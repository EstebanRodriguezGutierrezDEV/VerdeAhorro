import './style.css';
import { logoutUser, fetchExpensesFromSupabase, saveExpenseToSupabase, deleteExpenseFromSupabase, saveUserModesToSupabase } from './api';
import confetti from 'canvas-confetti';
import { createIcons, Wallet, Plus, Trash2, Copy, LogOut, Coins, PieChart, Target, Heart, Users, PlusCircle, Lightbulb, Tag, Layers, Briefcase, BadgePercent, AlertTriangle, CheckCircle2, Zap, Shield, PiggyBank, ShieldCheck } from 'lucide';
import { sanitizeHTML, sanitizeInput, sanitizeNumber, getSecureSession, clearSession, initSecurity } from './security';
import Chart from 'chart.js/auto';

let currentExpenses = [];

let currentUser = null;

function saveExpensesToLocal(userId, expenses) {
  const key = `verde_expenses_${userId || 'default'}`;
  try {
    localStorage.setItem(key, JSON.stringify(expenses));
  } catch (e) {}
}

function getExpensesFromLocal(userId) {
  const key = `verde_expenses_${userId || 'default'}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveUserModes(userId, modes) {
  const key = `verde_user_modes_${userId || 'default'}`;
  try {
    localStorage.setItem(key, JSON.stringify(modes));
  } catch (e) {}

  const isValidUUID = userId && !userId.startsWith('user-');
  if (isValidUUID) {
    saveUserModesToSupabase(modes);
  }
}

function getUserModes(user) {
  if (user?.user_metadata?.active_modes) {
    return user.user_metadata.active_modes;
  }
  const key = `verde_user_modes_${user?.id || 'default'}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'VA-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getUserInviteCode(userId) {
  const key = `verde_invite_code_${userId || 'default'}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return saved;
    const newCode = generateInviteCode();
    localStorage.setItem(key, newCode);
    return newCode;
  } catch (e) {
    return generateInviteCode();
  }
}

function saveLinkedPartner(userId, partnerData) {
  const key = `verde_linked_partner_${userId || 'default'}`;
  try {
    localStorage.setItem(key, JSON.stringify(partnerData));
  } catch (e) {}
}

function getLinkedPartner(userId) {
  const key = `verde_linked_partner_${userId || 'default'}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function removeLinkedPartner(userId) {
  const key = `verde_linked_partner_${userId || 'default'}`;
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}

function updatePartnerLinkedUI(partnerData) {
  const statusEl = document.getElementById('partnerLinkedStatus');
  const linkForm = document.getElementById('partnerLinkForm');
  const inviteCodeBox = document.getElementById('inviteCodeBox');
  const coupleCardDesc = document.getElementById('coupleCardDesc');
  const avatarEl = document.getElementById('partnerLinkedAvatar');
  const nameEl = document.getElementById('partnerLinkedName');

  if (partnerData && partnerData.name) {
    const name = partnerData.name;
    if (avatarEl) avatarEl.textContent = name.substring(0, 2).toUpperCase();
    if (nameEl) nameEl.textContent = name;
    statusEl?.classList.remove('hidden');
    linkForm?.classList.add('hidden');
    inviteCodeBox?.classList.add('hidden');
    coupleCardDesc?.classList.add('hidden');
    createIcons({
      icons: { CheckCircle2, Trash2 }
    });
  } else {
    statusEl?.classList.add('hidden');
    linkForm?.classList.remove('hidden');
    inviteCodeBox?.classList.remove('hidden');
    coupleCardDesc?.classList.remove('hidden');
  }
}

export async function renderDashboard(user) {
  currentUser = user;

  // Cargar preferencias de modos del usuario (Modo Colchón y Modo Pareja)
  const savedModes = getUserModes(user);
  if (savedModes) {
    if (typeof savedModes.isSituationModeActive === 'boolean') {
      isSituationModeActive = savedModes.isSituationModeActive;
    }
    if (typeof savedModes.isCoupleModeActive === 'boolean') {
      isCoupleModeActive = savedModes.isCoupleModeActive;
    }
  }

  // Fill User Profile info
  const name = sanitizeHTML(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario');
  const income = parseFloat(user.user_metadata?.monthly_income) || 2200;
  const goal = sanitizeHTML(user.user_metadata?.savings_goal_type || 'Fondo de Emergencia');

  const avatarEl = document.getElementById('dashUserAvatar');
  const nameEl = document.getElementById('dashUserName');
  const goalEl = document.getElementById('dashUserGoal');
  const incomeEl = document.getElementById('dashIncome');

  if (avatarEl) avatarEl.textContent = name.substring(0, 2).toUpperCase();
  if (nameEl) nameEl.textContent = name;
  if (goalEl) goalEl.textContent = `Meta: ${goal}`;
  if (incomeEl) incomeEl.textContent = `${income.toLocaleString('es-ES')} €`;

  // Cargar gastos de Supabase DB o del almacenamiento local como respaldo permanente
  const isValidUUID = user?.id && !user.id.startsWith('user-');
  if (isValidUUID) {
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

  // Init event listeners & icons
  initDashboardEvents(income, goal);
  initSituationManager();
  updateSituationModeUI();
  updateCoupleModeUI();
  // Set unique invite code for this user
  const inviteCodeEl = document.getElementById('myInviteCode');
  if (inviteCodeEl) {
    inviteCodeEl.textContent = getUserInviteCode(user?.id);
  }
  // Load linked partner status
  const savedPartner = getLinkedPartner(user?.id);
  if (savedPartner) {
    updatePartnerLinkedUI(savedPartner);
  }
  updateDashboardTotals(income);
  renderExpenseList(income);
  
  createIcons({
    icons: { Wallet, Plus, Trash2, Copy, LogOut, Coins, PieChart, Target, Heart, Users, PlusCircle, Lightbulb, Tag, Layers, Briefcase, BadgePercent, AlertTriangle, CheckCircle2, Zap, Shield, PiggyBank, ShieldCheck }
  });
}

function initSituationManager() {
  const container = document.getElementById('situationSelector');
  const inputCapital = document.getElementById('inputCapitalAvailable');
  const inputEssential = document.getElementById('inputEssentialExpenses');
  const monthsVal = document.getElementById('runwayMonthsVal');
  const runwayFill = document.getElementById('runwayFill');
  const tipsBoxTitle = document.getElementById('tipsBoxTitle');
  const tipsList = document.getElementById('survivalTipsList');
  const badgeText = document.getElementById('situationBadgeText');

  if (!container || !monthsVal) return;

  function updateRunway() {
    const capital = parseFloat(inputCapital?.value) || 0;
    const essential = parseFloat(inputEssential?.value) || 1;
    const months = (capital / Math.max(1, essential)).toFixed(1);
    
    monthsVal.textContent = months;
    if (runwayFill) {
      const pct = Math.min(100, Math.max(5, (parseFloat(months) / 12) * 100));
      runwayFill.style.width = `${pct}%`;
      runwayFill.style.background = parseFloat(months) < 3 
        ? 'linear-gradient(90deg, #EF4444 0%, #F59E0B 100%)' 
        : 'linear-gradient(90deg, #10B981 0%, #34D399 100%)';
    }
  }

  inputCapital?.addEventListener('input', updateRunway);
  inputEssential?.addEventListener('input', updateRunway);
  updateRunway();

  const strategies = {
    'employed': {
      badge: 'Modo Empleado (Estable)',
      title: 'Estrategia Recomendada: Regla 50/30/20',
      tips: [
        'Asigna el 50% a gastos fijos indispensables (vivienda, comida, luz).',
        'Automatiza el 20% de ahorro directo el primer día del mes.',
        'Mantén un 30% controlado para ocio y flexibilidad personal.'
      ]
    },
    'unemployed-subsidy': {
      badge: 'Modo Paro con Subsidio',
      title: 'Estrategia Recomendada: Austeridad Inteligente (70/10/20)',
      tips: [
        'Asigna el 70% del subsidio a vivienda y suministros básicos.',
        'Reduce el ocio temporalmente al 10% para estirar la prestación.',
        'Guarda el 20% en tu Fondo de Transición mientras buscas empleo.'
      ]
    },
    'no-income': {
      badge: 'Modo Supervivencia Extrema',
      title: 'Estrategia Recomendada: Plan de Emergencia (Sin Ingresos)',
      tips: [
        'Congela o cancela 100% de suscripciones y ocio secundario.',
        'Renegocia facturas de suministros y consulta prestaciones sociales.',
        'Guarda cada euro ahorrado exclusivamente para alquiler y alimentación.'
      ]
    }
  };

  container.querySelectorAll('.sit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.sit-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const sitKey = btn.getAttribute('data-situation');
      const strat = strategies[sitKey];

      if (strat) {
        if (badgeText) badgeText.textContent = strat.badge;
        if (tipsBoxTitle) tipsBoxTitle.textContent = strat.title;
        if (tipsList) {
          tipsList.innerHTML = strat.tips.map(tip => `
            <li><i data-lucide="check-circle2"></i> ${tip}</li>
          `).join('');
          createIcons({ icons: { CheckCircle2 } });
        }
      }
    });
  });
}

