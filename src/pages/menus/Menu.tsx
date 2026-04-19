import { Link } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import styles from "./Menu.module.css";
import msvImage from "../../assets/images/msv_niederrhein.png";

export default function Menu() {
  const { session } = useSession();
  const email = session?.user.email ?? "";

  return (
    <main className={styles.container}>
      <h1>Home</h1>
      <p className="hint">{email && `Eingeloggt als: ${email}`}</p>

      <div className={styles.tilesGrid}>
        <Link className={styles.tile} to="/activities/create">
          <div className={styles.tileIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--blue)"
              strokeWidth="1.8"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <span className={styles.tileLabel}>Neue Aktivität</span>
        </Link>

        <Link className={styles.tile} to="/activities">
          <div className={styles.tileIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--blue)"
              strokeWidth="1.8"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
            </svg>
          </div>
          <span className={styles.tileLabel}>Alle Aktivitäten</span>
        </Link>

        <Link className={styles.tile} to="/activities/rankings">
          <div className={styles.tileIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--blue)"
              strokeWidth="1.8"
            >
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </div>
          <span className={styles.tileLabel}>Rangliste</span>
        </Link>

        <Link className={styles.tile} to="/activities/groups">
          <div className={styles.tileIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--blue)"
              strokeWidth="1.8"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <span className={styles.tileLabel}>Gruppen</span>
        </Link>
      </div>

      <div className={styles.hero}>
        <img src={msvImage} alt="MSV Niederrhein" />
      </div>
    </main>
  );
}
