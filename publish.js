// publish.js
import { upsertJson } from './provision.js';

const GH_OWNER  = 'mpickettpayments-hue';
const GH_REPO   = 'json-asx-cdn';
const GH_BRANCH = 'main';

async function ghGet(path) {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}?ref=${GH_BRANCH}`;
  const r = await fetch(url);
  return { ok: r.ok, status: r.status, json: r.ok ? await r.json() : null };
}

export async function publishAppJson({ uid, appId, spec, token }) {
  const appPath = `users/${uid}/apps/${appId}/app.json`;
  await upsertJson(appPath, spec, token, `Publish app ${appId} for ${uid}`);

  const manPath = `users/${uid}/manifest.json`;
  const read = await ghGet(manPath);
  const manifest = read.ok ? JSON.parse(atob(read.json.content)) : { title: uid, main: appId, apps: [] };

  if (!manifest.apps.find(a => a.id === appId))
    manifest.apps.push({ id: appId, title: spec.title || appId });
  if (!manifest.main) manifest.main = appId;

  await upsertJson(manPath, manifest, token, `Update manifest for ${uid}`);
  return { url: `https://${uid}.xjson.app/apps/${appId}/` };
}
