import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sb } from "../lib/supabaseClient";
import { refreshStravaToken } from "../lib/stravaClient";
import { useSession } from "./SessionContext";
import type { Strava } from "../types";

async function fetchStrava(): Promise<Strava> {
  const { session } = useSession();
  if (!session)
    return {
      connected: false,
      accessToken: null,
      athleteId: null,
      lastSyncAt: null,
    };

  const { data, error } = await sb
    .from("user_connections")
    .select(
      "access_token, refresh_token, token_expires_at, external_user_id, last_sync_at",
    )
    .eq("user_id", session!.user.id)
    .eq("provider", "strava")
    .maybeSingle();

  if (error) throw new Error("Fehler beim sammeln von user Verbindungen!");

  if (!data)
    return {
      connected: false,
      accessToken: null,
      athleteId: null,
      lastSyncAt: null,
    };

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
          token_expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
        })
        .eq("user_id", session.user.id)
        .eq("provider", "strava");
    } catch {}
  }

  return {
    connected: true,
    accessToken,
    athleteId: data.external_user_id,
    lastSyncAt: data.last_sync_at,
  };
}

const StravaContext = createContext<{
  strava: Strava | null;
  refreshStrava: () => Promise<void>;
}>({
  strava: null,
  refreshStrava: async () => {},
});

export function StravaProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: strava = null } = useQuery({
    queryKey: ["strava"],
    queryFn: fetchStrava,
    staleTime: 1000 * 60 * 5,
  });

  async function refreshStrava() {
    await queryClient.invalidateQueries({ queryKey: ["strava"] });
  }

  return (
    <StravaContext.Provider value={{ strava, refreshStrava }}>
      {children}
    </StravaContext.Provider>
  );
}

export function useStrava() {
  return useContext(StravaContext);
}
