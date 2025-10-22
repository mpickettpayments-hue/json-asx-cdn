// provision.js
// One-time install of a new user's starter site into the repo.
// Uses GitHub REST API: PUT /repos/{owner}/{repo}/contents/{path}
const GH_OWNER  = 'mpickettpayments-hue';
const GH_REPO   = 'json-asx-cdn';
const GH_BRANCH = 'main';

// Helper
async function ghGet(path) {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}?ref=${GH_BRANCH}`;
  const r = await fetch(url);
  return { ok: r.ok, status: r.status, json: r.ok ? await r.json() : null };
}
async function ghPutFile(path, contentObj, token, message) {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}`;
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(contentObj, null, 2)))),
    branch: GH_BRANCH
  };
  const r = await fetch(url, {
    method: 'PUT',
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`GitHub PUT failed for ${path}: ${r.status}`);
  return r.json();
}
async function ghUpdateFile(path, contentObj, token, message, sha) {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}`;
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(contentObj, null, 2)))),
    branch: GH_BRANCH,
    sha
  };
  const r = await fetch(url, {
    method: 'PUT',
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`GitHub UPDATE failed for ${path}: ${r.status}`);
  return r.json();
}

export async function ensureUserProvisioned(uid, token) {
  // 1) Does users/<uid>/manifest.json exist?
  const manifestPath = `users/${uid}/manifest.json`;
  const probe = await ghGet(manifestPath);
  if (probe.ok) return { created: false, uid }; // already provisioned

  if (probe.status !== 404) throw new Error('Probe failed: ' + probe.status);

  // 2) Create starter manifest + app from template (inline template here for zero dependencies)
  const starterManifest = {
    title: "My First XJSON App",
    main: "starter",
    apps: [{ id: "starter", title: "Starter Game" }]
  };
  const starterApp = {
    state: { score: 0 },
    scene: [
      { type: "text", value: "Score: ${state.score}" },
      { type: "row", children: [
        { type: "button", label: "Tap +1", action: "set(score, ${state.score}+1)" },
        { type: "button", label: "Reset",  action: "set(score, 0)" }
      ] }
    ]
  };

  // 3) Write files
  await ghPutFile(manifestPath, starterManifest, token, `Provision user ${uid} (manifest)`);
  await ghPutFile(`users/${uid}/apps/starter/app.json`, starterApp, token, `Provision user ${uid} (starter app)`);

  return { created: true, uid };
}

// Utility to upsert a JSON file (used by publisher too)
export async function upsertJson(path, obj, token, commitMsg) {
  const read = await ghGet(path);
  if (read.ok) {
    const sha = read.json.sha;
    return ghUpdateFile(path, obj, token, commitMsg, sha);
  } else if (read.status === 404) {
    return ghPutFile(path, obj, token, commitMsg);
  } else {
    throw new Error(`Read failed ${read.status} for ${path}`);
  }
}
