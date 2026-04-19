import { useState, useRef } from "react";
import { sb } from "../../lib/supabaseClient";
import { useSession } from "../../context/SessionContext";
import { useProfile } from "../../context/ProfileContext";
import { useStrava } from "../../context/StravaContext";
import { getStravaAuthUrl } from "../../lib/stravaClient";
import stravaConnectSvg from "../../assets/images/btn_strava_connect_with_orange.svg";
import styles from "./Settings.module.css";

export default function Settings() {
  const { session } = useSession();
  const { profile, refreshProfile } = useProfile();
  const user_id = profile?.id;
  const { strava, refreshStrava } = useStrava();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [profileMsg, setProfileMsg] = useState("");

  const [avatarMsg, setAvatarMsg] = useState("");
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState(session?.user.email ?? "");
  const [emailMsg, setEmailMsg] = useState("");

  const [password, setPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

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
    <main className={styles.container}>
      <h1 className={styles.h1}>Einstellungen</h1>

      {/* ── Profil ── */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Profil</h2>
        <form onSubmit={handleProfileSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="displayName">
              Anzeigename
            </label>
            <input
              className={styles.input}
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Dein Name"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="bio">
              Bio
            </label>
            <textarea
              className={styles.textarea}
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ein paar Worte über dich..."
              rows={3}
            />
          </div>
          {profileMsg && (
            <p
              className={`alert ${profileMsg.includes("fehlgeschlagen") ? "alert-danger" : "alert-success"}`}
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
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Profilbild</h2>
        {profile?.avatar_url && (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className={styles.avatar}
          />
        )}
        <form onSubmit={handleAvatarSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="avatarFile">
              Neues Bild
            </label>
            <input
              className={styles.input}
              id="avatarFile"
              type="file"
              accept="image/*"
              ref={avatarFileRef}
            />
          </div>
          {avatarMsg && (
            <p
              className={`alert ${avatarMsg.includes("fehlgeschlagen") ? "alert-danger" : "alert-success"}`}
            >
              {avatarMsg}
            </p>
          )}
          <div className={styles.btnRow}>
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
            <button className="btn btn-danger" onClick={handleStravaDisconnect}>
              Trennen
            </button>
          ) : (
            <a href={getStravaAuthUrl()}>
              <img src={stravaConnectSvg} alt="Mit Strava verbinden" />
            </a>
          )}
        </div>
      </div>

      {/* ── E-Mail ── */}
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
              className={`alert ${emailMsg.includes("fehlgeschlagen") ? "alert-danger" : "alert-success"}`}
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
              className={`alert ${passwordMsg.includes("fehlgeschlagen") ? "alert-danger" : "alert-success"}`}
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
  );
}
