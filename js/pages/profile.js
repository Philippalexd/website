import { sb } from "../lib/supabaseClient.js";
import { requireAuth } from "../lib/auth.js";

export async function initProfilePage() {
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
  if (emailInput) emailInput.value = session.user.email || "";

  // Prefill: display_name aus profiles
  if (displayNameInput) {
    const { data, error } = await sb
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .single();

    if (error) {
      if (profileMsg) {
        profileMsg.textContent =
          "Profil konnte nicht geladen werden: " + error.message;
      }
    } else {
      displayNameInput.value = data?.display_name || "";
    }
  }

  // Anzeigename speichern
  profileForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (profileMsg) profileMsg.textContent = "";

    const display_name = String(displayNameInput?.value || "").trim();
    if (!display_name) {
      if (profileMsg)
        profileMsg.textContent = "Anzeigename darf nicht leer sein.";
      return;
    }

    const { error } = await sb
      .from("profiles")
      .update({ display_name })
      .eq("id", session.user.id);

    if (error) {
      if (profileMsg)
        profileMsg.textContent = "Speichern fehlgeschlagen: " + error.message;
      return;
    }
    if (profileMsg) profileMsg.textContent = "Gespeichert.";
  });

  // Email ändern (Supabase Auth)
  emailForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (emailMsg) emailMsg.textContent = "";

    const email = String(emailInput?.value || "").trim();
    const { error } = await sb.auth.updateUser({ email });

    if (error) {
      if (emailMsg)
        emailMsg.textContent = "E-Mail ändern fehlgeschlagen: " + error.message;
      return;
    }

    if (emailMsg) {
      emailMsg.textContent =
        "E-Mail-Änderung angestoßen. Prüfe ggf. dein Postfach zur Bestätigung.";
    }
  });

  // Passwort ändern (Supabase Auth)
  passwordForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (passwordMsg) passwordMsg.textContent = "";

    const password = String(document.getElementById("password")?.value || "");
    const { error } = await sb.auth.updateUser({ password });

    if (error) {
      if (passwordMsg)
        passwordMsg.textContent =
          "Passwort ändern fehlgeschlagen: " + error.message;
      return;
    }

    passwordForm.reset();
    if (passwordMsg) passwordMsg.textContent = "Passwort wurde geändert.";
  });
}
