// auth.js — Google Sign-In + UID-C generator + subdomain redirect

export function decodeJwtResponse(token) {
  const payload = token.split('.')[1];
  return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
}

export function makeUidC(email) {
  const base = email.split('@')[0].toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '-')   // sanitize
    .replace(/^-+|-+$/g, '')         // trim dashes
    .slice(0, 12) || 'user';
  const rand = Math.random().toString(36).slice(2, 6);
  return `u_${base}_${rand}`;
}

export function redirectToUserDomain(uid) {
  const proto = window.location.protocol;
  const host = window.location.hostname.replace(/^www\./, '');
  const parts = host.split('.');
  const main = parts.slice(-2).join('.');
  window.location.href = `${proto}//${uid}.${main}/`;
}

/**
 * Initializes Google Sign-In and resolves user { email, uid, claims }
 * @param {Object} opts
 * @param {string} opts.buttonId - DOM ID of the Google Sign-In button
 * @param {Function} opts.onSignedIn - Callback with { email, uid, claims }
 * @param {string} opts.clientId - Google OAuth client ID
 * @param {boolean} opts.autoRedirect - If true, redirects to subdomain after sign-in
 */
export function initGoogleSignIn({ buttonId = 'googleBtn', onSignedIn, clientId, autoRedirect = true }) {
  if (!clientId) {
    console.error('Google Sign-In: Missing clientId');
    return;
  }

  window.handleGsi = (resp) => {
    try {
      const claims = decodeJwtResponse(resp.credential);
      const email = claims.email;
      const uid = makeUidC(email);
      window.CURRENT_UID = uid;
      onSignedIn?.({ email, uid, claims });
      if (autoRedirect) redirectToUserDomain(uid);
    } catch (e) {
      alert('Sign-in failed: ' + e.message);
    }
  };

  const waitForGsi = () => {
    if (!window.google?.accounts?.id) return setTimeout(waitForGsi, 200);
    google.accounts.id.initialize({
      client_id: clientId,
      callback: window.handleGsi
    });

    const btn = document.getElementById(buttonId);
    if (btn) {
      google.accounts.id.renderButton(btn, { theme: 'outline', size: 'large' });
    } else {
      console.warn(`Google Sign-In: Button with ID "${buttonId}" not found`);
    }
  };

  waitForGsi();
}
