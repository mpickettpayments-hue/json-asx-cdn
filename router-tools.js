// router-tools.js
export function redirectToUserDomain(uid) {
  const base = window.location.protocol;
  const domain = window.location.hostname;
  const root = domain.replace(/^www\./,'');
  const parts = root.split('.');
  const mainDomain = parts.slice(parts.length-2).join('.');
  window.location.href = `${base}//${uid}.${mainDomain}/`;
}
