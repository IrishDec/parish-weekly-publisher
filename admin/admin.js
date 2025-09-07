// admin/admin.js
// Minimal, production-friendly pattern. No build step required.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cfg = window.__TOF_CFG__ || {};
if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
  console.error("Missing Supabase config: window.__TOF_CFG__");
  alert("Missing Supabase config. Please set SUPABASE_URL and SUPABASE_ANON_KEY.");
}

const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

// DOM refs
const form = document.getElementById("message-form");
const fields = {
  id: document.getElementById("id"),
  title: document.getElementById("title"),
  week_start: document.getElementById("week_start"),
  slug: document.getElementById("slug"),
  teaser_html: document.getElementById("teaser_html"),
  full_html: document.getElementById("full_html"),
  published: document.getElementById("published"),
};
const tableBody = document.querySelector("#messages-table tbody");
const emptyState = document.getElementById("empty-state");
const refreshBtn = document.getElementById("refresh-btn");
const resetBtn = document.getElementById("reset-btn");

// Helpers
const todayIso = () => new Date().toISOString().slice(0, 10);
const coerceBool = (v) => String(v) === "true";
const toRow = (m) => `
  <tr data-id="${m.id}">
    <td>${escapeHtml(m.title || "")}</td>
    <td>${m.week_start || ""}</td>
    <td>${m.published ? "✅" : "—"}</td>
    <td><code>${m.slug}</code></td>
    <td class="actions">
      <button data-action="edit">Edit</button>
      <button data-action="toggle">${m.published ? "Unpublish" : "Publish"}</button>
      <button data-action="delete">Delete</button>
    </td>
  </tr>
`;

// Very light HTML escape for table cells (admin form itself is trusted)
function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Load
async function loadMessages() {
  const { data, error } = await supabase
    .from("weekly_messages")
    .select("*")
    .order("week_start", { ascending: false });

  if (error) {
    console.error(error);
    alert("Failed to load messages.");
    return;
  }

  tableBody.innerHTML = (data || []).map(toRow).join("");
  emptyState.style.display = data && data.length ? "none" : "block";
}

// Reset form
function resetForm() {
  fields.id.value = "";
  fields.title.value = "";
  fields.week_start.value = todayIso();
  fields.slug.value = fields.week_start.value; // default slug to week_start
  fields.teaser_html.value = "";
  fields.full_html.value = "";
  fields.published.value = "false";
  form.querySelector("#save-btn").textContent = "Save";
}

// Autoset slug when week_start changes (if slug untouched)
fields.week_start.addEventListener("change", () => {
  if (!fields.slug.value) fields.slug.value = fields.week_start.value;
});

// Save (create or update)
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    title: fields.title.value?.trim() || null,
    week_start: fields.week_start.value,
    slug: fields.slug.value,
    teaser_html: fields.teaser_html.value || null,
    full_html: fields.full_html.value,
    published: coerceBool(fields.published.value),
  };

  // Basic guardrails
  if (!payload.week_start || !payload.slug || !payload.full_html) {
    alert("week_start, slug, and full_html are required.");
    return;
  }

  const id = fields.id.value;

  let resp;
  if (id) {
    resp = await supabase.from("weekly_messages").update(payload).eq("id", id).select().single();
  } else {
    resp = await supabase.from("weekly_messages").insert(payload).select().single();
  }

  const { data, error } = resp;
  if (error) {
    console.error(error);
    alert(error.message || "Save failed.");
    return;
  }

  resetForm();
  await loadMessages();
  // Put the just-saved row into edit mode for convenience
  if (data?.id) loadIntoForm(data);
});

// Edit / delete / toggle publish
tableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const tr = e.target.closest("tr");
  const id = tr?.dataset?.id;
  if (!id) return;

  const action = btn.dataset.action;
  if (action === "edit") {
    const { data, error } = await supabase.from("weekly_messages").select("*").eq("id", id).single();
    if (error) return alert("Could not load record.");
    loadIntoForm(data);
  } else if (action === "delete") {
    if (!confirm("Delete this message? This cannot be undone.")) return;
    const { error } = await supabase.from("weekly_messages").delete().eq("id", id);
    if (error) return alert("Delete failed.");
    await loadMessages();
  } else if (action === "toggle") {
    const { data: current, error: err1 } = await supabase
      .from("weekly_messages").select("published").eq("id", id).single();
    if (err1) return alert("Could not fetch current status.");
    const { error: err2 } = await supabase
      .from("weekly_messages").update({ published: !current.published }).eq("id", id);
    if (err2) return alert("Update failed.");
    await loadMessages();
  }
});

function loadIntoForm(m) {
  fields.id.value = m.id;
  fields.title.value = m.title || "";
  fields.week_start.value = m.week_start || "";
  fields.slug.value = m.slug || "";
  fields.teaser_html.value = m.teaser_html || "";
  fields.full_html.value = m.full_html || "";
  fields.published.value = String(!!m.published);
  form.querySelector("#save-btn").textContent = "Update";
}

refreshBtn.addEventListener("click", loadMessages);
resetBtn.addEventListener("click", resetForm);

// Init
resetForm();
loadMessages();

