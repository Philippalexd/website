import { sb } from "./supabase.js";

/* ---------- For all pages ---------- */

async function loadPartials() {
  // Head: <meta data-include="...">
  const headMarker = document.querySelector("meta[data-include]");
  if (headMarker) {
    const path = headMarker.getAttribute("data-include");
    const res = await fetch(path, { cache: "no-store" });
    headMarker.insertAdjacentHTML("beforebegin", await res.text());
    headMarker.remove();
  }

  // Body: <div data-include="..."></div>
  const hosts = document.querySelectorAll("div[data-include]");
  for (const host of hosts) {
    const path = host.getAttribute("data-include");
    const res = await fetch(path, { cache: "no-store" });
    host.outerHTML = await res.text();
  }
}

function setupTopbarLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    const { error } = await sb.auth.signOut();
    if (error) alert("Logout fehlgeschlagen: " + error.message);
    location.href = "../index.html";
  });
}

/* ---------- Page detection ---------- */
function page() {
  return document.body?.dataset.page || "";
}

/* ---------- Auth helpers ---------- */
async function getSession() {
  const { data, error } = await sb.auth.getSession();
  if (error) throw error;
  return data.session;
}

async function requireAuth() {
  const session = await getSession();
  if (!session) {
    // GitHub Pages Repo-Path beachten:
    location.href = "../index.html";
    return null;
  }
  return session;
}

/* ---------- Index (Login/Logout) ---------- */
async function setupAuthUI() {
  const form = document.getElementById("loginForm");
  const state = document.getElementById("loginState");

  async function refresh() {
    const session = await getSession();
    state.textContent = session
      ? `Eingeloggt als: ${session.user.email}`
      : "Nicht eingeloggt";

    // Wenn bereits eingeloggt: direkt ins Menü
    if (session) {
      location.href = "../menu.html";
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");

    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      alert("Login fehlgeschlagen: " + error.message);
      return;
    }
    location.href = "../menu.html";
  });
  await refresh();
}

/* ---------- Menu page ---------- */
async function setupMenuPage() {
  const session = await requireAuth();
  if (!session) return;

  const state = document.getElementById("loginState");

  state.textContent = `Eingeloggt als: ${session.user.email}`;
}

/* ---------- Profile page ---------- */
async function setupProfilePage() {
  const session = await requireAuth();
  if (!session) return;

  const profileForm = document.getElementById("profileForm");
  const profileMsg = document.getElementById("profileMsg");

  const emailForm = document.getElementById("emailForm");
  const emailMsg = document.getElementById("emailMsg");

  const passwordForm = document.getElementById("passwordForm");
  const passwordMsg = document.getElementById("passwordMsg");

  const displayNameInput = document.getElementById("displayName");
  const emailInput = document.getElementById("email");

  // Prefill: Email aus Session
  emailInput.value = session.user.email || "";

  // Prefill: display_name aus profiles
  {
    const { data, error } = await sb
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .single();

    if (error) {
      profileMsg.textContent =
        "Profil konnte nicht geladen werden: " + error.message;
    } else {
      displayNameInput.value = data.display_name || "";
    }
  }

  // Anzeigename speichern (public.profiles)
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    profileMsg.textContent = "";

    const display_name = String(displayNameInput.value || "").trim();
    if (!display_name) {
      profileMsg.textContent = "Anzeigename darf nicht leer sein.";
      return;
    }

    const { error } = await sb
      .from("profiles")
      .update({ display_name })
      .eq("id", session.user.id);

    if (error) {
      profileMsg.textContent = "Speichern fehlgeschlagen: " + error.message;
      return;
    }
    profileMsg.textContent = "Gespeichert.";
  });

  // Email ändern (auth.users via Supabase Auth)
  emailForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    emailMsg.textContent = "";

    const email = String(emailInput.value || "").trim();

    const { error } = await sb.auth.updateUser({ email });
    if (error) {
      emailMsg.textContent = "E-Mail ändern fehlgeschlagen: " + error.message;
      return;
    }

    // Hinweis: je nach Supabase Settings kommt Bestätigungs-Mail etc.
    emailMsg.textContent =
      "E-Mail-Änderung angestoßen. Prüfe ggf. dein Postfach zur Bestätigung.";
  });

  // Passwort ändern (auth.users via Supabase Auth)
  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    passwordMsg.textContent = "";

    const password = String(document.getElementById("password").value || "");
    const { error } = await sb.auth.updateUser({ password });

    if (error) {
      passwordMsg.textContent =
        "Passwort ändern fehlgeschlagen: " + error.message;
      return;
    }

    passwordForm.reset();
    passwordMsg.textContent = "Passwort wurde geändert.";
  });
}

/* ---------- Create page ---------- */
async function loadGroupsIntoSelect() {
  const sel = document.getElementById("groupSelect");
  if (!sel) return;

  const { data, error } = await sb
    .from("groups")
    .select("id,name")
    .order("name", { ascending: true });

  if (error) {
    alert("Gruppen konnten nicht geladen werden: " + error.message);
    return;
  }

  sel.innerHTML =
    `<option value="">Bitte auswählen</option>` +
    data.map((g) => `<option value="${g.id}">${g.name}</option>`).join("");
}

function showToast() {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2000);
}

