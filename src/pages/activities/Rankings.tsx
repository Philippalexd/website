import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { sb } from "../../lib/supabaseClient";
import { useProfile } from "../../context/ProfileContext";
import Topbar from "../../components/Topbar";

interface UserRank {
  user_id: string;
  display_name: string;
  total_minutes: number;
  total_km: number;
  total_points: number;
}

interface GroupRank {
  group_id: string;
  group_name: string;
  total_minutes: number;
  total_km: number;
  total_points: number;
}

export default function Rankings() {
  const { profile } = useProfile();

  const [users, setUsers] = useState<UserRank[]>([]);
  const [groups, setGroups] = useState<GroupRank[]>([]);
  const [userSort, setUserSort] = useState("points_desc");
  const [groupSort, setGroupSort] = useState("points_desc");
  const [msg, setMsg] = useState("");

  // ── User-Ranking laden ───────────────────────────────
  async function loadUsers() {
    let q = sb
      .from("v_ranking")
      .select("user_id, display_name, total_minutes, total_km, total_points");

    if (userSort === "points_desc")
      q = q.order("total_points", { ascending: false });
    else if (userSort === "km_desc")
      q = q.order("total_km", { ascending: false });
    else q = q.order("total_minutes", { ascending: false });

    const { data, error } = await q;
    if (error) {
      setMsg("User-Rangliste: " + error.message);
      return;
    }
    setUsers(data ?? []);
  }

  // ── Gruppen-Ranking laden ────────────────────────────
  async function loadGroups() {
    let q = sb
      .from("v_group_ranking")
      .select("group_id, group_name, total_minutes, total_km, total_points");

    if (groupSort === "points_desc")
      q = q.order("total_points", { ascending: false });
    else if (groupSort === "km_desc")
      q = q.order("total_km", { ascending: false });
    else q = q.order("total_minutes", { ascending: false });

    const { data, error } = await q;
    if (error) {
      setMsg("Gruppen-Rangliste: " + error.message);
      return;
    }
    setGroups(data ?? []);
  }

  useEffect(() => {
    if (profile.userId) loadUsers();
  }, [profile.userId, userSort]);

  useEffect(() => {
    if (profile.userId) loadGroups();
  }, [profile.userId, groupSort]);

  return (
    <div className="page">
      <Topbar />
      <main className="container">
        <h1 className="mt-md mb-md">Rangliste</h1>

        {msg && <p className="alert alert-danger mb-md">{msg}</p>}

        {/* ── User-Ranking ── */}
        <div className="card mb-md">
          <div className="flex justify-between mb-md">
            <h2>User</h2>
            <select
              value={userSort}
              onChange={(e) => setUserSort(e.target.value)}
            >
              <option value="points_desc">Punkte</option>
              <option value="km_desc">Kilometer</option>
              <option value="min_desc">Minuten</option>
            </select>
          </div>

          <p className="mb-sm">User: {users.length}</p>

          <ul className="list">
            {users.map((u, idx) => (
              <li key={u.user_id} className="card mb-sm flex justify-between">
                <Link to={`/activities/profile?user=${u.user_id}`}>
                  {idx + 1}. {u.display_name}
                  {idx === 0 && " 👑"}
                </Link>
                <div className="flex gap-sm">
                  <span>{Number(u.total_points || 0).toFixed(1)} P</span>
                  <span>{Number(u.total_km || 0).toFixed(2)} km</span>
                  <span>{u.total_minutes} min</span>
                </div>
              </li>
            ))}
          </ul>

          {users.length === 0 && <p>Keine User gefunden.</p>}
        </div>

        {/* ── Gruppen-Ranking ── */}
        <div className="card mb-md">
          <div className="flex justify-between mb-md">
            <h2>Gruppen</h2>
            <select
              value={groupSort}
              onChange={(e) => setGroupSort(e.target.value)}
            >
              <option value="points_desc">Punkte</option>
              <option value="km_desc">Kilometer</option>
              <option value="min_desc">Minuten</option>
            </select>
          </div>

          <p className="mb-sm">Gruppen: {groups.length}</p>

          <ul className="list">
            {groups.map((g, idx) => (
              <li key={g.group_id} className="card mb-sm flex justify-between">
                <span>
                  {idx + 1}. {g.group_name}
                  {idx === 0 && " 👑"}
                </span>
                <div className="flex gap-sm">
                  <span>{Number(g.total_points || 0).toFixed(1)} P</span>
                  <span>{Number(g.total_km || 0).toFixed(2)} km</span>
                  <span>{g.total_minutes} min</span>
                </div>
              </li>
            ))}
          </ul>

          {groups.length === 0 && <p>Keine Gruppen gefunden.</p>}
        </div>
      </main>
    </div>
  );
}
