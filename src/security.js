/**
 * ============================================================
 *  VERDEAHORRO — MÓDULO DE SEGURIDAD (security.js)
 *  Capa de protección contra XSS, inyección, fuerza bruta,
 *  manipulación de sesión y exposición de datos internos.
 * ============================================================
 */

// ─── 1. SANITIZACIÓN DE ENTRADA (Anti-XSS) ───────────────────

/**
 * Escapa caracteres HTML peligrosos para prevenir XSS.
 * Cualquier dato del usuario que se renderice en el DOM DEBE pasar por aquí.
 */
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

/**
 * Limpia un string de entrada eliminando caracteres de control,
 * scripts embebidos y patrones de inyección SQL comunes.
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  let clean = input
    // Eliminar caracteres de control Unicode (excepto espacios normales)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Eliminar etiquetas HTML/script completas
    .replace(/<\/?[^>]+(>|$)/g, '')
    // Eliminar event handlers inline (onerror, onclick, etc.)
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Eliminar javascript: / data: en URIs
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    // Eliminar patrones de inyección SQL básicos
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b\s)/gi, '')
    .replace(/(-{2}|\/\*|\*\/|;(?:\s|$))/g, '')
    .trim();

  return clean;
}

/**
 * Valida y sanitiza un valor numérico.
 * Previene NaN, Infinity y valores fuera de rango.
 */
export function sanitizeNumber(value, { min = 0, max = 999999, fallback = 0 } = {}) {
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

// ─── 2. VALIDACIÓN DE EMAIL SEGURA ───────────────────────────

/**
 * Valida formato de email con regex robusto (RFC 5322 simplificado).
 * Previene emails malformados que podrían causar errores en backend.
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  if (email.length > 254) return false; // RFC 5321 max length
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

// ─── 3. POLÍTICA DE CONTRASEÑAS ──────────────────────────────

/**
 * Verifica la fortaleza de la contraseña.
 * Devuelve { valid: bool, errors: string[] }
 */
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

  // Detectar contraseñas comunes
  const commonPasswords = [
    'password', '12345678', 'qwerty123', 'admin123', 'letmein1',
    'welcome1', 'monkey123', 'dragon12', 'master12', 'abc12345'
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Esta contraseña es demasiado común. Elige otra más segura');
  }

  return { valid: errors.length === 0, errors };
}

// ─── 4. RATE LIMITER (Anti Fuerza Bruta) ─────────────────────

const rateLimitStore = new Map();

/**
 * Rate limiter en cliente para prevenir ataques de fuerza bruta.
 * @param {string} key - Identificador de la acción (ej: 'login', 'register')
 * @param {number} maxAttempts - Máximo de intentos permitidos
 * @param {number} windowMs - Ventana de tiempo en milisegundos
 * @returns {{ allowed: boolean, remainingMs: number, attempts: number }}
 */
export function checkRateLimit(key, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now, lockedUntil: 0 });
    return { allowed: true, remainingMs: 0, attempts: 1 };
  }

  // Si está bloqueado, verificar si el bloqueo ha expirado
  if (entry.lockedUntil > now) {
    return {
      allowed: false,
      remainingMs: entry.lockedUntil - now,
      attempts: entry.attempts
    };
  }

  // Si la ventana de tiempo ha expirado, reiniciar contador
  if (now - entry.firstAttempt > windowMs) {
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now, lockedUntil: 0 });
    return { allowed: true, remainingMs: 0, attempts: 1 };
  }

  entry.attempts++;

  if (entry.attempts > maxAttempts) {
    // Bloqueo progresivo: cada vez más largo
    const lockMultiplier = Math.min(entry.attempts - maxAttempts, 5);
    const lockDuration = windowMs * lockMultiplier;
    entry.lockedUntil = now + lockDuration;
    rateLimitStore.set(key, entry);

    return {
      allowed: false,
      remainingMs: lockDuration,
      attempts: entry.attempts
    };
  }

  rateLimitStore.set(key, entry);
  return { allowed: true, remainingMs: 0, attempts: entry.attempts };
}

/**
 * Resetea el rate limiter para una clave específica (tras login exitoso).
 */
export function resetRateLimit(key) {
  rateLimitStore.delete(key);
}

// ─── 5. PROTECCIÓN DE SESIÓN ─────────────────────────────────

const SESSION_KEY = 'verde_user';
const SESSION_TIMESTAMP_KEY = 'verde_session_ts';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Guarda la sesión del usuario de forma segura.
 * Solo almacena datos mínimos necesarios (nunca contraseñas ni tokens sensibles).
 */
export function saveSecureSession(user) {
  if (!user) return;

  // Solo guardar datos mínimos y no sensibles
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
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
  } catch (e) {
    // localStorage puede estar lleno o bloqueado
  }
}

/**
 * Recupera la sesión validando integridad y expiración.
 * Devuelve null si la sesión es inválida o ha expirado.
 */
/**
 * Recupera la sesión validando integridad y expiración.
 * Devuelve null si la sesión es inválida o ha expirado.
 */
