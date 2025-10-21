// ------- Deploy config -------
const CDN = "https://mpickettpayments-hue.github.io/json-asx-cdn"; // channel JSONs
const SUBFOLDER = "/json-asx-cdn"; // GitHub Pages base path
let channel = "latest";
let os;

// ------- DOM refs -------
const mainEl = document.getElementById("main");
const navButtons = [...document.querySelectorAll(".nav button")];
const chips = [...document.querySelectorAll(".chip")];
const qEl = document.getElementById("q");

// Builder refs
const builder = document.getElementById("builder");
const appJsonEl = document.getElementById("appJson");
const builderTarget = document.getElementById("builderTarget");
const saveAppBtn = document.getElementById("saveApp");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");
const chatLog = document.getElementById("chatLog");
const langflowUrl = document.getElementById("langflowUrl");

// ------- Simple auth stub (later: plug Google OAuth) -------
window.XAUTH = {
  userId: "guest", // replace after adding Google Identity Services
};

// ------- Util -------
const ensureSlash = (p) => (p.endsWith("/") ? p : p + "/");
const stripBase = (p) => p.replace(SUBFOLDER, "") || "/";

// local save key per-user
const appKey = (id) => `xjson.app.${window.XAUTH.userId}.${id}`;

// ------- Router -------
function internalRoute() {
  const saved = sessionStorage.getItem("xjson-route");
  if (saved) {
    sessionStorage.removeItem("xjson-route");
    return stripBase(saved);
  }
  return stripBase(location.pathname) || "/";
}
function goto(route) {
  route = ensureSlash(route);
  history.pushState({}, "", route);
  render(route);
}
window.addEventListener("popstate", () => render(internalRoute()));

// ------- Boot / Channels -------
async function boot() {
  mainEl.innerHTML = `<div class="muted">Loading ${channel}/os.json …</div>`;
  const res = await fetch(`${CDN}/${channel}/os.json`, { cache: "no-store" });
  os = await res.json();

  // merge user-edited JSON apps from localStorage
  if (os.apps) {
    os.apps.forEach(a => {
      if (a.type === "json") {
        const saved = localStorage.getItem(appKey(a.id));
        if (saved) try { a.spec = JSON.parse(saved); } catch {}
      }
    });
  }

  // populate Builder target list
  builderTarget.innerHTML = `<option value="">Select JSON App to edit…</option>` +
    (os.apps||[]).filter(a=>a.type==="json").map(a => `<option value="${a.id}">${a.title}</option>`).join("");

  render(internalRoute());
}

function setChannel(ch) {
  channel = ch;
  chips.forEach(c => c.classList.toggle("active", c.dataset.channel === channel));
  boot();
}

