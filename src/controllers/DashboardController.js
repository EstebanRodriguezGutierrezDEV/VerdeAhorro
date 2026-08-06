import '../style.css';
import { logoutUser } from '../models/AuthModel.js';
import { fetchExpensesFromSupabase, saveExpenseToSupabase, deleteExpenseFromSupabase, getExpensesFromLocal, saveExpensesToLocal } from '../models/ExpenseModel.js';
import { getSecureSession, clearSession } from '../models/SessionModel.js';
import { saveUserModes, getUserModes, getUserInviteCode, saveLinkedPartner, getLinkedPartner, removeLinkedPartner } from '../models/UserModesModel.js';
import { sanitizeHTML, sanitizeInput, sanitizeNumber, initSecurity } from '../utils/security.js';
import { isValidUUID } from '../utils/helpers.js';
import { renderExpenseList, updateDashboardTotals, updateSituationModeUI, updateCoupleModeUI, updatePartnerLinkedUI, initSituationManager } from '../views/DashboardView.js';
import confetti from 'canvas-confetti';
import { createIcons, Wallet, Plus, Trash2, Copy, LogOut, Coins, PieChart, Target, Heart, Users, PlusCircle, Lightbulb, Tag, Layers, Briefcase, BadgePercent, AlertTriangle, CheckCircle2, Zap, Shield, PiggyBank, ShieldCheck } from 'lucide';
import Chart from 'chart.js/auto';

let currentExpenses = [];
let currentUser = null;
let isSituationModeActive = true;
let isCoupleModeActive = true;
let income = 2200;

