// ------- Deploy config -------
const CDN = "https://mpickettpayments-hue.github.io/json-asx-cdn"; // repo Pages origin
const MAIN_HOST = "xjson.app";          // primary domain
const USERS_BASE = `${CDN}/users`;      // where user manifests & apps live in the repo
const SUBFOLDER = "";                   // we are at domain root now
let channel = "latest";
let os;

// ------- DOM refs -------
const mainEl = document.getElementById("main");
const navButtons = [...document.querySelectorAll(".nav button")];
const chips = [...document.querySelectorAll(".chip")];
const qEl = document.getElementById("q");
const fsOffer = document.getElementById("fsOffer");
const fsGo = document.getElementById("fsGo");
const fsDismiss = document.getElementById("fsDismiss");

// ------- Util -------
const ensureSlash = (p) => (p.endsWith("/") ? p : p + "/");
const stripBase = (p) => p.replace(SUBFOLDER, "") || "/";
const isSubdomain = () =>
  location.hostname.endsWith("." + MAIN_HOST) && location.hostname !== MAIN_HOST;
const subdomainUser = () =>
  isSubdomain() ? location.hostname.split(".")[0] : null;

// ------- Minimal JSON runtime (unchanged from earlier) -------
function renderJsonApp(mountId, spec) {
  const el = document.getElementById(mountId);
  if (!el) return;
  const state = {...(spec.state||{})};
  const scene = spec.scene || [];
  el.innerHTML = scene.map(nodeToHTML).join("");

  el.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      try {
        const fn = btn.getAttribute("data-action");
        if (fn.startsWith("set(")) {
          const inside = fn.slice(4, -1);
          const [k, vExpr] = inside.split(",").map(s=>s.trim());
          const v = evalExpr(vExpr, state);
          state[k] = v;
          renderJsonApp(mountId, {...spec, state});
        }
      } catch(e){ console.warn(e); }
    });
  });

  function nodeToHTML(n){
    if (n.type === "row") return `<div style="display:flex;gap:8px">${(n.children||[]).map(nodeToHTML).join("")}</div>`;
    if (n.type === "col") return `<div style="display:flex;flex-direction:column;gap:8px">${(n.children||[]).map(nodeToHTML).join("")}</div>`;
    if (n.type === "text") return `<div style="padding:8px 0">${escapeHTML(resolve(n.value))}</div>`;
    if (n.type === "button"){
      const act = n.action || "";
      return `<button class="btn" data-action="${act}" style="margin:4px 0">${escapeHTML(resolve(n.label||"Button"))}</button>`;
    }
    if (n.type === "image"){
      const src = resolve(n.src);
      return `<img src="${src}" alt="" style="max-width:100%;border-radius:10px;border:1px solid #172231">`;
    }
    return `<div class="muted small">Unknown node: ${escapeHTML(n.type||"")}</div>`;
  }
  function resolve(val){
    if (typeof val !== "string") return val;
    return val.replace(/\$\{state\.([a-zA-Z0-9_]+)\}/g, (_,k)=> state[k]);
  }
  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function evalExpr(expr, stateObj){
    // super-light evaluator: replaces ${state.x} with numeric values, then eval() math only
    const safe = expr.replace(/\$\{state\.([a-zA-Z0-9_]+)\}/g, (_,k)=> JSON.stringify(stateObj[k]));
    // only allow simple math/number literals
    if (!/^[0-9+\-*/ ().]+$/.test(safe)) return stateObj; // refuse complex input
    return Function(`"use strict"; return (${safe});`)();
  }
}

// ------- HYBRID LAUNCHER -------
window.launchApp = (id) => {
  const app = (os.apps||[]).find(a => a.id === id);
  if (!app) return alert("App not found: " + id);

  if (app.type === "json") {
    const html = section(app.title, `<div id="jsonAppMount"></div>`);
    mainEl.innerHTML = html;
    renderJsonApp("jsonAppMount", app.spec || {});
  } else if (app.type === "iframe") {
    mainEl.innerHTML = section(app.title,
      `<iframe src="${app.src}" style="width:100%;height:70vh;border:0;border-radius:10px;background:#0b0f14"></iframe>`);
  } else {
    alert("Unknown app type: " + app.type);
  }
};

// ------- Core UI helpers -------
function tile(item, onClick) {
  if (!item) return "";
  const art = item.art || `https://picsum.photos/seed/xjson/640/360`;
  const click = onClick ? `onclick="${onClick}"` : "";
  return `
    <div class="tile" ${click}>
      <img src="${art}" alt="">
      <div class="meta">
        <span>${item.title}</span>
        <span class="small muted">${item.tag||""}</span>
      </div>
    </div>`;
}
const grid = (list, onClickMaker) =>
  `<div class="tilegrid">${(list||[]).map(i => tile(i, onClickMaker ? onClickMaker(i) : "")).join("")}</div>`;
const section = (title, content) =>
  `<div class="section"><div class="card"><h3>${title}</h3>${content}</div></div>`;
function hero() {
  const h = os.hero || { title:"Welcome to XJSON", subtitle:"Launcher powered by JSON" };
  return `
    <div class="hero section">
      <div class="card">
        <h3>${h.title}</h3>
        <div class="muted">${h.subtitle}</div>
        <div style="margin-top:10px">
          <button class="btn" onclick="goto('/store/')">Browse Store</button>
          <button class="btn" onclick="goto('/library/')">Open Library</button>
        </div>
      </div>
      <div class="card">
        <h3>Now Playing</h3>
        <div class="muted small">Continue your session</div>
        ${os.nowPlaying && os.nowPlaying.length ? tile(os.nowPlaying[0], `launchApp('${os.nowPlaying[0].id}')`) : `<div class="muted small" style="margin-top:10px">No active session</div>`}
      </div>
    </div>`;
}

