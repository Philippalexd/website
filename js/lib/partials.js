import { toBaseUrl } from "../config/paths.js";
import { sb } from "./supabaseClient.js";

export async function loadPartials() {
  const headMarker = document.querySelector("meta[data-include]");
  if (headMarker) {
    const path = headMarker.getAttribute("data-include");
    const res = await fetch(path, { cache: "no-store" });
    headMarker.insertAdjacentHTML("beforebegin", await res.text());
    headMarker.remove();
  }

  const hosts = document.querySelectorAll("div[data-include]");
  for (const host of hosts) {
    const path = host.getAttribute("data-include");
    const res = await fetch(path, { cache: "no-store" });
    host.outerHTML = await res.text();
  }

  initTopbarProfileMenu();
  await initTopbarAvatar();
}

function initTopbarProfileMenu() {
  const profileMenu = document.getElementById("profileMenu");
  const avatarBtn = document.getElementById("avatarBtn");
  if (!profileMenu || !avatarBtn) return;

  if (profileMenu.dataset.initialized === "true") return;
  profileMenu.dataset.initialized = "true";

  const closeMenu = () => {
    profileMenu.classList.remove("open");
    avatarBtn.setAttribute("aria-expanded", "false");
  };

  avatarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = profileMenu.classList.toggle("open");
    avatarBtn.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (e) => {
    if (!profileMenu.contains(e.target)) closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  profileMenu.addEventListener("click", (e) => {
    if (e.target.closest(".dropdown-item")) closeMenu();
  });
}
async function initTopbarAvatar() {
  const img = document.getElementById("avatarImg");
  if (!img) return;

  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return;

  const userId = session.user.id;

  const { data: profile } = await sb
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single();

  const path = profile?.avatar_url || "standard.jpg";

  const { data, error } = await sb.storage
    .from("avatars")
    .createSignedUrl(path, 60 * 10);

  if (!error && data?.signedUrl) {
    img.src = data.signedUrl + `&t=${Date.now()}`;
  }
}
