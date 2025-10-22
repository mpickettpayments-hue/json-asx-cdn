self.onmessage = (e)=>{
  const { type, payload } = e.data||{};
  if (type==='step') self.postMessage({ type:'state', payload });
};
