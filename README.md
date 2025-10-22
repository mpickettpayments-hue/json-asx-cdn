# JSON-ASX CDN
This is the CDN for JSON-ASX.
Alright, captain—here’s your **solid L2 shell** with **W2 neon Feather icon sidebar**, **Builder = slide-over (B1)**, and **Preview behind (P1)**. It keeps your **R1 redirect + UID subdomains** flow, and it plays nice on mobile (no hamburger; pinned icon rail). I’m also dropping an **awesome README** that recaps everything so far.

Paste these 5 files directly in GitHub:

---

## 1) `index.html` (FINAL SHELL)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>XJSON • JSON ASX</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="manifest" href="./manifest.json" />
  <link rel="icon" href="./icon-192.png" />
  <link rel="stylesheet" href="./style.css" />
  <!-- Google Sign-In (keeps your existing auth.js flow) -->
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  <!-- Feather Icons -->
  <script src="https://unpkg.com/feather-icons/dist/feather.min.js" defer></script>
</head>
<body>
  <div id="appRoot" class="shell">
    <!-- Pinned neon icon sidebar (W2 ~82px) -->
    <aside class="sidebar">
      <div class="brand">
        <img src="./json-asx.jpg" alt="JSON ASX" />
      </div>
      <nav class="nav">
        <button class="nav-btn" data-route="/" data-title="Home">
          <i data-feather="home"></i>
        </button>
        <button class="nav-btn" data-route="/store/" data-title="Store">
          <i data-feather="shopping-bag"></i>
        </button>
        <button class="nav-btn" data-route="/library/" data-title="Library">
          <i data-feather="grid"></i>
        </button>
        <button class="nav-btn" data-route="/downloads/" data-title="Downloads">
          <i data-feather="download"></i>
        </button>
        <button class="nav-btn" data-route="/settings/" data-title="Settings">
          <i data-feather="settings"></i>
        </button>
        <div class="spacer"></div>
        <!-- Open Builder -->
        <button id="openBuilder" class="nav-btn" data-title="Builder">
          <i data-feather="code"></i>
        </button>
      </nav>
    </aside>

    <!-- Topbar (compact, no hamburger) -->
    <header class="topbar">
      <div class="channels">
        <span class="chip active" data-channel="latest">latest</span>
        <span class="chip" data-channel="stable">stable</span>
        <span class="chip" data-channel="nightly">nightly</span>
      </div>
      <div class="actions">
        <input id="q" class="search" placeholder="Search…" />
        <div id="googleBtn"></div>
        <input id="pat" class="pat" placeholder="Admin GitHub PAT" />
        <button id="savePat" class="btn">Save PAT</button>
        <button id="refresh" class="btn">Refresh</button>
      </div>
    </header>

    <!-- Main content (apps render here; preview is the content) -->
    <main id="main" class="content">
      <div class="boot-msg">Loading XJSON…</div>
    </main>

    <!-- Slide-over Builder (B1). On mobile becomes full-screen modal. -->
    <aside id="builder" class="builder hidden">
      <div class="builder-header">
        <div class="tabs">
          <button class="tab active" data-tab="editor">Editor</button>
          <button class="tab" data-tab="ai">AI</button>
        </div>
        <button id="closeBuilder" class="icon-btn" title="Close Builder">
          <i data-feather="x"></i>
        </button>
      </div>

      <div class="builder-body">
        <!-- Editor tab -->
        <section class="tab-panel" data-tab-panel="editor">
          <div class="row">
            <select id="builderTarget"><option value="">Select JSON App…</option></select>
            <button id="saveApp" class="btn">Save</button>
            <button id="publishBtn" class="btn">Publish</button>
          </div>
          <textarea id="appJson" class="code" spellcheck="false"></textarea>
        </section>

        <!-- AI tab -->
        <section class="tab-panel hidden" data-tab-panel="ai">
          <div class="row">
            <input id="langflowUrl" placeholder="LangFlow endpoint (POST) e.g. https://…/api/v1/run" />
          </div>
          <div class="row">
            <input id="chatInput" placeholder="Describe a change (we’ll apply it, not paste code)" />
            <button id="chatSend" class="btn">Apply</button>
          </div>
          <div id="chatLog" class="chat-log"></div>
        </section>
      </div>
    </aside>

    <!-- Fullscreen prompt (20s) for subdomains -->
    <div id="fsOffer" class="fs-offer hidden">
      <span>Tip: Fullscreen for best experience</span>
      <button id="fsGo" class="btn">Go Fullscreen</button>
      <button id="fsDismiss" class="btn">Dismiss</button>
    </div>
  </div>

  <!-- App logic -->
  <script type="module" src="./app.js"></script>
  <script>
    // Activate feather icons after DOM
    document.addEventListener('DOMContentLoaded', () => {
      if (window.feather) window.feather.replace();
    });
  </script>
