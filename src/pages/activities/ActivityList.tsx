import { useEffect, useState } from "react";
import { sb } from "../../lib/supabaseClient";
import { useProfile } from "../../context/ProfileContext";
import Topbar from "../../components/Topbar";

interface Activity {
  id: string;
  date: string;
  type: string;
  minutes: string;
  distance: string | null;
  note: string | null;
}

export default function ActivityList() {
  const { profile } = useProfile();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filterType, setFilterType] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [msg, setMsg] = useState("");

  async function loadActivities() {
    let q = sb
      .from("activities")
      .select("id, date, type, minutes, distance, note")
      .eq("user_id", profile.userId);

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
    if (profile.userId) loadActivities();
  }, [profile.userId, filterType, sortBy]);

  // ── Stats berechnen ──────────────────────────────────
  const totalMin = activities.reduce(
    (sum, a) => sum + Number(a.minutes) || 0,
    0,
  );
  const totalKm = activities.reduce(
    (sum, a) => sum + Number(a.distance) || 0,
    0,
  );

  // ── Einzelne Aktivität löschen ───────────────────────
  async function handleDelete(id: string) {
    if (!confirm("Diese Aktivität wirklich löschen?")) return;

    const { error } = await sb
      .from("activities")
      .delete()
      .eq("id", id)
      .eq("user_id", profile.userId);

    if (error) {
      setMsg("Löschen fehlgeschlagen: " + error.message);
      return;
    }
    await loadActivities();
  }

  return (
    <div className="page">
      <Topbar />
      <main className="container">
        <h1 className="mt-md mb-md">Meine Aktivitäten</h1>

        <div className="card mb-md flex gap-sm">
          <div className="form-group">
            <label htmlFor="filterType">Typ</label>
            <select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Alle</option>
              <option value="Laufen">Laufen</option>
              <option value="Radfahren">Radfahren</option>
              <option value="Schwimmen">Schwimmen</option>
              <option value="Krafttraining">Krafttraining</option>
              <option value="Sonstiges">Sonstiges</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="sortBy">Sortierung</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date_desc">Neueste zuerst</option>
              <option value="date_asc">Älteste zuerst</option>
            </select>
          </div>
        </div>

        <p className="mb-md flex justify-between">
          <span>Einträge: {activities.length}</span>
          <span>
            Gesamt: {totalMin} min
            {totalKm > 0 && ` | ${totalKm.toFixed(2)} km`}
          </span>
        </p>

        {msg && <p className="alert alert-danger mb-md">{msg}</p>}

        {/* ── Liste ── */}
        <ul className="list">
          {activities.map((a) => (
            <li key={a.id} className="card mb-sm flex justify-between">
              <div>
                {a.date} | {a.type} | {a.minutes} min
                {a.distance != null && ` | ${a.distance} km`}
                {a.note && ` | ${a.note}`}
              </div>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(a.id)}
              >
                Löschen
              </button>
            </li>
          ))}
        </ul>

        {activities.length === 0 && (
          <p className="mt-md">Keine Aktivitäten gefunden.</p>
        )}
      </main>
    </div>
  );
}
