// engine/shared/vdom.js
// Minimal VDOM: h(), render(), diff(), patch()

// engine/shared/vdom.js
function h(type, props = {}, ...children) { return { type, props, children: children.flat() }; }
function el(node){
  if (node == null || node === false) return document.createComment('empty');
  if (typeof node === 'string' || typeof node === 'number') return document.createTextNode(String(node));
  const $el = document.createElement(node.type);
  for (const [k,v] of Object.entries(node.props || {})) {
    if (k.startsWith('on') && typeof v === 'function') $el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v != null) $el.setAttribute(k, v);
  }
  for (const c of node.children || []) $el.appendChild(el(c));
  return $el;
}
function changed(a,b){
  return typeof a !== typeof b || (typeof a === 'string' && a !== b) || a?.type !== b?.type;
}
function patch($parent, newNode, oldNode, index=0){
  const $el = $parent.childNodes[index];
  if (!oldNode) { $parent.appendChild(el(newNode)); return; }
  if (!newNode) { $parent.removeChild($el); return; }
  if (changed(newNode, oldNode)) { $parent.replaceChild(el(newNode), $el); return; }
  if (newNode.props && $el.nodeType === 1) {
    for (const [k,v] of Object.entries(newNode.props)) if (!k.startsWith('on')) $el.setAttribute(k, v ?? '');
  }
  const max = Math.max(newNode.children?.length||0, oldNode.children?.length||0);
  for (let i=0;i<max;i++) patch($el, newNode.children?.[i], oldNode.children?.[i], i);
}
function render($mount, nextTree, prev = { current:null }){ patch($mount, nextTree, prev.current, 0); prev.current = nextTree; }

export const vdom = { h, render };

