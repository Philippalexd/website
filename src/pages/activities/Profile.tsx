import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { sb } from "../../lib/supabaseClient";
import { useProfile } from "../../context/ProfileContext";
import Topbar from "../../components/Topbar";
import type { Activity, Profile } from "../../types";

export default function ProfilePage() {
  const { profile } = useProfile();
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [msg, setMsg] = useState("");
  const [searchParams] = useSearchParams();
  const userFromUrl = searchParams.get("user");
  const profileUserId = userFromUrl || profile.id;

  // ── Profil laden ─────────────────────────────────────
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
          setMsg("Avatar laden Fehlgeschlagen: " + signErr.message);
          return;
        }
        if (signed?.signedUrl) {
          setAvatarUrl(signed.signedUrl);
        }
      }
    }
    loadProfile();
  }, [profileUserId]);

  // ── Aktivitäten laden ────────────────────────────────
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

  // ── Stats berechnen ──────────────────────────────────
  const totalMin = activities.reduce(
    (sum, a) => sum + Number(a.minutes) || 0,
    0,
  );
  const totalKm = activities.reduce(
    (sum, a) => sum + Number(a.distance) || 0,
    0,
  );

  return (
    <div className="page">
      <Topbar />
      <main className="container">
        {/* ── Fehler-Meldung ── */}
        {msg && (
          <p
            className={`alert mb-md ${msg.includes("fehlgeschlagen") ? "alert-danger" : "alert-success"}`}
          >
            {msg}
          </p>
        )}

        {/* ── Profil-Header ── */}
        <div className="card mb-md flex gap-sm">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt="Avatar"
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          )}
          <div>
            <h1 className="mt-md mb-sm">
              {profileData?.display_name || "Profil"}
            </h1>
            {profileData?.bio && (
              <p className="text-muted">{profileData.bio}</p>
            )}
          </div>
        </div>

        {/* ── Statistiken ── */}
        <p className="mb-md flex justify-between">
          <span>Einträge: {activities.length}</span>
          <span>
            Gesamt: {totalMin} min
            {totalKm > 0 && ` | ${totalKm.toFixed(2)} km`}
          </span>
        </p>

        {/* ── Aktivitäten-Liste ── */}
        <ul className="list">
          {activities.map((a) => (
            <li key={a.id} className="card mb-sm flex justify-between">
              <div>
                {a.date} | {a.type} | {a.minutes} min
                {a.distance != null && ` | ${a.distance} km`}
                {a.note && ` | ${a.note}`}
              </div>
            </li>
          ))}
        </ul>

        {activities.length === 0 && !msg && (
          <p className="mt-md">Keine Aktivitäten vorhanden.</p>
        )}
      </main>
    </div>
  );
}
