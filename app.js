// app.js — C (relative CDN), F2 hard-fail, TB2 topbar, D1 debug overlay.
import { publishAppJson } from './publish.js';

const CDN = ".";                   // ← self-contained
const MAIN_HOST = "xjson.app";
const USERS_BASE = `${CDN}/users`;

let channel = "latest";
let os;

// DOM
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

// Debug DOM
const debugBtn = document.getElementById('debugBtn');
const debugPanel = document.getElementById('debugPanel');
const closeDebug = document.getElementById('closeDebug');
const errorTable = document.getElementById('errorTable').querySelector('tbody');
const osMetaPre = document.getElementById('osMeta');
const lastFetchPre = document.getElementById('lastFetch');

// FS offer
const fsOffer = document.getElementById('fsOffer');
const fsGo = document.getElementById('fsGo');
const fsDismiss = document.getElementById('fsDismiss');

// Utils
const ensureSlash = p => (p.endsWith('/') ? p : p + '/');
const isSubdomain = () => location.hostname.endsWith('.' + MAIN_HOST) && location.hostname !== MAIN_HOST;
const subdomainUid = () => (isSubdomain() ? location.hostname.split('.')[0] : null);
function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// OBD-style error feed
const ERR = [];
function pushErr(type, msg, src){
  const row = document.createElement('tr');
  const t = new Date().toLocaleTimeString();
  row.innerHTML = `<td>${t}</td><td>${escapeHTML(type)}</td><td>${escapeHTML(msg)}</td><td>${escapeHTML(src||'')}</td>`;
  errorTable.prepend(row);
  ERR.push({ t, type, msg, src });
}
window.addEventListener('error', (e)=> pushErr('error', e.message, e.filename||'' ));
window.addEventListener('unhandledrejection', (e)=> pushErr('unhandledrejection', String(e.reason||'promise'), '' ));

// Minimal JSON runtime
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
    if (n.type==='image') return `<img src="${resolve(n.src)}" alt="" style="max-width:100%;border-radius:10px;border:1px solid #172231">`;
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
  appJsonEl.value = JSON.stringify(spec, null, 2);
  const wrap = document.createElement('div');
  wrap.className = 'card';
  wrap.innerHTML = `<h3 class="h3">Preview</h3><div id="jsonAppMount"></div>`;
  mainEl.innerHTML = ''; mainEl.appendChild(wrap);
  try{ renderJsonApp(document.getElementById('jsonAppMount'), spec); }
  catch(e){ pushErr('applySpec', e.message, 'applySpec'); }
};

// Routing
function goto(route){ route = ensureSlash(route); history.pushState({},'',route); render(route); }
window.addEventListener('popstate', ()=> { if (!isSubdomain()) render(location.pathname); });

function section(title, content){ return `<div class="section"><div class="card"><h3 class="h3">${title}</h3>${content}</div></div>`; }
function tile(item, onClick){
  const art = item.art || `https://picsum.photos/seed/xjson/640/360`;
  return `<div class="tile" onclick="${onClick||''}">
    <img src="${art}" alt=""><div class="meta"><span>${item.title}</span><span class="small muted">${item.tag||''}</span></div></div>`;
}
function grid(list, clickMaker){ return `<div class="tilegrid">${(list||[]).map(i=>tile(i, clickMaker? clickMaker(i):'')).join('')}</div>`; }
function hero(){
  const h = os.hero || { title:'Welcome to XJSON', subtitle:'Build games with JSON. Launch anything.' };
  return `<div class="section"><div class="card"><h3 class="h3">${h.title}</h3><div class="small muted">${h.subtitle}</div>
  <div style="margin-top:10px"><button class="btn" onclick="(${goto}).call(null,'/store/')">Browse Store</button>
  <button class="btn" onclick="(${goto}).call(null,'/library/')">Open Library</button></div></div></div>`;
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
  } else if (path==='/store/'){
    const list = (os.store||[]).filter(i=>i.title.toLowerCase().includes(q));
    html += section('Store', grid(list, i=>`launch('${i.id||i.title}')`));
  } else if (path==='/library/'){
    const list = (os.library||[]).filter(i=>i.title.toLowerCase().includes(q));
    html += section('Library', grid(list, i=>`launch('${i.id||i.title}')`));
  } else if (path==='/downloads/'){
    html += section('Downloads', `<div class="small muted">No active downloads yet.</div>`);
  } else if (path==='/settings/'){
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
        langflowUrl.value = lf.value.trim(); alert('LangFlow saved.');
      };
      document.getElementById('clearCache').onclick = async ()=>{
        const keys = await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k)));
        alert('Cache cleared. Reloading.'); location.reload();
      };
    },0);
  } else {
    html += section('Not found', `<div class="small muted">Route ${path} not found.</div>`);
  }
  mainEl.innerHTML = html;
}

