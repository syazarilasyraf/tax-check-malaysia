/**
 * TAX CHECK MALAYSIA - Application Logic
 * 
 * A simple educational tool to estimate Malaysian income tax.
 * All calculations are performed client-side.
 * 
 * ============================================
 * TAX YEAR UPDATES - IMPORTANT
 * ============================================
 * To update for a new tax year (YA):
 * 1. Add a new entry to taxRules object with the YA as key
 * 2. Update relief caps and tax brackets as announced by LHDN
 * 3. Add the new YA to the year selector in init()
 * 
 * TODO: Update these values yearly when LHDN announces budget changes
 * ============================================
 */

// ============================================
// TAX RULES CONFIGURATION
// Update this section yearly for new tax rules
// ============================================

const taxRules = {
  // YA 2025 - Current default
  // TODO: Update these values when LHDN announces 2025 budget changes
  2025: {
    year: 2025,
    description: "Year of Assessment 2025",
    
    // Tax Rebates (Maklumat Pengurangan Cukai)
    rebate: {
      threshold: 35000,        // Chargeable income threshold for rebate
      amount: 400              // Rebate amount if below threshold
    },
    
    // Relief Caps (Had Potongan Cukai)
    // TODO: Verify and update caps yearly from LHDN announcements
    reliefs: {
      self: { cap: 9000, label: "Self & Dependent Relief" },
      epf: { cap: 4000, label: "EPF + Life Insurance" },
      socso: { cap: 350, label: "SOCSO / EIS" },
      lifestyle: { cap: 2500, label: "Lifestyle" },
      education: { cap: 2000, label: "Education & Self-Improvement" },
      medical: { cap: 10000, label: "Medical Expenses" },
      parents: { cap: 8000, label: "Parents' Medical / Care" },
      sspn: { cap: 8000, label: "SSPN" },
      childcare: { cap: 3000, label: "Childcare / Kindergarten" },
      prs: { cap: 3000, label: "PRS / Deferred Annuity" }
    },
    
    // Progressive Tax Brackets (Resident Individual)
    // Format: [upperLimit, rate, cumulativeTax]
    // cumulativeTax is the tax from all previous brackets
    // TODO: Update brackets if LHDN announces changes
    brackets: [
      { limit: 5000,   rate: 0.00, baseTax: 0 },      // First RM5,000: 0%
      { limit: 20000,  rate: 0.01, baseTax: 0 },      // RM5,001-20,000: 1%
      { limit: 35000,  rate: 0.03, baseTax: 150 },    // RM20,001-35,000: 3%
      { limit: 50000,  rate: 0.06, baseTax: 600 },    // RM35,001-50,000: 6%
      { limit: 70000,  rate: 0.11, baseTax: 1500 },   // RM50,001-70,000: 11%
      { limit: 100000, rate: 0.19, baseTax: 3700 },   // RM70,001-100,000: 19%
      { limit: 400000, rate: 0.25, baseTax: 9400 },   // RM100,001-400,000: 25%
      { limit: 600000, rate: 0.26, baseTax: 84400 },  // RM400,001-600,000: 26%
      { limit: 1000000, rate: 0.28, baseTax: 136400 }, // RM600,001-1,000,000: 28%
      { limit: Infinity, rate: 0.30, baseTax: 248400 } // Above RM1,000,000: 30%
    ],
    
    // Filing threshold (employment income only, resident)
    // Generally need to file if chargeable income > 0 or gross income > threshold
    filingThreshold: 34000
  },
  
  // YA 2024 - For reference and comparison
  2024: {
    year: 2024,
    description: "Year of Assessment 2024",
    rebate: { threshold: 35000, amount: 400 },
    reliefs: {
      self: { cap: 9000, label: "Self & Dependent Relief" },
      epf: { cap: 4000, label: "EPF + Life Insurance" },
      socso: { cap: 350, label: "SOCSO / EIS" },
      lifestyle: { cap: 2500, label: "Lifestyle" },
      education: { cap: 2000, label: "Education & Self-Improvement" },
      medical: { cap: 10000, label: "Medical Expenses" },
      parents: { cap: 8000, label: "Parents' Medical / Care" },
      sspn: { cap: 8000, label: "SSPN" },
      childcare: { cap: 3000, label: "Childcare / Kindergarten" },
      prs: { cap: 3000, label: "PRS / Deferred Annuity" }
    },
    brackets: [
      { limit: 5000,   rate: 0.00, baseTax: 0 },
      { limit: 20000,  rate: 0.01, baseTax: 0 },
      { limit: 35000,  rate: 0.03, baseTax: 150 },
      { limit: 50000,  rate: 0.06, baseTax: 600 },
      { limit: 70000,  rate: 0.11, baseTax: 1500 },
      { limit: 100000, rate: 0.19, baseTax: 3700 },
      { limit: 400000, rate: 0.25, baseTax: 9400 },
      { limit: 600000, rate: 0.26, baseTax: 84400 },
      { limit: 1000000, rate: 0.28, baseTax: 136400 },
      { limit: Infinity, rate: 0.30, baseTax: 248400 }
    ],
    filingThreshold: 34000
  }
};