function updateDashboardTotals(income) {
  const actualExpenses = currentExpenses.filter(e => e.category !== 'savings');
  const totalSpent = actualExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const sharedExpenses = actualExpenses.filter(e => e.isShared).reduce((acc, curr) => acc + curr.amount, 0);

  const savingsAdded = currentExpenses.filter(e => e.category === 'savings').reduce((acc, curr) => acc + curr.amount, 0);
  const targetGoal = 3000;
  const currentSavings = Math.min(targetGoal, savingsAdded);
  const savingsPct = Math.min(100, Math.round((currentSavings / targetGoal) * 100));

  const spentTotalEl = document.getElementById('dashSpentTotal');
  const spentLimitEl = document.getElementById('dashSpentLimit');
  const coupleShareEl = document.getElementById('dashCoupleShare');

  const goalAmountEl = document.getElementById('dashGoalAmount');
  const goalProgressEl = document.getElementById('dashGoalProgress');
  const goalPctEl = document.getElementById('dashGoalPct');

  if (spentTotalEl) spentTotalEl.textContent = `${totalSpent.toLocaleString('es-ES')} €`;
  if (goalAmountEl) goalAmountEl.textContent = `${currentSavings.toLocaleString('es-ES')} € / ${targetGoal.toLocaleString('es-ES')} €`;
  if (goalProgressEl) goalProgressEl.style.width = `${savingsPct}%`;
  if (goalPctEl) goalPctEl.textContent = `${savingsPct}% Completado 🎯`;
  
  const availableMargin = Math.max(0, (income * 0.80) - totalSpent);
  
  if (spentLimitEl) spentLimitEl.textContent = `Disponible para gastar: ${availableMargin.toLocaleString('es-ES')} €`;
  if (coupleShareEl) coupleShareEl.textContent = `${(sharedExpenses / 2).toLocaleString('es-ES')} € (Tu 50%)`;

  // Update 50/30/20 Stacked Bar Labels
  const distSubtitle = document.getElementById('distSubtitle');
  const labelFixed = document.getElementById('labelFixed');
  const labelFlex = document.getElementById('labelFlex');
  const labelSavings = document.getElementById('labelSavings');

  const val50 = Math.round(income * 0.50);
  const val30 = Math.round(income * 0.30);
  const val20 = Math.round(income * 0.20);

  if (distSubtitle) distSubtitle.textContent = `Calculado en base a tus ${income.toLocaleString('es-ES')} €/mes`;
  if (labelFixed) labelFixed.textContent = `50% Fijos (${val50.toLocaleString('es-ES')}€)`;
  if (labelFlex) labelFlex.textContent = `30% Ocio (${val30.toLocaleString('es-ES')}€)`;
  if (labelSavings) labelSavings.textContent = `20% Ahorro (${val20.toLocaleString('es-ES')}€)`;

  // Update Savings Status Banner elements
  const dashSavingsRate = document.getElementById('dashSavingsRate');
  const dashFreeCapacity = document.getElementById('dashFreeCapacity');
  const dashRunwayText = document.getElementById('dashRunwayText');

  if (dashSavingsRate) dashSavingsRate.textContent = `${Math.round((val20 / income) * 100)}% / mes`;
  if (dashFreeCapacity) dashFreeCapacity.textContent = `${val20.toLocaleString('es-ES')} €/mes`;
  if (dashRunwayText) {
    const monthlyFixed = currentExpenses.filter(e => e.category === 'fixed').reduce((a, b) => a + b.amount, 0) || val50;
    const runway = (currentSavings / Math.max(1, monthlyFixed)).toFixed(1);
    dashRunwayText.innerHTML = `Con tus gastos fijos actuales, tienes un colchón estimado de <strong>${runway} meses de tranquilidad financiera</strong>.`;
  }

  // Update Reto del Preahorro Card
  const preSavingBadge = document.getElementById('preSavingBadge');
  const preSavingPctText = document.getElementById('preSavingPctText');
  const preSavingBarFill = document.getElementById('preSavingBarFill');
  const preSavingRemainingText = document.getElementById('preSavingRemainingText');
  const chkPreSaving = document.getElementById('chkPreSaving');
  const preSavingCheckLabel = document.getElementById('preSavingCheckLabel');

  const monthlySavingsTarget = val20;
  const remainingSavingsTarget = Math.max(0, monthlySavingsTarget - savingsAdded);
  const preSavingPct = Math.min(100, Math.round((savingsAdded / Math.max(1, monthlySavingsTarget)) * 100));

  if (preSavingBadge) preSavingBadge.textContent = `Objetivo: ${monthlySavingsTarget.toLocaleString('es-ES')} €`;
  if (preSavingPctText) preSavingPctText.textContent = `${preSavingPct}% Guardado ${preSavingPct >= 100 ? '🎉' : '💪'}`;
  if (preSavingBarFill) preSavingBarFill.style.width = `${preSavingPct}%`;

  if (preSavingRemainingText) {
    if (remainingSavingsTarget === 0) {
      preSavingRemainingText.innerHTML = `Ingresados <strong>${savingsAdded.toLocaleString('es-ES')} €</strong> de ${monthlySavingsTarget.toLocaleString('es-ES')} € | <strong>Reto 100% completado 🎉</strong>`;
    } else {
      preSavingRemainingText.innerHTML = `Ingresados <strong>${savingsAdded.toLocaleString('es-ES')} €</strong> de ${monthlySavingsTarget.toLocaleString('es-ES')} € | <strong>${remainingSavingsTarget.toLocaleString('es-ES')} € restantes por ingresar</strong>`;
    }
  }

  updateCharts(income);
}

