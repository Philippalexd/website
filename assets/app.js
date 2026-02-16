const KEY = "activities_v1";

function isOnCreatePage() {
  return document.getElementById("activityform") !== null;
}
function isOnListPage() {
  return document.getElementById("list") !== null;
}

function loadActivities() {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}
function saveActivities(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}
function normalizeActivity(a) {
  return {
    id: a.id ?? crypto.randomUUID(),
    type: a.type,
    date: a.date,
    minutes: Number(a.minutes),
    distance:
      a.distance === "" || a.distance == null ? null : Number(a.distance),
    note: a.note ?? "",
  };
}

/* ---------- Create page ---------- */
function setupCreatePage() {
  const form = document.getElementById("activityform");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    const activity = normalizeActivity(data);

    const all = loadActivities();
    all.push(activity);
    saveActivities(all);

    form.reset();
    showToast();
  });
}

function showToast() {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2000);
}

/* ---------- List page ---------- */
function setupListPage() {
  const listEl = document.getElementById("list");
  const statsEl = document.getElementById("stats");
  const filterTypeEl = document.getElementById("filtertype");
  const sortByEl = document.getElementById("sortBy");
  const clearBtn = document.getElementById("clearBtn");
  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const importFile = document.getElementById("importFile");

  function render() {
    const filterType = filterTypeEl.value;
    const sortBy = sortByEl.value;

    let items = loadActivities();
    if (filterType) items = items.filter((a) => a.type === filterType);

    items.sort((a, b) => {
      if (sortBy === "date_asc")
        return (a.date || "").localeCompare(b.date || "");
      return (b.date || "").localeCompare(a.date || "");
    });

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
        (a.note ? ` · ${a.note}` : "");

      const actions = document.createElement("div");
      actions.className = "item-actions";

      const del = document.createElement("button");
      del.textContent = "Löschen";
      del.className = "danger";
      del.addEventListener("click", () => {
        if (!confirm("Diese Aktivität wirklich löschen?")) return;
        const all = loadActivities().filter((x) => x.id !== a.id);
        saveActivities(all);
        render();
      });

      actions.appendChild(del);
      li.appendChild(main);
      li.appendChild(actions);
      listEl.appendChild(li);
    }

    statsEl.textContent =
      `Einträge: ${items.length} · Summe: ${totalMin} min` +
      (totalKm ? ` · ${totalKm.toFixed(2)} km` : "");
  }

  clearBtn.addEventListener("click", () => {
    if (!confirm("Wirklich alle Aktivitäten löschen?")) return;
    localStorage.removeItem(KEY);
    render();
  });

  exportBtn.addEventListener("click", () => {
    const data = localStorage.getItem(KEY) || "[]";
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "activities-export.json";
    a.click();

    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener("click", () => importFile.click());

  importFile.addEventListener("change", async () => {
    const file = importFile.files?.[0];
    if (!file) return;

    const text = await file.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("JSON ist kein Array");
    } catch {
      alert("Import fehlgeschlagen: Ungültige JSON-Datei.");
      return;
    }

    const normalized = parsed.map(normalizeActivity);
    saveActivities(normalized);
    render();
    importFile.value = "";
  });

  filterTypeEl.addEventListener("change", render);
  sortByEl.addEventListener("change", render);

  render();
}

/* ---------- Boot ---------- */
if (isOnCreatePage()) setupCreatePage();
if (isOnListPage()) setupListPage();
