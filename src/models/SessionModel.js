import { sanitizeHTML, sanitizeNumber } from '../utils/security.js';

const SESSION_KEY = 'verde_user';
const SESSION_TIMESTAMP_KEY = 'verde_session_ts';
const SESSION_HASH_KEY = 'verde_session_hash';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SESSION_SECRET = 'verde-session-integrity-v1';

async function computeHash(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data + SESSION_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function saveSecureSession(user) {
  if (!user) return;

  const safeUser = {
    id: user.id,
    email: sanitizeHTML(user.email || ''),
    user_metadata: {
      full_name: sanitizeHTML(user.user_metadata?.full_name || 'Usuario'),
      monthly_income: sanitizeNumber(user.user_metadata?.monthly_income, { min: 0, max: 99999 }),
      savings_goal_type: sanitizeHTML(user.user_metadata?.savings_goal_type || '')
    }
  };

  try {
    const userDataStr = JSON.stringify(safeUser);
    const hash = await computeHash(userDataStr);
    
    localStorage.setItem(SESSION_KEY, userDataStr);
    localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
    localStorage.setItem(SESSION_HASH_KEY, hash);
  } catch (e) {
  }
}

export async function getSecureSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    let timestamp = parseInt(localStorage.getItem(SESSION_TIMESTAMP_KEY) || '0', 10);
    const hash = localStorage.getItem(SESSION_HASH_KEY);

    if (!raw) return null;

    if (!timestamp) {
      timestamp = Date.now();
      localStorage.setItem(SESSION_TIMESTAMP_KEY, timestamp.toString());
    }

    if (Date.now() - timestamp > SESSION_MAX_AGE_MS) {
      clearSession();
      return null;
    }
    
    if (hash) {
      const computedHash = await computeHash(raw);
      if (computedHash !== hash) {
        clearSession();
        return null;
      }
    }

    const user = JSON.parse(raw);

    if (!user || typeof user !== 'object' || !user.email) {
      clearSession();
      return null;
    }

    user.email = sanitizeHTML(user.email);
    if (user.user_metadata) {
      user.user_metadata.full_name = sanitizeHTML(user.user_metadata.full_name || '');
      user.user_metadata.monthly_income = sanitizeNumber(user.user_metadata.monthly_income, { min: 0, max: 99999 });
      user.user_metadata.savings_goal_type = sanitizeHTML(user.user_metadata.savings_goal_type || '');
    }

    return user;
  } catch (e) {
    clearSession();
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_TIMESTAMP_KEY);
  localStorage.removeItem(SESSION_HASH_KEY);
}