// Launch
window.launch = (id)=>{
  const app = (os.apps||[]).find(a=>a.id===id);
  if (!app) return alert('App not found: ' + id);
  if (app.type==='json'){
    const wrap = document.createElement('div');
    wrap.className='card';
    wrap.innerHTML = `<h3 class="h3">${app.title}</h3><div id="jsonAppMount"></div>`;
    mainEl.innerHTML=''; mainEl.appendChild(wrap);
    renderJsonApp(document.getElementById('jsonAppMount'), app.spec||{});
    // Prefill builder
    builderTarget.innerHTML = `<option value="${app.id}">${app.title}</option>`;
    builderTarget.value = app.id;
    appJsonEl.value = JSON.stringify(app.spec||{}, null, 2);
  } else if (app.type==='iframe'){
    mainEl.innerHTML = `<div class="card"><h3 class="h3">${app.title}</h3>
    <iframe src="${app.src}" style="width:100%;height:72vh;border:0;border-radius:10px;background:#0b0f14"></iframe></div>`;
  } else {
    alert('Unknown app type: ' + app.type);
  }
};

// Channels & search
chips.forEach(c=> c.addEventListener('click', async ()=>{
  channel = c.dataset.channel; chips.forEach(x=>x.classList.toggle('active', x===c));
  await bootMain(); // reload OS data from new channel
}));
qEl?.addEventListener('input', ()=> { if (!isSubdomain()) render(location.pathname); });

// Sidebar routing
navBtns.forEach(b=>{
  const r = b.dataset.route;
  if (!r) return;
  b.addEventListener('click', ()=> { if (!isSubdomain()) goto(r); });
  if (b.dataset.title) b.title = b.dataset.title;
});

// Builder
openBuilderBtn.addEventListener('click', ()=> builder.classList.add('show'));
closeBuilder.addEventListener('click', ()=> builder.classList.remove('show'));
function showTab(name){
  tabs.forEach(t=> t.classList.toggle('active', t.dataset.tab===name));
  editorPanel.classList.toggle('hidden', name!=='editor');
  aiPanel.classList.toggle('hidden', name!=='ai');
}
tabs.forEach(t=> t.addEventListener('click', ()=> showTab(t.dataset.tab)));
showTab('editor');

saveAppBtn.addEventListener('click', ()=>{
  try{ const parsed = JSON.parse(appJsonEl.value); window.applySpec(parsed); alert('Saved to preview. Use Publish to deploy.'); }
  catch(e){ alert('Invalid JSON: ' + e.message); }
});
publishBtn.addEventListener('click', async ()=>{
  const uid = window.CURRENT_UID || subdomainUid() || prompt('Your UID (e.g., u_name_x1y2):');
  const token = localStorage.getItem('xjson.admin.pat')||'';
  if (!token) return alert('Admin PAT required (Settings).');
  const appId = builderTarget.value || 'starter';
  try{
    const spec = JSON.parse(appJsonEl.value||'{}');
    const r = await publishAppJson({ uid, appId, spec, token });
    alert('Published! ' + r.url); window.open(r.url, '_blank');
  }catch(e){ alert('Publish failed: ' + e.message); }
});

