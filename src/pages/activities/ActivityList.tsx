import { useEffect, useState } from "react";
import { sb } from "../../lib/supabaseClient";
import { useProfile } from "../../context/ProfileContext";
import type { Activity } from "../../types";
import { ACTIVITY_TYPES } from "../../lib/activityTypes";
import styles from "./ActivityList.module.css";

export default function ActivityList() {
  const { profile } = useProfile();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filterType, setFilterType] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [msg, setMsg] = useState("");
  const user_id = profile.id;

  async function loadActivities() {
    let q = sb
      .from("activities")
      .select("id, date, type, minutes, distance, note")
      .eq("user_id", user_id);

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
    if (user_id) loadActivities();
  }, [user_id, filterType, sortBy]);

  let totalMin = 0;
  let totalKm = 0;
  for (const a of activities) {
    totalMin += Number(a.minutes) || 0;
    totalKm += Number(a.distance) || 0;
  }

  async function handleDelete(id: string) {
    if (!confirm("Diese Aktivität wirklich löschen?")) return;
    const { error } = await sb
      .from("activities")
      .delete()
      .eq("id", id)
      .eq("user_id", user_id);
    if (error) {
      setMsg("Löschen fehlgeschlagen: " + error.message);
      return;
    }
    await loadActivities();
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.h1}>Meine Aktivitäten</h1>

      {/* ── Filter ── */}
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

      {/* ── Stats ── */}
      <div className={styles.stats}>
        <span>Einträge: {activities.length}</span>
        <span>
          Gesamt: {totalMin} min
          {totalKm > 0 && ` | ${totalKm.toFixed(2)} km`}
        </span>
      </div>

      {msg && <p className="alert alert-danger">{msg}</p>}

      {/* ── Liste ── */}
      <ul className={styles.list}>
        {activities.map((a) => (
          <li key={a.id} className={styles.listItem}>
            <span className={styles.listItemText}>
              {a.date} | {a.type} | {a.minutes} min
              {a.distance != null && ` | ${a.distance} km`}
              {a.note && ` | ${a.note}`}
            </span>
            <button
              className="btn btn-danger"
              onClick={() => handleDelete(a.id)}
            >
              Löschen
            </button>
          </li>
        ))}
      </ul>

      {activities.length === 0 && <p>Keine Aktivitäten gefunden.</p>}
    </main>
  );
}
