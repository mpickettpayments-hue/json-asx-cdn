// workers/physics.worker.js
self.onmessage = (e)=>{
  const { type, payload } = e.data || {};
  if (type === 'step') {
    // Future: integrate planck.js / SAT.js / custom.
    self.postMessage({ type:'state', payload }); // echo for now
  }
};
