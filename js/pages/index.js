import { sb } from "../lib/supabaseClient.js";
import { getSession } from "../lib/auth.js";
import { toBaseUrl } from "../config/paths.js";

export async function initIndexPage() {
  const form = document.getElementById("loginForm");
  const state = document.getElementById("loginState");

  async function refresh() {
    const session = await getSession();
    state.textContent = session
      ? `Eingeloggt als: ${session.user.email}`
      : "Nicht eingeloggt";

    if (session) location.href = toBaseUrl("menu.html");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");

    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return alert("Login fehlgeschlagen: " + error.message);

    location.href = toBaseUrl("menu.html");
  });

  await refresh();
}
