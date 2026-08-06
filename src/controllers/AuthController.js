import { registerUser, loginUser } from '../models/AuthModel.js';
import { saveSecureSession } from '../models/SessionModel.js';
import { sanitizeHTML, isValidEmail, validatePassword, getSafeErrorMessage } from '../utils/security.js';
import { checkRateLimit, resetRateLimit } from '../utils/rateLimiter.js';
import { showToast } from '../views/ToastView.js';
import confetti from 'canvas-confetti';

export function initAuthController() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
      showToast('Completa todos los campos.', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showToast('El formato del email no es válido.', 'error');
      return;
    }

    const rateCheck = checkRateLimit('login', 5, 60000);
    if (!rateCheck.allowed) {
      const secsLeft = Math.ceil(rateCheck.remainingMs / 1000);
      showToast(`Demasiados intentos. Espera ${secsLeft}s antes de reintentar.`, 'error');
      return;
    }

    showToast('Conectando con tu cuenta...', 'success');
    const result = await loginUser({ email, password });

    if (result.success) {
      resetRateLimit('login');
      showToast(`¡Bienvenido de nuevo! Redirigiendo...`, 'success');
      await saveSecureSession(result.user);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1200);
    } else {
      showToast(getSafeErrorMessage(result.error), 'error');
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName')?.value?.trim() || 'Usuario';
    const email = document.getElementById('regEmail')?.value?.trim();
    const password = document.getElementById('regPassword')?.value;
    const income = document.getElementById('regIncome')?.value || '2000';
    const goal = document.getElementById('regGoal')?.value || 'Fondo de Emergencia';

    if (!email || !password) {
      showToast('Completa todos los campos obligatorios.', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showToast('El formato del email no es válido.', 'error');
      return;
    }

    const passCheck = validatePassword(password);
    if (!passCheck.valid) {
      showToast(passCheck.errors[0], 'error');
      return;
    }

    const rateCheck = checkRateLimit('register', 3, 60000);
    if (!rateCheck.allowed) {
      const secsLeft = Math.ceil(rateCheck.remainingMs / 1000);
      showToast(`Demasiados intentos de registro. Espera ${secsLeft}s.`, 'error');
      return;
    }

    showToast('Creando tu cuenta de forma segura...', 'success');

    const result = await registerUser({ name, email, password, income, goal });

    if (result.success) {
      resetRateLimit('register');
      showToast(`¡Cuenta creada para ${sanitizeHTML(name)}! Redirigiendo...`, 'success');
      await saveSecureSession(result.user);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#059669', '#10B981', '#A7F3D0', '#FFFFFF']
      });
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1400);
    } else {
      showToast(getSafeErrorMessage(result.error), 'error');
    }
  });
}
