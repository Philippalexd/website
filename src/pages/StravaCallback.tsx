import { useStravaCallback } from "../hooks/useStravaCallback";
import styles from "./StravaCallback.module.css";

export default function StravaCallback() {
  const { status, error } = useStravaCallback();

  return (
    <div className={styles.container}>
      {status === "error" ? (
        <>
          <p className={styles.error}>❌ Verbindung fehlgeschlagen</p>
          <p className={styles.detail}>{error}</p>
          <p className={styles.hint}>Du wirst gleich weitergeleitet...</p>
        </>
      ) : (
        <>
          <div className={styles.spinner} aria-hidden="true" />
          <p className={styles.message}>Verbinde mit Strava...</p>
        </>
      )}
    </div>
  );
}
