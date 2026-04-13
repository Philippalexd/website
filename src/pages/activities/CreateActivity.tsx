import { useState } from "react";
import { sb } from "../../lib/supabaseClient";
import { useProfile } from "../../context/ProfileContext";
import { useStrava } from "../../context/StravaContext";
import {
  fetchStravaActivities,
  mapStravaActivity,
} from "../../lib/stravaClient";
import Topbar from "../../components/Topbar";

export default function ActivityCreate() {
  const { profile } = useProfile();
  const { strava, refreshStrava } = useStrava();
  const user_id = profile.id;

  // ── Manuelle Eingabe ─────────────────────────────────
  const [type, setType] = useState("Laufen");
  const [date, setDate] = useState("");
  const [minutes, setMinutes] = useState("");
  const [distance, setDistance] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

  // ── Strava Popup ─────────────────────────────────────
  const [showPopup, setShowPopup] = useState(false);
  const [stravaActivities, setStravaActivities] = useState<any[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loadingStrava, setLoadingStrava] = useState(false);
  const [importing, setImporting] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");

  // ── Manuelle Aktivität speichern ─────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    const payload = {
      user_id,
      type,
      date,
      minutes: Number(minutes),
      distance: distance === "" ? null : Number(distance),
      note: note || "",
    };

    const { error } = await sb.from("activities").insert(payload);
    if (error) {
      setMsg("Speichern fehlgeschlagen: " + error.message);
      return;
    }

    setType("Laufen");
    setDate("");
    setMinutes("");
    setDistance("");
    setNote("");
    setMsg("Aktivität gespeichert!");
    setTimeout(() => setMsg(""), 2000);
  }

  // ── Strava Popup öffnen ──────────────────────────────
  async function handleOpenPopup() {
    if (!strava.accessToken) return;
    setShowPopup(true);
    setLoadingStrava(true);
    setPopupMsg("");

    try {
      const raw = await fetchStravaActivities(strava.accessToken);

      const { data: existing } = await sb
        .from("activities")
        .select("external_id")
        .eq("user_id", user_id)
        .eq("source", "strava");

      const existingIds = new Set(
        (existing ?? []).map((a) => a.external_id).filter(Boolean),
      );

      setStravaActivities(raw);

      const autoChecked = new Set<string>(
        raw
          .filter((a) => !existingIds.has(String(a.id)))
          .map((a) => String(a.id)),
      );
      setChecked(autoChecked);
    } catch (e: any) {
      setPopupMsg("Fehler beim Laden: " + e.message);
    } finally {
      setLoadingStrava(false);
    }
  }

  // ── Checkbox togglen ─────────────────────────────────
  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // ── Ausgewählte importieren ──────────────────────────
  async function handleImport() {
    if (checked.size === 0) {
      setPopupMsg("Keine Aktivität ausgewählt.");
      return;
    }
    setImporting(true);
    setPopupMsg("");

    try {
      const toImport = stravaActivities
        .filter((a) => checked.has(String(a.id)))
        .map((a) => mapStravaActivity(a, user_id));

      const { error } = await sb.from("activities").upsert(toImport, {
        onConflict: "user_id,external_id",
        ignoreDuplicates: false,
      });

      if (error) throw error;

      await sb
        .from("user_connections")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("user_id", user_id)
        .eq("provider", "strava");

      await refreshStrava();
      setPopupMsg(`✓ ${checked.size} Aktivitäten importiert!`);
      setTimeout(() => {
        setShowPopup(false);
        setPopupMsg("");
      }, 2000);
    } catch (e: any) {
      setPopupMsg("Import fehlgeschlagen: " + e.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="page">
      <Topbar />
      <main className="container">
        <h1 className="mt-md mb-md">Neue Aktivität</h1>

        {/* ── Strava Import Button ── */}
        {strava.connected && (
          <div className="card mb-md flex justify-between items-center">
            <div>
              <strong>Strava Import</strong>
              <p className="hint mt-sm">
                Aktivitäten der letzten 30 Tage importieren
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleOpenPopup}>
              Von Strava importieren
            </button>
          </div>
        )}

        {/* ── Manuelles Formular ── */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="type">Typ</label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="Laufen">Laufen</option>
                <option value="Radfahren">Radfahren</option>
                <option value="Schwimmen">Schwimmen</option>
                <option value="Krafttraining">Krafttraining</option>
                <option value="Sonstiges">Sonstiges</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="date">Datum</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="minutes">Zeit (min)</label>
              <input
                id="minutes"
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="z.B. 30"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="distance">Distanz (km)</label>
              <input
                id="distance"
                type="number"
                step="0.01"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="optional"
              />
            </div>

            <div className="form-group">
              <label htmlFor="note">Notiz</label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="optional"
                rows={2}
              />
            </div>

            {msg && (
              <p
                className={`alert mb-sm ${msg.includes("fehlgeschlagen") ? "alert-danger" : "alert-success"}`}
              >
                {msg}
              </p>
            )}

            <button type="submit" className="btn btn-primary">
              Speichern
            </button>
          </form>
        </div>

        {/* ── Strava Popup ── */}
        {showPopup && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              className="card"
              style={{
                width: "min(500px, 90vw)",
                maxHeight: "80vh",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <h2>Strava Aktivitäten</h2>
                <button
                  className="btn btn-danger"
                  onClick={() => setShowPopup(false)}
                  disabled={importing}
                >
                  ✕
                </button>
              </div>

              {loadingStrava ? (
                <p>Lade Aktivitäten von Strava...</p>
              ) : (
                <>
                  <p className="hint">
                    Neu = automatisch angehakt · bereits importierte = abgehakt
                  </p>

                  {/* Alle an/abhaken */}
                  <div className="flex gap-sm">
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        setChecked(
                          new Set(stravaActivities.map((a) => String(a.id))),
                        )
                      }
                    >
                      Alle anhaken
                    </button>
                    <button
                      className="btn"
                      onClick={() => setChecked(new Set())}
                    >
                      Alle abhaken
                    </button>
                  </div>

                  {/* Aktivitätenliste */}
                  <ul
                    style={{
                      overflowY: "auto",
                      flex: 1,
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                    }}
                  >
                    {stravaActivities.length === 0 && (
                      <p>Keine Aktivitäten in den letzten 30 Tagen gefunden.</p>
                    )}
                    {stravaActivities.map((a) => {
                      const id = String(a.id);
                      const isChecked = checked.has(id);
                      return (
                        <li key={id} className="flex gap-sm items-center mb-sm">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCheck(id)}
                            style={{
                              width: 18,
                              height: 18,
                              flexShrink: 0,
                              cursor: "pointer",
                            }}
                          />
                          <div>
                            <strong>{a.name}</strong>
                            <p className="hint">
                              {a.start_date_local?.split("T")[0]}
                              {" · "}
                              {a.sport_type ?? a.type}
                              {a.distance
                                ? ` · ${(a.distance / 1000).toFixed(2)} km`
                                : ""}
                              {a.moving_time
                                ? ` · ${Math.round(a.moving_time / 60)} min`
                                : ""}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {popupMsg && (
                    <p
                      className={`alert ${
                        popupMsg.includes("fehlgeschlagen") ||
                        popupMsg.includes("Fehler")
                          ? "alert-danger"
                          : "alert-success"
                      }`}
                    >
                      {popupMsg}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex justify-between items-center">
                    <span className="hint">{checked.size} ausgewählt</span>
                    <button
                      className="btn btn-primary"
                      onClick={handleImport}
                      disabled={importing || checked.size === 0}
                    >
                      {importing
                        ? "Importiere..."
                        : `${checked.size} importieren`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
