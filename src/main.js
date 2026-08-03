import './style.css';
import { loginUser, registerUser } from './api';
import { renderDashboard } from './dashboard';
import { 
  createIcons, 
  Wallet, 
  LogIn, 
  Menu, 
  ShieldCheck, 
  ArrowRight, 
  PlayCircle, 
  Zap, 
  TrendingUp, 
  PiggyBank, 
  Sparkles, 
  PieChart, 
  Layers, 
  BellRing, 
  Repeat, 
  Target, 
  Calculator, 
  Lightbulb, 
  Shield, 
  CheckCircle2, 
  Lock, 
  ChevronDown, 
  Mail, 
  User, 
  Eye,
  Coins,
  Users,
  Heart,
  Link,
  Sliders
} from 'lucide';
import confetti from 'canvas-confetti';
import { initSecurity, sanitizeHTML, checkRateLimit, resetRateLimit, getSafeErrorMessage, isValidEmail, validatePassword, saveSecureSession } from './security';

// 1. Initialize Lucide Icons
function initIcons() {
  createIcons({
    icons: {
      Wallet,
      LogIn,
      Menu,
      ShieldCheck,
      ArrowRight,
      PlayCircle,
      Zap,
      TrendingUp,
      PiggyBank,
      Sparkles,
      PieChart,
      Layers,
      BellRing,
      Repeat,
      Target,
      Calculator,
      Lightbulb,
      Shield,
      CheckCircle2,
      Lock,
      ChevronDown,
      Mail,
      User,
      Eye,
      Coins,
      Users,
      Heart,
      Link,
      Sliders
    }
  });
}

// 2. Interactive Expense Simulator (50/30/20 Rule)
function initExpenseSimulator() {
  const incomeInput = document.getElementById('simIncomeInput');
  const simIncomeVal = document.getElementById('simIncomeVal');
  const simSavingsVal = document.getElementById('simSavingsVal');
  const simFixedVal = document.getElementById('simFixedVal');
  const simFlexVal = document.getElementById('simFlexVal');

  if (!incomeInput) return;

  function updateSim() {
    const income = parseFloat(incomeInput.value) || 2200;
    const savings = income * 0.20;
    const fixed = income * 0.50;
    const flex = income * 0.30;

    simIncomeVal.textContent = `${income.toLocaleString('es-ES')} €`;
    simSavingsVal.textContent = `${savings.toLocaleString('es-ES', { maximumFractionDigits: 0 })} € / mes`;
    simFixedVal.textContent = `${fixed.toLocaleString('es-ES', { maximumFractionDigits: 0 })} € / mes`;
    simFlexVal.textContent = `${flex.toLocaleString('es-ES', { maximumFractionDigits: 0 })} € / mes`;
  }

  incomeInput.addEventListener('input', updateSim);
  updateSim();
}

// 3. Interactive Projections Calculator
function initProjectionsCalculator() {
  const monthlyInput = document.getElementById('monthlySavings');
  const yearsInput = document.getElementById('yearsRange');

  const monthlyVal = document.getElementById('monthlySavingsVal');
  const yearsVal = document.getElementById('yearsVal');
  const outYears = document.getElementById('outYears');
  const projectedTotal = document.getElementById('projectedTotal');
  const outCapital = document.getElementById('outCapital');
  const outYield = document.getElementById('outYield');
  const calcCtaBtn = document.getElementById('calcCtaBtn');

  if (!monthlyInput || !yearsInput) return;

  function calculateProjections() {
    const monthly = parseFloat(monthlyInput.value) || 250;
    const years = parseInt(yearsInput.value) || 5;

    monthlyVal.textContent = `${monthly.toLocaleString('es-ES')} €`;
    yearsVal.textContent = `${years} ${years === 1 ? 'Año' : 'Años'}`;
    if (outYears) outYears.textContent = years;

    const totalMonths = years * 12;
    const capital = monthly * totalMonths;
    
    // Annual compound interest rate of 4.5% (typical high-yield savings)
    const annualRate = 0.045;
    const monthlyRate = annualRate / 12;
    
    // Future Value formula for monthly contributions
    let totalAccumulated = 0;
    for (let i = 0; i < totalMonths; i++) {
      totalAccumulated = (totalAccumulated + monthly) * (1 + monthlyRate);
    }

    const yieldAmount = Math.max(0, totalAccumulated - capital);

    projectedTotal.textContent = `${Math.round(totalAccumulated).toLocaleString('es-ES')} €`;
    outCapital.textContent = `${Math.round(capital).toLocaleString('es-ES')} €`;
    outYield.textContent = `+${Math.round(yieldAmount).toLocaleString('es-ES')} €`;
  }

  monthlyInput.addEventListener('input', calculateProjections);
  yearsInput.addEventListener('input', calculateProjections);
  
  if (calcCtaBtn) {
    calcCtaBtn.addEventListener('click', () => {
      openAuthModal('register');
    });
  }

  calculateProjections();
}

