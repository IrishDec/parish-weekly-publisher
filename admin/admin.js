// 👉 Replace with YOUR real values
const SUPABASE_URL = "https://YOUR-PROJECT.ref.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3anRyYnhleHh6b3d5anBieHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzEwNzcsImV4cCI6MjA3Mjc0NzA3N30.zeo1fB1FSpwj2ayIIh_KIw4MBLfgSLVkhvJIeS516hc";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = id => document.getElementById(id);
const form = $('wm-form'), list = $('wm-list');
const week_start = $('week_start'), title = $('title');
const teaser_html = $('teaser_html'), full_html = $('full_html');
const published = $('published'), resetBtn = $('resetForm');

function slugFromDate(dStr){
  const d = new Date(dStr);
  return isNaN(d) ? "" : d.toISOString().slice(0,10); // YYYY-MM-DD
}

async function loadList(){
  try{
    const { data, error } = await sb
      .from('weekly_messages')
      .select('id,title,week_start,slug,published')
      .order('week_start',{ascending:false})
      .limit(12);

    if (error) throw error;
    if (!data?.length){ list.textContent = 'No messages yet.'; return; }

    list.innerHTML = data.map(r => `
      <div class="wm-row" data-id="${r.id}">
        <div>
          <strong>${new Date(r.week_start).toLocaleDateString('en-IE',{day:'numeric',month:'long',year:'numeric'})}</strong>
          — ${r.title ?? ''} ${r.published ? '<span class="badge">Published</span>' : '<span class="badge">Draft</span>'}
        </div>
        <div class="wm-actions">
          <button data-act="edit" class="ghost">Edit</button>
          <button data-act="toggle">${r.published ? 'Unpublish' : 'Publish'}</button>
          <button data-act="delete" class="danger">Delete</button>
        </div>
      </div>
    `).join('');
  }catch(e){
    list.textContent = 'Error: ' + (e?.message || e);
  }
}

list.addEventListener('click', async (e) => {
  const btn = e.target.closest('button'); if (!btn) return;
  const row = btn.closest('.wm-row'); const id = row?.dataset.id; if (!id) return;

  if (btn.dataset.act === 'delete'){
    if (!confirm('Delete this message?')) return;
    const { error } = await sb.from('weekly_messages').delete().eq('id', id);
    if (error) return alert(error.message);
    loadList(); return;
  }

  if (btn.dataset.act === 'toggle'){
    const makePublished = /Publish/.test(btn.textContent);
    const { error } = await sb.from('weekly_messages').update({ published: makePublished }).eq('id', id);
    if (error) return alert(error.message);
    loadList(); return;
  }

  if (btn.dataset.act === 'edit'){
    const { data, error } = await sb.from('weekly_messages').select('*').eq('id', id).single();
    if (error) return alert(error.message);
    week_start.value = data.week_start?.slice(0,10) || '';
    title.value = data.title || '';
    teaser_html.value = data.teaser_html || '';
    full_html.value = data.full_html || '';
    published.checked = !!data.published;
    window.scrollTo({ top: form.offsetTop - 20, behavior: 'smooth' });
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const ws = week_start.value;
  const payload = {
    week_start: ws,
    slug: slugFromDate(ws),
    title: title.value.trim(),
    teaser_html: teaser_html.value.trim(),
    full_html: full_html.value.trim(),
    published: published.checked
  };
  const { error } = await sb.from('weekly_messages').upsert(payload, { onConflict: 'slug' });
  if (error) return alert(error.message);
  alert('Saved.');
  form.reset();
  loadList();
});

resetBtn.addEventListener('click', () => form.reset());

loadList();

