import { useState, useRef } from "react";
import { sb } from "../../../lib/supabaseClient";
import { useProfile } from "../../../context/ProfileContext";
import styles from "./Settings.module.css";

export function ProfileSection() {
  const { profile, refreshProfile } = useProfile();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const trimmed = displayName.trim();
    if (!trimmed) {
      setMsg({ text: "Anzeigename darf nicht leer sein.", ok: false });
      return;
    }

    const { error } = await sb
      .from("profiles")
      .update({ display_name: trimmed, bio: bio.trim() })
      .eq("id", profile!.id);

    if (error) {
      setMsg({ text: `Speichern fehlgeschlagen: ${error.message}`, ok: false });
      return;
    }

    await refreshProfile();
    setMsg({ text: "Gespeichert.", ok: true });
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Profil</h2>
      <form onSubmit={handleSubmit}>
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
        {msg && (
          <p className={`alert ${msg.ok ? "alert-success" : "alert-danger"}`}>
            {msg.text}
          </p>
        )}
        <button type="submit" className="btn btn-primary">
          Speichern
        </button>
      </form>
    </div>
  );
}

export function AvatarSection() {
  const { profile, refreshProfile } = useProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const file = fileRef.current?.files?.[0];
    if (!file?.type.startsWith("image/")) {
      setMsg({ text: "Bitte eine Bilddatei auswählen.", ok: false });
      return;
    }

    const path = `${profile!.id}/avatar.jpg`;

    const { error: upErr } = await sb.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setMsg({ text: `Upload fehlgeschlagen: ${upErr.message}`, ok: false });
      return;
    }

    const { error: dbErr } = await sb
      .from("profiles")
      .update({ avatar_url: path })
      .eq("id", profile!.id);

    if (dbErr) {
      setMsg({ text: `DB-Update fehlgeschlagen: ${dbErr.message}`, ok: false });
      return;
    }

    await refreshProfile();
    setMsg({ text: "Avatar aktualisiert.", ok: true });
  }

  async function handleDelete() {
    setMsg(null);
    if (!confirm("Profilbild wirklich löschen?")) return;

    const currentPath = profile?.avatar_url;
    if (currentPath && currentPath !== "standard.jpg") {
      const { error } = await sb.storage.from("avatars").remove([currentPath]);
      if (error) {
        setMsg({ text: `Löschen fehlgeschlagen: ${error.message}`, ok: false });
        return;
      }
    }

    const { error: dbErr } = await sb
      .from("profiles")
      .update({ avatar_url: "standard.jpg" })
      .eq("id", profile!.id);

    if (dbErr) {
      setMsg({ text: `DB-Update fehlgeschlagen: ${dbErr.message}`, ok: false });
      return;
    }

    await refreshProfile();
    setMsg({ text: "Profilbild zurückgesetzt.", ok: true });
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Profilbild</h2>
      {profile?.avatar_url && (
        <img src={profile.avatar_url} alt="Avatar" className={styles.avatar} />
      )}
      <form onSubmit={handleUpload}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="avatarFile">
            Neues Bild
          </label>
          <input
            className={styles.input}
            id="avatarFile"
            type="file"
            accept="image/*"
            ref={fileRef}
          />
        </div>
        {msg && (
          <p className={`alert ${msg.ok ? "alert-success" : "alert-danger"}`}>
            {msg.text}
          </p>
        )}
        <div className={styles.btnRow}>
          <button type="submit" className="btn btn-primary">
            Hochladen
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
          >
            Löschen
          </button>
        </div>
      </form>
    </div>
  );
}
