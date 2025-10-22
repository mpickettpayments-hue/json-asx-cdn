// router-tools.js
export function redirectToUserDomain(uid) {
  const proto = window.location.protocol;
  const host = window.location.hostname.replace(/^www\./,'');
  const parts = host.split('.');
  const main = parts.slice(parts.length-2).join('.');
  window.location.href = `${proto}//${uid}.${main}/`;
}
