import { loadPartials } from "./lib/partials.js";
import { rewriteNavLinksToBase, toBaseUrl } from "./config/paths.js";
import { sb } from "./lib/supabaseClient.js";

import { initIndexPage } from "./pages/index.js";
import { initMenuPage } from "./pages/menu.js";
import { initSettingPage } from "./pages/settings.js";
import { initProfilePage } from "./pages/profile.js";
import { initCreatePage } from "./pages/activities-create.js";
import { initListPage } from "./pages/activities-list.js";
import { initRankingsPage } from "./pages/activities-rankings.js";
import { initGroupsPage } from "./pages/activities-groups.js";

function page() {
  return document.body?.dataset.page || "";
}

function setupTopbarLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    const { error } = await sb.auth.signOut();
    if (error) alert("Logout fehlgeschlagen: " + error.message);
    location.href = toBaseUrl("index.html");
  });
}

async function boot() {
  await loadPartials();
  rewriteNavLinksToBase();
  setupTopbarLogout();

  switch (page()) {
    case "index":
      return initIndexPage();
    case "menu":
      return initMenuPage();
    case "settings":
      return initSettingPage();
    case "profile":
      return initProfilePage();
    case "create":
      return initCreatePage();
    case "list":
      return initListPage();
    case "rankings":
      return initRankingsPage();
    case "groups":
      return initGroupsPage();
    default:
      return;
  }
}

boot();