// ============================================
// APPLICATION STATE
// ============================================

const state = {
  currentStep: 'intro',
  taxYear: 2025,
  residentStatus: 'resident',
  income: {
    annual: 0,
    bonus: 0,
    total: 0
  },
  mtdPaid: 0,
  reliefs: {
    self: 0,
    epf: 0,
    socso: 0,
    lifestyle: 0,
    education: 0,
    medical: 0,
    parents: 0,
    sspn: 0,
    childcare: 0,
    prs: 0
  },
  results: {
    totalRelief: 0,
    chargeableIncome: 0,
    taxBeforeRebate: 0,
    rebate: 0,
    finalTax: 0,
    balance: 0,
    bracket: null
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format number as Malaysian Ringgit currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'RM 0';
  }
  return 'RM ' + Math.round(amount).toLocaleString('en-MY');
}

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Parse number from input, defaulting to 0
 * @param {string} value - Input value
 * @returns {number} Parsed number
 */
function parseNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : Math.max(0, num);
}

// ============================================
// TAX CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate tax based on chargeable income using progressive brackets
 * @param {number} chargeableIncome - Income after reliefs
 * @param {number} year - Tax year
 * @returns {number} Tax amount before rebate
 */
function calculateTax(chargeableIncome, year) {
  const rules = taxRules[year];
  if (!rules) return 0;
  
  // Find the appropriate bracket
  let tax = 0;
  let previousLimit = 0;
  
  for (const bracket of rules.brackets) {
    if (chargeableIncome <= bracket.limit) {
      // Income falls in this bracket
      const taxableInThisBracket = chargeableIncome - previousLimit;
      tax = bracket.baseTax + (taxableInThisBracket * bracket.rate);
      return Math.max(0, tax);
    }
    previousLimit = bracket.limit;
  }
  
  return 0;
}

/**
 * Get tax bracket information for display
 * @param {number} chargeableIncome - Income after reliefs
 * @param {number} year - Tax year
 * @returns {object} Bracket information
 */
function getTaxBracketInfo(chargeableIncome, year) {
  const rules = taxRules[year];
  if (!rules) return { name: 'Unknown', rate: 0, description: '' };
  
  let previousLimit = 0;
  
  for (const bracket of rules.brackets) {
    if (chargeableIncome <= bracket.limit) {
      const rate = Math.round(bracket.rate * 100);
      let name;
      let description;
      
      if (rate === 0) {
        name = '0%';
        description = 'No tax on first RM 5,000';
      } else {
        name = `${rate}%`;
        const range = previousLimit === 0 ? 
          `First ${formatCurrency(bracket.limit)}` :
          `${formatCurrency(previousLimit + 1)} - ${formatCurrency(bracket.limit)}`;
        description = `Your next ringgit is taxed at ${rate}%`;
      }
      
      return { name, rate, description, bracket, previousLimit };
    }
    previousLimit = bracket.limit;
  }
  
  return { name: '30%', rate: 30, description: 'Top bracket: 30%' };
}

// ============================================
// SMART SUGGESTIONS / MISSED RELIEF DETECTOR
// ============================================

/**
 * Generate smart suggestions based on user's inputs
 * @returns {Array} Array of suggestion objects
 */
