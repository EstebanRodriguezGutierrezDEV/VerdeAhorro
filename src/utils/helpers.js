export function formatCurrency(amount) {
  return amount.toLocaleString('es-ES');
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function isValidUUID(id) {
  return id && typeof id === 'string' && !id.startsWith('user-');
}
