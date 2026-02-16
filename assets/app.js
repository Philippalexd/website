import { sb } from "./supabase.js";

/* ---------- Page detection ---------- */
function isOnIndexPage() {
  return document.getElementById("loginForm") !== null;
}
function isOnCreatePage() {
  return document.getElementById("activityform") !== null;
}
function isOnListPage() {
  return document.getElementById("list") !== null;
}
function isOnMenuPage() {
  return document.getElementById("logoutBtn") !== null && document.getElementById("loginForm") === null;
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
    location.href = "/website/index.html";
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
      location.href = "/website/menu.html";
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
  location.href = "/website/menu.html";
  });
  await refresh();
}

/* ---------- Menu page ---------- */
async function setupMenuPage() {
  const session = await requireAuth();
  if (!session) return;

  const state = document.getElementById("loginState");
  const logoutBtn = document.getElementById("logoutBtn");

  state.textContent = `Eingeloggt als: ${session.user.email}`;

  logoutBtn.addEventListener("click", async () => {
    const { error } = await sb.auth.signOut();
    if (error) alert("Logout fehlgeschlagen: " + error.message);
    location.href = "/website/index.html"; // zurück zum Login
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
      distance: data.distance === "" || data.distance == null ? null : Number(data.distance),
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
  await requireAuth(); // blockt ohne Login

  const listEl = document.getElementById("list");
  const statsEl = document.getElementById("stats");
  const filterTypeEl = document.getElementById("filtertype");
  const sortByEl = document.getElementById("sortBy");

  async function render() {
    const filterType = filterTypeEl.value;
    const sortBy = sortByEl.value;

    let q = sb
      .from("activities")
      .select(
        "id,date,type,minutes,distance,note, user_id, group_id, profiles(display_name), groups(name)"
      );

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

      li.appendChild(main);
      listEl.appendChild(li);
    }

    statsEl.textContent =
      `Einträge: ${items.length} · Summe: ${totalMin} min` +
      (totalKm ? ` · ${totalKm.toFixed(2)} km` : "");
  }

  filterTypeEl.addEventListener("change", render);
  sortByEl.addEventListener("change", render);

  await render();
}

/* ---------- Boot ---------- */
if (isOnIndexPage()) setupAuthUI();
if (isOnMenuPage()) setupMenuPage();
if (isOnCreatePage()) setupCreatePage();
if (isOnListPage()) setupListPage();