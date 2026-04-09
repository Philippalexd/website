import { requireAuth } from "../lib/auth.js";

export async function initMenuPage() {
  const session = await requireAuth();
  if (!session) return;

  const state = document.getElementById("loginState");
  if (state) state.textContent = `Eingeloggt als: ${session.user.email}`;
}