// engine/json-2d/engine.js
// 2D DOM-first renderer with optional <canvas> layer. Fast dev, perfect for starters.
// engine/json-2d/engine.js — G1 + TD-B ready

export function createEngine({ mount, workers, vdom }) {
  // --- State ---
  let running = false, rafId = 0, prev = 0;
  let spec = null;
  const treeRef = { current: null };
  const S = {
    gold: 100,
    hp: 20,
    wave: 0,
    towers: {},     // { spotId: { dmg, range, rate } }
    creeps: [],     // [{ x,y, hp, t, pathIndex }]
    bg: null,       // loaded Image
  };

  // --- Helpers ---
  const $ = (sel, root=mount)=> root.querySelector(sel);
  const $$ = (sel, root=mount)=> Array.from(root.querySelectorAll(sel));

  function loadImage(src){
    return new Promise((res, rej)=>{
      const img = new Image();
      img.onload = ()=> res(img);
      img.onerror = rej;
      img.src = src;
    });
  }

  // --- Lifecycle ---
  async function init() {
    running = true;
    mount.innerHTML = `
      <div class="td-stage" style="position:relative; width:100%; max-width:768px; aspect-ratio:1/1; margin:auto;">
        <canvas id="tdCanvas" width="768" height="768" style="width:100%; height:auto; display:block; background:#0b0f14;"></canvas>
        <div id="tdSpots" class="td-spots"></div>
        <div id="tdHud" class="td-hud"></div>
        <div id="tdUI" class="td-ui"></div>
      </div>
    `;
    prev = performance.now();
    loop(prev);
  }

  function destroy() {
    running = false;
    cancelAnimationFrame(rafId);
    mount.innerHTML = '';
  }

  function loop(now){
    if (!running) return;
    const dt = Math.min(0.033, (now - prev)/1000); // clamp to ~30fps max step
    prev = now;
    tick(dt);
    rafId = requestAnimationFrame(loop);
  }

  // --- Load spec (@game) ---
  async function load(newSpec) {
    spec = normalizeSpec(newSpec);
    // preload background
    if (spec.map?.background) {
      try { S.bg = await loadImage(spec.map.background); } catch { S.bg = null; }
    }
    renderHUD();
    renderUI();
    renderSpots();
  }

  function normalizeSpec(s) {
    // Support both legacy {scene} and grouped {@game}
    const g = s['@game'] || {};
    const map = g['@map'] || null;
    const hud = g['@hud'] || [];
    const ui  = g['@scene']?.ui || [];
    const npc = g['@npc'] || [];
    return { map, hud, ui, npc };
  }

  // --- HUD (VDOM) ---
  function renderHUD(){
    const { h, render } = vdom;
    const badges = (spec.hud || []).map(b=>{
      const value = String(S[b.bind] ?? '');
      return h('div', { class:'hud-badge' },
        h('div', { class:'hud-k' }, b.label),
        h('div', { class:'hud-v' }, value)
      );
    });
    const tree = h('div', { class:'hud-wrap' }, ...badges);
    render($('#tdHud'), tree, treeRef);
  }

  // --- UI buttons (VDOM) ---
  function renderUI(){
    const { h, render } = vdom;
    const btns = (spec.ui || []).map(n=>{
      if (n.type === 'button') {
        return h('button', { class:'btn', onClick: ()=>handleAction(n.action) }, n.label||'Button');
      }
      return h('div', {}, `Unknown UI: ${n.type}`);
    });
    const tree = h('div', { class:'ui-wrap' }, ...btns);
    render($('#tdUI'), tree, { current: null });
  }

  function handleAction(action){
    if (action === 'waves.start') startWave();
  }

  // --- Spots (absolute buttons) ---
  function renderSpots(){
    const host = $('#tdSpots');
    host.innerHTML = '';
    (spec.map?.spots || []).forEach(spot=>{
      const btn = document.createElement('button');
      btn.className = 'td-spot';
      btn.style.left = `${spot.x-14}px`;
      btn.style.top  = `${spot.y-14}px`;
      btn.title = S.towers[spot.id] ? 'Tower placed' : 'Build tower (50g)';
      btn.textContent = S.towers[spot.id] ? '⛳' : '+';
      btn.onclick = ()=> {
        if (S.towers[spot.id]) return; // already built
        if (S.gold < 50) return;
        S.gold -= 50;
        S.towers[spot.id] = { dmg: 2, range: 110, rate: 0.6, cd: 0 };
        btn.textContent = '⛳';
        btn.title = 'Tower placed';
        renderHUD();
      };
      host.appendChild(btn);
    });
  }

  // --- Waves & Creeps ---
  function startWave(){
    S.wave += 1;
    renderHUD();
    // spawn a simple line of creeps
    for (let i=0;i<8;i++){
      S.creeps.push({
        hp: 10 + S.wave*3,
        speed: 60 + S.wave*3,
        pathIndex: 0,
        t: -i*0.8, // stagger
        x: spec.map.path[0][0],
        y: spec.map.path[0][1]
      });
    }
  }

  function moveCreeps(dt){
    const P = spec.map.path;
    if (!P || P.length<2) return;
    for (const c of S.creeps){
      c.t += dt;
      if (c.t < 0) continue; // not yet spawned
      // Move toward next point
      const i = c.pathIndex;
      const a = P[i], b = P[i+1];
      if (!b) { // reached end
        c.dead = true; S.hp = Math.max(0, S.hp-1); renderHUD(); continue; }
      const dx = b[0]-a[0], dy = b[1]-a[1];
      const dist = Math.hypot(dx,dy);
      const nx = dx / (dist||1), ny = dy / (dist||1);
      c.x += nx * c.speed * dt;
      c.y += ny * c.speed * dt;
      // passed segment?
      const segDone = ((nx*(c.x-a[0]) + ny*(c.y-a[1])) >= dist);
      if (segDone) { c.pathIndex++; c.x = b[0]; c.y = b[1]; }
    }
    S.creeps = S.creeps.filter(c=> !c.dead && c.hp>0 );
  }

  function towersFire(dt){
    for (const [spotId, tw] of Object.entries(S.towers)){
      tw.cd -= dt;
      if (tw.cd > 0) continue;
      // find target
      const spot = (spec.map.spots||[]).find(s=> s.id===spotId);
      if (!spot) continue;
      let target = null, bestD = Infinity;
      for (const c of S.creeps){
        const d = Math.hypot(c.x-spot.x, c.y-spot.y);
        if (d < tw.range && d < bestD) { bestD=d; target=c; }
      }
      if (target){
        target.hp -= tw.dmg;
        tw.cd = tw.rate;
        if (target.hp <= 0) { S.gold += 5; renderHUD(); }
      }
    }
  }

  // --- Tick & Draw ---
  function tick(dt){
    // sim
    moveCreeps(dt);
    towersFire(dt);

    // draw
    const cvs = $('#tdCanvas');
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0,0,cvs.width,cvs.height);

    // background
    if (S.bg) ctx.drawImage(S.bg, 0, 0, cvs.width, cvs.height);

    // path (debug overlay)
    if (spec.map?.path?.length > 1) {
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(spec.map.path[0][0], spec.map.path[0][1]);
      for (let i=1;i<spec.map.path.length;i++) ctx.lineTo(spec.map.path[i][0], spec.map.path[i][1]);
      ctx.stroke();
    }

    // creeps
    for (const c of S.creeps){
      if (c.t < 0) continue;
      ctx.fillStyle = '#7cf';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 10, 0, Math.PI*2);
      ctx.fill();

      // hp bar
      ctx.fillStyle = '#222';
      ctx.fillRect(c.x-12, c.y-18, 24, 4);
      const pct = Math.max(0, Math.min(1, c.hp / (10 + S.wave*3)));
      ctx.fillStyle = '#4f4';
      ctx.fillRect(c.x-12, c.y-18, 24*pct, 4);
    }
  }

  return { init, load, tick, destroy };
}

