// os/common/ai-tab.js
// Minimal file tree + editor + commit via GitHub REST API.
// Requires: Settings -> enter "GitHub Owner", "Repo", "Branch", "PAT" (classic, repo scope).
(function(){
  const LS = k=>localStorage.getItem(k)||'';
  const ownerKey='xjson.owner', repoKey='xjson.repo', branchKey='xjson.branch', patKey='xjson.pat';

  async function api(path, opts={}){
    const token = LS(patKey); if(!token) throw new Error('PAT missing in Settings');
    const res = await fetch(`https://api.github.com${path}`, {
      ...opts,
      headers: { 'Authorization': `Bearer ${token}`, 'Accept':'application/vnd.github+json', 'Content-Type':'application/json', ...(opts.headers||{}) }
    });
    if(!res.ok){ const t=await res.text(); throw new Error(`GitHub API ${res.status}: ${t}`); }
    return res.json();
  }

  async function list(path=''){
    const owner=LS(ownerKey), repo=LS(repoKey);
    return api(`/repos/${owner}/${repo}/contents/${path}`);
  }
  async function read(path){
    const owner=LS(ownerKey), repo=LS(repoKey);
    const j = await api(`/repos/${owner}/${repo}/contents/${path}`);
    return { sha:j.sha, text: atob(j.content.replace(/\n/g,'')) };
  }
  async function write(path, text, sha){
    const owner=LS(ownerKey), repo=LS(repoKey), branch=LS(branchKey)||'main';
    return api(`/repos/${owner}/${repo}/contents/${path}`, {
      method:'PUT',
      body: JSON.stringify({ message:`AI edit: ${path}`, content:btoa(unescape(encodeURIComponent(text))), branch, sha })
    });
  }

  // Mount simple UI into #aiTab if present
  window.mountAiTab = async function(){
    const root = document.getElementById('aiTab'); if(!root) return;
    root.innerHTML = `
      <div class="card" style="display:flex;gap:12px;">
        <div style="min-width:280px;">
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
            <input id="aiPath" placeholder="path (e.g. apps/tower-defense/app.json)" style="width:100%">
            <button id="aiLoad" class="btn">Open</button>
          </div>
          <div id="aiTree" class="small" style="max-height:50vh;overflow:auto;border:1px solid #172231;border-radius:8px;padding:8px"></div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
          <textarea id="aiEditor" style="width:100%;height:46vh;font-family:ui-monospace, SFMono-Regular, Menlo, monospace;font-size:13px;"></textarea>
          <div style="display:flex;gap:8px;">
            <button id="aiSave" class="btn">Save</button>
            <button id="aiGen" class="btn">AI Generate (Langflow)</button>
          </div>
          <div id="aiLog" class="small muted"></div>
        </div>
      </div>`;

    async function loadTree(){
      const items = await list('');
      const ul = document.createElement('ul'); ul.style.listStyle='none'; ul.style.padding='0';
      for(const it of items){
        const li=document.createElement('li'); li.style.margin='4px 0';
        li.innerHTML = `${it.type==='dir'?'📁':'📄'} <a href="#" data-path="${it.path}">${it.path}</a>`;
        ul.appendChild(li);
      }
      const tree=document.getElementById('aiTree'); tree.innerHTML=''; tree.appendChild(ul);
      tree.addEventListener('click', async e=>{
        const a=e.target.closest('a[data-path]'); if(!a) return;
        e.preventDefault(); const p=a.getAttribute('data-path');
        const { text } = await read(p);
        document.getElementById('aiPath').value = p;
        document.getElementById('aiEditor').value = text;
      });
    }

    document.getElementById('aiLoad').onclick = async ()=>{
      const p = document.getElementById('aiPath').value.trim();
      const { text } = await read(p);
      document.getElementById('aiEditor').value = text;
    };
    document.getElementById('aiSave').onclick = async ()=>{
      const p = document.getElementById('aiPath').value.trim();
      const cur = await read(p).catch(()=>({sha:null,text:''}));
      await write(p, document.getElementById('aiEditor').value, cur.sha);
      document.getElementById('aiLog').textContent = `Saved ${p}`;
      loadTree();
    };
    document.getElementById('aiGen').onclick = async ()=>{
      const lf = localStorage.getItem('xjson.langflow') || '';
      if(!lf){ alert('Set Langflow endpoint in Settings'); return; }
      const p = document.getElementById('aiPath').value.trim();
      const prompt = prompt('Describe what to generate/modify for: '+p, 'Add 2 tower spots and bend path harder');
      if(!prompt) return;
      const body = { prompt, path:p, content:document.getElementById('aiEditor').value };
      try{
        const r = await fetch(lf, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
        const out = await r.json();
        if(out?.content){ document.getElementById('aiEditor').value = out.content; document.getElementById('aiLog').textContent='AI patched buffer (not saved yet)'; }
        else document.getElementById('aiLog').textContent='AI response did not include .content';
      }catch(e){ document.getElementById('aiLog').textContent='AI error: '+e.message; }
    };

    loadTree();
  };
})();
