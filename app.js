const BASE = "/json-asx-cdn";
const CDN = "https://mpickettpayments-hue.github.io/json-asx-cdn";
let channel = "latest";
let os;

const mainEl = document.getElementById("main");
const navButtons = [...document.querySelectorAll(".nav button")];
const chips = [...document.querySelectorAll(".chip")];

function goto(route) {
  window.history.pushState({}, "", BASE + route);
  render(route);
}

function setRoute(route) {
  goto(route);
}

function setChannel(ch) {
  channel = ch;
  chips.forEach(c => c.classList.toggle("active", c.dataset.channel === channel));
  boot();
}

async function boot() {
  mainEl.innerHTML = `<div class="muted">Loading ${channel}/os.json …</div>`;
  try {
    const r = await fetch(`${CDN}/${channel}/os.json`, { cache: "no-store" });
    os = await r.json();
  } catch {
    mainEl.innerHTML = `<div class="muted">Unable to fetch OS config.</div>`;
    return;
  }

  const saved = sessionStorage.getItem("xjson-route");
  let path = saved || location.pathname.replace(BASE, "") || "/";
  sessionStorage.removeItem("xjson-route");

  if (path === "" || path === "/") {
    render("/");
  } else {
    render(path);
  }
}

function tile(item) {
  if (!item) return "";
  const art = item.art || `https://picsum.photos/seed/xjson/640/360`;
  return `
    <div class="tile" onclick="alert('Launch: ${item.title}')">
      <img src="${art}" alt="">
      <div class="meta">
        <span>${item.title}</span>
        <span class="small muted">${item.tag||""}</span>
      </div>
    </div>`;
}

function section(title, content) {
  return `<div class="section"><div class="card"><h3>${title}</h3>${content}</div></div>`;
}

function grid(list) {
  return `<div class="tilegrid">${(list||[]).map(tile).join("")}</div>`;
}

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
        ${os.nowPlaying && os.nowPlaying.length ? tile(os.nowPlaying[0]) : `<div class="muted small" style="margin-top:10px">No active session</div>`}
      </div>
    </div>`;
}

function render(path) {
  navButtons.forEach(b => {
    b.classList.toggle("active", b.dataset.route === path);
  });

  const q = document.getElementById("q").value.toLowerCase();
  let html = "";

  if (path === "/") {
    html += hero();
    html += section("Featured", grid(os.featured));
    html += section("Library", grid(os.library.slice(0, 6)));
  }
  else if (path === "/store") {
    const list = os.store.filter(i => i.title.toLowerCase().includes(q));
    html += section("Store", grid(list));
  }
  else if (path === "/library") {
    const list = os.library.filter(i => i.title.toLowerCase().includes(q));
    html += section("Library", grid(list));
  }
  else if (path === "/downloads") {
    html += section("Downloads", `<div class="muted">No active downloads yet.</div>`);
  }
  else if (path === "/settings") {
    html += section("Settings", `
      <div class="muted small">Channel: <strong>${channel}</strong></div>
      <div style="margin-top:10px"><button class="btn" id="clear">Clear cache</button></div>
    `);
    setTimeout(() => {
      document.getElementById("clear").onclick = async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
        alert("Cache cleared. Reloading.");
        location.reload();
      };
    }, 0);
  }
  else {
    html += section("Not found", `<div class="muted">Route ${path} not found.</div>`);
  }

  mainEl.innerHTML = html;
}

navButtons.forEach(b =>
  b.addEventListener("click", () => goto(b.dataset.route))
);

chips.forEach(c =>
  c.addEventListener("click", () => setChannel(c.dataset.channel))
);

document.getElementById("refresh").onclick = boot;

window.addEventListener("popstate", () => {
  const clean = location.pathname.replace(BASE, "") || "/";
  render(clean);
});

boot();