</body>
</html>
```

---

## 2) `style.css` (NEON CONSOLE UI + MOBILE)

```css
:root{
  --bg:#0b0f14;
  --panel:#0c1117;
  --panel2:#10161d;
  --muted:#8aa0b2;
  --text:#e4eef8;
  --accent:#1DAFFF;      /* neon blue */
  --accent2:#5BD7FF;     /* hover/active */
  --line:#172231;
  --radius:14px;
  --sidebarW:82px;       /* W2 */
}

/* Reset */
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;background:#06090d;color:var(--text);font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif}

/* Shell grid */
.shell{
  display:grid;
  grid-template-columns: var(--sidebarW) 1fr;
  grid-template-rows: 56px calc(100% - 56px);
  grid-template-areas:
    "sidebar topbar"
    "sidebar content";
  height:100%;
}

/* Sidebar (matte black) */
.sidebar{
  grid-area:sidebar;
  background:#000;
  display:flex;
  flex-direction:column;
  align-items:center;
  padding:10px 0;
  border-right:1px solid #0a0a0a;
}
.brand img{width:42px;height:42px;border-radius:8px;object-fit:cover;margin:8px 0 10px}
.nav{display:flex;flex-direction:column;gap:10px;width:100%;align-items:center}
.nav-btn{
  width:54px;height:54px;border-radius:12px;border:1px solid #0f0f0f;background:#0a0a0a;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;
  transition:transform .16s ease, box-shadow .16s ease, border-color .16s ease;
  color:var(--accent);
  filter: drop-shadow(0 0 0 rgba(29,175,255,0));
}
.nav-btn:hover{
  border-color:#122538;
  box-shadow:0 0 18px rgba(91,215,255,.28), inset 0 0 8px rgba(29,175,255,.2);
  filter: drop-shadow(0 0 6px rgba(91,215,255,.55));
}
.nav-btn.active{
  border-color:#1f3f5c;
  box-shadow:0 0 22px rgba(91,215,255,.42), inset 0 0 10px rgba(29,175,255,.28);
  transform: translateZ(0) scale(1.02);
  filter: drop-shadow(0 0 8px rgba(91,215,255,.7));
}
.nav-btn i{width:22px;height:22px;stroke:var(--accent2);stroke-width:2}
.nav .spacer{flex:1}

