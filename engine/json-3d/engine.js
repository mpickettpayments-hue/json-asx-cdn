// engine/json-3d/engine.js
// 3D shell (placeholder). Later: Three.js or raw WebGL. Keeps contract consistent.
// engine/json-3d/engine.js
export function createEngine({ mount }) {
  let scene, camera, renderer, anim;
  function init(){
    mount.innerHTML='';
    const hasThree = !!window.THREE;
    const box = document.createElement('div'); box.className='card';
    box.innerHTML = `<h3 class="h3">JSON-3D Engine</h3>
      <div class="small muted">${hasThree?'Three.js detected – booting scene':'Three.js not found – fallback note below'}</div>
      <div id="threeMount" style="width:100%;height:60vh;background:#0b0f14;border-radius:10px;margin-top:10px;"></div>`;
    mount.appendChild(box);
    if (!hasThree) {
      const p=document.createElement('p'); p.className='small muted';
      p.textContent='Add <script src="https://cdn.jsdelivr.net/npm/three@0.158/build/three.min.js"></script> to enable live 3D.';
      box.appendChild(p); return;
    }
    const container = box.querySelector('#threeMount');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, container.clientWidth/container.clientHeight, 0.1, 1000);
    camera.position.set(0,1.5,3);
    renderer = new THREE.WebGLRenderer({ antialias:true }); renderer.setSize(container.clientWidth, container.clientHeight); container.appendChild(renderer.domElement);
    const geo=new THREE.BoxGeometry(1,1,1), mat=new THREE.MeshNormalMaterial(); const cube=new THREE.Mesh(geo,mat); scene.add(cube);
    const light=new THREE.DirectionalLight(0xffffff,1); light.position.set(2,3,4); scene.add(light);
    anim = ()=>{ cube.rotation.y += 0.01; renderer.render(scene,camera); requestAnimationFrame(anim); }; anim();
    window.addEventListener('resize', ()=>{ renderer.setSize(container.clientWidth, container.clientHeight); camera.aspect=container.clientWidth/container.clientHeight; camera.updateProjectionMatrix(); });
  }
  function load(spec){ console.log('[json-3d] spec', spec); } // future: parse @game blocks
  function tick(){} function destroy(){ mount.innerHTML=''; cancelAnimationFrame(anim); }
  return { init, load, tick, destroy };
}
