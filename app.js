// app.js — CDN alias + image route fix, /editor/ (E2-A), /guide/, PV1 full preview,
// relative CDN (C), strict loader (F2), TB2, D1 debug overlay.

import { publishAppJson } from './publish.js';

const CDN = ".";
const MAIN_HOST = "xjson.app";
const USERS_BASE = `${CDN}/users`;

let channel = "latest";
let os;

// ---------- CDN alias resolver ----------
function detectCdnBase() {
  // On GitHub Pages, the app is served under /<repo>; on custom domains it's root.
  if (location.hostname.endsWith('github.io')) {
    const seg = location.pathname.split('/').filter(Boolean)[0] || '';
    return `${location.origin}/${seg}`;
  }
  // Custom domain or local: use origin root
  return `${location.origin}`;
}
const CDN_BASE = detectCdnBase();
// @cdn/foo.png -> https://host/repo/foo.png  (GH Pages)  OR  https://domain/foo.png (custom)
function resolveCDN(path) {
  if (typeof path !== 'string') return path;
  if (path.startsWith('@cdn/')) return `${CDN_BASE}/${path.slice(5)}`;
  return path;
}

// ---------- DOM refs ----------
const mainEl = document.getElementById('main');
const chips = [...document.querySelectorAll('.chip')];
const qEl = document.getElementById('q');
const navBtns = [...document.querySelectorAll('.nav-btn')];

const debugBtn = document.getElementById('debugBtn');
const debugPanel = document.getElementById('debugPanel');
const closeDebug = document.getElementById('closeDebug');
const errorTable = document.getElementById('errorTable')?.querySelector('tbody');
const osMetaPre = document.getElementById('osMeta');
const lastFetchPre = document.getElementById('lastFetch');

const fsOffer = document.getElementById('fsOffer');
const fsGo = document.getElementById('fsGo');
const fsDismiss = document.getElementById('fsDismiss');

// ---------- utils ----------
const ensureSlash = p => (p.endsWith('/') ? p : p + '/');
const isSubdomain = () => location.hostname.endsWith('.' + MAIN_HOST) && location.hostname !== MAIN_HOST;
const subdomainUid = () => (isSubdomain() ? location.hostname.split('.')[0] : null);
function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function debounce(fn, ms=250){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

// ---------- error feed ----------
function pushErr(type, msg, src){
  if (!errorTable) return;
  const row = document.createElement('tr');
  const t = new Date().toLocaleTimeString();
  row.innerHTML = `<td>${t}</td><td>${escapeHTML(type)}</td><td>${escapeHTML(msg)}</td><td>${escapeHTML(src||'')}</td>`;
  errorTable.prepend(row);
}
window.addEventListener('error', (e)=> pushErr('error', e.message, e.filename||'' ));
window.addEventListener('unhandledrejection', (e)=> pushErr('unhandledrejection', String(e.reason||'promise'), '' ));

// ---------- minimal JSON runtime ----------
function renderJsonApp(mount, spec) {
  if (!mount) return;
  const state = { ...(spec.state||{}) };
  const scene = spec.scene || [];
  mount.innerHTML = scene.map(nodeToHTML).join('');
  mount.querySelectorAll('[data-action]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      try{
        const fn = btn.getAttribute('data-action')||'';
        if (fn.startsWith('set(')) {
          const inside = fn.slice(4,-1);
          const [k,vExpr] = inside.split(',').map(s=>s.trim());
          const v = evalMath(vExpr, state);
          state[k] = v;
          renderJsonApp(mount, { ...spec, state });
        }
      }catch(e){ pushErr('action', e.message, 'renderJsonApp'); }
    });
  });
  function nodeToHTML(n){
    if (n.type==='row') return `<div style="display:flex;gap:8px">${(n.children||[]).map(nodeToHTML).join('')}</div>`;
    if (n.type==='col') return `<div style="display:flex;flex-direction:column;gap:8px">${(n.children||[]).map(nodeToHTML).join('')}</div>`;
    if (n.type==='text') return `<div style="padding:8px 0">${escapeHTML(resolve(n.value))}</div>`;
    if (n.type==='button') return `<button class="btn" data-action="${n.action||''}" style="margin:4px 0">${escapeHTML(resolve(n.label||'Button'))}</button>`;
    if (n.type==='image') return `<img src="${resolve(resolveCDN(n.src))}" alt="" style="max-width:100%;border-radius:10px;border:1px solid #172231">`;
    return `<div class="small muted">Unknown node: ${escapeHTML(n.type||'')}</div>`;
  }
  function resolve(v){ return (typeof v==='string') ? v.replace(/\$\{state\.([a-zA-Z0-9_]+)\}/g,(_,k)=> state[k]) : v; }
  function evalMath(expr, st){
    const safe = String(expr).replace(/\$\{state\.([a-zA-Z0-9_]+)\}/g,(_,k)=> JSON.stringify(st[k]));
    if (!/^[0-9+\-*/ ().]+$/.test(safe)) return 0;
    return Function('"use strict";return('+safe+')')();
  }
}
window.applySpec = function(spec){
  try{
    const wrap = document.createElement('div');
    wrap.className = 'card';
    wrap.innerHTML = `<h3 class="h3">Preview</h3><div id="jsonAppMount"></div>`;
    mainEl.innerHTML = ''; mainEl.appendChild(wrap);
    renderJsonApp(document.getElementById('jsonAppMount'), spec);
  }catch(e){ pushErr('applySpec', e.message, 'applySpec'); alert('Invalid JSON'); }
};

