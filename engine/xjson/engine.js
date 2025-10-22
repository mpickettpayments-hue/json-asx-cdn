// engine/xjson/engine.js
// 2.5D / isometric-ready shell. For now, reuses DOM VDOM like 2D, but reserved for layers/parallax/grid.
// engine/xjson/engine.js (2.5D shell; shares VDOM for UI)


export function createEngine({ mount, vdom }) {
  let spec=null, treeRef={current:null};
  function init(){ mount.innerHTML=''; }
  function load(s){ spec = s['@game'] || {}; render(); }
  function render(){
    const { h, render } = vdom;
    const ui = (spec['@scene']?.ui||[]).map(n => n.type==='button'
      ? h('button',{class:'btn'}, n.label||'Button') : h('div',{}, 'Unknown'));
    const tree = h('div',{class:'xjson-25d'},
      h('div',{class:'layer bg'}, '/* parallax bg */'),
      h('div',{class:'layer world'}, '/* future isometric world */'),
      h('div',{class:'layer ui'}, ...ui)
    );
    render(mount, tree, treeRef);
  }
  function tick(){} function destroy(){ mount.innerHTML=''; }
  return { init, load, tick, destroy };
}
