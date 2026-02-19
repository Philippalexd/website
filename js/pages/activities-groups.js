import { sb } from "../lib/supabaseClient.js";
import { requireAuth } from "../lib/auth.js";

export async function initGroupsPage() {
  const session = await requireAuth();
  if (!session) return;

  // Admin-Check (aus profiles.is_admin)
  const { data: prof, error: pErr } = await sb
    .from("profiles")
    .select("is_admin")
    .eq("id", session.user.id)
    .single();

  if (pErr) alert("Profil konnte nicht geladen werden: " + pErr.message);
  const isAdmin = !!prof?.is_admin;

  const listEl = document.getElementById("groupsList");
  const hintEl = document.getElementById("groupsHint");

  const createForm = document.getElementById("createGroupForm");
  const createMsg = document.getElementById("createGroupMsg");

  async function render() {
    if (!listEl) return;

    // alle Gruppen
    const { data: groups, error: gErr } = await sb
      .from("groups")
      .select("id,name,created_by,created_at")
      .order("name", { ascending: true });

    if (gErr) return alert("Gruppen laden fehlgeschlagen: " + gErr.message);

    // meine Memberships
    const { data: my, error: mErr } = await sb
      .from("group_members")
      .select("group_id")
      .eq("user_id", session.user.id);

    if (mErr)
      return alert("Mitgliedschaften laden fehlgeschlagen: " + mErr.message);

    const mySet = new Set((my || []).map((x) => x.group_id));

    listEl.innerHTML = "";
    for (const g of groups || []) {
      const li = document.createElement("li");
      li.className = "item";

      const main = document.createElement("div");
      main.className = "item-main";
      main.textContent = g.name;

      const actions = document.createElement("div");
      actions.className = "item-actions";

      const isMember = mySet.has(g.id);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = isMember ? "danger btn" : "btn";
      btn.textContent = isMember ? "Verlassen" : "Beitreten";

      btn.addEventListener("click", async () => {
        if (!isMember) {
          const { error } = await sb.from("group_members").insert({
            group_id: g.id,
            user_id: session.user.id,
          });
          if (error) return alert("Beitreten fehlgeschlagen: " + error.message);
        } else {
          const { error } = await sb
            .from("group_members")
            .delete()
            .eq("group_id", g.id)
            .eq("user_id", session.user.id);

          if (error) return alert("Verlassen fehlgeschlagen: " + error.message);
        }
        await render();
      });

      actions.appendChild(btn);

      if (isAdmin) {
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "danger btn";
        delBtn.textContent = "Gruppe löschen";

        delBtn.addEventListener("click", async () => {
          if (!confirm(`Gruppe "${g.name}" wirklich löschen?`)) return;

          const { error } = await sb.from("groups").delete().eq("id", g.id);
          if (error) return alert("Löschen fehlgeschlagen: " + error.message);

          await render();
        });

        actions.appendChild(delBtn);
      }

      li.appendChild(main);
      li.appendChild(actions);
      listEl.appendChild(li);
    }

    if (hintEl) {
      hintEl.textContent = `Gruppen: ${(groups || []).length} · Mitglied in: ${mySet.size}`;
    }
  }

  createForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (createMsg) createMsg.textContent = "";

    const fd = new FormData(createForm);
    const name = String(fd.get("name") || "").trim();
    if (!name) return;

    const { data, error } = await sb
      .from("groups")
      .insert({
        name,
        created_by: session.user.id,
      })
      .select("id")
      .single();

    if (error) {
      if (createMsg)
        createMsg.textContent = "Gründen fehlgeschlagen: " + error.message;
      return;
    }

    // Ersteller direkt beitreten
    await sb.from("group_members").insert({
      group_id: data.id,
      user_id: session.user.id,
    });

    createForm.reset();
    if (createMsg) createMsg.textContent = "Gruppe erstellt.";
    await render();
  });

  await render();
}
