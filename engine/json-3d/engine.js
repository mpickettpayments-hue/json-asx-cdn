// engine/json-3d/engine.js
// 3D shell (placeholder). Later: Three.js or raw WebGL. Keeps contract consistent.

export function createEngine({ mount /*, workers*/ }) {
  let $label;

  function init(){
    mount.innerHTML = '';
    $label = document.createElement('div');
    $label.className = 'card';
    $label.innerHTML = `
      <h3 class="h3">JSON-3D Engine</h3>
      <div class="small muted">Nightly / experimental 3D. WebGL runtime coming next.</div>`;
    mount.appendChild($label);
  }

  function load(spec){
    // Future: parse @map, @npc, @physics etc. Build 3D scene graph.
    console.log('[json-3d] load spec', spec);
  }

  function tick(){ /* future render loop */ }
  function destroy(){ mount.innerHTML=''; }

  return { init, load, tick, destroy };
}
