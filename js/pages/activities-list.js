import { sb } from "../lib/supabaseClient.js";
import { requireAuth } from "../lib/auth.js";

export async function initListPage() {
  const session = await requireAuth();
  if (!session) return;

  const listEl = document.getElementById("list");
  const statsEl = document.getElementById("stats");
  const filterTypeEl = document.getElementById("filtertype");
  const sortByEl = document.getElementById("sortBy");
  const clearBtn = document.getElementById("clearBtn");

  async function render() {
    const filterType = filterTypeEl.value;
    const sortBy = sortByEl.value;

    let q = sb
      .from("activities")
      .select("id,date,type,minutes,distance,note")
      .eq("user_id", session.user.id);

    if (filterType) q = q.eq("type", filterType);
    q = q.order("date", { ascending: sortBy === "date_asc" });

    const { data: items, error } = await q;
    if (error) return alert("Laden fehlgeschlagen: " + error.message);

    listEl.innerHTML = "";

    let totalMin = 0;
    let totalKm = 0;

    for (const a of items) {
      totalMin += a.minutes || 0;
      totalKm += a.distance || 0;

      const li = document.createElement("li");
      li.className = "item";
      li.textContent =
        `${a.date} · ${a.type} · ${a.minutes} min` +
        (a.distance != null ? ` · ${a.distance} km` : "") +
        (a.note ? ` · ${a.note}` : "");

      // delete button
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "danger";
      delBtn.textContent = "Löschen";
      delBtn.addEventListener("click", async () => {
        if (!confirm("Diese Aktivität wirklich löschen?")) return;
        const { error } = await sb
          .from("activities")
          .delete()
          .eq("id", a.id)
          .eq("user_id", session.user.id);
        if (error) return alert("Löschen fehlgeschlagen: " + error.message);
        await render();
      });

      const actions = document.createElement("div");
      actions.className = "item-actions";
      actions.appendChild(delBtn);

      const wrap = document.createElement("div");
      wrap.className = "item-main";
      wrap.textContent = li.textContent;

      li.textContent = "";
      li.appendChild(wrap);
      li.appendChild(actions);

      listEl.appendChild(li);
    }

    statsEl.textContent =
      `Einträge: ${items.length} · Summe: ${totalMin} min` +
      (totalKm ? ` · ${totalKm.toFixed(2)} km` : "");
  }

  filterTypeEl.addEventListener("change", render);
  sortByEl.addEventListener("change", render);

  clearBtn?.addEventListener("click", async () => {
    if (!confirm("Wirklich ALLE Aktivitäten löschen?")) return;
    const { error } = await sb
      .from("activities")
      .delete()
      .eq("user_id", session.user.id);
    if (error) return alert("Alles löschen fehlgeschlagen: " + error.message);
    await render();
  });

  await render();
}
