const authToast = () => document.getElementById('authToast');

export function showToast(message, type = 'success') {
  const el = authToast();
  if (!el) return;
  el.textContent = message;
  el.className = `auth-toast ${type}`;
}

export function hideToast() {
  const el = authToast();
  if (!el) return;
  el.className = 'auth-toast hidden';
}