function renderExpenseList(income) {
  const listEl = document.getElementById('expenseList');
  if (!listEl) return;

  if (currentExpenses.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; padding: 2.25rem 1rem; color: var(--text-muted); background: var(--bg-secondary); border-radius: var(--radius-md); border: 1.5px dashed var(--border-light);">
        <div style="font-size: 2.2rem; margin-bottom: 0.4rem;">📊</div>
        <strong style="display: block; font-size: 0.95rem; color: var(--text-dark); margin-bottom: 0.25rem;">Aún no has registrado ningún gasto este mes</strong>
        <p style="font-size: 0.825rem; max-width: 360px; margin: 0 auto; color: var(--text-muted);">Completa los datos arriba para añadir tu primer gasto de alquiler, supermercado u ocio y ver tu presupuesto en tiempo real.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = currentExpenses.map(exp => `
    <div class="expense-item" data-id="${exp.id}">
      <div class="expense-left">
        <div class="category-icon-box ${exp.category}">
          ${exp.category === 'fixed' ? '🏠' : exp.category === 'flexible' ? '🎉' : '💰'}
        </div>
        <div>
          <div class="expense-info-title">${sanitizeHTML(exp.title)}</div>
          <div class="expense-info-sub">
            <span>${exp.date}</span>
            ${exp.isShared ? '<span class="tag-shared">Pareja 50/50</span>' : ''}
          </div>
        </div>
      </div>
      <div class="expense-right">
        <span class="expense-amount-val">${exp.amount.toLocaleString('es-ES')} €</span>
        <button class="btn-delete-expense" data-id="${exp.id}" title="Eliminar gasto">&times;</button>
      </div>
    </div>
  `).join('');

  // Attach delete events
  listEl.querySelectorAll('.btn-delete-expense').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = btn.getAttribute('data-id');
      const isValidUUID = currentUser?.id && !currentUser.id.startsWith('user-');
      if (isValidUUID) {
        await deleteExpenseFromSupabase(id);
      }
      currentExpenses = currentExpenses.filter(item => item.id !== id);
      saveExpensesToLocal(currentUser?.id, currentExpenses);
      renderExpenseList(income);
      updateDashboardTotals(income);
    });
  });
}