// 4. Accordion FAQ
function initAccordion() {
  const items = document.querySelectorAll('.accordion-item');
  items.forEach(item => {
    const header = item.querySelector('.accordion-header');
    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      items.forEach(i => {
        i.classList.remove('active');
        const content = i.querySelector('.accordion-content');
        if (content) content.style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        const content = item.querySelector('.accordion-content');
        if (content) content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });
}

// 5. Auth Modal (Login / Register Tabs & Toggle)
const authModal = document.getElementById('authModal');
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authToast = document.getElementById('authToast');

function openAuthModal(tab = 'login') {
  if (!authModal) return;
  authModal.classList.add('open');
  switchTab(tab);
}

function closeAuthModal() {
  if (!authModal) return;
  authModal.classList.remove('open');
  hideToast();
}

function switchTab(tab) {
  hideToast();
  if (tab === 'login') {
    tabLoginBtn?.classList.add('active');
    tabRegisterBtn?.classList.remove('active');
    loginForm?.classList.remove('hidden');
    registerForm?.classList.add('hidden');
  } else {
    tabRegisterBtn?.classList.add('active');
    tabLoginBtn?.classList.remove('active');
    registerForm?.classList.remove('hidden');
    loginForm?.classList.add('hidden');
  }
}

function showToast(message, type = 'success') {
  if (!authToast) return;
  authToast.textContent = message;
  authToast.className = `auth-toast ${type}`;
}

function hideToast() {
  if (!authToast) return;
  authToast.className = 'auth-toast hidden';
}

function initAuthEvents() {
  const btnOpenLogin = document.getElementById('btnOpenLogin');
  const btnOpenRegister = document.getElementById('btnOpenRegister');
  const heroBtnRegister = document.getElementById('heroBtnRegister');
  const footerCtaRegister = document.getElementById('footerCtaRegister');
  const btnCloseAuthModal = document.getElementById('btnCloseAuthModal');

  btnOpenLogin?.addEventListener('click', () => openAuthModal('login'));
  btnOpenRegister?.addEventListener('click', () => openAuthModal('register'));
  heroBtnRegister?.addEventListener('click', () => openAuthModal('register'));
  footerCtaRegister?.addEventListener('click', () => openAuthModal('register'));
  btnCloseAuthModal?.addEventListener('click', closeAuthModal);

  tabLoginBtn?.addEventListener('click', () => switchTab('login'));
  tabRegisterBtn?.addEventListener('click', () => switchTab('register'));

  // Close modal when clicking on backdrop
  authModal?.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
  });

  // Handle password view toggle
  const togglePassBtns = document.querySelectorAll('.toggle-pass');
  togglePassBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const input = btn.previousElementSibling;
      if (input && input.tagName === 'INPUT') {
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
      }
    });
  });

  // Live Income Preview Calculation
  const regIncomeInput = document.getElementById('regIncome');
  const regIncomePreview = document.getElementById('regIncomePreview');

  regIncomeInput?.addEventListener('input', () => {
    const val = parseFloat(regIncomeInput.value) || 0;
    const savings = Math.round(val * 0.20);
    if (regIncomePreview) {
      regIncomePreview.textContent = `Meta 20%: ${savings.toLocaleString('es-ES')}€/mes`;
    }
  });

  // Login Submission (con protección anti fuerza bruta)
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

    // Rate limiting: máximo 5 intentos por minuto
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
      saveSecureSession(result.user);
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

  // Register Submission (con validación y rate limiting)
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

    // Rate limiting: máximo 3 registros por minuto
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
      saveSecureSession(result.user);
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

// 6. Mobile Navbar Toggle
function initMobileMenu() {
  const toggle = document.getElementById('mobileToggle');
  const menu = document.getElementById('navMenu');
  
  toggle?.addEventListener('click', () => {
    menu?.classList.toggle('active');
  });

  // Close menu when clicking a link
  menu?.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('active');
    });
  });
}

// 7. Interactive Couple Split Simulator Widget
function initCoupleSplitWidget() {
  const btn5050 = document.getElementById('btnSplit5050');
  const btnProp = document.getElementById('btnSplitProp');

  const userSplitAmount = document.getElementById('userSplitAmount');
  const userSplitPct = document.getElementById('userSplitPct');
  const partnerSplitAmount = document.getElementById('partnerSplitAmount');
  const partnerSplitPct = document.getElementById('partnerSplitPct');
  const splitNoteText = document.getElementById('splitNoteText');

  if (!btn5050 || !btnProp) return;

  btn5050.addEventListener('click', () => {
    btn5050.classList.add('active');
    btnProp.classList.remove('active');

    if (userSplitAmount) userSplitAmount.textContent = '600 €';
    if (userSplitPct) userSplitPct.textContent = '(50% del total)';
    if (partnerSplitAmount) partnerSplitAmount.textContent = '600 €';
    if (partnerSplitPct) partnerSplitPct.textContent = '(50% del total)';
    if (splitNoteText) splitNoteText.textContent = 'Dividido equitativamente 50/50. Ideal para cuentas de hogar compartidas.';
  });

  btnProp.addEventListener('click', () => {
    btnProp.classList.add('active');
    btn5050.classList.remove('active');

    if (userSplitAmount) userSplitAmount.textContent = '720 €';
    if (userSplitPct) userSplitPct.textContent = '(60% proporcional a tu sueldo)';
    if (partnerSplitAmount) partnerSplitAmount.textContent = '480 €';
    if (partnerSplitPct) partnerSplitPct.textContent = '(40% proporcional al sueldo)';
    if (splitNoteText) splitNoteText.textContent = 'Reparto justo según ingresos: Tú aportas el 60% al ser mayor tu ingreso.';
  });
}

// Initialize everything on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initSecurity();
  initIcons();
  initExpenseSimulator();
  initProjectionsCalculator();
  initAccordion();
  initAuthEvents();
  initMobileMenu();
  initCoupleSplitWidget();
});
