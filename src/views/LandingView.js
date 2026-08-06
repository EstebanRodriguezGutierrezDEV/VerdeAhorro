export function initExpenseSimulator() {
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

export function initProjectionsCalculator(openAuthModalFn) {
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
      openAuthModalFn('register');
    });
  }

  calculateProjections();
}

export function initAccordion() {
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

export function initCoupleSplitWidget() {
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

export function initMobileMenu() {
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
