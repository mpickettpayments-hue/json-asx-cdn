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
