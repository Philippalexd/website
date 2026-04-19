import { useStrava } from "../../../context/StravaContext";
import { useProfile } from "../../../context/ProfileContext";
import { getStravaAuthUrl } from "../../../lib/stravaClient";
import { sb } from "../../../lib/supabaseClient";
import stravaConnectSvg from "../../../assets/images/btn_strava_connect_with_orange.svg";
import styles from "./Settings.module.css";

export function StravaSection() {
  const { profile } = useProfile();
  const { strava, refreshStrava } = useStrava();

  async function handleDisconnect() {
    if (
      !confirm(
        "Strava wirklich trennen?\nDeine importierten Aktivitäten bleiben erhalten.",
      )
    )
      return;

    await sb
      .from("user_connections")
      .delete()
      .eq("user_id", profile!.id)
      .eq("provider", "strava");

    await refreshStrava();
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Externe Verbindungen</h2>
      <div className={styles.stravaRow}>
        <div className={styles.stravaInfo}>
          <strong>Strava</strong>
          <small>
            {strava?.connected ? "Verbunden" : "Noch nicht verbunden"}
          </small>
        </div>

        {strava?.connected ? (
          <button className="btn btn-danger" onClick={handleDisconnect}>
            Trennen
          </button>
        ) : (
          <a href={getStravaAuthUrl()} aria-label="Mit Strava verbinden">
            <img src={stravaConnectSvg} alt="Mit Strava verbinden" />
          </a>
        )}
      </div>
    </div>
  );
}
