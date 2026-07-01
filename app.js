/*
  CHUNK // SOLVENCY
  Local-first state, no accounts, no tracking, no dependencies.
*/

const STORAGE_KEY = 'chunk-solvency-v1';
const VERSION = 1;

const ASSET_TYPES = {
  hardAsset: { label: 'Hard asset', short: 'Hard assets', color: '#9d8cff', description: 'Sellable only if you choose to turn a possession into cash.' },
  pipeline: { label: 'Pipeline', short: 'Pipeline', color: '#73c4ff', description: 'Expected money that has not landed yet.' },
  cash: { label: 'Immediate cash', short: 'True cash', color: '#66e0cf', description: 'Checking, physical cash, or money usable today.' },
  buffer: { label: 'Protected buffer', short: 'Buffer', color: '#8bb5ff', description: 'Deliberately separated savings, held out of active flow.' },
  investment: { label: 'Investment', short: 'Investment', color: '#b78cff', description: 'Optional to sell; may crystallize a loss or reduce future upside.' }
};

const EXPENSE_TYPES = {
  essential: { label: 'Essential', color: '#ffb66f' },
  flexible: { label: 'Flexible / variable', color: '#ffd47f' },
  oneoff: { label: 'One-off', color: '#ff9c8c' }
};

let state = loadState();
let editing = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function todayAtNoon() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
}

function addDays(date, days) {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
}