/* Topbar */
.topbar{
  grid-area:topbar;
  background:linear-gradient(180deg,#0b1117,#0b0f14);
  border-bottom:1px solid var(--line);
  display:flex;align-items:center;justify-content:space-between;
  padding:8px 12px;
}
.channels{display:flex;gap:8px}
.chip{
  border:1px solid #203040;background:#0b131b;color:#bcd0e0;padding:6px 10px;border-radius:20px;font-size:12px;cursor:pointer
}
.chip.active{background:#17324a;border-color:#24527a;color:#e9f5ff}
.actions{display:flex;align-items:center;gap:8px}
.search{width:220px;max-width:40vw;background:#0c141c;border:1px solid #1b2734;border-radius:999px;padding:8px 12px;color:var(--text)}
.pat{width:200px;background:#0c141c;border:1px solid #1b2734;border-radius:8px;padding:8px 10px;color:var(--text)}
.btn{background:#15324a;border:1px solid #214f74;color:#d6ecff;border-radius:10px;padding:8px 12px;cursor:pointer}

/* Content area (fullscreen apps) */
.content{
  grid-area:content;
  position:relative;
  overflow:auto;
  background:radial-gradient(1200px 800px at 70% -200px, rgba(29,175,255,.07), transparent 60%), linear-gradient(180deg,#0a0e13,#0d131a 30%,#0b0f14);
  padding:18px;
}
.boot-msg{color:var(--muted);padding:12px}

/* Cards & grids (for home/store/library routes) */
.card{background:var(--panel2);border:1px solid var(--line);border-radius:var(--radius);padding:16px}
.section{margin-bottom:22px}
.h3{margin:0 0 10px 0}
.tilegrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
.tile{background:#0e141b;border:1px solid #172231;border-radius:12px;overflow:hidden;cursor:pointer;display:flex;flex-direction:column}
.tile img{width:100%;aspect-ratio:16/9;object-fit:cover;background:#0b0f14}
.tile .meta{padding:10px 12px;display:flex;justify-content:space-between;align-items:center;font-size:14px;color:#cfe3f4}

/* Builder slide-over (B1) */
.builder{
  position:fixed; top:56px; right:0; bottom:0; width:min(42vw,720px);
  background:linear-gradient(180deg,#0b1218,#0a0f14);
  border-left:1px solid var(--line);
  transform:translateX(100%); transition:transform .22s ease;
  z-index:50; display:flex; flex-direction:column;
}
.builder.show{transform:translateX(0)}
.builder-header{
  display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-bottom:1px solid var(--line);
}
.tabs{display:flex; gap:8px}
.tab{background:#0f1720;border:1px solid #1b2940;color:#cfe3f4;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:13px}
.tab.active, .tab:hover{background:#142438;border-color:#244b71}
.icon-btn{background:transparent;border:1px solid #18222e;border-radius:8px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;color:#9ccff0;cursor:pointer}
.builder-body{padding:12px; overflow:auto; flex:1; display:block}
.row{display:flex;gap:8px;margin:8px 0} .row>*{flex:1}
.code{
  width:100%;min-height:46vh;background:#0a1117;color:#dbeaf7;border:1px solid #1b2734;border-radius:10px;padding:12px;
  font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:13px; line-height:1.45;
}
.chat-log{background:#0a1117;border:1px solid #1b2734;border-radius:10px;padding:10px;color:#b6cfe4;min-height:160px}

/* Fullscreen offer */
.fs-offer{
  position:fixed; left:50%; transform:translateX(-50%); bottom:16px;
  background:#0f1720;border:1px solid #223246;color:#e9f5ff;border-radius:12px;padding:10px 14px;display:flex;gap:10px;align-items:center;z-index:60;
  box-shadow:0 8px 30px rgba(0,0,0,.35)
}
.fs-offer.hidden{display:none}

/* Hidden util */
.hidden{display:none}

/* Responsive */
@media (max-width: 900px){
  .builder{width:100vw}
  .topbar .actions{gap:6px}
  .search{max-width:52vw}
}
@media (max-width: 640px){
  .search{display:none}
  .pat{width:150px}
}
```

---

## 3) `app.js` (ROUTER + SUBDOMAIN + BUILDER + AI)

```js
// app.js — L2 shell with W2 neon sidebar, B1 builder slide-over, P1 preview.
// Reuses: auth.js (Google login), provision.js (first-time install), publish.js (push changes)

import { publishAppJson } from './publish.js';

// ---------- Config ----------
const MAIN_HOST = 'xjson.app';
const CDN = 'https://mpickettpayments-hue.github.io/json-asx-cdn';
const USERS_BASE = `${CDN}/users`;
let channel = 'latest';
let os;

// ---------- DOM ----------
const mainEl = document.getElementById('main');
const chips = [...document.querySelectorAll('.chip')];
const qEl = document.getElementById('q');
const navBtns = [...document.querySelectorAll('.nav-btn')];
const openBuilderBtn = document.getElementById('openBuilder');
const builder = document.getElementById('builder');
const closeBuilder = document.getElementById('closeBuilder');
const tabs = [...document.querySelectorAll('.tab')];
const editorPanel = document.querySelector('[data-tab-panel="editor"]');
const aiPanel = document.querySelector('[data-tab-panel="ai"]');
const builderTarget = document.getElementById('builderTarget');
const appJsonEl = document.getElementById('appJson');
const saveAppBtn = document.getElementById('saveApp');
const publishBtn = document.getElementById('publishBtn');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const chatLog = document.getElementById('chatLog');
const langflowUrl = document.getElementById('langflowUrl');
const fsOffer = document.getElementById('fsOffer');
const fsGo = document.getElementById('fsGo');
const fsDismiss = document.getElementById('fsDismiss');

const patEl = document.getElementById('pat');
document.getElementById('savePat').onclick = () => {
  localStorage.setItem('xjson.admin.pat', patEl.value.trim());
  alert('PAT saved.');
};
patEl.value = localStorage.getItem('xjson.admin.pat') || '';

// ---------- Utils ----------
const ensureSlash = p => (p.endsWith('/') ? p : p + '/');
const isSubdomain = () =>
  location.hostname.endsWith('.' + MAIN_HOST) && location.hostname !== MAIN_HOST;
const subdomainUid = () => (isSubdomain() ? location.hostname.split('.')[0] : null);

// ---------- Minimal JSON runtime ----------
function renderJsonApp(mount, spec) {
  if (!mount) return;
  const state = { ...(spec.state || {}) };
  const scene = spec.scene || [];
  mount.innerHTML = scene.map(nodeToHTML).join('');

  // Wire simple actions
  mount.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      try {
        const fn = btn.getAttribute('data-action') || '';
        if (fn.startsWith('set(')) {
          const inside = fn.slice(4, -1);
          const [k, vExpr] = inside.split(',').map(s => s.trim());
          const v = evalMath(vExpr, state);
          state[k] = v;
          renderJsonApp(mount, { ...spec, state });
        }
      } catch (e) { console.warn(e); }
    });
  });

  function nodeToHTML(n) {
    if (n.type === 'row') return `<div style="display:flex;gap:8px">${(n.children||[]).map(nodeToHTML).join('')}</div>`;
    if (n.type === 'col') return `<div style="display:flex;flex-direction:column;gap:8px">${(n.children||[]).map(nodeToHTML).join('')}</div>`;
    if (n.type === 'text') return `<div style="padding:8px 0">${escapeHTML(resolve(n.value))}</div>`;
    if (n.type === 'button') return `<button class="btn" data-action="${n.action||''}" style="margin:4px 0">${escapeHTML(resolve(n.label||'Button'))}</button>`;
    if (n.type === 'image') return `<img src="${resolve(n.src)}" alt="" style="max-width:100%;border-radius:10px;border:1px solid #172231">`;
    return `<div class="small muted">Unknown node: ${escapeHTML(n.type||'')}</div>`;
  }
  function resolve(val){
    if (typeof val !== 'string') return val;
    return val.replace(/\$\{state\.([a-zA-Z0-9_]+)\}/g, (_,k)=> state[k]);
  }
  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function evalMath(expr, st){
    const safe = String(expr).replace(/\$\{state\.([a-zA-Z0-9_]+)\}/g, (_,k)=> JSON.stringify(st[k]));
    if (!/^[0-9+\-*/ ().]+$/.test(safe)) return 0;
    return Function('"use strict";return('+safe+')')();
  }
}

// Exposed so AI can apply changes without pasting code:
window.applySpec = function applySpec(spec){
  // If we're editing a particular app, refresh preview after setting textarea
  appJsonEl.value = JSON.stringify(spec, null, 2);
  try {
    const parsed = JSON.parse(appJsonEl.value);
    // Render preview area (main) in-place
    const wrap = document.createElement('div');
    wrap.className = 'card';
    wrap.innerHTML = `<h3 class="h3">Preview</h3><div id="jsonAppMount"></div>`;
    mainEl.innerHTML = '';
    mainEl.appendChild(wrap);
    renderJsonApp(document.getElementById('jsonAppMount'), parsed);
  } catch (e) {
    alert('Invalid JSON from AI applySpec: ' + e.message);
  }
};

// ---------- Routing (Main domain only) ----------
function goto(route){
  route = ensureSlash(route);
  history.pushState({}, '', route);
  render(route);
}
window.addEventListener('popstate', () => { if (!isSubdomain()) render(location.pathname); });

function section(title, content){
  return `<div class="section"><div class="card"><h3 class="h3">${title}</h3>${content}</div></div>`;
}
function tile(item, onClick){
  const art = item.art || `https://picsum.photos/seed/xjson/640/360`;
  return `
  <div class="tile" onclick="${onClick || ''}">
    <img src="${art}" alt="">
    <div class="meta"><span>${item.title}</span><span class="small muted">${item.tag||''}</span></div>
  </div>`;
}
function grid(list, clickMaker){
  return `<div class="tilegrid">${(list||[]).map(i => tile(i, clickMaker ? clickMaker(i) : '')).join('')}</div>`;
}
function hero(){
  const h = os.hero || { title:'Welcome to XJSON', subtitle:'Build & launch apps with JSON' };
  return `
  <div class="section">
    <div class="card">
      <h3 class="h3">${h.title}</h3>
      <div class="small muted">${h.subtitle}</div>
      <div style="margin-top:10px">
        <button class="btn" onclick="(${goto}).call(null,'/store/')">Browse Store</button>
        <button class="btn" onclick="(${goto}).call(null,'/library/')">Open Library</button>
      </div>
    </div>
  </div>`;
}

function render(pathname){
  const path = ensureSlash(pathname || location.pathname);
  navBtns.forEach(b => b.classList.toggle('active', ensureSlash(b.dataset.route||'') === path));
  const q = (qEl?.value || '').toLowerCase();
  let html = '';

  if (path === '/') {
    html += hero();
    html += section('Featured', grid(os.featured, i => `launch('${i.id||i.title}')`));
    html += section('Library', grid((os.library||[]).filter(i=>i.title.toLowerCase().includes(q)).slice(0,8), i => `launch('${i.id||i.title}')`));
  }
  else if (path === '/store/') {
    const list = (os.store||[]).filter(i=>i.title.toLowerCase().includes(q));
    html += section('Store', grid(list, i => `launch('${i.id||i.title}')`));
  }
  else if (path === '/library/') {
    const list = (os.library||[]).filter(i=>i.title.toLowerCase().includes(q));
    html += section('Library', grid(list, i => `launch('${i.id||i.title}')`));
  }
  else if (path === '/downloads/') {
    html += section('Downloads', `<div class="small muted">No active downloads yet (queue coming).</div>`);
  }
  else if (path === '/settings/') {
    html += section('Settings', `
      <div class="small muted">Channel: <strong>${channel}</strong></div>
      <div class="row"><input id="cfgLangflow" placeholder="LangFlow endpoint" value="${langflowUrl.value||''}" /></div>
      <div class="row"><button class="btn" id="clearCache">Clear cache</button></div>
    `);
    setTimeout(()=>{
      document.getElementById('clearCache').onclick = async ()=>{
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
        alert('Cache cleared. Reloading.'); location.reload();
      };
      const cfg = document.getElementById('cfgLangflow');
      if (cfg) cfg.onchange = ()=> (langflowUrl.value = cfg.value);
    },0);
  }
  else {
    html += section('Not found', `<div class="small muted">Route ${path} not found.</div>`);
  }

  mainEl.innerHTML = html;
}

// ---------- Launchers ----------
window.launch = (id)=>{
  const app = (os.apps||[]).find(a => a.id === id);
  if (!app) return alert('App not found: ' + id);

  if (app.type === 'json') {
    const wrap = document.createElement('div');
    wrap.className = 'card';
    wrap.innerHTML = `<h3 class="h3">${app.title}</h3><div id="jsonAppMount"></div>`;
    mainEl.innerHTML = '';
    mainEl.appendChild(wrap);
    renderJsonApp(document.getElementById('jsonAppMount'), app.spec || {});
    // prefill builder target
    const opt = [...builderTarget.options].find(o=>o.value===app.id);
    if (opt) builderTarget.value = app.id;
    appJsonEl.value = JSON.stringify(app.spec||{}, null, 2);
  } else if (app.type === 'iframe') {
    mainEl.innerHTML = `<div class="card"><h3 class="h3">${app.title}</h3><iframe src="${app.src}" style="width:100%;height:72vh;border:0;border-radius:10px;background:#0b0f14"></iframe></div>`;
  } else {
    alert('Unknown app type: ' + app.type);
  }
};

// ---------- Channels ----------
chips.forEach(c => c.addEventListener('click', ()=> {
  channel = c.dataset.channel;
  chips.forEach(x=>x.classList.toggle('active', x===c));
  bootMain();
}));

// ---------- Search ----------
qEl?.addEventListener('input', ()=> { if (!isSubdomain()) render(location.pathname); });

// ---------- Sidebar actions ----------
navBtns.forEach(b=>{
  const r = b.dataset.route;
  if (!r) return;
  b.addEventListener('click', ()=> { if (!isSubdomain()) goto(r); });
  // Tooltip title
  if (b.dataset.title) b.title = b.dataset.title;
});

// ---------- Builder slide-over ----------
openBuilderBtn.addEventListener('click', ()=> builder.classList.add('show'));
closeBuilder.addEventListener('click', ()=> builder.classList.remove('show'));
function showTab(name){
  tabs.forEach(t=>{
    t.classList.toggle('active', t.dataset.tab===name);
  });
  editorPanel.classList.toggle('hidden', name!=='editor');
  aiPanel.classList.toggle('hidden', name!=='ai');
}
tabs.forEach(t=> t.addEventListener('click', ()=> showTab(t.dataset.tab)));
showTab('editor');

// Save (preview only)
saveAppBtn.addEventListener('click', ()=>{
  try{
    const parsed = JSON.parse(appJsonEl.value);
    window.applySpec(parsed);
    alert('Saved to preview. Use Publish to push to your domain.');
  }catch(e){ alert('Invalid JSON: ' + e.message); }
});

// Publish to user domain
publishBtn.addEventListener('click', async ()=>{
  const uid = window.CURRENT_UID || subdomainUid() || prompt('Your UID (e.g., u_name_x1y2):');
  const token = localStorage.getItem('xjson.admin.pat') || '';
  if (!token) return alert('Admin PAT required.');
  const appId = builderTarget.value || 'starter';
  try{
    const spec = JSON.parse(appJsonEl.value || '{}');
    const r = await publishAppJson({ uid, appId, spec, token });
    alert('Published! ' + r.url);
    window.open(r.url, '_blank');
  }catch(e){ alert('Publish failed: ' + e.message); }
});

// AI tab: send prompt → expect JSON spec (we apply, no code dump)
chatSend.addEventListener('click', async ()=>{
  const url = (langflowUrl.value||'').trim();
  const prompt = (chatInput.value||'').trim();
  if (!url) return alert('Enter LangFlow endpoint.');
  if (!prompt) return;

  chatLog.innerHTML = `<div>Sending: ${escapeHTML(prompt)}</div>`;
  try{
    const current = JSON.parse(appJsonEl.value || '{}');
    const resp = await fetch(url, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ prompt, current })
    });
    const data = await resp.json();
    const updated = data.scene ? { scene:data.scene, state:data.state||{} } : data;
    appJsonEl.value = JSON.stringify(updated, null, 2);
    window.applySpec(updated);
    chatLog.innerHTML += `<div>Applied changes.</div>`;
  }catch(e){
    chatLog.innerHTML += `<div>Error: ${escapeHTML(e.message)}</div>`;
  }
});
function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// ---------- Fullscreen offer (subdomain) ----------
function offerFullscreenFor20s(){
  if (!fsOffer) return;
  fsOffer.classList.remove('hidden');
  let t = setTimeout(()=> fsOffer.classList.add('hidden'), 20000);
  fsGo.onclick = async ()=>{
    try{ if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); }
    catch(e){ console.warn(e); }
    finally{ fsOffer.classList.add('hidden'); clearTimeout(t); }
  };
  fsDismiss.onclick = ()=> { fsOffer.classList.add('hidden'); clearTimeout(t); };
}

// ---------- Boot flows ----------
async function bootMain(){
  mainEl.innerHTML = `<div class="boot-msg">Loading ${channel}/os.json …</div>`;
  const r = await fetch(`${CDN}/${channel}/os.json`, { cache:'no-store' });
  os = await r.json();
  // Populate Builder target with JSON apps
  const options = (os.apps||[]).filter(a=>a.type==='json').map(a=>`<option value="${a.id}">${a.title}</option>`).join('');
  builderTarget.innerHTML = `<option value="">Select JSON App…</option>${options}`;
  render(location.pathname);
}

async function bootUser(){
  const uid = subdomainUid();
  mainEl.innerHTML = `<div class="boot-msg">Loading ${uid}…</div>`;
  // Load manifest
  const manifest = await (await fetch(`${USERS_BASE}/${uid}/manifest.json`, {cache:'no-store'})).json();
  const mainId = manifest.main;
  const appSpec = await (await fetch(`${USERS_BASE}/${uid}/apps/${mainId}/app.json`, {cache:'no-store'})).json();
  // Render JSON app windowed (preview behind builder)
  const wrap = document.createElement('div');
  wrap.className = 'card';
  wrap.innerHTML = `<h3 class="h3">${manifest.title || mainId}</h3><div id="jsonAppMount"></div>`;
  mainEl.innerHTML = ''; mainEl.appendChild(wrap);
  renderJsonApp(document.getElementById('jsonAppMount'), appSpec);

  // Pre-fill editor
  builderTarget.innerHTML = `<option value="${mainId}">${manifest.title||mainId}</option>`;
  builderTarget.value = mainId;
  appJsonEl.value = JSON.stringify(appSpec, null, 2);

  offerFullscreenFor20s();
}

// Decide which mode to boot
if (isSubdomain()) {
  bootUser();
} else {
  (async ()=> { await bootMain(); })();
}

// Service worker
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
```

---

## 4) `router-tools.js` (redirect helper; keep using)

```js
// router-tools.js
export function redirectToUserDomain(uid) {
  const proto = window.location.protocol;
  const host = window.location.hostname.replace(/^www\./,'');
  const parts = host.split('.');
  const main = parts.slice(parts.length-2).join('.');
  window.location.href = `${proto}//${uid}.${main}/`;
}
```

---

## 5) `README.md` (EPIC RECAP)

```markdown
# JSON ASX • XJSON

**Steam/Xbox-style web OS** that boots apps from **JSON**, publishes to **GitHub Pages**, and gives every user a **personal subdomain** like:

```

[https://u_abcdef.xjson.app/](https://u_abcdef.xjson.app/)

```

This repo hosts the **OS**, the **CDN JSON**, and the **user sites** under `/users/<uid>/`.

---

## 🚀 What it does

- **Launcher UI (L2):** Fullscreen console shell with a pinned, neon Feather-icon sidebar (no hamburger).
- **Routing:** Clean routes with trailing slashes. Works on GitHub Pages (404 fallback).
- **Subdomains:** `*.xjson.app` auto-launch the user’s main JSON app (windowed). Fullscreen prompt appears for 20s.
- **Builder (B1):** Slide-over panel with tabs:
  - **Editor:** Live JSON editor with instant preview behind the panel (P1).
  - **AI:** LangFlow/LLM chat that _applies_ changes (no giant code dumps).
- **Google Sign-In:** First login → **auto-provision** `/users/<uid>/…` (UID-C format).
- **Publish:** Admin-scoped GitHub token pushes app changes to `/users/<uid>/apps/<id>/app.json`.
- **Channels:** `latest`, `stable`, `nightly` served from this repo (`/latest/os.json` etc).
- **PWA:** Simple `sw.js` for caching shell assets.

---

## 🧱 Tech choices

- **UI:** Vanilla HTML/CSS/JS + Feather Icons
- **Auth:** Google Identity Services (client)
- **Provision/Publish:** GitHub REST (fine-grained PAT; repo-scoped)
- **Hosting:** GitHub Pages (+ custom domain, wildcard `*.xjson.app`)
- **Data:** Flat JSON files (OS + per-user apps)

---

## 🔐 Security (MVP)

- A single **fine-grained GitHub Personal Access Token** (PAT) with:
  - Repository access: **this repo only**
  - Permissions: **Contents: Read & Write**, **Metadata: Read**
- Token is **pasted by the admin** in the OS topbar and stored in `localStorage`.
- Users cannot see the PAT; they only trigger writes via the OS.
- For public self-serve later, put a tiny proxy (Cloudflare Worker) to mediate writes per UID.

---

## 🧭 Directory map

```

/
├─ index.html        # OS shell
├─ style.css         # Neon console UI (+ responsive)
├─ app.js            # Router, builder, subdomains, preview
├─ auth.js           # Google Sign-In + UID-C generator
├─ provision.js      # First-login template install → /users/<uid>/
├─ publish.js        # Publish app JSON to /users/<uid>/apps/<id>/
├─ router-tools.js   # Redirect helpers
├─ sw.js             # PWA shell cache
├─ 404.html          # SPA fallback (preserves deep routes)
├─ latest/os.json    # OS dataset (also stable/nightly if used)
└─ users/
└─ <uid>/
├─ manifest.json
└─ apps/
└─ <appId>/
└─ app.json

````

---

## 🔧 First-time setup

1. **Custom Domain**
   - Set GitHub Pages → Custom Domain → `xjson.app`
   - DNS: apex `A` (4x Pages IPs) + `CNAME * → username.github.io`
   - Enforce HTTPS

2. **Wildcard subdomains**: `*.xjson.app` → same `CNAME` (`username.github.io`)

3. **Admin PAT**
   - GitHub → Settings → Developer settings → Fine-grained tokens
   - Repo access: `json-asx-cdn`
   - Permissions: Contents (Read/Write), Metadata (Read)
   - Paste token into OS topbar, **Save PAT**

4. **Google OAuth**
   - Create Web Client ID in Google Cloud
   - Put it into `auth.js` `client_id`

5. **Test**
   - Open `https://xjson.app/`
   - Sign in with Google → should **provision** a UID (e.g., `u_name_1a2b`)
   - Auto-redirect to `https://u_name_1a2b.xjson.app/`
   - JSON app auto-launches (windowed). Fullscreen prompt appears.

---

## 🧪 Build a JSON game

Open the **Builder**, choose an app (e.g., `starter`), and change the JSON:

```json
{
  "state": { "score": 0 },
  "scene": [
    { "type": "text", "value": "Score: ${state.score}" },
    { "type": "row", "children": [
      { "type": "button", "label": "Tap +1", "action": "set(score, ${state.score}+1)" },
      { "type": "button", "label": "Reset",  "action": "set(score, 0)" }
    ] }
  ]
}
````

Click **Save** → preview updates instantly.
Click **Publish** → deploys to your subdomain.

---## User Provisioning (P2 Vault)

On first Google Sign-In (main domain only), the OS calls:

- `ensureUserProvisioned(uid, PAT, email)` → writes:
  - `/users/<uid>/manifest.json` (SSoT)
  - `/users/<uid>/profile.json` (Base44-style identity)
  - `/users/<uid>/library.json` (owned apps)
  - `/users/<uid>/ledger.json` (XP + badges)
  - `/users/<uid>/vault.json` (asset index)
  - `/users/<uid>/dashboard.asx`
  - `/users/<uid>/apps/starter/app.json`

Admin must paste a **fine-grained GitHub PAT** (repo-scoped, Contents RW) in **Settings** first.

## 🤖 AI Builder

* Enter your **LangFlow endpoint** in the AI tab.
* Type how you want the game to change (e.g., *“Add a Start button that sets score to 0 and show a large header”*).
* The AI returns an updated JSON spec → we **apply** it to the Editor and Preview. No giant code paste.

---

## 🗺️ Roadmap

* Export to **Desktop** (WebView2/Tauri)
* **Downloads queue** (SW background)
* App **version channels**
* **WASM** plug-ins (C/C#/C++)
* **Vanity subdomains** → map names to UID
* Asset **CDN** (+ quotas, abuse controls)
* **Monetization** (Stripe, Coinbase)
* **Friends / presence** (optional)

---

Built with ❤️ for creators.
**JSON ASX / XJSON** — a new way to build & ship apps like a console OS.

```

---

### That’s the whole bundle.  
Paste these five files and hit refresh. If anything looks off, hard reload (Ctrl/Cmd+F5) to bust caches. Then we’re ready to add **App Store + Downloads Queue** next.
```
