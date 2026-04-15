import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { sb } from "../../lib/supabaseClient";
import { useProfile } from "../../context/ProfileContext";
import type { Activity, Profile } from "../../types";
import styles from "./Profile.module.css";

export default function ProfilePage() {
  const { profile } = useProfile();
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [msg, setMsg] = useState("");
  const [searchParams] = useSearchParams();
  const userFromUrl = searchParams.get("user");
  const profileUserId = userFromUrl || profile?.id;

  useEffect(() => {
    if (!profileUserId) return;

    async function loadProfile() {
      const { data, error } = await sb
        .from("profiles")
        .select("id, display_name, bio, avatar_url")
        .eq("id", profileUserId)
        .single();

      if (error) {
        setMsg("Profil laden fehlgeschlagen: " + error.message);
        setProfileData(null);
        return;
      }
      setProfileData(data);

      if (data?.avatar_url) {
        const { data: signed, error: signErr } = await sb.storage
          .from("avatars")
          .createSignedUrl(data.avatar_url, 60 * 10);
        if (signErr) {
          setMsg("Avatar laden fehlgeschlagen: " + signErr.message);
          return;
        }
        if (signed?.signedUrl) setAvatarUrl(signed.signedUrl);
      }
    }
    loadProfile();
  }, [profileUserId]);

  useEffect(() => {
    if (!profileUserId) return;

    async function loadActivities() {
      const { data, error } = await sb
        .from("activities")
        .select("id, date, type, minutes, distance, note")
        .eq("user_id", profileUserId)
        .order("date", { ascending: false });

      if (error) {
        setMsg("Aktivitäten laden fehlgeschlagen: " + error.message);
        return;
      }
      setActivities(data ?? []);
    }
    loadActivities();
  }, [profileUserId]);

  const totalMin = activities.reduce(
    (sum, a) => sum + Number(a.minutes) || 0,
    0,
  );
  const totalKm = activities.reduce(
    (sum, a) => sum + Number(a.distance) || 0,
    0,
  );

  return (
    <main className={styles.container}>
      {msg && (
        <p
          className={`alert ${msg.includes("fehlgeschlagen") ? "alert-danger" : ""}`}
        >
          {msg}
        </p>
      )}

      {/* ── Profil Header ── */}
      <div className={styles.profileCard}>
        {avatarUrl && (
          <img src={avatarUrl} alt="Avatar" className={styles.avatar} />
        )}
        <div className={styles.profileInfo}>
          <h1 className={styles.name}>
            {profileData?.display_name || "Profil"}
          </h1>
          {profileData?.bio && <p className={styles.bio}>{profileData.bio}</p>}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={styles.stats}>
        <span>Einträge: {activities.length}</span>
        <span>
          Gesamt: {totalMin} min
          {totalKm > 0 && ` | ${totalKm.toFixed(2)} km`}
        </span>
      </div>

      {/* ── Aktivitäten Liste ── */}
      <ul className={styles.list}>
        {activities.map((a) => (
          <li key={a.id} className={styles.listItem}>
            {a.date} | {a.type} | {a.minutes} min
            {a.distance != null && ` | ${a.distance} km`}
            {a.note && ` | ${a.note}`}
          </li>
        ))}
      </ul>

      {activities.length === 0 && !msg && <p>Keine Aktivitäten vorhanden.</p>}
    </main>
  );
}
