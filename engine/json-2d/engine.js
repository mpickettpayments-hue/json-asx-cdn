// engine/json-2d/engine.js
// 2D DOM-first renderer with optional <canvas> layer. Fast dev, perfect for starters.

export function createEngine({ mount, workers, vdom }) {
  let running = false, rafId = 0, prev = 0, treeRef = { current: null };
  let state = { t: 0, scene: [] };

  function init() {
    mount.innerHTML = ''; // clean
    running = true;
    prev = performance.now();
    loop(prev);
  }

  function loop(now){
    if (!running) return;
    const dt = (now - prev) / 1000;
    prev = now;
    tick(dt);
    rafId = requestAnimationFrame(loop);
  }

  function load(spec) {
    // Accepts your JSON scene format and stores it in state
    state.scene = Array.isArray(spec.scene) ? spec.scene : [];
  }

  function tick(dt) {
    state.t += dt;
    // render via VDOM (simple translation of your JSON nodes)
    const { h, render } = vdom;
    const tree = h('div', { class: 'json2d' },
      state.scene.map(n=>{
        if (n.type === 'text') return h('div', { class: 'n-text' }, String(n.value ?? ''));
        if (n.type === 'button') return h('button', { class: 'btn', onClick: ()=>runAction(n.action) }, n.label || 'Button');
        if (n.type === 'row') return h('div', { class: 'n-row' }, (n.children||[]).map(c=>nodeToVNode(c)));
        if (n.type === 'image') return h('img', { src: n.src, style: 'max-width:100%;border-radius:10px;border:1px solid #172231' });
        return h('div', { class: 'n-unknown' }, `Unknown: ${n.type}`);
      })
    );
    render(mount, tree, treeRef);
  }

  function nodeToVNode(n){
    const { h } = vdom;
    if (n.type === 'text') return h('div', { class: 'n-text' }, String(n.value ?? ''));
    if (n.type === 'button') return h('button', { class: 'btn', onClick: ()=>runAction(n.action) }, n.label || 'Button');
    if (n.type === 'image') return h('img', { src: n.src, style: 'max-width:100%;border-radius:10px;border:1px solid #172231' });
    if (n.type === 'row') return h('div', { class: 'n-row' }, (n.children||[]).map(c=>nodeToVNode(c)));
    return h('div', { class: 'n-unknown' }, `Unknown: ${n.type}`);
  }

  function runAction(action){
    // Placeholder—later wire to your state evaluator/expressions
    console.log('[json-2d] action:', action);
  }

  function destroy() {
    running = false;
    cancelAnimationFrame(rafId);
    mount.innerHTML = '';
  }

  return { init, load, tick(){}, destroy };
}