export function getSecureSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    let timestamp = parseInt(localStorage.getItem(SESSION_TIMESTAMP_KEY) || '0', 10);

    if (!raw) return null;

    // Si no hay timestamp previo (sesión existente), asignarlo ahora
    if (!timestamp) {
      timestamp = Date.now();
      localStorage.setItem(SESSION_TIMESTAMP_KEY, timestamp.toString());
    }

    // Verificar expiración (24h)
    if (Date.now() - timestamp > SESSION_MAX_AGE_MS) {
      clearSession();
      return null;
    }

    const user = JSON.parse(raw);

    // Validar estructura mínima
    if (!user || typeof user !== 'object' || !user.email) {
      clearSession();
      return null;
    }

    // Re-sanitizar datos leídos de localStorage (podrían haber sido manipulados)
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

/**
 * Limpia completamente la sesión del usuario.
 */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_TIMESTAMP_KEY);
}

// ─── 6. OFUSCACIÓN DE ERRORES ────────────────────────────────

/**
 * Transforma errores internos del backend en mensajes seguros para el usuario.
 * NUNCA expone nombres de tablas, columnas, claves o detalles del servidor.
 */
export function getSafeErrorMessage(error) {
  if (!error) return 'Ha ocurrido un error inesperado.';

  const errorStr = typeof error === 'string' ? error : (error.message || error.msg || '');
  const errorCode = error.code || error.error_code || '';

  // Mapeo de errores internos a mensajes seguros
  const safeMessages = {
    // Auth errors
    'invalid_credentials': 'Email o contraseña incorrectos.',
    'email_not_confirmed': 'Debes confirmar tu email antes de iniciar sesión.',
    'user_already_exists': 'Ya existe una cuenta con este email.',
    'signup_disabled': 'El registro está temporalmente deshabilitado.',
    'email_provider_disabled': 'El registro por email no está disponible en este momento.',
    'over_request_rate_limit': 'Demasiados intentos. Espera un momento.',
    'weak_password': 'La contraseña no cumple los requisitos mínimos de seguridad.',

    // DB errors
    '23505': 'Este registro ya existe.',
    '23503': 'Error de referencia en los datos.',
    '23502': 'Faltan datos obligatorios.',
    '42501': 'No tienes permisos para esta acción.',
    'PGRST301': 'Sesión expirada. Inicia sesión de nuevo.',

    // Network
    'AuthRetryableFetchError': 'Error de conexión. Verifica tu internet.',
    'FetchError': 'No se pudo conectar con el servidor.',
  };

  // Buscar por código primero, luego por mensaje parcial
  if (safeMessages[errorCode]) return safeMessages[errorCode];

  for (const [key, msg] of Object.entries(safeMessages)) {
    if (errorStr.toLowerCase().includes(key.toLowerCase())) return msg;
  }

  // Detectar patrones que NUNCA deben mostrarse al usuario
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

  // Si el mensaje parece seguro y corto, mostrarlo
  if (errorStr.length > 0 && errorStr.length < 100 && !dangerousPatterns.some(p => p.test(errorStr))) {
    return errorStr;
  }

  return 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}

// ─── 7. PROTECCIÓN CONTRA MANIPULACIÓN DEL DOM ───────────────

/**
 * Observa y bloquea intentos de inyección en formularios críticos.
 * Impide que se añadan inputs hidden o se modifiquen actions.
 */
export function protectForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  // Bloquear atributo action (nunca debería tener uno)
  form.removeAttribute('action');
  form.setAttribute('method', 'POST'); // Previene envío GET con params en URL

  // Observer para detectar modificaciones maliciosas
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Detectar inputs hidden añadidos dinámicamente
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1 && node.tagName === 'INPUT' && node.type === 'hidden') {
          node.remove();
          console.warn('[Security] Intento de inyección de campo oculto bloqueado');
        }
      }
      // Detectar cambio de action
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

// ─── 8. ANTI-CLICKJACKING ────────────────────────────────────

/**
 * Detecta si la página está cargada dentro de un iframe externo (clickjacking).
 * Ignora el entorno de desarrollo local para permitir previews e iFrames de desarrollo.
 */
export function preventClickjacking() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return; // Permitir iFrames en entorno de desarrollo local
  }

  try {
    if (window.self !== window.top) {
      window.top.location = window.self.location;
    }
  } catch (e) {
    document.body.innerHTML = '';
  }
}

// ─── 9. DESACTIVAR CONSOLA EN PRODUCCIÓN ─────────────────────

/**
 * En producción, silencia console.log/warn/error para no exponer
 * información interna a atacantes que abran DevTools.
 */
export function disableConsoleInProduction() {
  if (import.meta.env.PROD) {
    const noop = () => {};
    console.log = noop;
    console.warn = noop;
    console.info = noop;
    console.debug = noop;
    // console.error se mantiene para errores críticos pero sin detalles
    const originalError = console.error;
    console.error = (...args) => {
      originalError('[VerdeAhorro] Error interno detectado.');
    };
  }
}

// ─── 10. INICIALIZACIÓN DE SEGURIDAD ─────────────────────────

/**
 * Ejecuta todas las protecciones de seguridad al cargar la página.
 */
export function initSecurity() {
  preventClickjacking();
  disableConsoleInProduction();

  // Proteger formularios
  protectForm('loginForm');
  protectForm('registerForm');
  protectForm('addExpenseForm');

  // Prevenir drag & drop de archivos en toda la página (vector de ataque)
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => e.preventDefault());
}
