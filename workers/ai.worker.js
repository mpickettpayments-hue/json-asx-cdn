self.onmessage = async (e)=>{
  const { type, payload } = e.data||{};
  if (type==='generate') {
    // stub: echo a tiny scene
    const scene = [{ type:'text', value:'AI says hi' }, { type:'button', label:'Ok', action:'noop()' }];
    self.postMessage({ type:'result', payload:{ scene } });
  }
};