function toInputDate(date) {
  const d = typeof date === 'string' ? new Date(`${date}T12:00:00`) : date;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseInputDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function dateLabel(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function fullDateLabel(date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
}

function money(value, decimals = 0) {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(safe);
}

function compactMoney(value) {
  const abs = Math.abs(Number(value) || 0);
  if (abs >= 1000) return `$${(Number(value) / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  return money(value);
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function seededDemo() {
  const now = todayAtNoon();
  const upcomingRent = addDays(now, 9);
  return {
    version: VERSION,
    isDemo: true,
    settings: { taskPayout: 66, chunkSize: 100, forecastDays: 60 },
    assets: [
      { id: uid('asset'), name: 'Immediate cash', type: 'cash', amount: 420, expectedDate: '', confidence: 100, notes: 'Demo only' },
      { id: uid('asset'), name: 'Protected buffer', type: 'buffer', amount: 250, expectedDate: '', confidence: 100, notes: 'Demo only' },
      { id: uid('asset'), name: 'Likely task payout', type: 'pipeline', amount: 66, expectedDate: toInputDate(addDays(now, 2)), confidence: 90, notes: 'Demo only' },
      { id: uid('asset'), name: 'Long-horizon investment', type: 'investment', amount: 950, expectedDate: '', confidence: 100, notes: 'Demo only' },
      { id: uid('asset'), name: 'Optional sellable stuff', type: 'hardAsset', amount: 130, expectedDate: '', confidence: 100, notes: 'Demo only' }
    ],
    expenses: [
      { id: uid('expense'), name: 'Rent', amount: 925, cadence: 'monthly', type: 'essential', dueDay: upcomingRent.getDate(), dueDate: '', notes: 'Demo only' },
      { id: uid('expense'), name: 'Insurance', amount: 86, cadence: 'monthly', type: 'essential', dueDay: addDays(now, 4).getDate(), dueDate: '', notes: 'Demo only' },
      { id: uid('expense'), name: 'Food + fuel reserve', amount: 280, cadence: 'monthly', type: 'flexible', dueDay: addDays(now, 14).getDate(), dueDate: '', notes: 'Demo only' }
    ],
    debts: [
      { id: uid('debt'), name: 'Credit card', balance: 8950, minPayment: 263, dueDay: addDays(now, 18).getDate(), apr: 18.99, notes: 'Demo only' }
    ]
  };
}

function blankState() {
  return {
    version: VERSION,
    isDemo: false,
    settings: { taskPayout: 0, chunkSize: 100, forecastDays: 60 },
    assets: [],
    expenses: [],
    debts: []
  };
}

function normalizeState(raw) {
  const clean = raw && typeof raw === 'object' ? raw : seededDemo();
  return {
    version: VERSION,
    isDemo: Boolean(clean.isDemo),
    settings: {
      taskPayout: Number(clean.settings?.taskPayout) || 0,
      chunkSize: Math.max(25, Number(clean.settings?.chunkSize) || 100),
      forecastDays: clamp(Number(clean.settings?.forecastDays) || 60, 14, 180)
    },
    assets: Array.isArray(clean.assets) ? clean.assets.map((item) => ({
      id: item.id || uid('asset'),
      name: String(item.name || 'Untitled asset'),
      type: ASSET_TYPES[item.type] ? item.type : 'cash',
      amount: Math.max(0, Number(item.amount) || 0),
      expectedDate: item.expectedDate || '',
      confidence: clamp(Number(item.confidence) || 100, 0, 100),
      notes: String(item.notes || '')
    })) : [],
    expenses: Array.isArray(clean.expenses) ? clean.expenses.map((item) => ({
      id: item.id || uid('expense'),
      name: String(item.name || 'Untitled obligation'),
      amount: Math.max(0, Number(item.amount) || 0),
      cadence: item.cadence === 'oneoff' ? 'oneoff' : 'monthly',
      type: EXPENSE_TYPES[item.type] ? item.type : 'essential',
      dueDay: clamp(Number(item.dueDay) || 1, 1, 31),
      dueDate: item.dueDate || '',
      notes: String(item.notes || '')
    })) : [],
    debts: Array.isArray(clean.debts) ? clean.debts.map((item) => ({
      id: item.id || uid('debt'),
      name: String(item.name || 'Untitled debt'),
      balance: Math.max(0, Number(item.balance) || 0),
      minPayment: Math.max(0, Number(item.minPayment) || 0),
      dueDay: clamp(Number(item.dueDay) || 1, 1, 31),
      apr: Math.max(0, Number(item.apr) || 0),
      notes: String(item.notes || '')
    })) : []
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeState(JSON.parse(saved)) : seededDemo();
  } catch (error) {
    console.warn('Could not read saved state.', error);
    return seededDemo();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    $('#savedAt').textContent = `Saved ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date()).toLowerCase()}`;
  } catch (error) {
    console.warn('Could not save state.', error);
    $('#savedAt').textContent = 'Local save failed';
  }
}

function getAssetTotal(type) {
  return state.assets.filter((asset) => asset.type === type).reduce((sum, asset) => sum + asset.amount, 0);
}

function getMonthlyExpenses() {
  return state.expenses.filter((expense) => expense.cadence === 'monthly').reduce((sum, expense) => sum + expense.amount, 0);
}

function getMonthlyDebtMinimums() {
  return state.debts.reduce((sum, debt) => sum + debt.minPayment, 0);
}

function getDebtTotal() {
  return state.debts.reduce((sum, debt) => sum + debt.balance, 0);
}

function getNextMonthlyDates(day, start, end) {
  const dates = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1, 12, 0, 0, 0);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1, 12, 0, 0, 0);
  while (cursor <= endMonth) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), Math.min(day, daysInMonth(cursor.getFullYear(), cursor.getMonth())), 12, 0, 0, 0);
    if (date >= start && date <= end) dates.push(date);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1, 12, 0, 0, 0);
  }
  return dates;
}

function upcomingEvents(days = state.settings.forecastDays) {
  const start = todayAtNoon();
  const end = addDays(start, days);
  const events = [];

  state.assets.filter((asset) => asset.type === 'pipeline' && asset.expectedDate).forEach((asset) => {
    const date = parseInputDate(asset.expectedDate);
    if (date && date >= start && date <= end) {
      const confidence = clamp(asset.confidence, 0, 100);
      events.push({
        id: `pipeline-${asset.id}`,
        kind: 'income',
        name: asset.name,
        amount: asset.amount,
        effectiveAmount: asset.amount * (confidence / 100),
        date,
        meta: `${confidence}% confidence · pipeline`
      });
    }
  });

  state.expenses.forEach((expense) => {
    if (expense.cadence === 'oneoff') {
      const date = parseInputDate(expense.dueDate);
      if (date && date >= start && date <= end) {
        events.push({
          id: `expense-${expense.id}-${toInputDate(date)}`,
          kind: 'expense',
          name: expense.name,
          amount: expense.amount,
          effectiveAmount: -expense.amount,
          date,
          meta: `${EXPENSE_TYPES[expense.type].label} · one-off`
        });
      }
    } else {
      getNextMonthlyDates(expense.dueDay, start, end).forEach((date) => {
        events.push({
          id: `expense-${expense.id}-${toInputDate(date)}`,
          kind: 'expense',
          name: expense.name,
          amount: expense.amount,
          effectiveAmount: -expense.amount,
          date,
          meta: `${EXPENSE_TYPES[expense.type].label} · monthly`
        });
      });
    }
  });

  state.debts.forEach((debt) => {
    getNextMonthlyDates(debt.dueDay, start, end).forEach((date) => {
      events.push({
        id: `debt-${debt.id}-${toInputDate(date)}`,
        kind: 'debt',
        name: `${debt.name} minimum`,
        amount: debt.minPayment,
        effectiveAmount: -debt.minPayment,
        date,
        meta: `minimum payment · ${money(debt.balance)} remaining`
      });
    });
  });

  const order = { income: 0, expense: 1, debt: 2 };
  return events.sort((a, b) => a.date - b.date || order[a.kind] - order[b.kind] || a.name.localeCompare(b.name));
}

function calculate() {
  const activeCash = getAssetTotal('cash');
  const buffer = getAssetTotal('buffer');
  const pipeline = getAssetTotal('pipeline');
  const pipelineWeighted = state.assets.filter((a) => a.type === 'pipeline').reduce((sum, a) => sum + a.amount * (a.confidence / 100), 0);
  const investment = getAssetTotal('investment');
  const hardAssets = getAssetTotal('hardAsset');
  const monthlyExpenses = getMonthlyExpenses();
  const monthlyDebt = getMonthlyDebtMinimums();
  const monthlyWall = monthlyExpenses + monthlyDebt;
  const debtTotal = getDebtTotal();
  const dailyBurn = monthlyWall / 30;
  const runwayDays = dailyBurn > 0 ? Math.max(0, Math.floor(activeCash / dailyBurn)) : null;
  const events = upcomingEvents();
  let rolling = activeCash;
  let breach = activeCash < 0 ? todayAtNoon() : null;
  const mappedEvents = events.map((event) => {
    rolling += event.effectiveAmount;
    if (!breach && rolling < 0) breach = event.date;
    return { ...event, runningBalance: rolling };
  });
  const end = addDays(todayAtNoon(), state.settings.forecastDays);
  const essentialCoverage = monthlyWall > 0 ? activeCash / monthlyWall : null;
  return { activeCash, buffer, pipeline, pipelineWeighted, investment, hardAssets, monthlyExpenses, monthlyDebt, monthlyWall, debtTotal, dailyBurn, runwayDays, events: mappedEvents, breach, end, essentialCoverage };
}

function escapeHTML(text) {
  return String(text || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function chunksHTML(amount, color, chunkSize = state.settings.chunkSize) {
  const unit = Math.max(25, Number(chunkSize) || 100);
  const full = Math.floor(amount / unit);
  const remainder = amount - full * unit;
  const max = 24;
  let html = '';
  const visibleFull = Math.min(full, max);
  for (let index = 0; index < visibleFull; index += 1) html += '<i class="chunk"></i>';
  if (full > max) html += `<i class="chunk more">+${full - max}</i>`;
  if (remainder >= unit * .75) html += '<i class="chunk partial-75"></i>';
  else if (remainder >= unit * .5) html += '<i class="chunk partial-50"></i>';
  else if (remainder >= unit * .2) html += '<i class="chunk partial-25"></i>';
  return `<div class="chunk-grid" style="--layer:${color}">${html || '<span class="helper-copy">No chunks here</span>'}</div>`;
}

function renderNow(metrics) {
  const { activeCash, monthlyWall, runwayDays, debtTotal, breach, end, essentialCoverage } = metrics;
  const demoNotice = $('#demoNotice');
  demoNotice.hidden = !state.isDemo;

  $('#metricCash').textContent = money(activeCash);
  $('#metricCashMeta').textContent = activeCash > 0 ? 'Immediate liquid / active' : 'No true cash tracked yet';
  $('#metricWall').textContent = money(monthlyWall);
  $('#metricWallMeta').textContent = `${money(metrics.monthlyExpenses)} living · ${money(metrics.monthlyDebt)} debt mins`;
  $('#metricRunway').textContent = runwayDays === null ? '—' : `${runwayDays}d`;
  $('#metricRunwayMeta').textContent = runwayDays === null ? 'Add recurring obligations to calculate' : 'Using active cash only';
  $('#metricDebt').textContent = money(debtTotal);
  $('#metricDebtMeta').textContent = state.debts.length === 0 ? 'No dragons tracked' : `${money(metrics.monthlyDebt)} minimum / month`;

  const signal = $('#signalStatus');
  signal.classList.remove('at-risk', 'alert');
  if (monthlyWall <= 0 && activeCash <= 0) {
    $('#signalTitle').textContent = 'The field is blank. Start with what is real.';
    $('#signalBody').textContent = 'Add true cash, recurring obligations, and debt minimums. The instrument will turn them into a map.';
    signal.textContent = 'AWAITING SIGNAL';
  } else if (activeCash <= 0) {
    $('#signalTitle').textContent = 'No active cash is on the board.';
    $('#signalBody').textContent = 'The map can still show reserves and obligations, but it cannot claim present-day runway without true cash.';
    signal.textContent = 'ACTIVE DEFICIT';
    signal.classList.add('at-risk');
  } else if (breach) {
    $('#signalTitle').textContent = `Projected breach: ${dateLabel(breach)}.`;
    $('#signalBody').textContent = `The forecast runs below zero after the current sequence of expected inflows and scheduled obligations. This is not doom; it identifies the next wall.`;
    signal.textContent = 'THREAT VISIBLE';
    signal.classList.add('at-risk');
  } else if (essentialCoverage !== null && essentialCoverage < .7) {
    $('#signalTitle').textContent = `Active cash funds ${Math.floor(essentialCoverage * 100)}% of the monthly wall.`;
    $('#signalBody').textContent = `You have ${money(activeCash)} that is truly active. Pipeline and protected reserves exist, but they are not the same thing as cash on hand.`;
    signal.textContent = 'TIGHT BUT MAPPED';
    signal.classList.add('alert');
  } else if (essentialCoverage !== null && essentialCoverage < 1) {
    $('#signalTitle').textContent = `The monthly wall is ${Math.floor(essentialCoverage * 100)}% funded by active cash.`;
    $('#signalBody').textContent = `Close enough to be legible, not enough to forget. The next income chunk has a specific job waiting for it.`;
    signal.textContent = 'PARTIAL COVERAGE';
    signal.classList.add('alert');
  } else if (monthlyWall > 0) {
    $('#signalTitle').textContent = `Active cash clears the monthly wall.`;
    $('#signalBody').textContent = `The board remains projected-safe through ${dateLabel(end)} at the current recorded cadence. More surplus means more room to injure the debt dragons.`;
    signal.textContent = 'CLEAR FIELD';
  } else {
    $('#signalTitle').textContent = 'The board is holding liquid terrain.';
    $('#signalBody').textContent = 'There are no recurring obligations recorded yet, so the model cannot estimate runway. Add the monthly wall when ready.';
    signal.textContent = 'OPEN FIELD';
  }

  renderTaskImpact(metrics);
  renderPreviewTimeline(metrics.events);
}

function renderTaskImpact(metrics) {
  const task = state.settings.taskPayout;
  $('#taskPayout').textContent = task > 0 ? money(task) : '—';
  const node = $('#taskImpactText');
  if (!task) {
    node.textContent = 'Set a typical task payout in Settings. This becomes the app’s “what does one more task change?” lens.';
    return;
  }
  const wall = metrics.monthlyWall;
  const currentCoverage = wall > 0 ? metrics.activeCash / wall : null;
  const nextCoverage = wall > 0 ? (metrics.activeCash + task) / wall : null;
  const debt = metrics.debtTotal;
  const chunks = task / state.settings.chunkSize;

  if (wall <= 0) {
    node.innerHTML = `<b>${money(task)}</b> adds ${chunks.toFixed(chunks < 1 ? 2 : 1)} visual chunks to active cash. Add the monthly wall to see the actual defensive effect.`;
  } else if (metrics.activeCash < wall && metrics.activeCash + task >= wall) {
    node.innerHTML = `<b>${money(task)}</b> closes the current monthly-wall gap. It takes active coverage from ${Math.floor(currentCoverage * 100)}% to ${Math.floor(nextCoverage * 100)}%.`;
  } else if (metrics.activeCash < wall) {
    const remaining = Math.max(0, wall - metrics.activeCash - task);
    node.innerHTML = `<b>${money(task)}</b> takes monthly-wall coverage from ${Math.floor(currentCoverage * 100)}% to ${Math.floor(nextCoverage * 100)}%. <b>${money(remaining)}</b> would still remain unfunded.`;
  } else if (debt > 0) {
    const debtPercent = (task / debt) * 100;
    node.innerHTML = `If aimed at debt after obligations, <b>${money(task)}</b> removes ${debtPercent < .1 ? debtPercent.toFixed(2) : debtPercent.toFixed(1)}% of the recorded dragon total. Small bites become anatomy.`;
  } else {
    const days = metrics.dailyBurn > 0 ? Math.floor(task / metrics.dailyBurn) : null;
    node.innerHTML = `<b>${money(task)}</b> becomes additional optionality${days ? ` — about ${days} days of recorded burn` : ''}.`;
  }
}

function renderPreviewTimeline(events) {
  const node = $('#previewTimeline');
  const near = events.filter((event) => event.date <= addDays(todayAtNoon(), 30)).slice(0, 8);
  if (!near.length) {
    node.innerHTML = '<div class="empty-state"><strong>No timed events in the next 30 days.</strong><span>Add pipeline dates or recurring obligations to see time become visible.</span></div>';
    return;
  }
  node.innerHTML = near.map((event) => `
    <article class="mini-event ${event.kind}">
      <time>${dateLabel(event.date)}</time>
      <strong title="${escapeHTML(event.name)}">${escapeHTML(event.name)}</strong>
      <span>${event.kind === 'income' ? '+' : '−'}${money(event.amount)}</span>
    </article>
  `).join('');
}

function renderFlow(metrics) {
  const order = ['hardAsset', 'pipeline', 'cash', 'buffer', 'investment'];
  const ladder = $('#liquidityLadder');
  ladder.innerHTML = order.map((type) => {
    const definition = ASSET_TYPES[type];
    const assets = state.assets.filter((asset) => asset.type === type);
    const total = assets.reduce((sum, asset) => sum + asset.amount, 0);
    let descriptor = definition.description;
    if (type === 'pipeline' && assets.length) {
      const weighted = assets.reduce((sum, asset) => sum + asset.amount * (asset.confidence / 100), 0);
      descriptor = `${money(weighted)} weighted expectation across ${assets.length} item${assets.length === 1 ? '' : 's'}.`;
    }
    return `
      <article class="ladder-card" style="--layer:${definition.color}">
        <p class="ladder-label">${definition.short}</p>
        <strong>${money(total)}</strong>
        <small>${descriptor}</small>
        ${chunksHTML(total, definition.color)}
      </article>
    `;
  }).join('');

  const timeline = $('#timelineBoard');
  if (metrics.events.length) {
    timeline.innerHTML = metrics.events.map((event) => `
      <article class="flow-event ${event.kind}">
        <p class="event-date">${fullDateLabel(event.date)}</p>
        <h4>${escapeHTML(event.name)}</h4>
        <div class="event-amount">${event.kind === 'income' ? '+' : '−'}${money(event.amount)}</div>
        <span class="event-subtext">${escapeHTML(event.meta)}</span>
        <span class="running-balance ${event.runningBalance < 0 ? 'negative' : ''}">after: ${money(event.runningBalance)}</span>
      </article>
    `).join('');
  } else {
    timeline.innerHTML = '<div class="empty-state"><strong>The timeline has no events yet.</strong><span>Pipeline items need an expected date. Obligations need a recurring day or one-off due date.</span></div>';
  }

  const debts = $('#debtBoard');
  if (state.debts.length) {
    debts.innerHTML = state.debts.map((debt) => {
      const percentage = debt.balance > 0 && debt.minPayment > 0 ? ((debt.minPayment / debt.balance) * 100).toFixed(1) : '0';
      return `
        <article class="dragon-card">
          <p>Debt dragon</p>
          <h4>${escapeHTML(debt.name)}</h4>
          <strong>${money(debt.balance)}</strong>
          <span>${money(debt.minPayment)} minimum / mo · ${debt.apr ? `${debt.apr.toFixed(2)}% APR` : 'APR not entered'} · ${percentage}% monthly bite</span>
        </article>
      `;
    }).join('');
  } else {
    debts.innerHTML = '<div class="empty-state"><strong>No dragons on record.</strong><span>That might mean none exist, or simply that the map does not know about them yet.</span></div>';
  }
}

function renderLedger() {
  renderLedgerList('#assetLedger', state.assets, 'asset');
  renderLedgerList('#expenseLedger', state.expenses, 'expense');
  renderLedgerList('#debtLedger', state.debts, 'debt');
}

function ledgerDetails(item, type) {
  if (type === 'asset') {
    const def = ASSET_TYPES[item.type];
    const date = item.type === 'pipeline' && item.expectedDate ? ` · expected ${dateLabel(parseInputDate(item.expectedDate))} at ${item.confidence}%` : '';
    return { color: def.color, typeLabel: `${def.label}${date}`, amount: money(item.amount) };
  }
  if (type === 'expense') {
    const timing = item.cadence === 'monthly' ? `monthly · day ${item.dueDay}` : `one-off · ${item.dueDate ? dateLabel(parseInputDate(item.dueDate)) : 'no date'}`;
    return { color: EXPENSE_TYPES[item.type].color, typeLabel: `${EXPENSE_TYPES[item.type].label} · ${timing}`, amount: money(item.amount) };
  }
  return { color: '#e181b5', typeLabel: `${money(item.minPayment)} min / month · day ${item.dueDay}${item.apr ? ` · ${item.apr.toFixed(2)}% APR` : ''}`, amount: money(item.balance) };
}

function renderLedgerList(selector, items, type) {
  const node = $(selector);
  if (!items.length) {
    const template = $('#emptyStateTemplate');
    node.innerHTML = template.innerHTML;
    return;
  }
  node.innerHTML = items.map((item) => {
    const detail = ledgerDetails(item, type);
    return `
      <article class="ledger-item">
        <i class="ledger-pip" style="--item-color:${detail.color}"></i>
        <div>
          <h4>${escapeHTML(item.name)}</h4>
          <div class="ledger-meta">${escapeHTML(detail.typeLabel)}</div>
        </div>
        <strong class="ledger-amount">${detail.amount}</strong>
        <button class="edit-row" data-edit-type="${type}" data-edit-id="${item.id}">Edit</button>
      </article>
    `;
  }).join('');
}

function render() {
  const metrics = calculate();
  renderNow(metrics);
  renderFlow(metrics);
  renderLedger();
  saveState();
}

function assetFields(item = {}) {
  const type = item.type || 'cash';
  const expectedDate = item.expectedDate || '';
  const confidence = item.confidence ?? 100;
  return `
    <label class="field"><span>Name</span><input required name="name" maxlength="60" placeholder="e.g., checking account" value="${escapeHTML(item.name || '')}" /></label>
    <div class="field-row">
      <label class="field"><span>Amount</span><input required name="amount" inputmode="decimal" type="number" min="0" step="1" value="${Number(item.amount) || ''}" /></label>
      <label class="field"><span>Asset layer</span><select name="type">${Object.entries(ASSET_TYPES).map(([key, def]) => `<option value="${key}" ${key === type ? 'selected' : ''}>${def.label}</option>`).join('')}</select></label>
    </div>
    <div class="pipeline-fields" ${type === 'pipeline' ? '' : 'hidden'}>
      <div class="field-row">
        <label class="field"><span>Expected landing date</span><input name="expectedDate" type="date" value="${expectedDate}" /></label>
        <label class="field"><span>Confidence %</span><input name="confidence" inputmode="numeric" type="number" min="0" max="100" step="1" value="${confidence}" /></label>
      </div>
      <p class="helper-copy">Pipeline is shown at full value, but its date-flow effect is weighted by confidence.</p>
    </div>
    <label class="field"><span>Notes (optional)</span><textarea name="notes" maxlength="300" placeholder="Anything useful to remember…">${escapeHTML(item.notes || '')}</textarea></label>
  `;
}

function expenseFields(item = {}) {
  const cadence = item.cadence || 'monthly';
  const type = item.type || 'essential';
  return `
    <label class="field"><span>Name</span><input required name="name" maxlength="60" placeholder="e.g., rent" value="${escapeHTML(item.name || '')}" /></label>
    <div class="field-row">
      <label class="field"><span>Amount</span><input required name="amount" inputmode="decimal" type="number" min="0" step="1" value="${Number(item.amount) || ''}" /></label>
      <label class="field"><span>Kind</span><select name="type">${Object.entries(EXPENSE_TYPES).map(([key, def]) => `<option value="${key}" ${key === type ? 'selected' : ''}>${def.label}</option>`).join('')}</select></label>
    </div>
    <label class="field"><span>Cadence</span><select name="cadence"><option value="monthly" ${cadence === 'monthly' ? 'selected' : ''}>Monthly recurring</option><option value="oneoff" ${cadence === 'oneoff' ? 'selected' : ''}>One-off event</option></select></label>
    <div class="monthly-fields" ${cadence === 'monthly' ? '' : 'hidden'}>
      <label class="field"><span>Day of month due</span><input name="dueDay" inputmode="numeric" type="number" min="1" max="31" step="1" value="${Number(item.dueDay) || 1}" /></label>
    </div>
    <div class="oneoff-fields" ${cadence === 'oneoff' ? '' : 'hidden'}>
      <label class="field"><span>Due date</span><input name="dueDate" type="date" value="${item.dueDate || toInputDate(addDays(todayAtNoon(), 7))}" /></label>
    </div>
    <label class="field"><span>Notes (optional)</span><textarea name="notes" maxlength="300" placeholder="Anything useful to remember…">${escapeHTML(item.notes || '')}</textarea></label>
  `;
}

function debtFields(item = {}) {
  return `
    <label class="field"><span>Debt name</span><input required name="name" maxlength="60" placeholder="e.g., credit card" value="${escapeHTML(item.name || '')}" /></label>
    <div class="field-row">
      <label class="field"><span>Current balance</span><input required name="balance" inputmode="decimal" type="number" min="0" step="1" value="${Number(item.balance) || ''}" /></label>
      <label class="field"><span>Minimum payment</span><input required name="minPayment" inputmode="decimal" type="number" min="0" step="1" value="${Number(item.minPayment) || ''}" /></label>
    </div>
    <div class="field-row">
      <label class="field"><span>Due day</span><input name="dueDay" inputmode="numeric" type="number" min="1" max="31" step="1" value="${Number(item.dueDay) || 1}" /></label>
      <label class="field"><span>APR % (optional)</span><input name="apr" inputmode="decimal" type="number" min="0" max="100" step="0.01" value="${Number(item.apr) || ''}" /></label>
    </div>
    <label class="field"><span>Notes (optional)</span><textarea name="notes" maxlength="300" placeholder="Anything useful to remember…">${escapeHTML(item.notes || '')}</textarea></label>
  `;
}

function wireDynamicFields(type) {
  if (type === 'asset') {
    const selector = $('#editorFields select[name="type"]');
    selector?.addEventListener('change', () => {
      const visible = selector.value === 'pipeline';
      $('.pipeline-fields').hidden = !visible;
    });
  }
  if (type === 'expense') {
    const selector = $('#editorFields select[name="cadence"]');
    selector?.addEventListener('change', () => {
      const monthly = selector.value === 'monthly';
      $('.monthly-fields').hidden = !monthly;
      $('.oneoff-fields').hidden = monthly;
    });
  }
}

function openEditor(type, id = null) {
  const collectionName = type === 'asset' ? 'assets' : type === 'expense' ? 'expenses' : 'debts';
  const existing = id ? state[collectionName].find((item) => item.id === id) : null;
  editing = { type, id };
  $('#dialogEyebrow').textContent = existing ? 'EDIT ITEM' : `NEW ${type.toUpperCase()}`;
  $('#dialogTitle').textContent = existing ? `Edit ${existing.name}` : type === 'asset' ? 'Add an asset layer' : type === 'expense' ? 'Add an obligation' : 'Add a debt dragon';
  $('#deleteItemBtn').hidden = !existing;
  $('#editorFields').innerHTML = type === 'asset' ? assetFields(existing) : type === 'expense' ? expenseFields(existing) : debtFields(existing);
  wireDynamicFields(type);
  $('#editorDialog').showModal();
}

function closeEditor() {
  $('#editorDialog').close();
  editing = null;
}

function formNumber(data, key, fallback = 0) {
  const number = Number(data.get(key));
  return Number.isFinite(number) ? number : fallback;
}

function saveEditor(event) {
  event.preventDefault();
  if (!editing) return;
  const data = new FormData(event.currentTarget);
  const { type, id } = editing;
  const collectionName = type === 'asset' ? 'assets' : type === 'expense' ? 'expenses' : 'debts';
  let item;
  if (type === 'asset') {
    item = {
      id: id || uid('asset'),
      name: String(data.get('name') || '').trim(),
      type: ASSET_TYPES[data.get('type')] ? data.get('type') : 'cash',
      amount: Math.max(0, formNumber(data, 'amount')),
      expectedDate: String(data.get('expectedDate') || ''),
      confidence: clamp(formNumber(data, 'confidence', 100), 0, 100),
      notes: String(data.get('notes') || '').trim()
    };
  } else if (type === 'expense') {
    item = {
      id: id || uid('expense'),
      name: String(data.get('name') || '').trim(),
      amount: Math.max(0, formNumber(data, 'amount')),
      cadence: data.get('cadence') === 'oneoff' ? 'oneoff' : 'monthly',
      type: EXPENSE_TYPES[data.get('type')] ? data.get('type') : 'essential',
      dueDay: clamp(formNumber(data, 'dueDay', 1), 1, 31),
      dueDate: String(data.get('dueDate') || ''),
      notes: String(data.get('notes') || '').trim()
    };
  } else {
    item = {
      id: id || uid('debt'),
      name: String(data.get('name') || '').trim(),
      balance: Math.max(0, formNumber(data, 'balance')),
      minPayment: Math.max(0, formNumber(data, 'minPayment')),
      dueDay: clamp(formNumber(data, 'dueDay', 1), 1, 31),
      apr: Math.max(0, formNumber(data, 'apr')),
      notes: String(data.get('notes') || '').trim()
    };
  }
  if (!item.name) return;
  const index = state[collectionName].findIndex((entry) => entry.id === item.id);
  if (index >= 0) state[collectionName][index] = item;
  else state[collectionName].push(item);
  state.isDemo = false;
  closeEditor();
  render();
}

function deleteEditingItem() {
  if (!editing?.id) return;
  const label = editing.type === 'asset' ? 'asset' : editing.type === 'expense' ? 'obligation' : 'debt dragon';
  if (!window.confirm(`Delete this ${label} from the local board?`)) return;
  const collectionName = editing.type === 'asset' ? 'assets' : editing.type === 'expense' ? 'expenses' : 'debts';
  state[collectionName] = state[collectionName].filter((item) => item.id !== editing.id);
  state.isDemo = false;
  closeEditor();
  render();
}

function switchView(viewName) {
  $$('.mode-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.view === viewName));
  $$('[data-view-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.viewPanel === viewName));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function exportData() {
  const payload = { exportedAt: new Date().toISOString(), app: 'Chunk Solvency', data: state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `chunk-solvency-backup-${toInputDate(todayAtNoon())}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const raw = JSON.parse(reader.result);
      const incoming = raw.data || raw;
      if (!incoming || typeof incoming !== 'object') throw new Error('Not a Chunk backup.');
      if (!window.confirm('Replace the current local board with this backup?')) return;
      state = normalizeState(incoming);
      render();
    } catch (error) {
      window.alert(`Could not import that file. ${error.message}`);
    }
  };
  reader.readAsText(file);
}

