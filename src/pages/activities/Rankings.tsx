import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { sb } from "../../lib/supabaseClient";
import { useProfile } from "../../context/ProfileContext";
import styles from "./Rankings.module.css";
import type { UserRank, GroupRank } from "../../types";

const SORT_OPTIONS = [
  { value: "points_desc", label: "Punkte" },
  { value: "km_desc", label: "Kilometer" },
  { value: "min_desc", label: "Minuten" },
];

function medal(idx: number) {
  if (idx === 0) return "👑";
  if (idx === 1) return "🥈";
  if (idx === 2) return "🥉";
  return `${idx + 1}.`;
}

export default function Rankings() {
  const { profile } = useProfile();

  const [users, setUsers] = useState<UserRank[]>([]);
  const [groups, setGroups] = useState<GroupRank[]>([]);
  const [userSort, setUserSort] = useState("points_desc");
  const [groupSort, setGroupSort] = useState("points_desc");
  const [msg, setMsg] = useState("");
  const user_id = profile.id;

  function sortColumn(key: string) {
    if (key === "km_desc") return "total_km";
    if (key === "min_desc") return "total_minutes";
    return "total_points";
  }

  async function loadUsers() {
    const { data, error } = await sb
      .from("v_ranking")
      .select("user_id, display_name, total_minutes, total_km, total_points")
      .order(sortColumn(userSort), { ascending: false });
    if (error) return setMsg("User-Rangliste: " + error.message);
    setUsers(data ?? []);
  }

  async function loadGroups() {
    const { data, error } = await sb
      .from("v_group_ranking")
      .select("group_id, group_name, total_minutes, total_km, total_points")
      .order(sortColumn(groupSort), { ascending: false });
    if (error) return setMsg("Gruppen-Rangliste: " + error.message);
    setGroups(data ?? []);
  }

  useEffect(() => {
    if (user_id) loadUsers();
  }, [user_id, userSort]);

  useEffect(() => {
    if (user_id) loadGroups();
  }, [user_id, groupSort]);

  return (
    <main className={styles.container}>
      <h1 className={styles.h1}>Rangliste</h1>

      {msg && <p className="alert alert-danger">{msg}</p>}

      {/* ── User-Ranking ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>User</h2>
          <select
            className={styles.select}
            value={userSort}
            onChange={(e) => setUserSort(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <p>{users.length} User</p>

        <div className={styles.rows}>
          {users.map((u, idx) => {
            const isMe = u.user_id === user_id;
            return (
              <div
                key={u.user_id}
                className={`${styles.row} ${isMe ? styles.me : ""}`}
              >
                <span className={styles.pos}>{medal(idx)}</span>
                <div className={styles.info}>
                  <Link
                    to={`/activities/profile?user=${u.user_id}`}
                    className={styles.name}
                  >
                    {u.display_name}
                    {isMe && <span className={styles.badge}>Du</span>}
                  </Link>
                  <small>
                    {Number(u.total_points || 0).toFixed(1)} P ·{" "}
                    {Number(u.total_km || 0).toFixed(2)} km · {u.total_minutes}{" "}
                    min
                  </small>
                </div>
              </div>
            );
          })}
        </div>

        {users.length === 0 && <p>Keine User gefunden.</p>}
      </div>

      {/* ── Gruppen-Ranking ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Gruppen</h2>
          <select
            className={styles.select}
            value={groupSort}
            onChange={(e) => setGroupSort(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <p>{groups.length} Gruppen</p>

        <div className={styles.rows}>
          {groups.map((g, idx) => (
            <div key={g.group_id} className={styles.row}>
              <span className={styles.pos}>{medal(idx)}</span>
              <div className={styles.info}>
                <span className={styles.name}>{g.group_name}</span>
                <small>
                  {Number(g.total_points || 0).toFixed(1)} P ·{" "}
                  {Number(g.total_km || 0).toFixed(2)} km · {g.total_minutes}{" "}
                  min
                </small>
              </div>
            </div>
          ))}
        </div>

        {groups.length === 0 && <p>Keine Gruppen gefunden.</p>}
      </div>
    </main>
  );
}
