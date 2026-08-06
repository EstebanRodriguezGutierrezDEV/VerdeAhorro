import { hideToast } from './ToastView.js';

const getAuthModal = () => document.getElementById('authModal');
const getTabLoginBtn = () => document.getElementById('tabLoginBtn');
const getTabRegisterBtn = () => document.getElementById('tabRegisterBtn');
const getLoginForm = () => document.getElementById('loginForm');
const getRegisterForm = () => document.getElementById('registerForm');

export function openAuthModal(tab = 'login') {
  const authModal = getAuthModal();
  if (!authModal) return;
  authModal.classList.add('open');
  switchTab(tab);
}

export function closeAuthModal() {
  const authModal = getAuthModal();
  if (!authModal) return;
  authModal.classList.remove('open');
  hideToast();
}

export function switchTab(tab) {
  hideToast();
  const tabLoginBtn = getTabLoginBtn();
  const tabRegisterBtn = getTabRegisterBtn();
  const loginForm = getLoginForm();
  const registerForm = getRegisterForm();
  
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

export function initAuthModalView() {
  const btnOpenLogin = document.getElementById('btnOpenLogin');
  const btnOpenRegister = document.getElementById('btnOpenRegister');
  const heroBtnRegister = document.getElementById('heroBtnRegister');
  const footerCtaRegister = document.getElementById('footerCtaRegister');
  const btnCloseAuthModal = document.getElementById('btnCloseAuthModal');
  const authModal = getAuthModal();
  const tabLoginBtn = getTabLoginBtn();
  const tabRegisterBtn = getTabRegisterBtn();

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
}
