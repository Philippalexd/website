// ActivityList.tsx
import { useEffect, useState } from "react";
import { sb } from "../../lib/supabaseClient";
import { useProfile } from "../../context/ProfileContext";
import type { Activity } from "../../types";
import { ACTIVITY_TYPES } from "../../lib/activityTypes";
import ActivityMap from "./ActivityMap";

import styles from "./ActivityList.module.css";

interface ActivityListProps {
  userId?: string;
  showFilters?: boolean;
  showStats?: boolean;
}

export default function ActivityList({
  userId,
  showFilters = true,
  showStats = true,
}: ActivityListProps) {
  const { profile } = useProfile();

  const targetUserId = userId || profile?.id;
  const isOwn = !userId || userId === profile?.id;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [filterType, setFilterType] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [msg, setMsg] = useState("");

  async function loadActivities() {
    if (!targetUserId) return;

    let q = sb
      .from("activities")
      .select("id, date, type, minutes, distance, note, source, raw_data")
      .eq("user_id", targetUserId);

    if (filterType) q = q.eq("type", filterType);
    q = q.order("date", { ascending: sortBy === "date_asc" });

    const { data, error } = await q;
    if (error) {
      setMsg("Laden fehlgeschlagen: " + error.message);
      return;
    }
    setActivities(data ?? []);
  }

  useEffect(() => {
    loadActivities();
  }, [targetUserId, filterType, sortBy]);

  let totalMin = 0;
  let totalKm = 0;
  for (const a of activities) {
    totalMin += Number(a.minutes) || 0;
    totalKm += Number(a.distance) || 0;
  }

  async function handleDelete(id: string) {
    if (!confirm("Diese Aktivität wirklich löschen?")) return;
    if (!profile?.id) return;

    const { error } = await sb
      .from("activities")
      .delete()
      .eq("id", id)
      .eq("user_id", profile.id);

    if (error) {
      setMsg("Löschen fehlgeschlagen: " + error.message);
      return;
    }
    await loadActivities();
  }

  if (!targetUserId) return null;

  return (
    <div className={styles.container}>
      {/* ── Filter ── */}
      {showFilters && (
        <div className={styles.filterCard}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="filterType">
              Typ
            </label>
            <select
              className={styles.select}
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Alle</option>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="sortBy">
              Sortierung
            </label>
            <select
              className={styles.select}
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date_desc">Neueste zuerst</option>
              <option value="date_asc">Älteste zuerst</option>
            </select>
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      {showStats && (
        <div className={styles.stats}>
          <span>Einträge: {activities.length}</span>
          <span>
            Gesamt: {totalMin} min
            {totalKm > 0 && ` | ${totalKm.toFixed(2)} km`}
          </span>
        </div>
      )}

      {msg && <p className="alert alert-danger">{msg}</p>}

      {/* ── Liste ── */}
      <ul className={styles.list}>
        {activities.map((a) => {
          const polyline =
            a.source === "strava" ? a.raw_data?.map?.summary_polyline : null;

          return (
            <li key={a.id} className={styles.listItem}>
              <div className={styles.listItemHeader}>
                <p className={styles.listItemText}>
                  {a.date} | {a.type} | {a.minutes} min
                  {a.distance != null && ` | ${a.distance} km`}
                  {a.note && ` | ${a.note}`}
                </p>
                {isOwn && (
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(a.id)}
                  >
                    Löschen
                  </button>
                )}
              </div>
              {polyline && <ActivityMap summaryPolyline={polyline} />}
            </li>
          );
        })}
      </ul>

      {activities.length === 0 && <p>Keine Aktivitäten gefunden.</p>}
    </div>
  );
}
