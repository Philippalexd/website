import { useState } from "react";
import { sb } from "../../lib/supabaseClient";
import { useProfile } from "../../context/ProfileContext";
import Topbar from "../../components/Topbar";

export default function ActivityCreate() {
  const { profile } = useProfile();

  const [type, setType] = useState("Laufen");
  const [date, setDate] = useState("");
  const [minutes, setMinutes] = useState("");
  const [distance, setDistance] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    const payload = {
      user_id: profile.id,
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

    // Reset
    setType("Laufen");
    setDate("");
    setMinutes("");
    setDistance("");
    setNote("");
    setMsg("Aktivität gespeichert!");

    // Toast nach 2s ausblenden
    setTimeout(() => setMsg(""), 2000);
  }

  return (
    <div className="page">
      <Topbar />
      <main className="container">
        <h1 className="mt-md mb-md">Neue Aktivität</h1>

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
                className={`alert mb-sm ${
                  msg.includes("fehlgeschlagen")
                    ? "alert-danger"
                    : "alert-success"
                }`}
              >
                {msg}
              </p>
            )}

            <button type="submit" className="btn btn-primary">
              Speichern
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