// AI tab
langflowUrl.value = localStorage.getItem('xjson.langflow')||'';
chatSend.addEventListener('click', async ()=>{
  const url = (langflowUrl.value||'').trim(); const prompt = (chatInput.value||'').trim();
  if (!url) return alert('Enter LangFlow endpoint in Settings/AI tab.');
  if (!prompt) return;
  chatLog.innerHTML = `<div>Sending: ${escapeHTML(prompt)}</div>`;
  try{
    const current = JSON.parse(appJsonEl.value||'{}');
    const resp = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt, current }) });
    const data = await resp.json();
    const updated = data.scene ? { scene:data.scene, state:data.state||{} } : data;
    appJsonEl.value = JSON.stringify(updated, null, 2);
    window.applySpec(updated);
    chatLog.innerHTML += `<div>Applied changes.</div>`;
  }catch(e){ chatLog.innerHTML += `<div>Error: ${escapeHTML(e.message)}</div>`; }
});

// Fullscreen offer
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

// Strict OS loader (F2)
async function loadOS(ch){
  const url = `./${ch}/os.json`;
  lastFetchPre.textContent = `GET ${url}`;
  const r = await fetch(url, { cache:'no-store' });
  if (!r.ok) {
    const msg = `OS load failed (${r.status}) for ${url}`;
    pushErr('fetch', msg, url);
    alert(msg); // F2 hard fail
    throw new Error(msg);
  }
  const data = await r.json();
  os = data;
  osMetaPre.textContent = JSON.stringify(os.meta||{channel:ch}, null, 2);
}

// Boot flows
async function bootMain(){
  mainEl.innerHTML = `<div class="boot-msg">Loading ${channel}/os.json …</div>`;
  await loadOS(channel);
  // Fill builder target
  const options = (os.apps||[]).filter(a=>a.type==='json').map(a=>`<option value="${a.id}">${a.title}</option>`).join('');
  builderTarget.innerHTML = `<option value="">Select JSON App…</option>${options}`;
  render(location.pathname);
}
async function bootUser(){
  const uid = subdomainUid();
  mainEl.innerHTML = `<div class="boot-msg">Loading ${uid}…</div>`;
  const manUrl = `${USERS_BASE}/${uid}/manifest.json`;
  lastFetchPre.textContent = `GET ${manUrl}`;
  const r1 = await fetch(manUrl, { cache:'no-store' });
  if (!r1.ok) { const msg=`Manifest not found for ${uid}`; pushErr('fetch', msg, manUrl); alert(msg); throw new Error(msg); }
  const manifest = await r1.json();
  const mainId = manifest.main;
  const appUrl = `${USERS_BASE}/${uid}/apps/${mainId}/app.json`;
  lastFetchPre.textContent += `\nGET ${appUrl}`;
  const r2 = await fetch(appUrl, { cache:'no-store' });
  if (!r2.ok) { const msg=`App not found: ${mainId}`; pushErr('fetch', msg, appUrl); alert(msg); throw new Error(msg); }
  const appSpec = await r2.json();
  const wrap = document.createElement('div');
  wrap.className='card';
  wrap.innerHTML = `<h3 class="h3">${manifest.title||mainId}</h3><div id="jsonAppMount"></div>`;
  mainEl.innerHTML=''; mainEl.appendChild(wrap);
  renderJsonApp(document.getElementById('jsonAppMount'), appSpec);
  builderTarget.innerHTML = `<option value="${mainId}">${manifest.title||mainId}</option>`;
  builderTarget.value = mainId;
  appJsonEl.value = JSON.stringify(appSpec, null, 2);
  offerFullscreenFor20s();
}

// Debug overlay (D1)
debugBtn.addEventListener('click', ()=> debugPanel.classList.toggle('hidden'));
closeDebug.addEventListener('click', ()=> debugPanel.classList.add('hidden'));

// Start
if (isSubdomain()) { bootUser().catch(e=>pushErr('bootUser', e.message, 'boot')); }
else { bootMain().catch(e=>pushErr('bootMain', e.message, 'boot')); }

// SW
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
