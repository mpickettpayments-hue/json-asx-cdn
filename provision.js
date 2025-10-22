// provision.js — P2: Vault + Provision (GitHub Contents API, repo-scoped)
// Uses the PAT saved in localStorage ("xjson.admin.pat") by the admin on Settings.
// publish.js already imports { upsertJson } from here — keep signatures stable.

const GH_OWNER  = 'mpickettpayments-hue';
const GH_REPO   = 'json-asx-cdn';
const GH_BRANCH = 'main';

// ---------- GitHub helpers ----------
async function ghGet(path, token) {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}?ref=${GH_BRANCH}`;
  const r = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { ok: r.ok, status: r.status, json: r.ok ? await r.json() : await r.json().catch(()=>null) };
}
async function ghPut(path, contentB64, message, sha, token) {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}`;
  const body = {
    message: message || `Update ${path}`,
    content: contentB64,
    branch: GH_BRANCH,
    ...(sha ? { sha } : {})
  };
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`PUT ${path} failed (${r.status}): ${txt}`);
  }
  return r.json();
}
function toB64(objOrString) {
  const s = (typeof objOrString === 'string') ? objOrString : JSON.stringify(objOrString, null, 2);
  // btoa expects ASCII; encode UTF-8 safely:
  return btoa(unescape(encodeURIComponent(s)));
}

// Public: upsert JSON file with proper sha handling
export async function upsertJson(path, data, token, message) {
  const exists = await ghGet(path, token);
  const b64 = toB64(data);
  const sha = exists.ok ? exists.json.sha : undefined;
  return ghPut(path, b64, message, sha, token);
}

// ---------- P2: Ensure user scaffold ----------
export async function ensureUserProvisioned(uid, token, email) {
  // Detect if already provisioned (manifest is the SSoT)
  const man = await ghGet(`users/${uid}/manifest.json`, token);
  if (man.ok) return { created: false, uid };

  // Defaults
  const now = new Date().toISOString();

  const manifest = {
    title: uid,
    main: "starter",
    apps: [{ id: "starter", title: "Starter Clicker" }],
    createdAt: now,
    channel: "latest"
  };

  const profile = {
    "@profile": {
      uid,
      email: email || null,
      joined: now,
      avatar: null,
      badges: ["founder"],
      xp: 50,
      flags: { beta: true }
    }
  };

  const library = {
    "@library": {
      uid,
      apps: ["starter"],
      updated: now
    }
  };

  const ledger = {
    "@ledger": {
      uid,
      xp: [{ ts: now, delta: 50, reason: "founder" }],
      badges: [{ ts: now, id: "founder" }]
    }
  };

  const vault = {
    "@vault": {
      uid,
      buckets: {
        apps: ["apps/starter/app.json"],
        scenes: ["dashboard.asx"],
        meta: ["manifest.json", "profile.json", "library.json", "ledger.json"]
      },
      updated: now
    }
  };

  const starterApp = {
    state: { score: 0 },
    scene: [
      { "type": "text", "value": "Score: ${state.score}" },
      { "type": "row", "children": [
        { "type": "button", "label": "Tap +1", "action": "set(score, ${state.score}+1)" },
        { "type": "button", "label": "Reset",  "action": "set(score, 0)" }
      ] }
    ]
  };

  const dashboardASX = {
    "@scene": "dashboard",
    "title": "Welcome",
    "blocks": [
      { "type": "text", "value": `Hi ${uid}! This is your dashboard.` },
      { "type": "text", "value": "Open Builder (</>) to edit your starter app, then Publish." }
    ]
  };

  // Create files (order roughly top-down)
  await upsertJson(`users/${uid}/manifest.json`, manifest, token, `Provision manifest for ${uid}`);
  await upsertJson(`users/${uid}/profile.json`,  profile,  token, `Provision profile for ${uid}`);
  await upsertJson(`users/${uid}/library.json`,  library,  token, `Provision library for ${uid}`);
  await upsertJson(`users/${uid}/ledger.json`,   ledger,   token, `Provision ledger for ${uid}`);
  await upsertJson(`users/${uid}/vault.json`,    vault,    token, `Provision vault for ${uid}`);
  await upsertJson(`users/${uid}/dashboard.asx`, dashboardASX, token, `Provision dashboard for ${uid}`);
  await upsertJson(`users/${uid}/apps/starter/app.json`, starterApp, token, `Provision starter app for ${uid}`);

  return { created: true, uid };
}