function generateSmartSuggestions() {
  const suggestions = [];
  const rules = taxRules[state.taxYear];
  
  // 1. Check if EPF is zero but income is significant
  if (state.income.total > 36000 && state.reliefs.epf === 0) {
    suggestions.push({
      type: 'warning',
      icon: '💡',
      title: 'Check your EPF contributions',
      message: `You have employment income but no EPF claimed. Most employees contribute ~11% to EPF (${formatCurrency(state.income.total * 0.11)} potential relief). Check your EA form for the actual amount.`
    });
  }
  
  // 2. Check if lifestyle is zero
  if (state.reliefs.lifestyle === 0) {
    suggestions.push({
      type: 'info',
      icon: '📱',
      title: 'Lifestyle purchases may qualify',
      message: `Books, sports equipment, gym membership, internet bills, smartphones, and computers may qualify for up to ${formatCurrency(rules.reliefs.lifestyle.cap)} relief. Keep your receipts!`
    });
  }
  
  // 3. Check rebate eligibility
  if (state.results.chargeableIncome <= rules.rebate.threshold && state.results.chargeableIncome > 0) {
    if (state.results.rebate > 0) {
      suggestions.push({
        type: 'success',
        icon: '🎉',
        title: 'Tax rebate applied!',
        message: `Your chargeable income is below ${formatCurrency(rules.rebate.threshold)}, so you qualify for a ${formatCurrency(rules.rebate.amount)} tax rebate.`
      });
    }
  }
  
  // 4. Resident status warning
  if (state.residentStatus === 'not-sure') {
    suggestions.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Resident status uncertain',
      message: 'Tax rates are significantly higher for non-residents (flat 30%). Please confirm your status - you are likely a resident if you stayed in Malaysia for 182+ days this year.'
    });
  }
  
  // 5. SOCSO check
  if (state.income.total > 0 && state.reliefs.socso === 0) {
    suggestions.push({
      type: 'info',
      icon: '🛡️',
      title: 'Don\'t forget SOCSO/EIS',
      message: `Your SOCSO and employment insurance contributions qualify for relief up to ${formatCurrency(rules.reliefs.socso.cap)}. Check your payslips or EA form.`
    });
  }
  
  // 6. High income, low reliefs warning
  const totalReliefCap = Object.values(rules.reliefs).reduce((sum, r) => sum + r.cap, 0);
  if (state.income.total > 80000 && state.results.totalRelief < 15000) {
    suggestions.push({
      type: 'info',
      icon: '📋',
      title: 'Consider reviewing all reliefs',
      message: `With your income level, you may benefit from maximizing available reliefs. Consider PRS (${formatCurrency(rules.reliefs.prs.cap)}), SSPN, or medical insurance premiums.`
    });
  }
  
  return suggestions;
}

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

/**
 * Update progress indicator
 */
function updateProgressIndicator() {
  const steps = ['intro', 'income', 'reliefs', 'results'];
  const currentIndex = steps.indexOf(state.currentStep);
  
  document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
    indicator.classList.remove('active', 'completed');
    if (index === currentIndex) {
      indicator.classList.add('active');
    } else if (index < currentIndex) {
      indicator.classList.add('completed');
    }
  });
}

/**
 * Show a specific section
 * @param {string} stepId - Section ID to show
 */
