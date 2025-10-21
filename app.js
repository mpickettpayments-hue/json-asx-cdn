// XJSON minimal shell: routes + channel control + renderer
const CDN = "https://mpickettpayments-hue.github.io/json-asx-cdn";
let channel = "latest";
let os = null;

const main = document.getElementById("main");
const navButtons = [...document.querySelectorAll(".nav button")];
const chips = [...document.querySelectorAll(".chip")];

function setActiveRoute(path) {
  navButtons.forEach(b => b.classList.toggle("active", b.dataset.route === path));
  window.history.pushState({}, "", path);
  render(path);
}
function setChannel(next) {
  channel = next;
  chips.forEach(c => c.classList.toggle("active", c.dataset.channel === channel));
  boot(); // re-fetch OS for this channel
}
async function boot() {
  main.innerHTML = `<div class="muted">Loading ${channel}/os.json …</div>`;
  const res = await fetch(`${CDN}/${channel}/os.json`, { cache: "no-store" });
  os = await res.json();
  render(location.pathname || "/");
}
function heroCard() {
  const h = os?.hero || {};
  return `
  <div class="hero section">
    <div class="card">
      <h3>${h.title || "Welcome to XJSON"}</h3>
      <div class="muted">${h.subtitle || "JSON-driven launcher for apps, games, and tools."}</div>
      <div style="margin-top:10px;">
        <button class="btn" onclick="location.href='/store'">Browse Store</button>
        <button class="btn" onclick="location.href='/library'">Open Library</button>
      </div>
    </div>
    <div class="card">
      <h3>Now Playing</h3>
      <div class="muted small">Pick up where you left off</div>
      ${tile(os?.nowPlaying?.[0]) || `<div class="muted small" style="margin-top:10px">No active session</div>`}
    </div>
  </div>`;
}
function tile(item) {
  if (!item) return "";
  const art = item.art || "https://picsum.photos/seed/xjson/640/360";
  return `
    <div class="tile" onclick="alert('Launch: ${item.title}')">
      <img src="${art}" alt="">
      <div class="meta">
        <span>${item.title}</span>
        <span class="small muted">${item.tag || ""}</span>
      </div>
    </div>`;
}
function grid(list) {
  return `<div class="tilegrid">${(list||[]).map(tile).join("")}</div>`;
}
function section(title, content) {
  return `<div class="section"><div class="card"><h3>${title}</h3>${content}</div></div>`;
}
function render(path) {
  // search filter
  const q = document.getElementById("q").value.toLowerCase();
  let body = "";
  if (path === "/") {
    body += heroCard();
    body += section("Featured", grid(os?.featured));
    body += section("Top from Library", grid(os?.library?.slice(0,8)));
  } else if (path === "/store") {
    const list = (os?.store || []).filter(x => x.title.toLowerCase().includes(q));
    body += section("Store", grid(list));
  } else if (path === "/library") {
    const list = (os?.library || []).filter(x => x.title.toLowerCase().includes(q));
    body += section("Your Library", grid(list));
  } else if (path === "/downloads") {
    body += section("Downloads", `<div class="muted">No active downloads (wired for future).</div>`);
  } else if (path === "/settings") {
    body += section("Settings", `
      <div class="muted small">Channel: <strong>${channel}</strong></div>
      <div style="margin-top:10px">
        <button class="btn" id="clearCache">Clear cache</button>
      </div>
    `);
    setTimeout(() => {
      const btn = document.getElementById("clearCache");
      if (btn) btn.onclick = async () => {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
          alert('Cache cleared. Reloading.');
          location.reload();
        }
      };
    }, 0);
  } else {
    body += section("Not found", `<div class="muted">Route ${path} not found.</div>`)
  }
  main.innerHTML = body;
}

// wire UI
navButtons.forEach(b => b.addEventListener("click", () => setActiveRoute(b.dataset.route)));
chips.forEach(c => c.addEventListener("click", () => setChannel(c.dataset.channel)));
document.getElementById("refresh").onclick = boot;
document.getElementById("q").addEventListener("input", () => render(location.pathname || "/"));

// PWA install hook
let defPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); defPrompt = e; });
document.getElementById("install").onclick = async () => { if (defPrompt) { defPrompt.prompt(); defPrompt = null; }};

// Service Worker (simple cache-first shell; we’ll upgrade after)
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');

// router
window.addEventListener("popstate", () => render(location.pathname || "/"));

// boot
boot();
