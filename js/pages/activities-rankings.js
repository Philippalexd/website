import { sb } from "../lib/supabaseClient.js";
import { requireAuth } from "../lib/auth.js";

export async function initRankingsPage() {
  const session = await requireAuth();
  if (!session) return;

  // Users
  const usersListEl = document.getElementById("rankingListUsers");
  const usersHintEl = document.getElementById("rankingHintUsers");
  const usersSortEl = document.getElementById("rankSortByUsers");

  // Groups
  const groupsListEl = document.getElementById("rankingListGroups");
  const groupsHintEl = document.getElementById("rankingHintGroups");
  const groupsSortEl = document.getElementById("rankSortByGroups");

  async function renderUsers() {
    if (!usersListEl || !usersSortEl) return;

    let q = sb
      .from("v_ranking")
      .select("user_id,display_name,total_minutes,total_km");
    q =
      usersSortEl.value === "km_desc"
        ? q.order("total_km", { ascending: false })
        : q.order("total_minutes", { ascending: false });

    const { data, error } = await q;
    if (error) return alert("User-Rangliste: " + error.message);

    usersListEl.innerHTML = "";
    (data || []).forEach((u, idx) => {
      const crown = idx === 0 ? " 👑" : "";
      const km = Number(u.total_km || 0);

      const li = document.createElement("li");
      li.className = "item";
      li.textContent = `${idx + 1}. ${u.display_name}${crown} · ${km.toFixed(
        2,
      )} km · ${u.total_minutes} min`;

      usersListEl.appendChild(li);
    });

    if (usersHintEl) usersHintEl.textContent = `User: ${(data || []).length}`;
  }

  async function renderGroups() {
    if (!groupsListEl || !groupsSortEl) return;

    let q = sb
      .from("v_group_ranking")
      .select("group_id,group_name,total_minutes,total_km");
    q =
      groupsSortEl.value === "km_desc"
        ? q.order("total_km", { ascending: false })
        : q.order("total_minutes", { ascending: false });

    const { data, error } = await q;
    if (error) return alert("Gruppen-Rangliste: " + error.message);

    groupsListEl.innerHTML = "";
    (data || []).forEach((g, idx) => {
      const crown = idx === 0 ? " 👑" : "";
      const km = Number(g.total_km || 0);

      const li = document.createElement("li");
      li.className = "item";
      li.textContent = `${idx + 1}. ${g.group_name}${crown} · ${km.toFixed(
        2,
      )} km · ${g.total_minutes} min`;

      groupsListEl.appendChild(li);
    });

    if (groupsHintEl)
      groupsHintEl.textContent = `Gruppen: ${(data || []).length}`;
  }

  usersSortEl?.addEventListener("change", renderUsers);
  groupsSortEl?.addEventListener("change", renderGroups);

  await Promise.all([renderUsers(), renderGroups()]);
}
