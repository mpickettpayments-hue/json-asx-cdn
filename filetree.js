// filetree.js — GitHub Contents API helpers for File Tree R/W (SAVE-B, DEL-YES, UA2)
// Uses PAT from localStorage('xjson.admin.pat')

const GH_OWNER  = 'mpickettpayments-hue';
const GH_REPO   = 'json-asx-cdn';
const GH_BRANCH = 'main';

function authHeaders() {
  const token = localStorage.getItem('xjson.admin.pat') || '';
  const h = { 'Accept': 'application/vnd.github+json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

function ghUrl(path, params={}) {
  const base = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}`;
  const q = new URLSearchParams({ ref: GH_BRANCH, ...params }).toString();
  return `${base}?${q}`;
}

export async function listDir(path) {
  const r = await fetch(ghUrl(path), { headers: authHeaders() });
  if (!r.ok) throw new Error(`listDir ${path} failed: ${r.status}`);
  return r.json(); // array of {name,path,sha,type,download_url}
}

export async function getFile(path) {
  const r = await fetch(ghUrl(path), { headers: authHeaders() });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`getFile ${path} failed: ${r.status}`);
  const j = await r.json();
  // j.content is base64 (with newlines). Keep sha for updates.
  const content = atob((j.content||'').replace(/\n/g,''));
  return { sha: j.sha, content, encoding: j.encoding || 'base64' };
}

function toB64(s) {
  // ensure UTF-8
  return btoa(unescape(encodeURIComponent(s)));
}

export async function putFile(path, content, message='Update', sha=null) {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}`;
  const body = {
    message,
    content: toB64(content),
    branch: GH_BRANCH,
    ...(sha ? { sha } : {})
  };
  const r = await fetch(url, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`putFile ${path} failed: ${r.status} ${t}`);
  }
  return r.json();
}

export async function deleteFile(path, sha, message='Delete file') {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}`;
  const body = { message, sha, branch: GH_BRANCH };
  const r = await fetch(url, {
    method: 'DELETE',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`deleteFile ${path} failed: ${r.status} ${t}`);
  }
  return r.json();
}

// GitHub cannot create empty directories; create a .keep file
export async function createFolder(path) {
  const keepPath = path.replace(/\/+$/,'') + '/.keep';
  return putFile(keepPath, 'keep', `Create folder ${path}`, null);
}

export async function renamePath(oldPath, newPath) {
  // GitHub API has no rename; implement as copy + delete for files.
  const f = await getFile(oldPath);
  if (!f) throw new Error('Source not found');
  await putFile(newPath, f.content, `Rename ${oldPath} -> ${newPath}`, null);
  await deleteFile(oldPath, f.sha, `Delete ${oldPath} after rename`);
}

export async function ensureJsonPretty(str) {
  const obj = JSON.parse(str);
  return JSON.stringify(obj, null, 2);
}