function showSection(stepId) {
  // Hide all sections
  document.querySelectorAll('.section-card').forEach(section => {
    section.classList.remove('active');
  });
  
  // Show target section
  const target = document.getElementById(`${stepId}-section`);
  if (target) {
    target.classList.add('active');
    state.currentStep = stepId;
    updateProgressIndicator();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Update relief caps display based on selected tax year
 */
function updateReliefCaps() {
  const rules = taxRules[state.taxYear];
  if (!rules) return;
  
  Object.entries(rules.reliefs).forEach(([key, config]) => {
    const capElement = document.getElementById(`cap-${key}`);
    if (capElement) {
      capElement.textContent = `Cap: ${formatCurrency(config.cap)}`;
    }
  });
}

/**
 * Update income preview
 */
function updateIncomePreview() {
  state.income.total = state.income.annual + state.income.bonus;
  document.getElementById('preview-total-income').textContent = formatCurrency(state.income.total);
  
  // Enable/disable next button
  const nextBtn = document.getElementById('income-next-btn');
  if (nextBtn) {
    nextBtn.disabled = state.income.total <= 0;
  }
}

/**
 * Update relief preview
 */
function updateReliefPreview() {
  const rules = taxRules[state.taxYear];
  if (!rules) return;
  
  // Calculate total relief with caps
  let total = 0;
  Object.entries(state.reliefs).forEach(([key, value]) => {
    const cap = rules.reliefs[key]?.cap || 0;
    total += clamp(value, 0, cap);
  });
  
  document.getElementById('preview-total-relief').textContent = formatCurrency(total);
}

/**
 * Calculate and display results
 */
function calculateAndShowResults() {
  const rules = taxRules[state.taxYear];
  if (!rules) return;
  
  // Calculate total relief with caps
  state.results.totalRelief = 0;
  Object.entries(state.reliefs).forEach(([key, value]) => {
    const cap = rules.reliefs[key]?.cap || 0;
    state.results.totalRelief += clamp(value, 0, cap);
  });
  
  // Calculate chargeable income
  state.results.chargeableIncome = Math.max(0, state.income.total - state.results.totalRelief);
  
  // Calculate tax
  state.results.taxBeforeRebate = calculateTax(state.results.chargeableIncome, state.taxYear);
  
  // Apply rebate if eligible
  state.results.rebate = (state.results.chargeableIncome <= rules.rebate.threshold && state.results.chargeableIncome > 0) 
    ? rules.rebate.amount 
    : 0;
  
  state.results.finalTax = Math.max(0, state.results.taxBeforeRebate - state.results.rebate);
  state.results.balance = state.results.finalTax - state.mtdPaid;
  
  // Get bracket info
  state.results.bracket = getTaxBracketInfo(state.results.chargeableIncome, state.taxYear);
  
  // Reset explain result toggle
  const explainContent = document.getElementById('explain-result-content');
  const btnText = document.getElementById('explain-btn-text');
  if (explainContent) explainContent.classList.add('hidden');
  if (btnText) btnText.textContent = '🔍 Explain my result';
  
  // Update results display
  updateResultsDisplay();
  
  // Show results section
  showSection('results');
}

/**
 * Update all results display elements
 */
function updateResultsDisplay() {
  // Basic results
  document.getElementById('result-total-income').textContent = formatCurrency(state.income.total);
  document.getElementById('result-total-relief').textContent = formatCurrency(state.results.totalRelief);
  document.getElementById('result-chargeable-income').textContent = formatCurrency(state.results.chargeableIncome);
  
  // Tax bracket
  document.getElementById('result-tax-bracket').textContent = state.results.bracket?.name || '-';
  document.getElementById('bracket-description').textContent = state.results.bracket?.description || '-';
  
  // Progress bar
  const progressBar = document.getElementById('bracket-progress');
  if (progressBar && state.results.bracket) {
    const { chargeableIncome } = state.results;
    const { previousLimit, bracket } = state.results.bracket;
    
    if (bracket && bracket.limit !== Infinity) {
      const bracketSize = bracket.limit - previousLimit;
      const positionInBracket = chargeableIncome - previousLimit;
      const percentage = Math.min(100, (positionInBracket / bracketSize) * 100);
      progressBar.style.width = `${percentage}%`;
    } else {
      progressBar.style.width = '100%';
    }
  }
  
  // Tax calculation
  document.getElementById('result-tax-before-rebate').textContent = formatCurrency(state.results.taxBeforeRebate);
  document.getElementById('result-rebate').textContent = `- ${formatCurrency(state.results.rebate)}`;
  document.getElementById('result-final-tax').textContent = formatCurrency(state.results.finalTax);
  document.getElementById('result-mtd-paid').textContent = `- ${formatCurrency(state.mtdPaid)}`;
  
  // Balance/Refund
  const balanceRow = document.getElementById('balance-row');
  const balanceLabel = document.getElementById('balance-label');
  const balanceValue = document.getElementById('result-balance');
  
  balanceValue.textContent = formatCurrency(Math.abs(state.results.balance));
  
  if (state.results.balance > 0) {
    // Need to pay more
    balanceRow.classList.add('positive');
    balanceRow.classList.remove('negative');
    balanceLabel.textContent = 'Additional Tax to Pay';
  } else if (state.results.balance < 0) {
    // Refund
    balanceRow.classList.add('negative');
    balanceRow.classList.remove('positive');
    balanceLabel.textContent = 'Estimated Refund';
  } else {
    balanceRow.classList.remove('positive', 'negative');
    balanceLabel.textContent = 'Balance';
  }
  
  // Rebate row visibility
  const rebateRow = document.getElementById('rebate-row');
  if (state.results.rebate > 0) {
    rebateRow.style.display = 'flex';
  } else {
    rebateRow.style.display = 'none';
  }
  
  // Generate and display smart suggestions
  displaySmartSuggestions();
  
  // Display filing recommendation
  displayFilingRecommendation();
  
  // Update enhanced result breakdown
  updateResultBreakdown();
  
  // Update explain result content
  updateExplainResult();
}

/**
 * Update enhanced result breakdown display
 */
function updateResultBreakdown() {
  document.getElementById('breakdown-income').textContent = formatCurrency(state.income.total);
  document.getElementById('breakdown-reliefs').textContent = `− ${formatCurrency(state.results.totalRelief)}`;
  document.getElementById('breakdown-chargeable').textContent = formatCurrency(state.results.chargeableIncome);
}

/**
 * Update the explain result content with dynamic explanations
 */
function updateExplainResult() {
  const list = document.getElementById('explain-result-list');
  if (!list) return;
  
  const explanations = [];
  const rules = taxRules[state.taxYear];
  
  // Explanation 1: Tax bracket
  if (state.results.chargeableIncome > 0) {
    const bracket = state.results.bracket;
    explanations.push(`Your income places you in the <strong>${bracket?.name || '0%'}</strong> tax bracket after reliefs.`);
  } else {
    explanations.push('Your chargeable income is zero after reliefs, so no tax is due.');
  }
  
  // Explanation 2: Reliefs impact
  if (state.results.totalRelief > 0) {
    explanations.push(`Your reliefs reduced your taxable income by <strong>${formatCurrency(state.results.totalRelief)}</strong>.`);
  } else {
    explanations.push('You didn\'t claim any reliefs. You might be missing opportunities to reduce your tax.');
  }
  
  // Explanation 3: Rebate
  if (state.results.rebate > 0) {
    explanations.push(`You qualify for a <strong>${formatCurrency(state.results.rebate)}</strong> rebate because your chargeable income is below ${formatCurrency(rules.rebate.threshold)}.`);
  } else if (state.results.chargeableIncome <= rules.rebate.threshold && state.results.chargeableIncome > 0) {
    explanations.push(`Your chargeable income is below ${formatCurrency(rules.rebate.threshold)}, but your tax was already zero.`);
  }
  
  // Explanation 4: Balance/Refund
  if (state.results.balance < 0) {
    explanations.push(`You may get a <strong>refund of ${formatCurrency(Math.abs(state.results.balance))}</strong> because you paid more PCB/MTD than your estimated tax.`);
  } else if (state.results.balance > 0) {
    explanations.push(`You may need to pay an <strong>additional ${formatCurrency(state.results.balance)}</strong> because your estimated tax exceeds your PCB/MTD payments.`);
  } else {
    explanations.push('Your PCB/MTD payments match your estimated tax closely.');
  }
  
  // Explanation 5: Filing requirement
  if (state.results.chargeableIncome <= 0 && state.income.total < rules.filingThreshold) {
    explanations.push('Based on your income, you likely <strong>don\'t need to file</strong>, but filing can be beneficial for official records.');
  } else {
    explanations.push('Based on your income, you <strong>likely need to file</strong> a tax return.');
  }
  
  list.innerHTML = explanations.map(exp => `<li>${exp}</li>`).join('');
}

/**
 * Display smart suggestions
 */
function displaySmartSuggestions() {
  const container = document.getElementById('smart-suggestions');
  const suggestions = generateSmartSuggestions();
  
  if (suggestions.length === 0) {
    container.classList.add('hidden');
    return;
  }
  
  container.innerHTML = suggestions.map(s => `
    <div class="suggestion-item suggestion--${s.type}">
      <span class="suggestion-icon">${s.icon}</span>
      <div class="suggestion-content">
        <h4>${s.title}</h4>
        <p>${s.message}</p>
      </div>
    </div>
  `).join('');
  
  container.classList.remove('hidden');
}

/**
 * Display filing recommendation
 */
function displayFilingRecommendation() {
  const container = document.getElementById('filing-recommendation');
  const rules = taxRules[state.taxYear];
  
  let recommendation = {
    status: '',
    title: '',
    description: '',
    class: ''
  };
  
  // Determine recommendation
  if (state.results.chargeableIncome <= 0 && state.income.total < rules.filingThreshold) {
    recommendation = {
      status: '✓',
      title: 'Likely No Filing Required',
      description: `Your income is below the filing threshold of ${formatCurrency(rules.filingThreshold)} and you have no chargeable income. However, filing may still be beneficial for loan applications or official records.`,
      class: 'rec--no-file'
    };
  } else if (state.results.finalTax === 0) {
    recommendation = {
      status: '✓',
      title: 'Likely Zero Tax, But Should File',
      description: `Your tax is estimated to be zero, but you should still file a return to declare your income and claim refunds if applicable.`,
      class: 'rec--file-low'
    };
  } else if (state.results.finalTax < 1000) {
    recommendation = {
      status: '⚠️',
      title: 'Likely Need to File - Low Tax',
      description: `Your estimated tax is ${formatCurrency(state.results.finalTax)}. You likely need to file a tax return.`,
      class: 'rec--file-low'
    };
  } else if (state.results.finalTax < 5000) {
    recommendation = {
      status: '⚠️',
      title: 'Need to File - Some Tax Due',
      description: `Your estimated tax is ${formatCurrency(state.results.finalTax)}. You need to file a tax return and may need to make additional payment or receive a refund depending on your PCB/MTD.`,
      class: 'rec--file-mid'
    };
  } else {
    recommendation = {
      status: '⚠️',
      title: 'Need to File - Significant Tax',
      description: `Your estimated tax is ${formatCurrency(state.results.finalTax)}. You definitely need to file a tax return. Review your PCB/MTD payments to see if you need to pay more or will get a refund.`,
      class: 'rec--file-high'
    };
  }
  
  container.className = `recommendation-box ${recommendation.class}`;
  container.innerHTML = `
    <div class="recommendation-status">${recommendation.status}</div>
    <div class="recommendation-title">${recommendation.title}</div>
    <p class="recommendation-desc">${recommendation.description}</p>
  `;
}

// ============================================
// EVENT HANDLERS
// ============================================

/**
 * Navigate to a specific step
 * @param {string} step - Step ID
 */
function goToStep(step) {
  showSection(step);
}

/**
 * Handle tax year change
 */
function onTaxYearChange() {
  const select = document.getElementById('tax-year');
  state.taxYear = parseInt(select.value, 10);
  updateReliefCaps();
  updateReliefPreview();
  updateTaxYearDisplay();
}

/**
 * Handle resident status change
 */
function onResidentChange() {
  const radios = document.getElementsByName('resident-status');
  for (const radio of radios) {
    if (radio.checked) {
      state.residentStatus = radio.value;
      break;
    }
  }
  
  // Show/hide warning
  const warning = document.getElementById('resident-warning');
  if (warning) {
    warning.classList.toggle('hidden', state.residentStatus === 'resident');
  }
}

/**
 * Handle income input change
 */
function onIncomeChange() {
  const input = document.getElementById('annual-income');
  state.income.annual = parseNumber(input.value);
  updateIncomePreview();
}

/**
 * Handle bonus input change
 */
function onBonusChange() {
  const input = document.getElementById('bonus-income');
  state.income.bonus = parseNumber(input.value);
  updateIncomePreview();
}

/**
 * Handle MTD input change
 */
function onMtdChange() {
  const input = document.getElementById('mtd-paid');
  state.mtdPaid = parseNumber(input.value);
}

/**
 * Handle relief input change
 * @param {string} reliefType - Type of relief
 */
function onReliefChange(reliefType) {
  const input = document.getElementById(`relief-${reliefType}`);
  const value = parseNumber(input.value);
  
  // Clamp to cap
  const rules = taxRules[state.taxYear];
  const cap = rules?.relief?.[reliefType]?.cap || Infinity;
  
  if (value > cap) {
    input.value = cap;
    state.reliefs[reliefType] = cap;
  } else {
    state.reliefs[reliefType] = value;
  }
  
  updateReliefPreview();
}

/**
 * Reset and start over
 */
function resetAndStartOver() {
  // Reset state
  state.income = { annual: 0, bonus: 0, total: 0 };
  state.mtdPaid = 0;
  state.reliefs = {
    self: 0, epf: 0, socso: 0, lifestyle: 0,
    education: 0, medical: 0, parents: 0,
    sspn: 0, childcare: 0, prs: 0
  };
  state.results = {
    totalRelief: 0, chargeableIncome: 0, taxBeforeRebate: 0,
    rebate: 0, finalTax: 0, balance: 0, bracket: null
  };
  
  // Reset form inputs
  document.getElementById('annual-income').value = '';
  document.getElementById('bonus-income').value = '';
  document.getElementById('mtd-paid').value = '';
  
  Object.keys(state.reliefs).forEach(key => {
    const input = document.getElementById(`relief-${key}`);
    if (input) input.value = '';
  });
  
  // Reset to intro
  goToStep('intro');
  
  // Reset radio buttons
  const residentRadio = document.querySelector('input[name="resident-status"][value="resident"]');
  if (residentRadio) residentRadio.checked = true;
  onResidentChange();
  
  // Update previews
  updateIncomePreview();
  updateReliefPreview();
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the application
 */
function init() {
  // Check if banner was previously dismissed
  checkBannerState();
  
  // Populate tax year selector
  const yearSelect = document.getElementById('tax-year');
  if (yearSelect) {
    Object.keys(taxRules).sort((a, b) => b - a).forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = taxRules[year].description;
      yearSelect.appendChild(option);
    });
    
    // Set default
    yearSelect.value = state.taxYear;
  }
  
  // Initialize relief caps
  updateReliefCaps();
  
  // Update tax year display in UI
  updateTaxYearDisplay();
  
  // Set up default values for testing/demo (optional)
  // Uncomment the following lines for demo mode:
  /*
  document.getElementById('annual-income').value = '60000';
  document.getElementById('mtd-paid').value = '2400';
  document.getElementById('relief-self').value = '9000';
  document.getElementById('relief-epf').value = '3000';
  document.getElementById('relief-socso').value = '350';
  document.getElementById('relief-lifestyle').value = '1500';
  
  // Trigger updates
  onIncomeChange();
  onMtdChange();
  onReliefChange('self');
  onReliefChange('epf');
  onReliefChange('socso');
  onReliefChange('lifestyle');
  */
  
  // Initialize previews
  updateIncomePreview();
  updateReliefPreview();
}

// ============================================
// NEW TRUST & CLARITY UI FUNCTIONS
// ============================================

/**
 * Dismiss the top banner
 */
function dismissBanner() {
  const banner = document.getElementById('top-banner');
  if (banner) {
    banner.classList.add('hidden');
    // Store in localStorage so it stays dismissed
    try {
      localStorage.setItem('taxCheckBannerDismissed', 'true');
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

/**
 * Toggle collapsible card open/closed
 * @param {HTMLElement} header - The collapsible header element
 */
function toggleCollapsible(header) {
  const card = header.closest('.collapsible-card');
  if (card) {
    card.classList.toggle('open');
  }
}

/**
 * Toggle explain result section visibility
 */
function toggleExplainResult() {
  const content = document.getElementById('explain-result-content');
  const btnText = document.getElementById('explain-btn-text');
  
  if (content) {
    content.classList.toggle('hidden');
    const isVisible = !content.classList.contains('hidden');
    
    if (btnText) {
      btnText.textContent = isVisible ? '🔍 Hide explanation' : '🔍 Explain my result';
    }
  }
}

/**
 * Update tax year display in the UI
 */
function updateTaxYearDisplay() {
  const displayYear = document.getElementById('display-tax-year');
  if (displayYear) {
    displayYear.textContent = state.taxYear;
  }
}

/**
 * Check and restore banner state from localStorage
 */
function checkBannerState() {
  try {
    const dismissed = localStorage.getItem('taxCheckBannerDismissed');
    if (dismissed === 'true') {
      const banner = document.getElementById('top-banner');
      if (banner) banner.classList.add('hidden');
    }
  } catch (e) {
    // Ignore localStorage errors
  }
}

// ============================================
// PUBLIC API
// ============================================

// Expose functions to global scope for HTML event handlers
window.app = {
  goToStep,
  onTaxYearChange,
  onResidentChange,
  onIncomeChange,
  onBonusChange,
  onMtdChange,
  onReliefChange,
  calculateAndShowResults,
  resetAndStartOver,
  dismissBanner,
  toggleCollapsible,
  toggleExplainResult
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
