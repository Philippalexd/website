import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sb } from "../lib/supabaseClient";
import { getSession } from "../lib/auth";
import { exchangeStravaCode } from "../lib/stravaClient";
import { useStrava } from "../context/StravaContext";

export default function StravaCallback() {
  const navigate = useNavigate();
  const { refreshStrava } = useStrava();

  useEffect(() => {
    async function handle() {
      const code = sessionStorage.getItem("strava_code");

      if (!code) {
        navigate("/settings", { replace: true });
        return;
      }

      sessionStorage.removeItem("strava_code");

      try {
        const session = await getSession();
        if (!session) throw new Error("Nicht eingeloggt");

        const token = await exchangeStravaCode(code);

        await sb.from("user_connections").upsert(
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
        await refreshStrava();
      } catch (e: any) {
        console.error("Fehler:", e.message);
      }

      navigate("/settings", { replace: true });
    }

    handle();
  }, []);

  return (
    <p style={{ color: "#f3f4f6", padding: "2rem" }}>Verbinde mit Strava...</p>
  );
}
