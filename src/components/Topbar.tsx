import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sb } from "../lib/supabaseClient";
import { useProfile } from "../context/ProfileContext";
import styles from "./Topbar.module.css";

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { profile, loading } = useProfile();

  if (loading) return <p>Laden...</p>;

  async function handleLogout() {
    await sb.auth.signOut();
    navigate("/");
  }

  return (
    <header className={styles.topbar}>
      <nav className={styles.navigation}>
        <Link className="btn" to="/menu">
          Home
        </Link>
        <Link className="btn" to="/activities/create">
          Neue Aktivität
        </Link>
        <Link className="btn" to="/activities/rankings">
          Rangliste
        </Link>
      </nav>

      <div className="dropdown-wrapper">
        <button
          className={styles.avatar}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <img
            src={profile.avatarUrl}
            alt={profile.displayName}
            className={styles.avatarImg}
          />
        </button>

        {open && (
          <div className="dropdown" role="menu">
            <Link
              className="dropdown-item"
              role="menuitem"
              to="/activities/profile"
              onClick={() => setOpen(false)}
            >
              Profil
            </Link>
            <Link
              className="dropdown-item"
              role="menuitem"
              to="/settings"
              onClick={() => setOpen(false)}
            >
              Einstellungen
            </Link>
            <hr className="divider" />
            <button
              className="dropdown-item danger"
              type="button"
              role="menuitem"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