// ------- RENDER HELPERS (tiles/sections) -------
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
          <button class="btn" onclick="goto('/store')">Browse Store</button>
          <button class="btn" onclick="goto('/library')">Open Library</button>
        </div>
      </div>
      <div class="card">
        <h3>Now Playing</h3>
        <div class="muted small">Continue your session</div>
        ${os.nowPlaying && os.nowPlaying.length ? tile(os.nowPlaying[0], `launchApp('${os.nowPlaying[0].id}')`) : `<div class="muted small" style="margin-top:10px">No active session</div>`}
      </div>
    </div>`;
}

// ------- HYBRID LAUNCHER (JSON runtime + iframe) -------
window.launchApp = (id) => {
  const app = (os.apps||[]).find(a => a.id === id);
  if (!app) return alert("App not found: " + id);

  if (app.type === "json") {
    // render JSON scene in preview card
    const html = section(app.title, `<div id="jsonAppMount"></div>`);
    mainEl.innerHTML = html;
    renderJsonApp("jsonAppMount", app.spec || {});
    // prefill builder
    builderTarget.value = app.id;
    appJsonEl.value = JSON.stringify(app.spec || {}, null, 2);
  } else if (app.type === "iframe") {
    mainEl.innerHTML = section(app.title,
      `<iframe src="${app.src}" style="width:100%;height:70vh;border:0;border-radius:10px;background:#0b0f14"></iframe>`);
  } else {
    alert("Unknown app type: " + app.type);
  }
};

// Minimal JSON UI runtime (extend as needed)
function renderJsonApp(mountId, spec) {
  const el = document.getElementById(mountId);
  if (!el) return;
  const state = {...(spec.state||{})};
  const scene = spec.scene || [];
  el.innerHTML = scene.map(nodeToHTML).join("");

  // wire actions (very simple)
  el.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      try {
        const fn = btn.getAttribute("data-action");
        // supports: set(key,value)
        if (fn.startsWith("set(")) {
          const inside = fn.slice(4, -1);
          const [k, v] = inside.split(",").map(s=>s.trim());
          state[k] = JSON.parse(v);
          // naive re-render to reflect state
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
    // very small templating: ${state.foo}
    return val.replace(/\$\{state\.([a-zA-Z0-9_]+)\}/g, (_,k)=> state[k]);
  }
  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
}

// ------- PAGES -------
function render(path) {
  path = ensureSlash(path);
  navButtons.forEach(b => b.classList.toggle("active", ensureSlash(b.dataset.route) === path));

  const query = (qEl.value||"").toLowerCase();
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
    html += section("Downloads", `<div class="muted">No active downloads yet (queue comes next).</div>`);
  }
  else if (path === "/settings/") {
    html += section("Settings", `
      <div class="muted small">Channel: <strong>${channel}</strong></div>
      <div class="row"><input id="cfgLangflow" placeholder="LangFlow endpoint" value="${langflowUrl.value||""}" /></div>
      <div class="row"><button class="btn" id="clear">Clear cache</button></div>
      <div class="muted small">User: ${window.XAUTH.userId}</div>
    `);
    setTimeout(() => {
      document.getElementById("clear").onclick = async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
        alert("Cache cleared. Reloading.");
        location.reload();
      };
      const cfg = document.getElementById("cfgLangflow");
      if (cfg) cfg.onchange = () => (langflowUrl.value = cfg.value);
    }, 0);
  }
  else {
    html += section("Not found", `<div class="muted">Route ${path} not found.</div>`);
  }

  mainEl.innerHTML = html;
}

// ------- Wire UI -------
navButtons.forEach(b => b.addEventListener("click", () => goto(b.dataset.route)));
chips.forEach(c => c.addEventListener("click", () => setChannel(c.dataset.channel)));
document.getElementById("refresh").onclick = boot;
qEl.addEventListener("input", () => render(internalRoute()));

// Builder actions
builderTarget.addEventListener("change", () => {
  const id = builderTarget.value;
  if (!id) return;
  const app = (os.apps||[]).find(a => a.id === id);
  appJsonEl.value = JSON.stringify(app?.spec||{}, null, 2);
  // live preview if already on app
  if (location.pathname.endsWith("/library/") || location.pathname.endsWith("/store/")) return;
  window.launchApp(id);
});
saveAppBtn.addEventListener("click", () => {
  const id = builderTarget.value;
  if (!id) return alert("Pick a JSON app first.");
  try {
    const parsed = JSON.parse(appJsonEl.value);
    localStorage.setItem(appKey(id), JSON.stringify(parsed));
    // merge into current OS view
    const app = (os.apps||[]).find(a => a.id === id);
    if (app){ app.spec = parsed; window.launchApp(id); }
    alert("Saved & hot-reloaded.");
  } catch (e) {
    alert("Invalid JSON: " + e.message);
  }
});

// LangFlow chat: expects a full JSON scene in response (we apply it)
chatSend.addEventListener("click", async () => {
  const id = builderTarget.value;
  if (!id) return alert("Pick a JSON app to modify.");
  const prompt = chatInput.value.trim();
  if (!prompt) return;

  const url = (langflowUrl.value||"").trim();
  if (!url) return alert("Enter LangFlow endpoint in Settings or above.");

  chatLog.innerHTML = `<div>Sending to LangFlow…</div>`;
  try {
    // You can customize payload shape to your LangFlow flow
    const resp = await fetch(url, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ prompt, current: JSON.parse(appJsonEl.value||"{}") })
    });
    const data = await resp.json();
    // Expect { scene: [...], state?: {...} } or a full spec
    const updated = data.scene ? { scene: data.scene, state: data.state||{} } : data;
    appJsonEl.value = JSON.stringify(updated, null, 2);
    saveAppBtn.click(); // auto-apply
    chatLog.innerHTML = `<div>Applied changes from LangFlow.</div>`;
  } catch (e) {
    chatLog.innerHTML = `<div>Error: ${e.message}</div>`;
  }
});

// PWA minimal SW
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});

// Kickoff
boot();