let categoryChartInstance = null;
let coupleChartInstance = null;

function updateCharts(income) {
  const canvasCategory = document.getElementById('categoryExpensesChart');
  const canvasCouple = document.getElementById('coupleExpensesChart');

  // 1. Chart 1: Categorías vs Ahorro
  if (canvasCategory) {
    const fixedTotal = currentExpenses.filter(e => e.category === 'fixed').reduce((a, b) => a + b.amount, 0);
    const flexTotal = currentExpenses.filter(e => e.category === 'flexible').reduce((a, b) => a + b.amount, 0);
    const savingsTotal = currentExpenses.filter(e => e.category === 'savings').reduce((a, b) => a + b.amount, 0);
    const targetSavings = Math.round(income * 0.20);
    const totalSavingsPlanned = Math.max(savingsTotal, targetSavings);

    const categoryData = {
      labels: ['Gastos Fijos 🏠', 'Gastos Ocio 🎉', 'Meta Ahorro 💰'],
      datasets: [{
        data: [fixedTotal, flexTotal, totalSavingsPlanned],
        backgroundColor: ['#059669', '#3B82F6', '#8B5CF6'],
        borderWidth: 3,
        borderColor: '#FFFFFF',
        hoverOffset: 6
      }]
    };

    if (categoryChartInstance) {
      categoryChartInstance.data = categoryData;
      categoryChartInstance.update();
    } else {
      categoryChartInstance = new Chart(canvasCategory, {
        type: 'doughnut',
        data: categoryData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { family: 'Plus Jakarta Sans', weight: '600', size: 12 }, padding: 16 }
            },
            tooltip: {
              callbacks: {
                label: (item) => ` ${item.label}: ${item.raw.toLocaleString('es-ES')} €`
              }
            }
          },
          cutout: '68%'
        }
      });
    }
  }

  // 2. Chart 2: Gastos Personales vs Compartidos
  if (canvasCouple) {
    const personalTotal = currentExpenses.filter(e => !e.isShared && e.category !== 'savings').reduce((a, b) => a + b.amount, 0);
    const sharedTotal = currentExpenses.filter(e => e.isShared && e.category !== 'savings').reduce((a, b) => a + b.amount, 0);
    const coupleShare = sharedTotal / 2;

    const coupleData = {
      labels: ['Personales 👤', 'Tu 50% Pareja 💑'],
      datasets: [{
        data: [personalTotal, coupleShare],
        backgroundColor: ['#10B981', '#F43F5E'],
        borderRadius: 8,
        barThickness: 36
      }]
    };

    if (coupleChartInstance) {
      coupleChartInstance.data = coupleData;
      coupleChartInstance.update();
    } else {
      coupleChartInstance = new Chart(canvasCouple, {
        type: 'bar',
        data: coupleData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (item) => ` ${item.raw.toLocaleString('es-ES')} €`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (val) => `${val} €`,
                font: { family: 'Plus Jakarta Sans', weight: '600' }
              },
              grid: { color: '#F1F5F9' }
            },
            x: {
              ticks: { font: { family: 'Plus Jakarta Sans', weight: '700' } },
              grid: { display: false }
            }
          }
        }
      });
    }
  }
}

