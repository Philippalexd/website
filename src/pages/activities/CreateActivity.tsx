import { useState } from "react";
import { sb } from "../../lib/supabaseClient";
import { useProfile } from "../../context/ProfileContext";
import { useStrava } from "../../context/StravaContext";
import {
  fetchStravaActivities,
  mapStravaActivity,
} from "../../lib/stravaClient";
import { ACTIVITY_TYPES } from "../../lib/activityTypes";
import styles from "./CreateActivity.module.css";

export default function ActivityCreate() {
  const { profile } = useProfile();
  if (!profile) return null;
  const { strava, refreshStrava } = useStrava();
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
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
    if (!strava?.accessToken) return;
    setShowPopup(true);
    setLoadingStrava(true);
    setPopupMsg("");

    try {
      const raw = await fetchStravaActivities(strava.accessToken);

      raw.sort(
        (a, b) =>
          new Date(b.start_date_local).getTime() -
          new Date(a.start_date_local).getTime(),
      );

      const { data: existing } = await sb
        .from("activities")
        .select("external_id")
        .eq("user_id", user_id)
        .eq("source", "strava");

      const existingIds = new Set(
        (existing ?? []).map((a) => a.external_id).filter(Boolean),
      );

      const { data: skipped } = await sb
        .from("skipped_activities")
        .select("external_id")
        .eq("user_id", user_id)
        .eq("provider", "strava");

      const skippedSet = new Set((skipped ?? []).map((s) => s.external_id));
      setSkippedIds(skippedSet);

      setStravaActivities(raw);

      const autoChecked = new Set<string>(
        raw
          .filter(
            (a) =>
              !existingIds.has(String(a.id)) && !skippedSet.has(String(a.id)),
          )
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

  async function handleSkip(a: any) {
    const id = String(a.id);
    await sb.from("skipped_activities").upsert(
      {
        user_id,
        external_id: id,
        provider: "strava",
        title: a.name ?? null,
        date: a.start_date_local?.split("T")[0] ?? null,
      },
      { onConflict: "user_id,external_id,provider" },
    );
    setSkippedIds((prev) => new Set(prev).add(id));
    setChecked((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function handleUnskip(id: string) {
    await sb
      .from("skipped_activities")
      .delete()
      .eq("user_id", user_id)
      .eq("external_id", id)
      .eq("provider", "strava");
    setSkippedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
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

      const externalIds = toImport.map((a) => a.external_id).filter(Boolean);

      const { data: existing } = await sb
        .from("activities")
        .select("external_id")
        .eq("user_id", user_id)
        .eq("source", "strava")
        .in("external_id", externalIds);

      const existingIds = new Set((existing ?? []).map((a) => a.external_id));

      const newActivities = toImport.filter(
        (a) => !existingIds.has(a.external_id),
      );

      if (newActivities.length === 0) {
        setPopupMsg("Alle Aktivitäten bereits importiert.");
        setImporting(false);
        return;
      }

      const { error } = await sb.from("activities").insert(newActivities);
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
    <main className={styles.container}>
      <h1>Neue Aktivität</h1>

      {/* ── Strava Import Button ── */}
      {strava?.connected && (
        <div className={styles.stravaCard}>
          <strong>Aktivitäten importieren</strong>
          <button className="btn btn-primary" onClick={handleOpenPopup}>
            Von Strava importieren
          </button>
        </div>
      )}

      {/* ── Manuelles Formular ── */}
      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="type">
              Typ
            </label>
            <select
              className={styles.select}
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="date">
              Datum
            </label>
            <input
              className={styles.input}
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="minutes">
              Zeit (min)
            </label>
            <input
              className={styles.input}
              id="minutes"
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="z.B. 30"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="distance">
              Distanz (km)
            </label>
            <input
              className={styles.input}
              id="distance"
              type="number"
              step="0.01"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="optional"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="note">
              Notiz
            </label>
            <textarea
              className={styles.textarea}
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="optional"
              rows={2}
            />
          </div>

          {msg && (
            <p
              className={`alert ${msg.includes("fehlgeschlagen") ? "alert-danger" : "alert-success"}`}
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
        <div className={styles.overlay}>
          <div className={styles.popup}>
            <div className={styles.popupHeader}>
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
                <hr />
                <ul className={styles.activityList}>
                  {stravaActivities.length === 0 && (
                    <p>Keine Aktivitäten in den letzten 30 Tagen gefunden.</p>
                  )}
                  {stravaActivities.map((a) => {
                    const id = String(a.id);
                    const isChecked = checked.has(id);
                    const isSkipped = skippedIds.has(id);
                    return (
                      <li key={id} className={styles.activityItem}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isSkipped}
                          onChange={() => toggleCheck(id)}
                          style={{
                            width: 18,
                            height: 18,
                            flexShrink: 0,
                            cursor: isSkipped ? "not-allowed" : "pointer",
                          }}
                        />
                        <div className={styles.activityInfo}>
                          <strong>{a.name}</strong>
                          <small>
                            {a.start_date_local?.split("T")[0]}
                            {" | "}
                            {a.sport_type ?? a.type}
                            {a.distance
                              ? ` | ${(a.distance / 1000).toFixed(2)} km`
                              : ""}
                            {a.moving_time
                              ? ` | ${Math.round(a.moving_time / 60)} min`
                              : ""}
                            {isSkipped && " | bereits vorhanden"}
                          </small>
                        </div>
                        {isSkipped ? (
                          <button
                            className="btn"
                            style={{
                              fontSize: "0.75rem",
                              padding: "4px 8px",
                              flexShrink: 0,
                            }}
                            onClick={() => handleUnskip(id)}
                          >
                            Rückgängig
                          </button>
                        ) : (
                          <button
                            className="btn"
                            style={{
                              fontSize: "0.75rem",
                              padding: "4px 8px",
                              flexShrink: 0,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSkip(a);
                            }}
                          >
                            Bereits vorhanden
                          </button>
                        )}
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

                <div className={styles.popupFooter}>
                  <small>{checked.size} ausgewählt</small>
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
  );
}
