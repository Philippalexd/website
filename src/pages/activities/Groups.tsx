import { useState, useEffect } from "react";
import { sb } from "../../lib/supabaseClient";
import { useProfile } from "../../context/ProfileContext";
import type { Group } from "../../types";

export default function Groups() {
  const { profile } = useProfile();

  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const [newName, setNewName] = useState("");
  const [msg, setMsg] = useState("");
  const user_id = profile.id;

  // ── Laden ────────────────────────────────────────────
  async function loadGroups() {
    // Admin-Check
    const { data: prof } = await sb
      .from("profiles")
      .select("is_admin")
      .eq("id", user_id)
      .single();

    setIsAdmin(!!prof?.is_admin);

    // Alle Gruppen
    const { data: groupData, error: gErr } = await sb
      .from("groups")
      .select("id, name, created_by, created_at")
      .order("name", { ascending: true });

    if (gErr) {
      setMsg("Gruppen laden fehlgeschlagen: " + gErr.message);
      return;
    }
    setGroups(groupData ?? []);

    // Meine Memberships
    const { data: myData, error: mErr } = await sb
      .from("group_members")
      .select("group_id")
      .eq("user_id", user_id);

    if (mErr) {
      setMsg("Mitgliedschaften laden fehlgeschlagen: " + mErr.message);
      return;
    }
    setMyGroupIds(new Set((myData ?? []).map((x) => x.group_id)));
  }

  useEffect(() => {
    if (user_id) loadGroups();
  }, [user_id]);

  // ── Beitreten / Verlassen ────────────────────────────
  async function handleToggleMembership(groupId: string, isMember: boolean) {
    if (!isMember) {
      const { error } = await sb.from("group_members").insert({
        group_id: groupId,
        user_id: user_id,
      });
      if (error) {
        setMsg("Beitreten fehlgeschlagen: " + error.message);
        return;
      }
    } else {
      const { error } = await sb
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user_id);
      if (error) {
        setMsg("Verlassen fehlgeschlagen: " + error.message);
        return;
      }
    }
    await loadGroups();
  }

  // ── Gruppe löschen ──────────────────────────────────
  async function handleDeleteGroup(group: Group) {
    if (!confirm(`Gruppe "${group.name}" wirklich löschen?`)) return;

    const { error } = await sb.from("groups").delete().eq("id", group.id);
    if (error) {
      setMsg("Löschen fehlgeschlagen: " + error.message);
      return;
    }
    await loadGroups();
  }

  // ── Gruppe erstellen ────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    const name = newName.trim();
    if (!name) return;

    const { data, error } = await sb
      .from("groups")
      .insert({ name, created_by: user_id })
      .select("id")
      .single();

    if (error) {
      setMsg("Gründen fehlgeschlagen: " + error.message);
      return;
    }

    // Ersteller direkt beitreten
    await sb.from("group_members").insert({
      group_id: data.id,
      user_id: user_id,
    });

    setNewName("");
    setMsg("Gruppe erstellt.");
    setTimeout(() => setMsg(""), 2000);
    await loadGroups();
  }

  return (
    <div className="page">
      <main className="container">
        <h1 className="mt-md mb-md">Gruppen</h1>

        {/* ── Stats ── */}
        <p className="mb-md">
          Gruppen: {groups.length} · Mitglied in: {myGroupIds.size}
        </p>

        {msg && (
          <p
            className={`alert mb-md ${
              msg.includes("fehlgeschlagen") ? "alert-danger" : "alert-success"
            }`}
          >
            {msg}
          </p>
        )}

        {/* ── Gruppe erstellen ── */}
        <div className="card mb-md">
          <h2 className="mb-md">Neue Gruppe</h2>
          <form onSubmit={handleCreate} className="flex gap-sm">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Gruppenname"
              required
            />
            <button type="submit" className="btn btn-primary">
              Gründen
            </button>
          </form>
        </div>

        {/* ── Gruppenliste ── */}
        <ul className="list">
          {groups.map((g) => {
            const isMember = myGroupIds.has(g.id);

            return (
              <li key={g.id} className="card mb-sm flex justify-between">
                <span>{g.name}</span>

                <div className="flex gap-sm">
                  <button
                    className={`btn ${isMember ? "btn-danger" : "btn-primary"}`}
                    onClick={() => handleToggleMembership(g.id, isMember)}
                  >
                    {isMember ? "Verlassen" : "Beitreten"}
                  </button>

                  {isAdmin && (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteGroup(g)}
                    >
                      Löschen
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {groups.length === 0 && (
          <p className="mt-md">Keine Gruppen vorhanden.</p>
        )}
      </main>
    </div>
  );
}
