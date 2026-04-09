import { sb } from "../lib/supabaseClient.js";
import { requireAuth } from "../lib/auth.js";

function showToast() {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2000);
}

export async function initCreatePage() {
  const session = await requireAuth();
  if (!session) return;

  const form = document.getElementById("activityform");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    const payload = {
      user_id: session.user.id,
      type: data.type,
      date: data.date,
      minutes: Number(data.minutes),
      distance: data.distance === "" ? null : Number(data.distance),
      note: data.note ? String(data.note) : "",
    };

    const { error } = await sb.from("activities").insert(payload);
    if (error) return alert("Speichern fehlgeschlagen: " + error.message);

    form.reset();
    showToast();
  });
}
