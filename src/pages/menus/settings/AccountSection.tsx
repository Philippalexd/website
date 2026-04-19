import { useState } from "react";
import { sb } from "../../../lib/supabaseClient";
import { useSession } from "../../../context/SessionContext";
import styles from "./Settings.module.css";

export function AccountSection() {
  const { session } = useSession();

  const [email, setEmail] = useState(session?.user.email ?? "");
  const [emailMsg, setEmailMsg] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);

  const [password, setPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailMsg(null);

    const { error } = await sb.auth.updateUser({ email: email.trim() });
    setEmailMsg(
      error
        ? { text: `Fehler: ${error.message}`, ok: false }
        : {
            text: "Änderung angestoßen. Prüfe dein Postfach zur Bestätigung.",
            ok: true,
          },
    );
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);

    const { error } = await sb.auth.updateUser({ password });
    if (error) {
      setPasswordMsg({ text: `Fehler: ${error.message}`, ok: false });
      return;
    }

    setPassword("");
    setPasswordMsg({ text: "Passwort wurde geändert.", ok: true });
  }

  return (
    <>
      {/* E-Mail */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>E-Mail ändern</h2>
        <form onSubmit={handleEmailSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">
              Neue E-Mail
            </label>
            <input
              className={styles.input}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {emailMsg && (
            <p
              className={`alert ${emailMsg.ok ? "alert-success" : "alert-danger"}`}
            >
              {emailMsg.text}
            </p>
          )}
          <button type="submit" className="btn btn-primary">
            Ändern
          </button>
        </form>
      </div>

      {/* Passwort */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Passwort ändern</h2>
        <form onSubmit={handlePasswordSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">
              Neues Passwort
            </label>
            <input
              className={styles.input}
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {passwordMsg && (
            <p
              className={`alert ${passwordMsg.ok ? "alert-success" : "alert-danger"}`}
            >
              {passwordMsg.text}
            </p>
          )}
          <button type="submit" className="btn btn-primary">
            Ändern
          </button>
        </form>
      </div>
    </>
  );
}