// ---------- routing ----------
function goto(route){ route = ensureSlash(route); history.pushState({},'',route); render(route); }
window.addEventListener('popstate', ()=> { if (!isSubdomain()) render(location.pathname); });

function section(title, content){ return `<div class="section"><div class="card"><h3 class="h3">${title}</h3>${content}</div></div>`; }

function tile(item, onClick){
  const art = resolveCDN(item.art || `@cdn/art/placeholder-640x360.png`);
  return `<div class="tile" onclick="${onClick||''}">
    <img src="${art}" alt=""><div class="meta"><span>${item.title}</span><span class="small muted">${item.tag||''}</span></div></div>`;
}
function grid(list, clickMaker){ return `<div class="tilegrid">${(list||[]).map(i=>tile(i, clickMaker? clickMaker(i):'')).join('')}</div>`; }

function hero(){
  const h = os.hero || { title:'Welcome to XJSON', subtitle:'Build games with JSON. Launch anything.' };
  return `<div class="section"><div class="card"><h3 class="h3">${h.title}</h3><div class="small muted">${h.subtitle}</div>
  <div style="margin-top:10px"><button class="btn" onclick="(${goto}).call(null,'/store/')">Browse Store</button>
  <button class="btn" onclick="(${goto}).call(null,'/library/')">Open Library</button>
  <button class="btn" onclick="(${goto}).call(null,'/editor/')">Open Editor</button>
  <button class="btn" onclick="(${goto}).call(null,'/guide/')">User Guide</button>
  </div></div></div>`;
}

