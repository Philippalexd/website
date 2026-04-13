import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { sb } from "../lib/supabaseClient";
import { getSession } from "../lib/auth";
import { refreshStravaToken } from "../lib/stravaClient";

interface StravaConnection {
  connected: boolean;
  accessToken: string | null;
  athleteId: string | null;
  lastSyncAt: string | null;
}

interface StravaContextType {
  strava: StravaConnection;
  loading: boolean;
  refreshStrava: () => Promise<void>;
}

const defaultStrava: StravaConnection = {
  connected: false,
  accessToken: null,
  athleteId: null,
  lastSyncAt: null,
};

const StravaContext = createContext<StravaContextType>({
  strava: defaultStrava,
  loading: true,
  refreshStrava: async () => {},
});

export function StravaProvider({ children }: { children: ReactNode }) {
  const [strava, setStrava] = useState<StravaConnection>(defaultStrava);
  const [loading, setLoading] = useState(true);

  async function refreshStrava() {
    const session = await getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error } = await sb
      .from("user_connections")
      .select(
        "access_token, refresh_token, token_expires_at, external_user_id, last_sync_at",
      )
      .eq("user_id", session.user.id)
      .eq("provider", "strava")
      .maybeSingle();

    if (error || !data) {
      setStrava(defaultStrava);
      setLoading(false);
      return;
    }

    let accessToken = data.access_token;
    const expiresAt = data.token_expires_at
      ? new Date(data.token_expires_at).getTime() / 1000
      : 0;

    if (expiresAt < Date.now() / 1000 + 60) {
      try {
        const refreshed = await refreshStravaToken(data.refresh_token!);
        accessToken = refreshed.access_token;
        await sb
          .from("user_connections")
          .update({
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token,
            token_expires_at: new Date(
              refreshed.expires_at * 1000,
            ).toISOString(),
          })
          .eq("user_id", session.user.id)
          .eq("provider", "strava");
      } catch {}
    }

    setStrava({
      connected: true,
      accessToken,
      athleteId: data.external_user_id,
      lastSyncAt: data.last_sync_at,
    });
    setLoading(false);
  }

  useEffect(() => {
    refreshStrava();
  }, []);

  return (
    <StravaContext.Provider value={{ strava, loading, refreshStrava }}>
      {children}
    </StravaContext.Provider>
  );
}

export function useStrava() {
  return useContext(StravaContext);
}
