import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sb } from "../lib/supabaseClient";
import { useProfile } from "../context/ProfileContext";
import styles from "./Topbar.module.css";

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { profile } = useProfile();

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

      <div className={styles.dropdownWrapper}>
        <button
          className={styles.avatar}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <img src={profile.avatar_url} className={styles.avatarImg} />
        </button>

        {open && (
          <div className={styles.dropdown} role="menu">
            <Link
              className={styles.dropdownItem}
              role="menuitem"
              to="/activities/profile"
              onClick={() => setOpen(false)}
            >
              Profil
            </Link>
            <Link
              className={styles.dropdownItem}
              role="menuitem"
              to="/settings"
              onClick={() => setOpen(false)}
            >
              Einstellungen
            </Link>
            <hr />
            <button
              className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
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
