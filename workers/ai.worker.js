// workers/ai.worker.js
self.onmessage = async (e)=>{
  const { type, payload } = e.data || {};
  if (type === 'generate') {
    // Placeholder: call LangFlow / local model via fetch if allowed (CORS).
    // Return a stubbed scene for now.
    const scene = [
      { type:'text', value:'AI generated greeting' },
      { type:'button', label:'Hello', action:'noop()' }
    ];
    self.postMessage({ type:'result', payload:{ scene } });
  }
};
