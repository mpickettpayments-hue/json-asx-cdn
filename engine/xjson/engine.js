// engine/xjson/engine.js
// 2.5D / isometric-ready shell. For now, reuses DOM VDOM like 2D, but reserved for layers/parallax/grid.

export function createEngine({ mount, workers, vdom }) {
  let treeRef = { current: null };
  let state = { scene: [] };

  function init(){ mount.innerHTML=''; }
  function load(spec){ state.scene = Array.isArray(spec.scene) ? spec.scene : []; }
  function tick(){ render(); }

  function render(){
    const { h, render } = vdom;
    const tree = h('div', { class: 'xjson-25d' },
      h('div', { class: 'layer bg' }, '/* parallax bg */'),
      h('div', { class: 'layer world' }, state.scene.map(n=> nodeToVNode(n))),
      h('div', { class: 'layer ui' }, '/* ui layer */')
    );
    render(mount, tree, treeRef);
  }

  function nodeToVNode(n){
    const { h } = vdom;
    if (n.type === 'text') return h('div', { class: 'n-text' }, String(n.value ?? ''));
    if (n.type === 'button') return h('button', { class: 'btn' }, n.label || 'Button');
    if (n.type === 'image') return h('img', { src: n.src, style: 'max-width:100%;border-radius:10px;border:1px solid #172231' });
    return h('div', { class: 'n-unknown' }, `Unknown: ${n.type}`);
  }

  function destroy(){ mount.innerHTML=''; }
  return { init, load, tick, destroy };
}
