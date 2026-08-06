import { sanitizeHTML, sanitizeInput, sanitizeNumber } from '../utils/security.js';
import { formatCurrency, isValidUUID } from '../utils/helpers.js';
import { deleteExpenseFromSupabase, saveExpensesToLocal } from '../models/ExpenseModel.js';
import Chart from 'chart.js/auto';
import { createIcons, CheckCircle2, Trash2 } from 'lucide';

let categoryChartInstance = null;
let coupleChartInstance = null;

export function renderExpenseList(currentExpenses, income, currentUser, onExpenseDeleted) {
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
            <span>${sanitizeHTML(exp.date || '')}</span>
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
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (isValidUUID(currentUser?.id)) {
        await deleteExpenseFromSupabase(currentUser.id, id);
      }
      onExpenseDeleted(id);
    });
  });
}

export function updateDashboardTotals(currentExpenses, income) {
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
    
    dashRunwayText.textContent = '';
    const text1 = document.createTextNode('Con tus gastos fijos actuales, tienes un colchón estimado de ');
    const strong = document.createElement('strong');
    strong.textContent = `${runway} meses de tranquilidad financiera`;
    const text2 = document.createTextNode('.');
    dashRunwayText.append(text1, strong, text2);
  }

  // Update Reto del Preahorro Card
  const preSavingBadge = document.getElementById('preSavingBadge');
  const preSavingPctText = document.getElementById('preSavingPctText');
  const preSavingBarFill = document.getElementById('preSavingBarFill');
  const preSavingRemainingText = document.getElementById('preSavingRemainingText');

  const monthlySavingsTarget = val20;
  const remainingSavingsTarget = Math.max(0, monthlySavingsTarget - savingsAdded);
  const preSavingPct = Math.min(100, Math.round((savingsAdded / Math.max(1, monthlySavingsTarget)) * 100));

  if (preSavingBadge) preSavingBadge.textContent = `Objetivo: ${monthlySavingsTarget.toLocaleString('es-ES')} €`;
  if (preSavingPctText) preSavingPctText.textContent = `${preSavingPct}% Guardado ${preSavingPct >= 100 ? '🎉' : '💪'}`;
  if (preSavingBarFill) preSavingBarFill.style.width = `${preSavingPct}%`;

  if (preSavingRemainingText) {
    preSavingRemainingText.textContent = '';
    const text1 = document.createTextNode('Ingresados ');
    const strong1 = document.createElement('strong');
    strong1.textContent = `${savingsAdded.toLocaleString('es-ES')} €`;
    const text2 = document.createTextNode(` de ${monthlySavingsTarget.toLocaleString('es-ES')} € | `);
    const strong2 = document.createElement('strong');
    
    if (remainingSavingsTarget === 0) {
      strong2.textContent = 'Reto 100% completado 🎉';
    } else {
      strong2.textContent = `${remainingSavingsTarget.toLocaleString('es-ES')} € restantes por ingresar`;
    }
    
    preSavingRemainingText.append(text1, strong1, text2, strong2);
  }

  updateCharts(currentExpenses, income);
}

export function updateSituationModeUI(isSituationModeActive) {
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

export function updateCoupleModeUI(isCoupleModeActive, categoryChartResize) {
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
    if (categoryChartInstance && categoryChartResize) {
      categoryChartInstance.resize();
    }
  }, 50);
}

export function updatePartnerLinkedUI(partnerData) {
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

export function initSituationManager() {
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

function updateCharts(currentExpenses, income) {
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