function render(pathname){
  const path = ensureSlash(pathname || location.pathname);
  navBtns.forEach(b=> b.classList.toggle('active', ensureSlash(b.dataset.route||'')===path));
  const q = (qEl?.value||'').toLowerCase();
  let html = '';

  if (path==='/'){
    html += hero();
    html += section('Featured', grid(os.featured, i=>`launch('${i.id||i.title}')`));
    html += section('Library', grid((os.library||[]).filter(i=>i.title.toLowerCase().includes(q)).slice(0,8), i=>`launch('${i.id||i.title}')`));
  }
  else if (path==='/store/'){
    const list = (os.store||[]).filter(i=>i.title.toLowerCase().includes(q));
    html += section('Store', grid(list, i=>`launch('${i.id||i.title}')`));
  }
  else if (path==='/library/'){
    const list = (os.library||[]).filter(i=>i.title.toLowerCase().includes(q));
    html += section('Library', grid(list, i=>`launch('${i.id||i.title}')`));
  }
  else if (path==='/downloads/'){
    html += section('Downloads', `<div class="small muted">No active downloads yet.</div>`);
  }
  else if (path==='/settings/'){
    const savedPat = localStorage.getItem('xjson.admin.pat')||'';
    const savedLF = localStorage.getItem('xjson.langflow')||'';
    html += section('Settings', `
      <div class="row"><input id="pat" class="pat" placeholder="Admin GitHub PAT" value="${escapeHTML(savedPat)}" />
      <button id="savePat" class="btn">Save PAT</button></div>
      <div class="row"><input id="cfgLangflow" placeholder="LangFlow endpoint" value="${escapeHTML(savedLF)}" />
      <button id="saveLF" class="btn">Save LangFlow</button></div>
      <div class="row"><button id="clearCache" class="btn">Clear Cache</button></div>
    `);
    setTimeout(()=>{
      document.getElementById('savePat').onclick = ()=>{
        const v = document.getElementById('pat').value.trim();
        localStorage.setItem('xjson.admin.pat', v); alert('PAT saved.');
      };
      const lf = document.getElementById('cfgLangflow');
      document.getElementById('saveLF').onclick = ()=>{
        localStorage.setItem('xjson.langflow', lf.value.trim());
        alert('LangFlow saved.');
      };
      document.getElementById('clearCache').onclick = async ()=>{
        const keys = await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k)));
        alert('Cache cleared. Reloading.'); location.reload();
      };
    },0);
  }
  else if (path==='/guide/'){
    html += `<div class="card"><div id="guideHost" class="doc"></div></div>`;
    mainEl.innerHTML = html;
    fetch('./user-guide.html', {cache:'no-store'}).then(r=>r.text()).then(t=>{ document.getElementById('guideHost').innerHTML = t; }).catch(e=>{
      mainEl.innerHTML = section('Guide', `<div class="small muted">Could not load guide: ${escapeHTML(e.message)}</div>`);
    });
    return;
  }
  else if (path==='/editor/'){
    html += `
      <div class="card">
        <div class="ed-tabs">
          <button class="ed-tab active" data-edtab="editor">Editor</button>
          <button class="ed-tab" data-edtab="preview">Preview</button>
          <button class="ed-tab" data-edtab="ai" disabled>AI (coming soon)</button>
        </div>
        <div class="ed-panel show" id="panel-editor">
          <div class="row">
            <select id="edTarget"><option value="">Select JSON App…</option></select>
            <button id="edPublish" class="btn">Publish</button>
          </div>
          <textarea id="edText" class="code" spellcheck="false"></textarea>
          <div class="file-hint">Editing a JSON app spec. Changes auto-apply to Preview tab.</div>
        </div>
        <div class="ed-panel" id="panel-preview">
          <div id="edPreviewMount"></div>
        </div>
        <div class="ed-panel" id="panel-ai">
          <div class="small muted">AI Builder is under construction.</div>
        </div>
      </div>`;
    mainEl.innerHTML = html;

    // populate app list
    const edTarget = document.getElementById('edTarget');
    const options = (os.apps||[]).filter(a=>a.type==='json').map(a=>`<option value="${a.id}">${a.title}</option>`).join('');
    edTarget.innerHTML = `<option value="">Select JSON App…</option>${options}`;
    const first = (os.apps||[]).find(a=>a.type==='json');
    if (first){ edTarget.value = first.id; document.getElementById('edText').value = JSON.stringify(first.spec||{}, null, 2); }

    // tabs
    const tabBtns = [...document.querySelectorAll('.ed-tab')];
    const panelEditor = document.getElementById('panel-editor');
    const panelPreview = document.getElementById('panel-preview');
    const panelAI = document.getElementById('panel-ai');
    tabBtns.forEach(b=> b.addEventListener('click', ()=>{
      if (b.disabled) return;
      tabBtns.forEach(x=>x.classList.toggle('active', x===b));
      panelEditor.classList.toggle('show', b.dataset.edtab==='editor');
      panelPreview.classList.toggle('show', b.dataset.edtab==='preview');
      panelAI.classList.toggle('show', b.dataset.edtab==='ai');
      if (b.dataset.edtab==='preview') refreshPreview();
    }));

    // auto preview (P-A) with debounce
    const edText = document.getElementById('edText');
    edText.addEventListener('input', debounce(()=> {
      if (panelPreview.classList.contains('show')) refreshPreview();
    }, 250));

    edTarget.addEventListener('change', ()=>{
      const app = (os.apps||[]).find(a=>a.id===edTarget.value);
      if (app && app.type==='json') document.getElementById('edText').value = JSON.stringify(app.spec||{}, null, 2);
      if (panelPreview.classList.contains('show')) refreshPreview();
    });

    function refreshPreview(){
      try{
        const spec = JSON.parse(document.getElementById('edText').value||'{}');
        // resolve @cdn inside image nodes before preview render happens (runtime already resolves, but this ensures)
        (spec.scene||[]).forEach(n => { if (n.type==='image' && typeof n.src==='string' && n.src.startsWith('@cdn/')) n.src = resolveCDN(n.src); });
        const m = document.getElementById('edPreviewMount');
        m.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.innerHTML = `<div id="jsonAppMount"></div>`;
        m.appendChild(wrap);
        renderJsonApp(document.getElementById('jsonAppMount'), spec);
      }catch(e){ alert('Invalid JSON: ' + e.message); }
    }

    document.getElementById('edPublish').addEventListener('click', async ()=>{
      const uid = window.CURRENT_UID || subdomainUid() || prompt('Your UID:');
      const token = localStorage.getItem('xjson.admin.pat')||'';
      if (!token) return alert('Admin PAT required (Settings).');
      const appId = edTarget.value || 'starter';
      try{
        const spec = JSON.parse(document.getElementById('edText').value||'{}');
        const r = await publishAppJson({ uid, appId, spec, token });
        alert('Published! ' + r.url);
        window.open(r.url, '_blank');
      }catch(e){ alert('Publish failed: ' + e.message); }
    });

    return;
  }
  else {
    html += section('Not found', `<div class="small muted">Route ${path} not found.</div>`);
  }

  mainEl.innerHTML = html;
}