let isSituationModeActive = true;
let isCoupleModeActive = true;

function updateSituationModeUI() {
  const toggleBtn = document.getElementById('dashSituationToggleBtn');
  const toggleText = document.getElementById('situationToggleText');
  const banner = document.getElementById('dashSurvivalBanner');

  if (isSituationModeActive) {
    toggleBtn?.classList.remove('inactive');
    toggleBtn?.classList.add('active');
    if (toggleText) toggleText.textContent = 'Modo Colchón Activo';
    banner?.classList.remove('hidden');
  } else {
    toggleBtn?.classList.remove('active');
    toggleBtn?.classList.add('inactive');
    if (toggleText) toggleText.textContent = 'Activar Modo Colchón';
    banner?.classList.add('hidden');
  }
}

function updateCoupleModeUI() {
  const toggleBtn = document.getElementById('dashCoupleToggleBtn');
  const toggleText = document.getElementById('coupleToggleText');
  const coupleSummaryCard = document.getElementById('dashCoupleSummaryCard');
  const coupleCard = document.getElementById('dashCoupleCard');
  const coupleChartCard = document.getElementById('dashCoupleChartCard');
  const btnCoupleExpense = document.getElementById('btnAddCoupleExpense');
  const chartsGrid = document.getElementById('dashChartsGrid');

  if (isCoupleModeActive) {
    toggleBtn?.classList.remove('inactive');
    toggleBtn?.classList.add('active');
    if (toggleText) toggleText.textContent = 'Modo Pareja Activo';
    coupleSummaryCard?.classList.remove('hidden');
    coupleCard?.classList.remove('hidden');
    coupleChartCard?.classList.remove('hidden');
    btnCoupleExpense?.classList.remove('hidden');
    chartsGrid?.classList.remove('single-chart');
  } else {
    toggleBtn?.classList.remove('active');
    toggleBtn?.classList.add('inactive');
    if (toggleText) toggleText.textContent = 'Activar Modo Pareja';
    coupleSummaryCard?.classList.add('hidden');
    coupleCard?.classList.add('hidden');
    coupleChartCard?.classList.add('hidden');
    btnCoupleExpense?.classList.add('hidden');
    chartsGrid?.classList.add('single-chart');
  }

  setTimeout(() => {
    if (categoryChartInstance) categoryChartInstance.resize();
  }, 50);
}

