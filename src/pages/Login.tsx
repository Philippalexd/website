import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sb, getSession } from "../lib/supabaseClient";
import styles from "./Login.module.css";

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getSession().then((session) => {
      if (session) navigate("/menu");
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Login fehlgeschlagen: " + error.message);
      return;
    }
    navigate("/menu");
  }

  return (
    <main className={styles.container}>
      <h1>Sportaktivitäten</h1>

      <div className={styles.card}>
        <h2>Anmelden</h2>

        {error && <p className="alert alert-danger">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className={styles.form}>
            <label htmlFor="email">E-Mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@beispiel.de"
              required
            />

            <label htmlFor="password">Passwort</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full mt-sm">
            Einloggen
          </button>
        </form>
      </div>
    </main>
  );
}
