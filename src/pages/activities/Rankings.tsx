import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { sb } from "../../lib/supabaseClient";
import { useProfile } from "../../context/ProfileContext";
import Topbar from "../../components/Topbar";
import s from "./Rankings.module.css";
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
  const user_id = profile.id

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
    <div className="page">
      <Topbar />
      <main className="container">
        <h1 className="mt-md mb-md">Rangliste</h1>

        {msg && <p className="alert alert-danger mb-md">{msg}</p>}

        {/* ── User-Ranking ── */}
        <div className="card mb-md">
          <div className="flex items-center justify-between mb-md">
            <h2 className="mr-md">User</h2>
            <select
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

          <p className="hint mb-sm">{users.length} User</p>

          <div className="flex flex-col gap-sm">
            {users.map((u, idx) => {
              const isMe = u.user_id === user_id;
              return (
                <div key={u.user_id} className={`${s.row} ${isMe ? s.me : ""}`}>
                  <span className={s.pos}>{medal(idx)}</span>
                  <div className={s.info}>
                    <Link
                      to={`/activities/profile?user=${u.user_id}`}
                      className={s.name}
                    >
                      {u.display_name}
                      {isMe && <span className={s.badge}>Du</span>}
                    </Link>
                    <span className="hint">
                      {Number(u.total_points || 0).toFixed(1)} P ·{" "}
                      {Number(u.total_km || 0).toFixed(2)} km ·{" "}
                      {u.total_minutes} min
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {users.length === 0 && <p>Keine User gefunden.</p>}
        </div>

        {/* ── Gruppen-Ranking ── */}
        <div className="card mb-md">
          <div className="flex items-center justify-between mb-md">
            <h2 className="mr-md">Gruppen</h2>
            <select
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

          <p className="hint mb-sm">{groups.length} Gruppen</p>

          <div className="flex flex-col gap-sm">
            {groups.map((g, idx) => (
              <div key={g.group_id} className={s.row}>
                <span className={s.pos}>{medal(idx)}</span>
                <div className={s.info}>
                  <span className={s.name}>{g.group_name}</span>
                  <span className="hint">
                    {Number(g.total_points || 0).toFixed(1)} P ·{" "}
                    {Number(g.total_km || 0).toFixed(2)} km · {g.total_minutes}{" "}
                    min
                  </span>
                </div>
              </div>
            ))}
          </div>

          {groups.length === 0 && <p>Keine Gruppen gefunden.</p>}
        </div>
      </main>
    </div>
  );
}
