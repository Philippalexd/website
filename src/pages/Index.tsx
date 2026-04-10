import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sb } from "../lib/supabaseClient";
import { getSession } from "../lib/auth";

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
    <div className="page">
      <main
        className="container flex flex-col items-center"
        style={{ paddingTop: "20vh" }}
      >
        <h1 className="text-center mb-md">Sportaktivitäten</h1>

        <div className="card w-full" style={{ maxWidth: "360px" }}>
          <h2 className="mb-md">Anmelden</h2>

          {error && <p className="alert alert-danger mb-md">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">E-Mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@beispiel.de"
                required
              />
            </div>

            <div className="form-group">
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
    </div>
  );
}
