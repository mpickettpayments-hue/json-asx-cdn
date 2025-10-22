// revisions.js — simple JSON revision log per file (PUB-YES, SAVE-B, rollback support)

import { getFile, putFile, ensureJsonPretty } from './filetree.js';

function historyPathFor(filePath) {
  const parts = filePath.split('/');
  const file = parts.pop();
  const base = parts.join('/');
  return (base ? base + '/' : '') + `.revisions/${file}.history.json`;
}

function ts() { return new Date().toISOString(); }
function currentUID() {
  if (window.CURRENT_UID) return window.CURRENT_UID;
  const host = location.hostname;
  const m = host.match(/^([^.]+)\.xjson\.app$/);
  return m ? m[1] : 'unknown';
}

export async function appendRevision(filePath, message) {
  const hp = historyPathFor(filePath);
  const existing = await getFile(hp);
  let hist = [];
  if (existing) {
    try { hist = JSON.parse(existing.content); } catch { hist = []; }
  }
  // compute hash-ish (simple)
  const hash = Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  hist.push({ timestamp: ts(), uid: currentUID(), filepath: filePath.split('/').pop(), message, hash });
  const body = JSON.stringify(hist, null, 2);
  await putFile(hp, body, `Revlog: ${filePath}`, existing?.sha || null);
}

export async function readRevisions(filePath) {
  const hp = historyPathFor(filePath);
  const existing = await getFile(hp);
  if (!existing) return [];
  try { return JSON.parse(existing.content); } catch { return []; }
}

export async function viewRevisionModal(filePath, entry, openModal) {
  // This is a read-only view using current file content as approximation;
  // For full snapshots we can store blob later. For now, show current content and metadata.
  const f = await getFile(filePath);
  const content = f ? await ensureJsonPretty(f.content) : '(file missing)';
  openModal('Revision', `<div><div><strong>${entry.timestamp}</strong> — ${entry.message}</div><pre>${escapeHTML(content)}</pre></div>`);
}

function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
