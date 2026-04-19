import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { sb } from "../lib/supabaseClient";
import { exchangeStravaCode } from "../lib/stravaClient";
import { useSession } from "../context/SessionContext";
import { useStrava } from "../context/StravaContext";

type Status = "pending" | "success" | "error";

interface UseStravaCallbackResult {
  status: Status;
  error: string | null;
}

const OAUTH_CODE_KEY = "strava_oauth_code";

export function useStravaCallback(): UseStravaCallbackResult {
  const handledRef = useRef(false);

  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();
  const { refreshStrava } = useStrava();

  const [status, setStatus] = useState<Status>("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    if (sessionLoading) return;
    if (handledRef.current) return;
    handledRef.current = true;

    async function handleCallback() {
      const code = sessionStorage.getItem(OAUTH_CODE_KEY);

      if (!code) {
        navigate("/settings", { replace: true });
        return;
      }

      sessionStorage.removeItem(OAUTH_CODE_KEY);

      try {
        if (!session) throw new Error("Nicht eingeloggt");

        const token = await exchangeStravaCode(code);
        const { error: dbError } = await sb.from("user_connections").upsert(
          {
            user_id: session.user.id,
            provider: "strava",
            external_user_id: String(token.athlete.id),
            access_token: token.access_token,
            refresh_token: token.refresh_token,
            token_expires_at: new Date(token.expires_at * 1000).toISOString(),
            scope: "activity:read_all",
            connected_at: new Date().toISOString(),
          },
          { onConflict: "user_id,provider" },
        );
        if (dbError) throw new Error(dbError.message);
        
        await refreshStrava();
        setStatus("success");
        navigate("/settings", { replace: true });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unbekannter Fehler";
        console.error("Strava Callback Fehler:", message);
        setError(message);
        setStatus("error");
        setTimeout(() => navigate("/settings", { replace: true }), 3000);
      }
    }

    handleCallback();
  }, [sessionLoading]);

  return { status, error };
}
