import './style.css';
import { logoutUser, fetchExpensesFromSupabase, saveExpenseToSupabase, deleteExpenseFromSupabase } from './api';
import confetti from 'canvas-confetti';
import { createIcons, Wallet, Plus, Trash2, Copy, LogOut, Coins, PieChart, Target, Heart, Users, PlusCircle, Lightbulb } from 'lucide';
import { sanitizeHTML, sanitizeInput, sanitizeNumber, getSecureSession, clearSession, initSecurity } from './security';

let currentExpenses = [];

let currentUser = null;

export async function renderDashboard(user) {
  currentUser = user;

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

  // Cargar gastos reales de Supabase si existen
  if (user?.id) {
    const dbExpenses = await fetchExpensesFromSupabase(user.id);
    if (dbExpenses && dbExpenses.length > 0) {
      currentExpenses = dbExpenses.map(e => ({
        id: e.id,
        title: e.title,
        amount: parseFloat(e.amount),
        category: e.category,
        isShared: e.is_shared,
        date: e.expense_date || e.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
      }));
    }
  }

  // Init event listeners & icons
  initDashboardEvents(income, goal);
  updateDashboardTotals(income);
  renderExpenseList(income);
  
  createIcons({
    icons: { Wallet, Plus, Trash2, Copy, LogOut, Coins, PieChart, Target, Heart, Users, PlusCircle, Lightbulb }
  });
}

function updateDashboardTotals(income) {
  const totalSpent = currentExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const sharedExpenses = currentExpenses.filter(e => e.isShared).reduce((acc, curr) => acc + curr.amount, 0);

  const spentTotalEl = document.getElementById('dashSpentTotal');
  const spentLimitEl = document.getElementById('dashSpentLimit');
  const coupleShareEl = document.getElementById('dashCoupleShare');

  if (spentTotalEl) spentTotalEl.textContent = `${totalSpent.toLocaleString('es-ES')} €`;
  
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
      if (currentUser?.id) {
        await deleteExpenseFromSupabase(id);
      }
      currentExpenses = currentExpenses.filter(item => item.id !== id);
      renderExpenseList(income);
      updateDashboardTotals(income);
    });
  });
}

let isCoupleModeActive = true;

function updateCoupleModeUI() {
  const toggleBtn = document.getElementById('dashCoupleToggleBtn');
  const toggleText = document.getElementById('coupleToggleText');
  const coupleSummaryCard = document.getElementById('dashCoupleSummaryCard');
  const coupleCard = document.getElementById('dashCoupleCard');
  const sharedWrapper = document.getElementById('dashExpenseSharedWrapper');

  if (isCoupleModeActive) {
    toggleBtn?.classList.remove('inactive');
    toggleBtn?.classList.add('active');
    if (toggleText) toggleText.textContent = 'Modo Pareja Activo';
    coupleSummaryCard?.classList.remove('hidden');
    coupleCard?.classList.remove('hidden');
    sharedWrapper?.classList.remove('hidden');
  } else {
    toggleBtn?.classList.remove('active');
    toggleBtn?.classList.add('inactive');
    if (toggleText) toggleText.textContent = 'Activar Modo Pareja';
    coupleSummaryCard?.classList.add('hidden');
    coupleCard?.classList.add('hidden');
    sharedWrapper?.classList.add('hidden');
  }
}

function initDashboardEvents(income, goal) {
  // Couple Mode Toggle Listener
  const dashCoupleToggleBtn = document.getElementById('dashCoupleToggleBtn');
  dashCoupleToggleBtn?.addEventListener('click', () => {
    isCoupleModeActive = !isCoupleModeActive;
    updateCoupleModeUI();
    if (isCoupleModeActive) {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.2 } });
    }
  });
  // Add Expense form listener
  const newAddForm = document.getElementById('addExpenseForm');

  newAddForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('expenseTitle');
    const amountInput = document.getElementById('expenseAmount');
    const catInput = document.getElementById('expenseCategory');
    const sharedChk = document.getElementById('expenseIsShared');

    if (!titleInput || !amountInput) return;

    const newExpense = {
      id: Date.now().toString(),
      title: sanitizeInput(titleInput.value),
      amount: sanitizeNumber(amountInput.value, { min: 0.01, max: 99999 }),
      category: sanitizeInput(catInput?.value || 'fixed'),
      isShared: sharedChk ? sharedChk.checked : true,
      date: new Date().toISOString().split('T')[0]
    };

    // Intentar guardar en Supabase si el usuario está autenticado
    if (currentUser?.id) {
      await saveExpenseToSupabase(currentUser.id, newExpense);
    }

    currentExpenses.unshift(newExpense);
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
    const code = document.getElementById('myInviteCode')?.textContent || 'VA-8492';
    navigator.clipboard.writeText(code);
    alert(`Código ${code} copiado al portapapeles. ¡Envíaselo a tu pareja!`);
  });

  // Partner Link listener
  const btnLinkPartner = document.getElementById('btnLinkPartner');
  btnLinkPartner?.addEventListener('click', () => {
    const partnerCode = document.getElementById('partnerCodeInput')?.value;
    if (!partnerCode) {
      alert('Introduce el código de tu pareja para vincular las cuentas.');
      return;
    }
    alert(`¡Cuentas vinculadas con éxito mediante el código ${partnerCode}! Modo Pareja activado.`);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
  });
}

// Auto init on page load
document.addEventListener('DOMContentLoaded', async () => {
  initSecurity();

  const user = getSecureSession();

  if (!user) {
    // Sesión inválida o expirada — redirigir al login
    clearSession();
    window.location.href = '/index.html';
    return;
  }

  await renderDashboard(user);
});
