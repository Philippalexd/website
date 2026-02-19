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
      .select("user_id,display_name,total_minutes,total_km,total_points");
    q =
      usersSortEl.value === "points_desc"
        ? q.order("total_points", { ascending: false })
        : usersSortEl.value === "km_desc"
          ? q.order("total_km", { ascending: false })
          : q.order("total_minutes", { ascending: false });

    const { data, error } = await q;
    if (error) return alert("User-Rangliste: " + error.message);

    usersListEl.innerHTML = "";
    (data || []).forEach((u, idx) => {
      const crown = idx === 0 ? " 👑" : "";

      const li = document.createElement("li");
      li.className = "item rank-row";

      const left = document.createElement("a");
      left.className = "rank-left";
      left.href = `./profile.html?user=${encodeURIComponent(u.user_id)}`;
      left.textContent = `${idx + 1}. ${u.display_name}${crown}`;

      const ptsEL = document.createElement("span");
      ptsEL.className = "rank-points";
      ptsEL.textContent = `| ${Number(u.total_points || 0).toFixed(1)} P`;

      const kmEl = document.createElement("span");
      kmEl.className = "rank-km";
      kmEl.textContent = `| ${Number(u.total_km || 0).toFixed(2)} km`;

      const minEl = document.createElement("span");
      minEl.className = "rank-min";
      minEl.textContent = `| ${u.total_minutes} min`;

      li.append(left, ptsEL, kmEl, minEl);
      usersListEl.appendChild(li);
    });

    if (usersHintEl) usersHintEl.textContent = `User: ${(data || []).length}`;
  }

  async function renderGroups() {
    if (!groupsListEl || !groupsSortEl) return;

    let q = sb
      .from("v_group_ranking")
      .select("group_id,group_name,total_minutes,total_km,total_points");
    q =
      groupsSortEl.value === "points_desc"
        ? q.order("total_points", { ascending: false })
        : groupsSortEl.value === "km_desc"
          ? q.order("total_km", { ascending: false })
          : q.order("total_minutes", { ascending: false });

    const { data, error } = await q;
    if (error) return alert("Gruppen-Rangliste: " + error.message);

    groupsListEl.innerHTML = "";
    (data || []).forEach((g, idx) => {
      const crown = idx === 0 ? " 👑" : "";

      const li = document.createElement("li");
      li.className = "item rank-row";

      const left = document.createElement("span");
      left.className = "rank-left";
      left.textContent = `${idx + 1}. ${g.group_name}${crown}`;

      const ptsEL = document.createElement("span");
      ptsEL.className = "rank-points";
      ptsEL.textContent = `| ${Number(g.total_points || 0).toFixed(1)} P`;

      const kmEl = document.createElement("span");
      kmEl.className = "rank-km";
      kmEl.textContent = `| ${Number(g.total_km || 0).toFixed(2)} km`;

      const minEl = document.createElement("span");
      minEl.className = "rank-min";
      minEl.textContent = `| ${g.total_minutes} min`;

      li.append(left, ptsEL, kmEl, minEl);
      groupsListEl.appendChild(li);
    });

    if (groupsHintEl)
      groupsHintEl.textContent = `Gruppen: ${(data || []).length}`;
  }

  usersSortEl?.addEventListener("change", renderUsers);
  groupsSortEl?.addEventListener("change", renderGroups);

  await Promise.all([renderUsers(), renderGroups()]);
}
