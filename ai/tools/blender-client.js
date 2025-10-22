export function createBlenderClient(url='ws://127.0.0.1:8765'){
  let ws; const wait = ms=>new Promise(r=>setTimeout(r,ms));
  async function ensure(){
    if(ws && ws.readyState===1) return;
    ws = new WebSocket(url);
    await new Promise((res,rej)=>{
      ws.onopen=res; ws.onerror=e=>rej(new Error('WS error'));
      setTimeout(()=>rej(new Error('WS timeout')), 4000);
    });
  }
  async function send(cmd, args={}){
    await ensure();
    return new Promise((res,rej)=>{
      ws.onmessage = (ev)=>{ try{ res(JSON.parse(ev.data)); }catch(e){ rej(e); } };
      ws.send(JSON.stringify({cmd,args}));
    });
  }
  return { send };
}