function initDashboardEvents(income, goal) {
  // Situation Mode Toggle Listener with Confirmation Modal
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
    updateSituationModeUI();
    saveUserModes(currentUser?.id, { isSituationModeActive, isCoupleModeActive });
    modalSituationConfirm?.classList.remove('open');
    if (isSituationModeActive) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.2 } });
    }
  });

  btnCancelSituationModal?.addEventListener('click', () => {
    modalSituationConfirm?.classList.remove('open');
  });

  // Modal backdrop click to close
  modalSituationConfirm?.addEventListener('click', (e) => {
    if (e.target === modalSituationConfirm) modalSituationConfirm.classList.remove('open');
  });

  // Couple Mode Toggle Listener with Confirmation Modal
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
    updateCoupleModeUI();
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

  // Situation Form Config Modal
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

    // Trigger button click on corresponding situation selector button
    const targetSitBtn = document.querySelector(`.sit-btn[data-situation="${cfgSituationType}"]`);
    targetSitBtn?.click();

    modalSituationForm?.classList.remove('open');
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.3 } });
  });

  // Quick Deposit Listener
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

    const isValidUUID = currentUser?.id && !currentUser.id.startsWith('user-');
    if (isValidUUID) {
      await saveExpenseToSupabase(currentUser.id, newExpense);
    }

    currentExpenses.unshift(newExpense);
    saveExpensesToLocal(currentUser?.id, currentExpenses);
    if (input) input.value = '';

    renderExpenseList(income);
    updateDashboardTotals(income);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.3 } });
  });

  // Add Expense form listener
  const newAddForm = document.getElementById('addExpenseForm');

  newAddForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('expenseTitle');
    const amountInput = document.getElementById('expenseAmount');
    const catInput = document.getElementById('expenseCategory');

    if (!titleInput || !amountInput) return;

    // Detectar si se pulsó "Añadir Gasto Pareja" o "Añadir Gasto Personal"
    const isShared = e.submitter ? e.submitter.getAttribute('data-shared') === 'true' : false;

    const newExpense = {
      id: Date.now().toString(),
      title: sanitizeInput(titleInput.value),
      amount: sanitizeNumber(amountInput.value, { min: 0.01, max: 99999 }),
      category: sanitizeInput(catInput?.value || 'fixed'),
      isShared: isShared,
      date: new Date().toISOString().split('T')[0]
    };

    // Guardar en Supabase DB si es un usuario con UUID válido
    const isValidUUID = currentUser?.id && !currentUser.id.startsWith('user-');
    if (isValidUUID) {
      await saveExpenseToSupabase(currentUser.id, newExpense);
    }

    currentExpenses.unshift(newExpense);
    saveExpensesToLocal(currentUser?.id, currentExpenses);

    titleInput.value = '';
    amountInput.value = '';

    renderExpenseList(income);
    updateDashboardTotals(income);
  });

  // Logout listener
  const btnLogout = document.getElementById('btnLogout');
  btnLogout?.addEventListener('click', async () => {
    await logoutUser();
    localStorage.removeItem('verde_user');
    window.location.href = '/index.html';
  });

  // Copy partner invite code listener
  const btnCopyCode = document.getElementById('btnCopyCode');
  btnCopyCode?.addEventListener('click', () => {
    const code = document.getElementById('myInviteCode')?.textContent || getUserInviteCode(currentUser?.id);
    navigator.clipboard.writeText(code);
    alert(`Código ${code} copiado al portapapeles. ¡Envíaselo a tu pareja!`);
  });

  // Partner Link listener
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

  // Unlink Partner listener
  const btnUnlinkPartner = document.getElementById('btnUnlinkPartner');
  btnUnlinkPartner?.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres desvincular la cuenta de tu pareja?')) {
      removeLinkedPartner(currentUser?.id);
      updatePartnerLinkedUI(null);
      document.getElementById('partnerCodeInput').value = '';
    }
  });
}

// Auto init on page load — SOLO en dashboard.html
if (window.location.pathname.includes('dashboard')) {
  document.addEventListener('DOMContentLoaded', async () => {
    initSecurity();

    const user = getSecureSession();

    if (!user) {
      clearSession();
      window.location.href = '/index.html';
      return;
    }

    await renderDashboard(user);
  });
}
