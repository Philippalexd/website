import { sb } from "../lib/supabaseClient.js";
import { requireAuth } from "../lib/auth.js";

export async function initSettingPage() {
  const session = await requireAuth();
  if (!session) return;

  const profileForm = document.getElementById("profileForm");
  const profileMsg = document.getElementById("profileMsg");

  const avatarForm = document.getElementById("avatarForm");
  const avatarFile = document.getElementById("avatarFile");
  const avatarMsg = document.getElementById("avatarMsg");
  const avatarPreview = document.getElementById("avatarPreview");

  const emailForm = document.getElementById("emailForm");
  const emailMsg = document.getElementById("emailMsg");

  const passwordForm = document.getElementById("passwordForm");
  const passwordMsg = document.getElementById("passwordMsg");

  const displayNameInput = document.getElementById("displayName");
  const bioInput = document.getElementById("bio");
  const emailInput = document.getElementById("email");

  const deleteAvatarBtn = document.getElementById("deleteAvatarBtn");

  // Prefill: Email aus Session
  if (emailInput) emailInput.value = session.user.email || "";

  // Prefill: display_name + bio + avatar_url aus profiles
  const { data: profile, error: loadErr } = await sb
    .from("profiles")
    .select("display_name, bio, avatar_url")
    .eq("id", session.user.id)
    .single();

  if (loadErr) {
    if (profileMsg) {
      profileMsg.textContent =
        "Profil konnte nicht geladen werden: " + loadErr.message;
    }
  } else {
    if (displayNameInput) displayNameInput.value = profile?.display_name || "";
    if (bioInput) bioInput.value = profile?.bio || "";

    // Avatar anzeigen (private bucket => signed url)
    if (profile?.avatar_url && avatarPreview) {
      const { data, error } = await sb.storage
        .from("avatars")
        .createSignedUrl(profile.avatar_url, 60 * 10); // 10 Minuten gültig

      if (!error && data?.signedUrl) {
        avatarPreview.src = data.signedUrl;
        avatarPreview.style.display = "block";
      }
    }
  }

  // Anzeigename + Bio speichern
  profileForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (profileMsg) profileMsg.textContent = "";

    const display_name = String(displayNameInput?.value || "").trim();
    const bio = String(bioInput?.value || "").trim();

    if (!display_name) {
      if (profileMsg)
        profileMsg.textContent = "Anzeigename darf nicht leer sein.";
      return;
    }

    const { error } = await sb
      .from("profiles")
      .update({ display_name, bio })
      .eq("id", session.user.id);

    if (error) {
      if (profileMsg)
        profileMsg.textContent = "Speichern fehlgeschlagen: " + error.message;
      return;
    }
    if (profileMsg) profileMsg.textContent = "Gespeichert.";
  });
  // Avatar upload (speichert Storage-PFAD in profiles.avatar_url)
  avatarForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (avatarMsg) avatarMsg.textContent = "";

    const file = avatarFile?.files?.[0];
    if (!file) {
      if (avatarMsg) avatarMsg.textContent = "Bitte eine Bilddatei auswählen.";
      return;
    }
    if (!file.type.startsWith("image/")) {
      if (avatarMsg) avatarMsg.textContent = "Bitte eine Bilddatei auswählen.";
      return;
    }

    const path = `${session.user.id}/avatar.jpg`;

    const { error: upErr } = await sb.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      if (avatarMsg)
        avatarMsg.textContent = "Upload fehlgeschlagen: " + upErr.message;
      return;
    }

    // in profiles speichern (PFAD, nicht URL)
    const { error: dbErr } = await sb
      .from("profiles")
      .update({ avatar_url: path })
      .eq("id", session.user.id);

    if (dbErr) {
      if (avatarMsg)
        avatarMsg.textContent = "DB-Update fehlgeschlagen: " + dbErr.message;
      return;
    }

    // neue Signed URL holen und anzeigen
    const { data, error } = await sb.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 10);

    if (!error && data?.signedUrl) {
      if (avatarPreview) {
        avatarPreview.src = data.signedUrl;
        avatarPreview.style.display = "block";
      }

      const topbarImg = document.getElementById("avatarImg");
      if (topbarImg) topbarImg.src = data.signedUrl;
    }

    if (avatarMsg) avatarMsg.textContent = "Avatar aktualisiert.";
  });

  deleteAvatarBtn?.addEventListener("click", async () => {
    if (avatarMsg) avatarMsg.textContent = "";
    if (!confirm("Profilbild wirklich löschen?")) return;

    // aktuellen avatar_url holen
    const { data: prof, error: loadErr2 } = await sb
      .from("profiles")
      .select("avatar_url")
      .eq("id", session.user.id)
      .single();

    if (loadErr2) {
      if (avatarMsg)
        avatarMsg.textContent = "Laden fehlgeschlagen: " + loadErr2.message;
      return;
    }

    const currentPath = prof?.avatar_url;

    // eigene Datei löschen (aber NICHT standard.jpg löschen)
    if (currentPath && currentPath !== "standard.jpg") {
      const { error: delErr } = await sb.storage
        .from("avatars")
        .remove([currentPath]);
      if (delErr) {
        if (avatarMsg)
          avatarMsg.textContent = "Löschen fehlgeschlagen: " + delErr.message;
        return;
      }
    }

    // DB auf Standard setzen
    const { error: dbErr2 } = await sb
      .from("profiles")
      .update({ avatar_url: "standard.jpg" })
      .eq("id", session.user.id);

    if (dbErr2) {
      if (avatarMsg)
        avatarMsg.textContent = "DB-Update fehlgeschlagen: " + dbErr2.message;
      return;
    }

    // Preview auf Standard aktualisieren (signed url)
    const { data: signed, error: signErr } = await sb.storage
      .from("avatars")
      .createSignedUrl("standard.jpg", 60 * 10);

    if (!signErr && signed?.signedUrl) {
      if (avatarPreview) {
        avatarPreview.src = signed.signedUrl;
        avatarPreview.style.display = "block";
      }
      const topbarImg = document.getElementById("avatarImg");
      if (topbarImg) topbarImg.src = signed.signedUrl;
    } else {
      // fallback: Preview ausblenden
      if (avatarPreview) {
        avatarPreview.src = "";
        avatarPreview.style.display = "none";
      }
    }

    if (avatarMsg) avatarMsg.textContent = "Profilbild zurückgesetzt.";
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