// ---------- launchers ----------
window.launch = (id)=>{
  const app = (os.apps||[]).find(a=>a.id===id);
  if (!app) return alert('App not found: ' + id);
  if (app.type==='json'){
    const wrap = document.createElement('div');
    wrap.className='card';
    wrap.innerHTML = `<h3 class="h3">${app.title}</h3><div id="jsonAppMount"></div>`;
    mainEl.innerHTML=''; mainEl.appendChild(wrap);
    renderJsonApp(document.getElementById('jsonAppMount'), app.spec||{});
  } else if (app.type==='iframe'){
    const src = resolveCDN(app.src || '');
    mainEl.innerHTML = `<div class="card"><h3 class="h3">${app.title}</h3>
    <iframe src="${src}" style="width:100%;height:72vh;border:0;border-radius:10px;background:#0b0f14"></iframe></div>`;
  } else {
    alert('Unknown app type: ' + app.type);
  }
};

// ---------- channels & search ----------
chips.forEach(c=> c.addEventListener('click', async ()=>{
  channel = c.dataset.channel; chips.forEach(x=>x.classList.toggle('active', x===c));
  await bootMain();
}));
qEl?.addEventListener('input', ()=> { if (!isSubdomain()) render(location.pathname); });

// ---------- sidebar routing ----------
navBtns.forEach(b=>{
  const r = b.dataset.route;
  if (!r) return;
  b.addEventListener('click', ()=> { if (!isSubdomain()) goto(r); });
  if (b.dataset.title) b.title = b.dataset.title;
});

// ---------- fullscreen prompt ----------
function offerFullscreenFor20s(){
  if (!fsOffer) return;
  fsOffer.classList.remove('hidden');
  let t = setTimeout(()=> fsOffer.classList.add('hidden'), 20000);
  fsGo.onclick = async ()=>{
    try{ if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); }
    catch(e){ /* ignore */ }
    finally{ fsOffer.classList.add('hidden'); clearTimeout(t); }
  };
  fsDismiss.onclick = ()=> { fsOffer.classList.add('hidden'); clearTimeout(t); };
}

// ---------- OS loader (F2 strict) ----------
async function loadOS(ch){
  const url = `./${ch}/os.json`;
  lastFetchPre && (lastFetchPre.textContent = `GET ${url}`);
  const r = await fetch(url, { cache:'no-store' });
  if (!r.ok) {
    const msg = `OS load failed (${r.status}) for ${url}`;
    pushErr('fetch', msg, url);
    alert(msg);
    throw new Error(msg);
  }
  os = await r.json();
  osMetaPre && (osMetaPre.textContent = JSON.stringify(os.meta||{channel:ch}, null, 2));
}

async function bootMain(){
  mainEl.innerHTML = `<div class="boot-msg">Loading ${channel}/os.json …</div>`;
  await loadOS(channel);
  render(location.pathname);
}
async function bootUser(){
  const uid = subdomainUid();
  mainEl.innerHTML = `<div class="boot-msg">Loading ${uid}…</div>`;
  const manUrl = `${USERS_BASE}/${uid}/manifest.json`;
  lastFetchPre && (lastFetchPre.textContent = `GET ${manUrl}`);
  const r1 = await fetch(manUrl, { cache:'no-store' });
  if (!r1.ok) { const msg=`Manifest not found for ${uid}`; pushErr('fetch', msg, manUrl); alert(msg); throw new Error(msg); }
  const manifest = await r1.json();
  const mainId = manifest.main;
  const appUrl = `${USERS_BASE}/${uid}/apps/${mainId}/app.json`;
  lastFetchPre && (lastFetchPre.textContent += `\nGET ${appUrl}`);
  const r2 = await fetch(appUrl, { cache:'no-store' });
  if (!r2.ok) { const msg=`App not found: ${mainId}`; pushErr('fetch', msg, appUrl); alert(msg); throw new Error(msg); }
  const appSpec = await r2.json();
  const wrap = document.createElement('div');
  wrap.className='card';
  wrap.innerHTML = `<h3 class="h3">${manifest.title||mainId}</h3><div id="jsonAppMount"></div>`;
  mainEl.innerHTML=''; mainEl.appendChild(wrap);
  renderJsonApp(document.getElementById('jsonAppMount'), appSpec);
  offerFullscreenFor20s();
}

// ---------- debug overlay ----------
debugBtn?.addEventListener('click', ()=> debugPanel.classList.toggle('hidden'));
closeDebug?.addEventListener('click', ()=> debugPanel.classList.add('hidden'));

// ---------- start ----------
if (isSubdomain()) { bootUser().catch(e=>pushErr('bootUser', e.message, 'boot')); }
else { bootMain().catch(e=>pushErr('bootMain', e.message, 'boot')); }

// ---------- SW ----------
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
