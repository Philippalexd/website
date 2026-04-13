import { useState, useRef, useEffect } from "react";
import { getSession } from "../lib/auth";
import { sb } from "../lib/supabaseClient";
import { useProfile } from "../context/ProfileContext";
import { useStrava } from "../context/StravaContext";
import { getStravaAuthUrl } from "../lib/stravaClient";
import Topbar from "../components/Topbar";

export default function Settings() {
  const { profile, refreshProfile } = useProfile();
  const user_id = profile.id;
  const { strava, refreshStrava } = useStrava();

  // ── Profile ─────────────────────────────────────────
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [profileMsg, setProfileMsg] = useState("");

  // ── Avatar ──────────────────────────────────────────
  const [avatarMsg, setAvatarMsg] = useState("");
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // ── Email ───────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  useEffect(() => {
    getSession().then((session) => setEmail(session?.user.email ?? ""));
  }, []);

  // ── Password ────────────────────────────────────────
  const [password, setPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  // ── Save display name + bio ──────────────────────────
  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg("");

    const trimmed = displayName.trim();
    if (!trimmed) {
      setProfileMsg("Anzeigename darf nicht leer sein.");
      return;
    }

    const { error } = await sb
      .from("profiles")
      .update({ display_name: trimmed, bio: bio.trim() })
      .eq("id", user_id);

    if (error) {
      setProfileMsg("Speichern fehlgeschlagen: " + error.message);
      return;
    }

    await refreshProfile();
    setProfileMsg("Gespeichert.");
  }

  // ── Upload avatar ────────────────────────────────────
  async function handleAvatarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAvatarMsg("");

    const file = avatarFileRef.current?.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setAvatarMsg("Bitte eine Bilddatei auswählen.");
      return;
    }

    const path = `${user_id}/avatar.jpg`;

    const { error: upErr } = await sb.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setAvatarMsg("Upload fehlgeschlagen: " + upErr.message);
      return;
    }

    const { error: dbErr } = await sb
      .from("profiles")
      .update({ avatar_url: path })
      .eq("id", user_id);

    if (dbErr) {
      setAvatarMsg("DB-Update fehlgeschlagen: " + dbErr.message);
      return;
    }

    await refreshProfile();
    setAvatarMsg("Avatar aktualisiert.");
  }

  // ── Delete avatar ────────────────────────────────────
  async function handleDeleteAvatar() {
    setAvatarMsg("");
    if (!confirm("Profilbild wirklich löschen?")) return;

    const { data: prof, error: loadErr } = await sb
      .from("profiles")
      .select("avatar_url")
      .eq("id", user_id)
      .single();

    if (loadErr) {
      setAvatarMsg("Laden fehlgeschlagen: " + loadErr.message);
      return;
    }

    const currentPath = prof?.avatar_url;
    if (currentPath && currentPath !== "standard.jpg") {
      const { error: delErr } = await sb.storage
        .from("avatars")
        .remove([currentPath]);
      if (delErr) {
        setAvatarMsg("Löschen fehlgeschlagen: " + delErr.message);
        return;
      }
    }

    const { error: dbErr } = await sb
      .from("profiles")
      .update({ avatar_url: "standard.jpg" })
      .eq("id", user_id);

    if (dbErr) {
      setAvatarMsg("DB-Update fehlgeschlagen: " + dbErr.message);
      return;
    }

    await refreshProfile();
    setAvatarMsg("Profilbild zurückgesetzt.");
  }

  // ── Strava disconnect ─────────────────────────────────────
  async function handleStravaDisconnect() {
    if (
      !confirm(
        "Strava wirklich trennen? Deine importierten Aktivitäten bleiben erhalten.",
      )
    )
      return;
    await sb
      .from("user_connections")
      .delete()
      .eq("user_id", user_id)
      .eq("provider", "strava");
    await refreshStrava();
  }

  // ── Change email ─────────────────────────────────────
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailMsg("");

    const { error } = await sb.auth.updateUser({ email: email.trim() });
    setEmailMsg(
      error
        ? "E-Mail ändern fehlgeschlagen: " + error.message
        : "E-Mail-Änderung angestoßen. Prüfe ggf. dein Postfach zur Bestätigung.",
    );
  }

  // ── Change password ───────────────────────────────────
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg("");

    const { error } = await sb.auth.updateUser({ password });
    if (error) {
      setPasswordMsg("Passwort ändern fehlgeschlagen: " + error.message);
      return;
    }

    setPassword("");
    setPasswordMsg("Passwort wurde geändert.");
  }

  return (
    <div className="page">
      <Topbar />
      <main className="container">
        <h1 className="mt-md mb-md">Einstellungen</h1>

        {/* ── Profil ── */}
        <div className="card mb-md">
          <h2 className="mb-md">Profil</h2>
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label htmlFor="displayName">Anzeigename</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dein Name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ein paar Worte über dich..."
                rows={3}
              />
            </div>
            {profileMsg && (
              <p
                className={`alert mb-sm ${profileMsg.includes("fehlgeschlagen") ? "alert-danger" : "alert-success"}`}
              >
                {profileMsg}
              </p>
            )}
            <button type="submit" className="btn btn-primary">
              Speichern
            </button>
          </form>
        </div>

        {/* ── Avatar ── */}
        <div className="card mb-md">
          <h2 className="mb-md">Profilbild</h2>
          {profile.avatar_url && (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: 12,
              }}
            />
          )}
          <form onSubmit={handleAvatarSubmit}>
            <div className="form-group">
              <label htmlFor="avatarFile">Neues Bild</label>
              <input
                id="avatarFile"
                type="file"
                accept="image/*"
                ref={avatarFileRef}
              />
            </div>
            {avatarMsg && (
              <p
                className={`alert mb-sm ${avatarMsg.includes("fehlgeschlagen") ? "alert-danger" : "alert-success"}`}
              >
                {avatarMsg}
              </p>
            )}
            <div className="flex gap-sm">
              <button type="submit" className="btn btn-primary">
                Hochladen
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteAvatar}
              >
                Löschen
              </button>
            </div>
          </form>
        </div>

        {/* ── Externe Verbindungen ── */}
        <div className="card mb-md">
          <h2 className="mb-md">Externe Verbindungen</h2>
          <div className="flex justify-between items-center">
            <div>
              <strong>Strava</strong>
              <p className="hint mt-sm">
                {strava.connected
                  ? `Verbunden · Athlete ID: ${strava.athleteId}`
                  : "Noch nicht verbunden"}
              </p>
              {strava.lastSyncAt && (
                <p className="hint">
                  Letzter Import:{" "}
                  {new Date(strava.lastSyncAt).toLocaleString("de-DE")}
                </p>
              )}
            </div>
            {strava.connected ? (
              <button
                className="btn btn-danger"
                onClick={handleStravaDisconnect}
              >
                Trennen
              </button>
            ) : (
              <a href={getStravaAuthUrl()} className="btn btn-primary">
                Verbinden
              </a>
            )}
          </div>
        </div>

        {/* ── E-Mail ── */}
        <div className="card mb-md">
          <h2 className="mb-md">E-Mail ändern</h2>
          <form onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label htmlFor="email">Neue E-Mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {emailMsg && (
              <p
                className={`alert mb-sm ${emailMsg.includes("fehlgeschlagen") ? "alert-danger" : "alert-success"}`}
              >
                {emailMsg}
              </p>
            )}
            <button type="submit" className="btn btn-primary">
              Ändern
            </button>
          </form>
        </div>

        {/* ── Passwort ── */}
        <div className="card mb-md">
          <h2 className="mb-md">Passwort ändern</h2>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="password">Neues Passwort</label>
              <input
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
                className={`alert mb-sm ${passwordMsg.includes("fehlgeschlagen") ? "alert-danger" : "alert-success"}`}
              >
                {passwordMsg}
              </p>
            )}
            <button type="submit" className="btn btn-primary">
              Ändern
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
