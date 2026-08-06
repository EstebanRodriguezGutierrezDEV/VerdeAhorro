export function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#96;'
  };
  return str.replace(/[&<>"'/`]/g, char => map[char]);
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  let clean = input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b\s)/gi, '')
    .replace(/(-{2}|\/\*|\*\/|;(?:\s|$))/g, '')
    .trim();

  return clean;
}

export function sanitizeNumber(value, { min = 0, max = 999999, fallback = 0 } = {}) {
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  if (email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

export function validatePassword(password) {
  const errors = [];

  if (typeof password !== 'string' || password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  if (password.length > 128) {
    errors.push('La contraseña no puede superar 128 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Debe contener al menos un carácter especial (!@#$%...)');
  }

  const commonPasswords = [
    'password', '12345678', 'qwerty123', 'admin123', 'letmein1',
    'welcome1', 'monkey123', 'dragon12', 'master12', 'abc12345'
  ];
  if (commonPasswords.includes(password?.toLowerCase())) {
    errors.push('Esta contraseña es demasiado común. Elige otra más segura');
  }

  return { valid: errors.length === 0, errors };
}

export function getSafeErrorMessage(error) {
  if (!error) return 'Ha ocurrido un error inesperado.';

  const errorStr = typeof error === 'string' ? error : (error.message || error.msg || '');
  const errorCode = error.code || error.error_code || '';

  const safeMessages = {
    'invalid_credentials': 'Email o contraseña incorrectos.',
    'email_not_confirmed': 'Debes confirmar tu email antes de iniciar sesión.',
    'user_already_exists': 'Ya existe una cuenta con este email.',
    'signup_disabled': 'El registro está temporalmente deshabilitado.',
    'email_provider_disabled': 'El registro por email no está disponible en este momento.',
    'over_request_rate_limit': 'Demasiados intentos. Espera un momento.',
    'weak_password': 'La contraseña no cumple los requisitos mínimos de seguridad.',
    '23505': 'Este registro ya existe.',
    '23503': 'Error de referencia en los datos.',
    '23502': 'Faltan datos obligatorios.',
    '42501': 'No tienes permisos para esta acción.',
    'PGRST301': 'Sesión expirada. Inicia sesión de nuevo.',
    'AuthRetryableFetchError': 'Error de conexión. Verifica tu internet.',
    'FetchError': 'No se pudo conectar con el servidor.',
  };

  if (safeMessages[errorCode]) return safeMessages[errorCode];

  for (const [key, msg] of Object.entries(safeMessages)) {
    if (errorStr.toLowerCase().includes(key.toLowerCase())) return msg;
  }

  const dangerousPatterns = [
    /column/i, /table/i, /relation/i, /constraint/i, /schema/i,
    /postgresql/i, /supabase/i, /pgrst/i, /violates/i, /fkey/i,
    /null value/i, /not-null/i, /duplicate key/i, /auth\.users/i,
    /profiles/i, /expenses/i, /INSERT/i, /UPDATE/i, /DELETE/i,
    /SELECT/i, /sql/i, /database/i, /row level security/i
  ];

  if (dangerousPatterns.some(p => p.test(errorStr))) {
    return 'No se pudo completar la operación. Inténtalo de nuevo.';
  }

  if (errorStr.length > 0 && errorStr.length < 100 && !dangerousPatterns.some(p => p.test(errorStr))) {
    return errorStr;
  }

  return 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}

export function protectForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.removeAttribute('action');
  form.setAttribute('method', 'POST');

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1 && node.tagName === 'INPUT' && node.type === 'hidden') {
          node.remove();
          console.warn('[Security] Intento de inyección de campo oculto bloqueado');
        }
      }
      if (mutation.type === 'attributes' && mutation.attributeName === 'action') {
        form.removeAttribute('action');
      }
    }
  });

  observer.observe(form, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['action', 'method']
  });
}

export function preventClickjacking() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return;
  }

  try {
    if (window.self !== window.top) {
      window.top.location = window.self.location;
    }
  } catch (e) {
    document.body.innerHTML = '';
  }
}

export function disableConsoleInProduction() {
  if (import.meta.env.PROD) {
    const noop = () => {};
    console.log = noop;
    console.warn = noop;
    console.info = noop;
    console.debug = noop;
    const originalError = console.error;
    console.error = (...args) => {
      originalError('[VerdeAhorro] Error interno detectado.');
    };
  }
}

export function initSecurity() {
  preventClickjacking();
  disableConsoleInProduction();

  protectForm('loginForm');
  protectForm('registerForm');
  protectForm('addExpenseForm');

  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => e.preventDefault());
}