function openSettings() {
  $('#settingTaskPayout').value = state.settings.taskPayout || '';
  $('#settingChunkSize').value = state.settings.chunkSize || 100;
  $('#settingForecastDays').value = state.settings.forecastDays || 60;
  $('#settingsDialog').showModal();
}

function saveSettings(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  state.settings.taskPayout = Math.max(0, formNumber(data, 'taskPayout'));
  state.settings.chunkSize = Math.max(25, formNumber(data, 'chunkSize', 100));
  state.settings.forecastDays = clamp(formNumber(data, 'forecastDays', 60), 14, 180);
  $('#settingsDialog').close();
  render();
}

function resetAll() {
  if (!window.confirm('Erase every saved number from this browser only? Export a backup first if you want to keep anything.')) return;
  state = blankState();
  $('#settingsDialog').close();
  render();
}

function bindEvents() {
  $$('.mode-tab').forEach((tab) => tab.addEventListener('click', () => switchView(tab.dataset.view)));
  $$('[data-jump-view]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.jumpView)));
  $$('[data-add]').forEach((button) => button.addEventListener('click', () => openEditor(button.dataset.add)));
  $('#addFlowItemBtn').addEventListener('click', () => openEditor('asset'));
  $('#editorForm').addEventListener('submit', saveEditor);
  $('#closeDialogBtn').addEventListener('click', closeEditor);
  $('#cancelDialogBtn').addEventListener('click', closeEditor);
  $('#deleteItemBtn').addEventListener('click', deleteEditingItem);
  $('#editorDialog').addEventListener('click', (event) => { if (event.target === $('#editorDialog')) closeEditor(); });

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-edit-type]');
    if (button) openEditor(button.dataset.editType, button.dataset.editId);
  });

  $('#settingsBtn').addEventListener('click', openSettings);
  $('#taskPayoutBtn').addEventListener('click', openSettings);
  $('#closeSettingsBtn').addEventListener('click', () => $('#settingsDialog').close());
  $('#cancelSettingsBtn').addEventListener('click', () => $('#settingsDialog').close());
  $('#settingsForm').addEventListener('submit', saveSettings);
  $('#resetAllBtn').addEventListener('click', resetAll);
  $('#settingsDialog').addEventListener('click', (event) => { if (event.target === $('#settingsDialog')) $('#settingsDialog').close(); });

  $('#exportBtn').addEventListener('click', exportData);
  $('#importBtn').addEventListener('click', () => $('#importInput').click());
  $('#importInput').addEventListener('change', (event) => {
    const [file] = event.target.files;
    if (file) importData(file);
    event.target.value = '';
  });

  $('#clearDemoBtn').addEventListener('click', () => {
    if (!window.confirm('Replace the demo terrain with an empty local board?')) return;
    state = blankState();
    render();
  });
  $('#loadDemoBtn').addEventListener('click', () => {
    if (!window.confirm('Replace the current local board with demo terrain? Export first if you need a backup.')) return;
    state = seededDemo();
    render();
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('Service worker registration failed.', error)));
  }
}

bindEvents();
render();
registerServiceWorker();
