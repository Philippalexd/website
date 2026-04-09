import { sb } from "../lib/supabaseClient.js";
import { requireAuth } from "../lib/auth.js";

export async function initProfilePage() {
  const session = await requireAuth();
  if (!session) return;

  const params = new URLSearchParams(location.search);
  const profileUserId = params.get("user") || session.user.id;

  const h1 = document.getElementById("profileHeadline");
  const bioEl = document.getElementById("profileBio");
  const avatarEl = document.getElementById("profileAvatar");

  const listEl = document.getElementById("profileActivities");
  const statsEl = document.getElementById("profileStats");

  // --- Profil laden (display_name, bio, avatar_url) ---
  const { data: profile, error: profErr } = await sb
    .from("profiles")
    .select("display_name,bio,avatar_url")
    .eq("id", profileUserId)
    .single();

  if (profErr) {
    if (h1) h1.textContent = "Profil";
  } else {
    if (h1) h1.textContent = profile?.display_name || "Profil";
    if (bioEl) bioEl.textContent = profile?.bio || "";

    // Avatar (private bucket => signed URL)
    if (profile?.avatar_url && avatarEl) {
      const { data, error } = await sb.storage
        .from("avatars")
        .createSignedUrl(profile.avatar_url, 60 * 10);

      if (!error && data?.signedUrl) {
        avatarEl.src = data.signedUrl;
        avatarEl.style.display = "block";
      }
    }
  }

  // --- Aktivitäten dieses Users laden (wie List-Page, aber nur Anzeige) ---
  const { data: items, error: actErr } = await sb
    .from("activities")
    .select("id,date,type,minutes,distance,note")
    .eq("user_id", profileUserId)
    .order("date", { ascending: false });

  if (actErr) {
    if (listEl) listEl.innerHTML = "";
    if (statsEl)
      statsEl.textContent = "Aktivitäten konnten nicht geladen werden.";
    return;
  }

  if (listEl) listEl.innerHTML = "";

  let totalMin = 0;
  let totalKm = 0;

  for (const a of items || []) {
    totalMin += a.minutes || 0;
    totalKm += a.distance || 0;

    const li = document.createElement("li");
    li.className = "item";
    li.textContent =
      `${a.date} · ${a.type} · ${a.minutes} min` +
      (a.distance != null ? ` · ${a.distance} km` : "") +
      (a.note ? ` · ${a.note}` : "");

    if (listEl) listEl.appendChild(li);
  }

  if (statsEl) {
    statsEl.textContent =
      `Einträge: ${items.length} · Summe: ${totalMin} min` +
      (totalKm ? ` · ${totalKm.toFixed(2)} km` : "");
  }
}