// ------- Main OS mode (xjson.app) -------
async function bootMain() {
  mainEl.innerHTML = `<div class="muted">Loading ${channel}/os.json …</div>`;
  const r = await fetch(`${CDN}/${channel}/os.json`, { cache: "no-store" });
  os = await r.json();

  render(internalRouteMain());
}

// ------- User-subdomain mode (*.xjson.app) -------
async function bootUser() {
  const user = subdomainUser();
  mainEl.innerHTML = `<div class="muted">Loading ${user}…</div>`;

  // Load user's manifest & main app
  const manifestUrl = `${USERS_BASE}/${user}/manifest.json`;
  const manifestRes = await fetch(manifestUrl, { cache: "no-store" });
  if (!manifestRes.ok) { mainEl.innerHTML = `<div class="muted">No manifest for ${user}.</div>`; return; }
  const manifest = await manifestRes.json();
  const mainId = manifest.main;
  const appUrl = `${USERS_BASE}/${user}/apps/${mainId}/app.json`;
  const appRes = await fetch(appUrl, { cache: "no-store" });
  if (!appRes.ok) { mainEl.innerHTML = `<div class="muted">Main app not found: ${mainId}</div>`; return; }
  const appSpec = await appRes.json();

  // Render into OS chrome (windowed)
  const appMeta = { id: mainId, title: manifest.title || mainId, type: "json", spec: appSpec };
  mainEl.innerHTML = section(appMeta.title, `<div id="jsonAppMount"></div>`);
  renderJsonApp("jsonAppMount", appMeta.spec);

  // Show fullscreen offer bar (20s window)
  offerFullscreenFor20s();
}

// ------- Routing (main OS) -------
function internalRouteMain() {
  const saved = sessionStorage.getItem("xjson-route");
  if (saved) { sessionStorage.removeItem("xjson-route"); return stripBase(saved); }
  return stripBase(location.pathname) || "/";
}
function goto(route) {
  route = ensureSlash(route);
  history.pushState({}, "", route);
  render(route);
}
function render(path) {
  if (isSubdomain()) return; // subdomain uses bootUser rendering only
  path = ensureSlash(path);
  navButtons.forEach(b => b.classList.toggle("active", ensureSlash(b.dataset.route) === path));

  const query = (qEl?.value||"").toLowerCase();
  let html = "";

  if (path === "/") {
    html += hero();
    html += section("Featured", grid(os.featured, i => `launchApp('${i.id||i.title}')`));
    html += section("Library", grid((os.library||[]).filter(i => i.title.toLowerCase().includes(query)).slice(0, 8), i => `launchApp('${i.id||i.title}')`));
  }
  else if (path === "/store/") {
    const list = (os.store||[]).filter(i => i.title.toLowerCase().includes(query));
    html += section("Store", grid(list, i => `launchApp('${i.id||i.title}')`));
  }
  else if (path === "/library/") {
    const list = (os.library||[]).filter(i => i.title.toLowerCase().includes(query));
    html += section("Library", grid(list, i => `launchApp('${i.id||i.title}')`));
  }
  else if (path === "/downloads/") {
    html += section("Downloads", `<div class="muted">No active downloads yet (queue coming).</div>`);
  }
  else if (path === "/settings/") {
    html += section("Settings", `<div class="muted small">Channel: <strong>${channel}</strong></div>`);
  }
  else {
    html += section("Not found", `<div class="muted">Route ${path} not found.</div>`);
  }

  mainEl.innerHTML = html;
}

// ------- Fullscreen Offer -------
function offerFullscreenFor20s(){
  if (!fsOffer) return;
  fsOffer.classList.remove("hidden");
  let timer = setTimeout(()=> fsOffer.classList.add("hidden"), 20000);

  const enter = async ()=>{
    try {
      const elem = document.documentElement; // or mainEl for contained fs
      if (!document.fullscreenElement) await elem.requestFullscreen();
    } catch(e){ console.warn(e); }
    finally { fsOffer.classList.add("hidden"); clearTimeout(timer); }
  };
  const dismiss = ()=>{
    fsOffer.classList.add("hidden");
    clearTimeout(timer);
  };
  fsGo.onclick = enter;
  fsDismiss.onclick = dismiss;
}

// ------- Wire UI (main OS only) -------
navButtons.forEach(b => b.addEventListener("click", () => goto(b.dataset.route)));
chips.forEach(c => c.addEventListener("click", () => { channel = c.dataset.channel; chips.forEach(x=>x.classList.toggle("active", x===c)); bootMain(); }));
document.getElementById("refresh").onclick = ()=> isSubdomain()? bootUser() : bootMain();
qEl?.addEventListener("input", () => isSubdomain()? null : render(internalRouteMain()));

// ------- SW -------
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});

// ------- Boot: choose mode -------
if (isSubdomain()) {
  bootUser();          // windowed; FS offer appears for 20s
} else {
  // load OS dataset and render routes
  (async ()=>{
    const r = await fetch(`${CDN}/${channel}/os.json`, { cache: "no-store" });
    os = await r.json();
    render(internalRouteMain());
  })();
}
