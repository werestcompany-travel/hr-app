import liff from '@line/liff';

const API_URL = import.meta.env.VITE_API_URL;

// ── Initialize LIFF and get JWT ───────────────────────────────────────────────
export async function initLiff(liffId) {
  await liff.init({ liffId });

  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri: window.location.href });
    return; // page will reload after login
  }

  const idToken = liff.getIDToken();
  if (!idToken) throw new Error('Could not get LINE ID token');

  const resp = await fetch(`${API_URL}/auth/line`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken: idToken }),
  });

  if (!resp.ok) {
    throw new Error('Authentication failed');
  }

  const { token } = await resp.json();
  localStorage.setItem('hr_jwt', token);
}

// ── Authenticated API call ────────────────────────────────────────────────────
export async function apiCall(path, options = {}) {
  const token = localStorage.getItem('hr_jwt');

  const isFormData = options.body instanceof FormData;

  const headers = {
    Authorization: token ? `Bearer ${token}` : undefined,
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  // Remove undefined headers
  Object.keys(headers).forEach(k => headers[k] === undefined && delete headers[k]);

  const resp = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.error || `Request failed (${resp.status})`);
  }

  return data;
}