export async function initDashboardPage() {
  initSecurity();
  
  const user = await getSecureSession();
  
  if (!user) {
    clearSession();
    window.location.href = '/index.html';
    return;
  }
  
  currentUser = user;
  
  const savedModes = getUserModes(user);
  if (savedModes) {
    if (typeof savedModes.isSituationModeActive === 'boolean') {
      isSituationModeActive = savedModes.isSituationModeActive;
    }
    if (typeof savedModes.isCoupleModeActive === 'boolean') {
      isCoupleModeActive = savedModes.isCoupleModeActive;
    }
  }

  const name = sanitizeHTML(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario');
  income = parseFloat(user.user_metadata?.monthly_income) || 2200;
  const goal = sanitizeHTML(user.user_metadata?.savings_goal_type || 'Fondo de Emergencia');

  const avatarEl = document.getElementById('dashUserAvatar');
  const nameEl = document.getElementById('dashUserName');
  const goalEl = document.getElementById('dashUserGoal');
  const incomeEl = document.getElementById('dashIncome');

  if (avatarEl) avatarEl.textContent = name.substring(0, 2).toUpperCase();
  if (nameEl) nameEl.textContent = name;
  if (goalEl) goalEl.textContent = `Meta: ${goal}`;
  if (incomeEl) incomeEl.textContent = `${income.toLocaleString('es-ES')} €`;

  if (isValidUUID(user?.id)) {
    const dbExpenses = await fetchExpensesFromSupabase(user.id);
    if (dbExpenses && dbExpenses.length > 0) {
      currentExpenses = dbExpenses.map(e => ({
        id: e.id,
        title: sanitizeHTML(e.title),
        amount: parseFloat(e.amount),
        category: e.notes || e.category || 'fixed',
        isShared: e.is_shared,
        date: e.expense_date || e.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
      }));
      saveExpensesToLocal(user.id, currentExpenses);
    } else {
      currentExpenses = getExpensesFromLocal(user.id);
    }
  } else {
    currentExpenses = getExpensesFromLocal(user?.id);
  }

  initSituationManager();
  updateSituationModeUI(isSituationModeActive);
  updateCoupleModeUI(isCoupleModeActive, true);

  const inviteCodeEl = document.getElementById('myInviteCode');
  if (inviteCodeEl) {
    inviteCodeEl.textContent = getUserInviteCode(user?.id);
  }

  const savedPartner = getLinkedPartner(user?.id);
  if (savedPartner) {
    updatePartnerLinkedUI(savedPartner);
  }

  updateDashboardTotals(currentExpenses, income);
  renderExpenseList(currentExpenses, income, currentUser, handleExpenseDeleted);
  
  initDashboardEvents();
  
  createIcons({
    icons: { Wallet, Plus, Trash2, Copy, LogOut, Coins, PieChart, Target, Heart, Users, PlusCircle, Lightbulb, Tag, Layers, Briefcase, BadgePercent, AlertTriangle, CheckCircle2, Zap, Shield, PiggyBank, ShieldCheck }
  });
}

function handleExpenseDeleted(deletedId) {
  currentExpenses = currentExpenses.filter(item => item.id !== deletedId);
  saveExpensesToLocal(currentUser?.id, currentExpenses);
  renderExpenseList(currentExpenses, income, currentUser, handleExpenseDeleted);
  updateDashboardTotals(currentExpenses, income);
}

function initDashboardEvents() {
  const dashSituationToggleBtn = document.getElementById('dashSituationToggleBtn');
  const modalSituationConfirm = document.getElementById('modalSituationConfirm');
  const btnConfirmSituationModal = document.getElementById('btnConfirmSituationModal');
  const btnCancelSituationModal = document.getElementById('btnCancelSituationModal');
  const modalSituationTitle = document.getElementById('modalSituationTitle');
  const modalSituationDescText = document.getElementById('modalSituationDescText');

  dashSituationToggleBtn?.addEventListener('click', () => {
    if (modalSituationTitle && modalSituationDescText) {
      if (isSituationModeActive) {
        modalSituationTitle.textContent = '¿Deseas desactivar el Modo Colchón?';
        modalSituationDescText.textContent = 'Al desactivarlo, se ocultará el panel de autonomía financiera y gestión de situación.';
        if (btnConfirmSituationModal) btnConfirmSituationModal.textContent = 'Desactivar Modo Colchón';
      } else {
        modalSituationTitle.textContent = '¿Deseas activar el Modo Colchón?';
        modalSituationDescText.textContent = 'Al activarlo, se mostrará el panel de autonomía financiera, recomendaciones adaptativas y la calculadora en tiempo real.';
        if (btnConfirmSituationModal) btnConfirmSituationModal.textContent = 'Activar Modo Colchón';
      }
    }
    modalSituationConfirm?.classList.add('open');
  });

  btnConfirmSituationModal?.addEventListener('click', () => {
    isSituationModeActive = !isSituationModeActive;
    updateSituationModeUI(isSituationModeActive);
    saveUserModes(currentUser?.id, { isSituationModeActive, isCoupleModeActive });
    modalSituationConfirm?.classList.remove('open');
    if (isSituationModeActive) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.2 } });
    }
  });

  btnCancelSituationModal?.addEventListener('click', () => {
    modalSituationConfirm?.classList.remove('open');
  });

  modalSituationConfirm?.addEventListener('click', (e) => {
    if (e.target === modalSituationConfirm) modalSituationConfirm.classList.remove('open');
  });

  const dashCoupleToggleBtn = document.getElementById('dashCoupleToggleBtn');
  const modalCoupleConfirm = document.getElementById('modalCoupleConfirm');
  const btnConfirmCoupleModal = document.getElementById('btnConfirmCoupleModal');
  const btnCancelCoupleModal = document.getElementById('btnCancelCoupleModal');
  const modalCoupleTitle = document.getElementById('modalCoupleTitle');
  const modalCoupleDescText = document.getElementById('modalCoupleDescText');

  dashCoupleToggleBtn?.addEventListener('click', () => {
    if (modalCoupleTitle && modalCoupleDescText) {
      if (isCoupleModeActive) {
        modalCoupleTitle.textContent = '¿Deseas desactivar el Modo Pareja?';
        modalCoupleDescText.textContent = 'Al desactivarlo, se ocultarán el código de invitación, la vinculación y los gastos compartidos.';
        if (btnConfirmCoupleModal) btnConfirmCoupleModal.textContent = 'Desactivar Modo Pareja';
      } else {
        modalCoupleTitle.textContent = '¿Deseas activar el Modo Pareja?';
        const userCode = getUserInviteCode(currentUser?.id);
        modalCoupleDescText.textContent = `Al activarlo, se mostrará tu código de invitación único (${userCode}), la vinculación 50/50 y los botones de gasto en pareja.`;
        if (btnConfirmCoupleModal) btnConfirmCoupleModal.textContent = 'Activar Modo Pareja 💑';
      }
    }
    modalCoupleConfirm?.classList.add('open');
  });

  btnConfirmCoupleModal?.addEventListener('click', () => {
    isCoupleModeActive = !isCoupleModeActive;
    updateCoupleModeUI(isCoupleModeActive, true);
    saveUserModes(currentUser?.id, { isSituationModeActive, isCoupleModeActive });
    modalCoupleConfirm?.classList.remove('open');
    if (isCoupleModeActive) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.2 } });
    }
  });

  btnCancelCoupleModal?.addEventListener('click', () => {
    modalCoupleConfirm?.classList.remove('open');
  });

  modalCoupleConfirm?.addEventListener('click', (e) => {
    if (e.target === modalCoupleConfirm) modalCoupleConfirm.classList.remove('open');
  });

  const btnOpenSituationConfig = document.getElementById('btnOpenSituationConfig');
  const modalSituationForm = document.getElementById('modalSituationForm');
  const btnCloseSituationFormModal = document.getElementById('btnCloseSituationFormModal');
  const formSituationConfig = document.getElementById('formSituationConfig');

  btnOpenSituationConfig?.addEventListener('click', () => {
    const inputCapital = document.getElementById('inputCapitalAvailable');
    const inputEssential = document.getElementById('inputEssentialExpenses');
    const cfgCapital = document.getElementById('cfgCapital');
    const cfgEssential = document.getElementById('cfgEssential');

    if (cfgCapital && inputCapital) cfgCapital.value = inputCapital.value;
    if (cfgEssential && inputEssential) cfgEssential.value = inputEssential.value;

    modalSituationForm?.classList.add('open');
  });

  btnCloseSituationFormModal?.addEventListener('click', () => {
    modalSituationForm?.classList.remove('open');
  });

  modalSituationForm?.addEventListener('click', (e) => {
    if (e.target === modalSituationForm) modalSituationForm.classList.remove('open');
  });

  formSituationConfig?.addEventListener('submit', (e) => {
    e.preventDefault();
    const cfgSituationType = document.getElementById('cfgSituationType')?.value;
    const cfgCapital = parseFloat(document.getElementById('cfgCapital')?.value) || 0;
    const cfgEssential = parseFloat(document.getElementById('cfgEssential')?.value) || 1;

    const inputCapital = document.getElementById('inputCapitalAvailable');
    const inputEssential = document.getElementById('inputEssentialExpenses');

    if (inputCapital) inputCapital.value = cfgCapital;
    if (inputEssential) inputEssential.value = cfgEssential;

    const targetSitBtn = document.querySelector(`.sit-btn[data-situation="${cfgSituationType}"]`);
    targetSitBtn?.click();

    modalSituationForm?.classList.remove('open');
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.3 } });
  });

  const btnQuickDeposit = document.getElementById('btnQuickDeposit');
  btnQuickDeposit?.addEventListener('click', async () => {
    const input = document.getElementById('quickDepositAmount');
    const amount = parseFloat(input?.value) || 50;
    if (amount <= 0) return;

    const newExpense = {
      id: Date.now().toString(),
      title: 'Aportación Meta Ahorro',
      amount: amount,
      category: 'savings',
      isShared: false,
      date: new Date().toISOString().split('T')[0]
    };

    if (isValidUUID(currentUser?.id)) {
      await saveExpenseToSupabase(currentUser.id, newExpense);
    }

    currentExpenses.unshift(newExpense);
    saveExpensesToLocal(currentUser?.id, currentExpenses);
    if (input) input.value = '';

    renderExpenseList(currentExpenses, income, currentUser, handleExpenseDeleted);
    updateDashboardTotals(currentExpenses, income);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.3 } });
  });

  const newAddForm = document.getElementById('addExpenseForm');
  newAddForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('expenseTitle');
    const amountInput = document.getElementById('expenseAmount');
    const catInput = document.getElementById('expenseCategory');

    if (!titleInput || !amountInput) return;

    const isShared = e.submitter ? e.submitter.getAttribute('data-shared') === 'true' : false;

    const newExpense = {
      id: Date.now().toString(),
      title: sanitizeInput(titleInput.value),
      amount: sanitizeNumber(amountInput.value, { min: 0.01, max: 99999 }),
      category: sanitizeInput(catInput?.value || 'fixed'),
      isShared: isShared,
      date: new Date().toISOString().split('T')[0]
    };

    if (isValidUUID(currentUser?.id)) {
      await saveExpenseToSupabase(currentUser.id, newExpense);
    }

    currentExpenses.unshift(newExpense);
    saveExpensesToLocal(currentUser?.id, currentExpenses);

    titleInput.value = '';
    amountInput.value = '';

    renderExpenseList(currentExpenses, income, currentUser, handleExpenseDeleted);
    updateDashboardTotals(currentExpenses, income);
  });

  const btnLogout = document.getElementById('btnLogout');
  btnLogout?.addEventListener('click', async () => {
    await logoutUser();
    localStorage.removeItem('verde_user');
    window.location.href = '/index.html';
  });

  const btnCopyCode = document.getElementById('btnCopyCode');
  btnCopyCode?.addEventListener('click', () => {
    const code = document.getElementById('myInviteCode')?.textContent || getUserInviteCode(currentUser?.id);
    navigator.clipboard.writeText(code);
    alert(`Código ${code} copiado al portapapeles. ¡Envíaselo a tu pareja!`);
  });

  const btnLinkPartner = document.getElementById('btnLinkPartner');
  btnLinkPartner?.addEventListener('click', () => {
    const partnerCode = document.getElementById('partnerCodeInput')?.value?.trim();
    if (!partnerCode) {
      alert('Introduce el código de tu pareja para vincular las cuentas.');
      return;
    }
    const partnerName = prompt('¿Cuál es el nombre de tu pareja?');
    if (!partnerName || !partnerName.trim()) {
      return;
    }
    const partnerData = { name: partnerName.trim(), code: partnerCode };
    saveLinkedPartner(currentUser?.id, partnerData);
    updatePartnerLinkedUI(partnerData);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
  });

  const btnUnlinkPartner = document.getElementById('btnUnlinkPartner');
  btnUnlinkPartner?.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres desvincular la cuenta de tu pareja?')) {
      removeLinkedPartner(currentUser?.id);
      updatePartnerLinkedUI(null);
      const inputCode = document.getElementById('partnerCodeInput');
      if (inputCode) inputCode.value = '';
    }
  });
}