async function setupCreatePage() {
  const session = await requireAuth();
  if (!session) return;

  await loadGroupsIntoSelect();

  const form = document.getElementById("activityform");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());

    const payload = {
      user_id: session.user.id,
      group_id: data.group_id,
      type: data.type,
      date: data.date,
      minutes: Number(data.minutes),
      distance:
        data.distance === "" || data.distance == null
          ? null
          : Number(data.distance),
      note: data.note ? String(data.note) : "",
    };

    const { error } = await sb.from("activities").insert(payload);
    if (error) {
      alert("Speichern fehlgeschlagen: " + error.message);
      return;
    }

    form.reset();
    showToast();
  });
}

/* ---------- List page ---------- */
async function setupListPage() {
  const session = await requireAuth();
  if (!session) return;

  const listEl = document.getElementById("list");
  const statsEl = document.getElementById("stats");
  const filterTypeEl = document.getElementById("filtertype");
  const sortByEl = document.getElementById("sortBy");
  const clearBtn = document.getElementById("clearBtn");

  async function render() {
    const filterType = filterTypeEl.value;
    const sortBy = sortByEl.value;

    let q = sb
      .from("activities")
      .select(
        "id,date,type,minutes,distance,note, user_id, group_id, profiles(display_name), groups(name)",
      )
      .eq("user_id", session.user.id);

    if (filterType) q = q.eq("type", filterType);
    q = q.order("date", { ascending: sortBy === "date_asc" });

    const { data: items, error } = await q;
    if (error) {
      alert("Laden fehlgeschlagen: " + error.message);
      return;
    }

    listEl.innerHTML = "";

    let totalMin = 0;
    let totalKm = 0;

    for (const a of items) {
      totalMin += a.minutes || 0;
      totalKm += a.distance || 0;

      const li = document.createElement("li");
      li.className = "item";

      const main = document.createElement("div");
      main.className = "item-main";
      main.textContent =
        `${a.date} · ${a.type} · ${a.minutes} min` +
        (a.distance != null ? ` · ${a.distance} km` : "") +
        (a.note ? ` · ${a.note}` : "") +
        (a.groups?.name ? ` · Gruppe: ${a.groups.name}` : "") +
        (a.profiles?.display_name ? ` · User: ${a.profiles.display_name}` : "");

      const actions = document.createElement("div");
      actions.className = "item-actions";

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "danger";
      delBtn.textContent = "Löschen";

      delBtn.addEventListener("click", async () => {
        if (!confirm("Diese Aktivität wirklich löschen?")) return;

        const { error } = await sb
          .from("activities")
          .delete()
          .eq("id", a.id)
          .eq("user_id", session.user.id); // extra Sicherheit

        if (error) return alert("Löschen fehlgeschlagen: " + error.message);
        await render();
      });

      actions.appendChild(delBtn);

      li.appendChild(main);
      li.appendChild(actions);
      listEl.appendChild(li);
    }

    statsEl.textContent =
      `Einträge: ${items.length} · Summe: ${totalMin} min` +
      (totalKm ? ` · ${totalKm.toFixed(2)} km` : "");
  }

  filterTypeEl.addEventListener("change", render);
  sortByEl.addEventListener("change", render);

  clearBtn?.addEventListener("click", async () => {
    if (!confirm("Wirklich ALLE Aktivitäten löschen?")) return;

    const { error } = await sb
      .from("activities")
      .delete()
      .eq("user_id", session.user.id);

    if (error) return alert("Alles löschen fehlgeschlagen: " + error.message);
    await render();
  });

  await render();
}

/* ---------- Ranking page ---------- */
async function setupRankingPage() {
  await requireAuth();

  // User
  const usersListEl = document.getElementById("rankingListUsers");
  const usersHintEl = document.getElementById("rankingHintUsers");
  const usersSortEl = document.getElementById("rankSortByUsers");

  // Groups
  const groupsListEl = document.getElementById("rankingListGroups");
  const groupsHintEl = document.getElementById("rankingHintGroups");
  const groupsSortEl = document.getElementById("rankSortByGroups");

  async function renderUsers() {
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
    data.forEach((u, idx) => {
      const crown = idx === 0 ? " 👑" : "";
      const km = Number(u.total_km || 0);
      const li = document.createElement("li");
      li.className = "item";
      li.textContent = `${idx + 1}. ${u.display_name}${crown} · ${km.toFixed(2)} km · ${u.total_minutes} min`;
      usersListEl.appendChild(li);
    });

    usersHintEl.textContent = `User: ${data.length}`;
  }

  async function renderGroups() {
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
    data.forEach((g, idx) => {
      const crown = idx === 0 ? " 👑" : "";
      const km = Number(g.total_km || 0);
      const li = document.createElement("li");
      li.className = "item";
      li.textContent = `${idx + 1}. ${g.group_name}${crown} · ${km.toFixed(2)} km · ${g.total_minutes} min`;
      groupsListEl.appendChild(li);
    });

    groupsHintEl.textContent = `Gruppen: ${data.length}`;
  }

  usersSortEl.addEventListener("change", renderUsers);
  groupsSortEl.addEventListener("change", renderGroups);

  await Promise.all([renderUsers(), renderGroups()]);
}

/* ---------- Boot ---------- */
async function boot() {
  await loadPartials();
  setupTopbarLogout();

  if (page() === "index") setupAuthUI();
  if (page() === "menu") setupMenuPage();
  if (page() === "create") setupCreatePage();
  if (page() === "list") setupListPage();
  if (page() === "rankings") setupRankingPage();
  if (page() === "profile") setupProfilePage();
}
boot();
