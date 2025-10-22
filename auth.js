// auth.js
// Google Sign-In (client-only) + UID-C generator (u_<namehint>_<4char>)
export function decodeJwtResponse(token) {
  // minimal client decode (MVP). For production, verify on server.
  const payload = token.split('.')[1];
  return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
}

export function makeUidC(email) {
  const base = email.split('@')[0].toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '-')  // sanitize
    .replace(/^-+|-+$/g,'')         // trim dashes
    .slice(0,12) || 'user';
  const rand = Math.random().toString(36).slice(2,6);
  return `u_${base}_${rand}`;
}

// Renders Google button and resolves user { email, uid }
export function initGoogleSignIn({ buttonId = 'googleBtn', onSignedIn }) {
  window.handleGsi = (resp) => {
    try {
      const claims = decodeJwtResponse(resp.credential);
      const email = claims.email;
      const uid = makeUidC(email);
      onSignedIn({ email, uid, claims });
    } catch (e) {
      alert('Sign-in failed: ' + e.message);
    }
  };
  // Defer until GIS is loaded
  const tryRender = () => {
    if (!window.google || !google.accounts || !google.accounts.id) {
      return setTimeout(tryRender, 300);
    }
    google.accounts.id.initialize({
      client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
      callback: window.handleGsi
    });
    const btn = document.getElementById(buttonId);
    if (btn) google.accounts.id.renderButton(btn, { theme: 'outline', size: 'large' });
  };
  tryRender();
}
