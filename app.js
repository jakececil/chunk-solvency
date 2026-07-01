/*
  CHUNK // SOLVENCY v0.3
  Local-first financial terrain board. No backend. No tracking. No accounts.
*/

const STORAGE_KEY = 'chunk-solvency-v3';
const PREVIOUS_STORAGE_KEYS = ['chunk-solvency-v2', 'chunk-solvency-v1'];
const VERSION = 3;

const ASSET_TYPES = {
  hardAsset: { label: 'Hard asset', title: 'Hard assets', className: 'hard-assets', description: 'Sellable possessions. Least liquid. Useful only if you choose to sacrifice the object.' },
  pipeline: { label: 'Pipeline', title: 'Pipeline', className: 'pipeline', description: 'Expected money. Not real until it lands.' },
  cash: { label: 'True cash', title: 'True cash', className: 'current', description: 'Immediately accessible money. This is the active body.' },
  buffer: { label: 'Protected buffer', title: 'Buffer', className: 'buffer', description: 'Savings deliberately separated from active panic flow.' },
  investment: { label: 'Investment', title: 'Investments', className: 'investments', description: 'Conditional liquidity. Sellable, but possibly at a future cost.' }
};
const ASSET_ORDER = ['hardAsset', 'pipeline', 'cash', 'buffer', 'investment'];

const EXPENSE_TYPES = {
  essential: { label: 'Fixed / essential' },
  flexible: { label: 'Variable / flexible' },
  oneoff: { label: 'One-off' }
};

let state = loadState();
let editing = null;
let tuningTerritory = null;
let tuningValue = 0;
let dragStartX = null;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function todayAtNoon() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
}
function addDays(date, days) { const result = new Date(date); result.setDate(result.getDate() + days); return result; }
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function toInputDate(date) {
  const d = typeof date === 'string' ? new Date(`${date}T12:00:00`) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseInputDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}
function dateLabel(date) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date); }
function weekDay(date) { return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date).toUpperCase(); }
function money(value, decimals = 0) {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(safe);
}
function uid(prefix) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function escapeHTML(value) { return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
function escapeAttr(value) { return escapeHTML(value).replace(/`/g, '&#96;'); }
function number(value, fallback = 0) { return Number.isFinite(Number(value)) ? Number(value) : fallback; }
function numberOrZero(value) { return Math.max(0, number(value, 0)); }
function majorTileScale(value) { return clamp(Math.round(number(value, 100) / 100) * 100, 100, 2000); }
function weekHorizon(value) { return clamp(Math.round(number(value, 28) / 7) * 7, 14, 84); }

function quarterValue() { return Math.max(1, state.settings.chunkSize / 4); }
function roundToQuarter(value) {
  const q = quarterValue();
  return Math.max(0, Math.round((Number(value) || 0) / q) * q);
}
function amountToQuarters(value) {
  const amount = Number(value) || 0;
  if (amount <= 0) return 0;
  return Math.max(1, Math.round(amount / quarterValue()));
}
function quartersToAmount(quarters) { return quarters * quarterValue(); }
function chunkCountLabel(value) {
  const q = amountToQuarters(value);
  const chunks = q / 4;
  if (!q) return '0 chunks';
  const clean = Number.isInteger(chunks) ? String(chunks) : chunks.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return `${clean} chunk${chunks === 1 ? '' : 's'}`;
}

function seedDemo() {
  const now = todayAtNoon();
  return {
    version: VERSION,
    isDemo: true,
    settings: { taskPayout: 66, chunkSize: 100, forecastDays: 28 },
    territoryTotals: {},
    assets: [
      { id: uid('asset'), name: 'Checking / active cash', type: 'cash', amount: 420, expectedDate: '', confidence: 100, notes: 'Demo number' },
      { id: uid('asset'), name: 'Protected buffer', type: 'buffer', amount: 250, expectedDate: '', confidence: 100, notes: 'Demo number' },
      { id: uid('asset'), name: 'Likely DA payout', type: 'pipeline', amount: 66, expectedDate: toInputDate(addDays(now, 2)), confidence: 90, notes: 'Demo number' },
      { id: uid('asset'), name: 'Portfolio / conditional', type: 'investment', amount: 950, expectedDate: '', confidence: 100, notes: 'Demo number' },
      { id: uid('asset'), name: 'Sellable misc.', type: 'hardAsset', amount: 130, expectedDate: '', confidence: 100, notes: 'Demo number' }
    ],
    expenses: [
      { id: uid('expense'), name: 'Rent', amount: 925, cadence: 'monthly', type: 'essential', dueDay: addDays(now, 9).getDate(), dueDate: '', notes: 'Demo number' },
      { id: uid('expense'), name: 'Insurance', amount: 86, cadence: 'monthly', type: 'essential', dueDay: addDays(now, 4).getDate(), dueDate: '', notes: 'Demo number' },
      { id: uid('expense'), name: 'Food + fuel reserve', amount: 280, cadence: 'monthly', type: 'flexible', dueDay: addDays(now, 14).getDate(), dueDate: '', notes: 'Demo number' }
    ],
    debts: [
      { id: uid('debt'), name: 'Credit card', balance: 8950, minPayment: 263, dueDay: addDays(now, 18).getDate(), apr: 18.99, notes: 'Demo number' }
    ],
    desires: [
      { id: uid('desire'), name: 'Hollow Press books', target: 100, saved: 0, notes: 'Optional demo track' },
      { id: uid('desire'), name: 'Tools', target: 200, saved: 0, notes: 'Optional demo track' },
      { id: uid('desire'), name: 'Candy / mystery', target: 25, saved: 0, notes: 'Optional demo track' }
    ]
  };
}
function blankState() { return { version: VERSION, isDemo: false, settings: { taskPayout: 0, chunkSize: 100, forecastDays: 28 }, territoryTotals: {}, assets: [], expenses: [], debts: [], desires: [] }; }
function normalizeState(raw) {
  const source = raw && typeof raw === 'object' ? raw : seedDemo();
  const territoryTotals = {};
  ASSET_ORDER.forEach(type => {
    const value = Number(source.territoryTotals?.[type]);
    if (Number.isFinite(value) && value >= 0) territoryTotals[type] = value;
  });
  return {
    version: VERSION,
    isDemo: Boolean(source.isDemo),
    settings: {
      taskPayout: Math.max(0, number(source.settings?.taskPayout)),
      chunkSize: majorTileScale(source.settings?.chunkSize),
      forecastDays: weekHorizon(source.settings?.forecastDays)
    },
    territoryTotals,
    assets: Array.isArray(source.assets) ? source.assets.map(item => ({
      id: item.id || uid('asset'), name: String(item.name || 'Untitled money'), type: ASSET_TYPES[item.type] ? item.type : 'cash', amount: Math.max(0, number(item.amount)), expectedDate: item.expectedDate || '', confidence: clamp(number(item.confidence, 100), 0, 100), notes: String(item.notes || '')
    })) : [],
    expenses: Array.isArray(source.expenses) ? source.expenses.map(item => ({
      id: item.id || uid('expense'), name: String(item.name || 'Untitled obligation'), amount: Math.max(0, number(item.amount)), cadence: item.cadence === 'oneoff' ? 'oneoff' : 'monthly', type: EXPENSE_TYPES[item.type] ? item.type : 'essential', dueDay: clamp(number(item.dueDay, 1), 1, 31), dueDate: item.dueDate || '', notes: String(item.notes || '')
    })) : [],
    debts: Array.isArray(source.debts) ? source.debts.map(item => ({
      id: item.id || uid('debt'), name: String(item.name || 'Untitled dragon'), balance: Math.max(0, number(item.balance)), minPayment: Math.max(0, number(item.minPayment)), dueDay: clamp(number(item.dueDay, 1), 1, 31), apr: Math.max(0, number(item.apr)), notes: String(item.notes || '')
    })) : [],
    desires: Array.isArray(source.desires) ? source.desires.map(item => ({
      id: item.id || uid('desire'), name: String(item.name || 'Untitled life track'), target: Math.max(0, number(item.target)), saved: Math.max(0, number(item.saved)), notes: String(item.notes || '')
    })) : []
  };
}
function loadState() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return normalizeState(JSON.parse(current));
    for (const key of PREVIOUS_STORAGE_KEYS) {
      const old = localStorage.getItem(key);
      if (old) return normalizeState(JSON.parse(old));
    }
    return seedDemo();
  } catch (error) {
    console.warn('Could not read local board state.', error);
    return seedDemo();
  }
}
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const stamp = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date()).toUpperCase();
    $('#savedAt').textContent = `SAVED ${stamp}`;
  } catch (error) {
    console.warn('Could not save local board state.', error);
    $('#savedAt').textContent = 'LOCAL SAVE FAILED';
  }
}

function itemAssetTotal(type) { return state.assets.filter(item => item.type === type).reduce((sum, item) => sum + item.amount, 0); }
function territoryHasTotal(type) { return Number.isFinite(Number(state.territoryTotals?.[type])); }
function assetTotal(type) { return territoryHasTotal(type) ? Number(state.territoryTotals[type]) : itemAssetTotal(type); }
function monthlyExpenseTotal() { return state.expenses.filter(item => item.cadence === 'monthly').reduce((sum, item) => sum + item.amount, 0); }
function oneOffInHorizonTotal() { return upcomingEvents().filter(event => event.kind === 'expense' && event.cadence === 'oneoff').reduce((sum, event) => sum + event.amount, 0); }
function monthlyMinimumTotal() { return state.debts.reduce((sum, item) => sum + item.minPayment, 0); }
function debtTotal() { return state.debts.reduce((sum, item) => sum + item.balance, 0); }
function totalMonthlyWall() { return monthlyExpenseTotal() + monthlyMinimumTotal(); }

function nextMonthlyDates(dueDay, start, end) {
  const dates = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1, 12, 0, 0, 0);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1, 12, 0, 0, 0);
  while (cursor <= endMonth) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), Math.min(dueDay, daysInMonth(cursor.getFullYear(), cursor.getMonth())), 12, 0, 0, 0);
    if (date >= start && date <= end) dates.push(date);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1, 12, 0, 0, 0);
  }
  return dates;
}
function upcomingEvents(days = state.settings.forecastDays) {
  const start = todayAtNoon();
  const end = addDays(start, days);
  const events = [];
  state.assets.filter(item => item.type === 'pipeline' && item.expectedDate).forEach(item => {
    const date = parseInputDate(item.expectedDate);
    if (date && date >= start && date <= end) events.push({ id:`asset-${item.id}`, source:'asset', sourceId:item.id, kind:'income', name:item.name, amount:item.amount, effectiveAmount:item.amount * (item.confidence / 100), date, meta:`${item.confidence}% confidence` });
  });
  state.expenses.forEach(item => {
    if (item.cadence === 'oneoff') {
      const date = parseInputDate(item.dueDate);
      if (date && date >= start && date <= end) events.push({ id:`expense-${item.id}-${toInputDate(date)}`, source:'expense', sourceId:item.id, kind:'expense', expenseType:item.type, cadence:item.cadence, name:item.name, amount:item.amount, date, meta:'one-off obligation' });
    } else {
      nextMonthlyDates(item.dueDay, start, end).forEach(date => events.push({ id:`expense-${item.id}-${toInputDate(date)}`, source:'expense', sourceId:item.id, kind:'expense', expenseType:item.type, cadence:item.cadence, name:item.name, amount:item.amount, date, meta:'monthly obligation' }));
    }
  });
  state.debts.forEach(item => {
    nextMonthlyDates(item.dueDay, start, end).forEach(date => events.push({ id:`debt-${item.id}-${toInputDate(date)}`, source:'debt', sourceId:item.id, kind:'debt', name:`${item.name} minimum`, amount:item.minPayment, date, meta:'debt minimum' }));
  });
  return events.sort((a, b) => a.date - b.date || (a.kind === 'income' ? -1 : 1));
}
function flowProjection() {
  const start = todayAtNoon();
  let balance = assetTotal('cash');
  let breach = null;
  const points = [{ date:start, balance, event:null }];
  upcomingEvents().forEach(event => {
    balance += event.kind === 'income' ? event.effectiveAmount : -event.amount;
    const point = { date:event.date, balance, event };
    points.push(point);
    if (balance < 0 && !breach) breach = point;
  });
  return { start, points, breach, ending:balance };
}
function nextObligation() { return upcomingEvents().filter(event => event.kind !== 'income').sort((a,b) => a.date - b.date)[0] || null; }

function quarterCell(full) { return `<span class="quarter-cell ${full ? 'full' : 'empty'}"></span>`; }
function majorTileHTML(filledQuarters, className = '', attrs = '') {
  const q = clamp(Number(filledQuarters) || 0, 0, 4);
  return `<button type="button" class="flow-token ${className}" ${attrs}>${[1,2,3,4].map(i => quarterCell(i <= q)).join('')}</button>`;
}
function miniMajorHTML(filledQuarters, className = '') {
  const q = clamp(Number(filledQuarters) || 0, 0, 4);
  return `<span class="mini-major ${className}">${[1,2,3,4].map(i => quarterCell(i <= q)).join('')}</span>`;
}
function tileSeries(amount, className = '', max = Infinity) {
  const quarters = amountToQuarters(amount);
  if (!quarters) return '';
  const cells = Math.ceil(quarters / 4);
  const shown = Math.min(cells, max);
  let html = '';
  for (let i = 0; i < shown; i += 1) html += miniMajorHTML(Math.min(4, quarters - i * 4), className);
  if (cells > shown) html += `<span class="mini-overflow">+${cells - shown}</span>`;
  return html;
}
function emptyBlock(text) { return `<div class="empty-state">${escapeHTML(text)}</div>`; }

function renderHeader() {
  const cash = assetTotal('cash');
  const wall = totalMonthlyWall();
  const next = nextObligation();
  $('#activeCashReadout').textContent = money(cash);
  $('#bridgeTotal').textContent = money(cash);
  $('#monthlyWallTotal').textContent = money(wall);
  $('#minimumTotal').textContent = `${money(monthlyMinimumTotal())} / month`;
  $('#debtTotal').textContent = money(debtTotal());
  $('#taskPayout').textContent = state.settings.taskPayout ? money(state.settings.taskPayout) : '—';
  $('#taskImpactText').textContent = state.settings.taskPayout ? `${chunkCountLabel(state.settings.taskPayout)} of matter added to true cash.` : 'Set the usual complete-task payout in settings.';
  if (!next) {
    $('#countdownNumber').textContent = 'OPEN';
    $('#countdownLabel').textContent = 'No timed obligation is placed yet.';
  } else {
    const delta = Math.max(0, daysBetween(todayAtNoon(), next.date));
    $('#countdownNumber').textContent = `T−${delta}`;
    $('#countdownLabel').textContent = `${next.name} · ${money(next.amount)} · ${dateLabel(next.date)}`;
  }
  const projection = flowProjection();
  let verdict;
  if (!state.assets.length && !state.expenses.length && !state.debts.length) verdict = 'The board is empty. Place the first true number and the map will begin to exist.';
  else if (projection.breach) verdict = `Active cash breaches after ${projection.breach.event.name}. Another route is needed before ${dateLabel(projection.breach.date)}.`;
  else if (cash >= wall && wall > 0) verdict = 'The baseline monthly wall is funded by true cash. Now the interesting question is protection versus acceleration.';
  else if (wall > 0) verdict = `True cash covers ${Math.round((cash / wall) * 100)}% of the baseline monthly wall. The remaining gap still needs a route.`;
  else verdict = 'No monthly wall is defined. Place obligations before asking the board to forecast survival.';
  $('#verdictText').textContent = verdict;
  $('#demoBanner').hidden = !state.isDemo;
}

function renderTimeBoard() {
  const start = todayAtNoon();
  const days = state.settings.forecastDays;
  const events = upcomingEvents(days);
  const byDate = new Map();
  events.forEach(event => {
    const key = toInputDate(event.date);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(event);
  });
  const blanks = start.getDay();
  const html = [];
  for (let i = 0; i < blanks; i += 1) html.push('<div class="time-blank"></div>');
  for (let index = 0; index < days; index += 1) {
    const date = addDays(start, index);
    const list = byDate.get(toInputDate(date)) || [];
    const hasIncome = list.some(event => event.kind === 'income');
    const hasExpense = list.some(event => event.kind === 'expense' || event.kind === 'debt');
    const critical = list.some(event => event.kind !== 'income' && event.amount >= Math.max(assetTotal('cash'), 1));
    const eventHTML = list.slice(0, 3).map(event => `<button type="button" class="time-event ${event.kind}" data-edit-type="${event.source}" data-edit-id="${event.sourceId}">${escapeHTML(event.name)} · ${money(event.amount)}</button>`).join('') + (list.length > 3 ? `<span class="time-event more">+${list.length - 3} more</span>` : '');
    html.push(`<div class="time-cell ${index === 0 ? 'today' : ''} ${hasIncome ? 'has-income' : ''} ${hasExpense ? 'has-expense' : ''} ${critical ? 'is-critical' : ''}"><div class="time-dayline"><span class="time-day">${weekDay(date)}</span><span class="time-date">${date.getDate()}</span></div>${index === 0 ? '<span class="time-now">NOW</span>' : ''}<div class="time-events">${eventHTML}</div></div>`);
  }
  $('#timeCorridor').innerHTML = html.join('');
  $('#timeStart').textContent = `${dateLabel(start)} / now`;
  $('#timeEnd').textContent = `${dateLabel(addDays(start, days - 1))} / horizon`;
  const soon = events.filter(event => event.kind !== 'income').slice(0, 6);
  $('#nextEvents').innerHTML = soon.length ? soon.map(event => `<button type="button" class="event-card ${event.kind === 'income' ? 'income' : ''}" data-edit-type="${event.source}" data-edit-id="${event.sourceId}"><span class="event-date">${dateLabel(event.date)} · ${escapeHTML(event.meta)}</span><strong>${escapeHTML(event.name)}</strong><b>${money(event.amount)}</b></button>`).join('') : emptyBlock('No timed expenses in the current corridor. That may be true, or the board still needs dates.');
}

function flowSegment(label, amount, kind, attrs = {}, short = null) {
  const quarters = amountToQuarters(amount);
  return { label, amount, kind, quarters, cells: Math.ceil(quarters / 4), attrs, short: short || label };
}
function attrString(attrs) { return Object.entries(attrs).map(([k, v]) => `${k}="${escapeAttr(v)}"`).join(' '); }
function renderFlow() {
  $('#quarterReadout').textContent = `${money(state.settings.chunkSize)} / tile · ${money(quarterValue())} quarters`;
  const segments = [];
  ASSET_ORDER.forEach(type => segments.push(flowSegment(ASSET_TYPES[type].title, assetTotal(type), type, { 'data-adjust-territory': type }, ASSET_TYPES[type].label.toUpperCase())));
  state.expenses.forEach(expense => segments.push(flowSegment(expense.name, expense.amount, expense.type, { 'data-edit-type': 'expense', 'data-edit-id': expense.id }, expense.type.toUpperCase())));
  state.debts.forEach(debt => {
    segments.push(flowSegment(`${debt.name} minimum`, debt.minPayment, 'debt', { 'data-edit-type': 'debt', 'data-edit-id': debt.id }, 'MIN'));
    segments.push(flowSegment(`${debt.name} body`, debt.balance, 'debtMass', { 'data-edit-type': 'debt', 'data-edit-id': debt.id }, 'DRAGON'));
  });
  const active = segments.filter(segment => segment.quarters > 0);
  if (!active.length) {
    $('#flowGrid').innerHTML = emptyBlock('No chunks exist yet. Add cash, a bill, or a dragon and the body appears.');
    $('#flowLegend').innerHTML = '';
    return;
  }
  const grid = [];
  active.forEach(segment => {
    for (let i = 0; i < segment.cells; i += 1) {
      const filled = Math.min(4, segment.quarters - i * 4);
      const title = `${segment.label} · ${money(segment.amount)} · ${chunkCountLabel(segment.amount)}`;
      const attrs = { ...segment.attrs, title, 'aria-label': title };
      if (i === 0) attrs['data-short'] = segment.short;
      grid.push(majorTileHTML(filled, `${segment.kind} ${i === 0 ? 'flow-segment-start' : ''}`, attrString(attrs)));
    }
  });
  $('#flowGrid').innerHTML = grid.join('');
  $('#flowLegend').innerHTML = active.map(segment => {
    const attrs = attrString(segment.attrs);
    return `<button type="button" class="flow-legend-button ${segment.kind}" ${attrs}><span>${escapeHTML(segment.label)}</span><b>${money(segment.amount)}</b><span>${chunkCountLabel(segment.amount)}</span></button>`;
  }).join('');
}

function renderAssets() {
  ASSET_ORDER.forEach(type => {
    const total = assetTotal(type);
    const items = state.assets.filter(item => item.type === type);
    $(`#total-${type}`).textContent = money(total);
    $(`#chunks-${type}`).innerHTML = tileSeries(total, type, type === 'cash' ? 72 : 44) || emptyBlock(`No ${ASSET_TYPES[type].title.toLowerCase()} placed.`);
    const list = $(`#items-${type}`);
    const chips = items.length ? items.map(item => `<button type="button" class="item-chip" data-edit-type="asset" data-edit-id="${item.id}" title="Edit ${escapeAttr(item.name)}">${escapeHTML(item.name)} · ${money(item.amount)}${type === 'pipeline' && item.expectedDate ? ` · ${dateLabel(parseInputDate(item.expectedDate))}` : ''}</button>`).join('') : '<span class="item-chip">NO ENTRY</span>';
    const override = territoryHasTotal(type) ? `<span class="territory-override">TOTAL TUNER ACTIVE · ITEM SUM ${money(itemAssetTotal(type))}</span>` : '';
    list.innerHTML = chips + override;
  });
}
function renderObligations() {
  const all = [...state.expenses].sort((a, b) => (a.cadence === 'monthly' ? 0 : 1) - (b.cadence === 'monthly' ? 0 : 1) || b.amount - a.amount);
  if (!all.length) { $('#obligationBoard').innerHTML = emptyBlock('No obligations placed. Add rent, insurance, food/fuel, utilities, one-offs—whatever becomes materially true.'); return; }
  $('#obligationBoard').innerHTML = all.map(item => {
    const due = item.cadence === 'monthly' ? `monthly · day ${item.dueDay}` : `one-off · ${item.dueDate ? dateLabel(parseInputDate(item.dueDate)) : 'date required'}`;
    return `<button type="button" class="obligation ${item.type}" data-edit-type="expense" data-edit-id="${item.id}"><div class="obligation-top"><span>${escapeHTML(EXPENSE_TYPES[item.type].label)}</span><span>${due}</span></div><div class="obligation-name">${escapeHTML(item.name)}</div><div class="obligation-amount">${money(item.amount)}</div><div class="obligation-chunks">${tileSeries(item.amount, item.type, 10)}</div><div class="obligation-bottom"><span>${item.cadence === 'monthly' ? 'RECURRING' : 'SINGLE IMPACT'}</span><span>EDIT ↗</span></div></button>`;
  }).join('');
}
function renderDebts() {
  if (!state.debts.length) { $('#debtBoard').innerHTML = emptyBlock('No dragons released. Add a debt account to make its mass and monthly bite visible.'); return; }
  $('#debtBoard').innerHTML = state.debts.map(debt => `<button type="button" class="dragon-card" data-edit-type="debt" data-edit-id="${debt.id}"><div class="dragon-top"><span>DEBT DRAGON</span><span>${debt.apr ? `${debt.apr.toFixed(2)}% APR` : 'APR unspecified'}</span></div><div class="dragon-name">${escapeHTML(debt.name)}</div><div class="dragon-balance">${money(debt.balance)}</div><div class="dragon-meta"><span>minimum ${money(debt.minPayment)} / month</span><span>due day ${debt.dueDay}</span><span>${chunkCountLabel(debt.balance)}</span></div><div class="dragon-preview">${tileSeries(debt.balance, 'debtMass', 60)}</div><div class="dragon-bottom"><span>EDIT DRAGON ↗</span><strong>${Math.max(0, Math.ceil(debt.balance / Math.max(debt.minPayment, 1)))} MINIMUM PAYMENTS*</strong></div></button>`).join('');
}
function renderDesires() {
  if (!state.desires.length) { $('#desireBoard').innerHTML = emptyBlock('No sanctioned life tracks yet. This is where books, tools, toys, travel, weirdness, and non-punitive desire get a bounded address.'); return; }
  $('#desireBoard').innerHTML = state.desires.map(item => {
    const percent = item.target ? clamp((item.saved / item.target) * 100, 0, 100) : 0;
    return `<button type="button" class="desire-card" data-edit-type="desire" data-edit-id="${item.id}"><div class="desire-top"><span>TRACKED DESIRE</span><span>${Math.round(percent)}%</span></div><div class="desire-name">${escapeHTML(item.name)}</div><div class="desire-amount">${money(item.saved)} <small>/ ${money(item.target)}</small></div><div class="desire-line"><span style="width:${percent}%"></span></div><p class="desire-caption">${escapeHTML(item.notes || 'A bounded place for something that makes life feel like life.')}</p></button>`;
  }).join('');
}
function render() { renderHeader(); renderTimeBoard(); renderFlow(); renderAssets(); renderObligations(); renderDebts(); renderDesires(); saveState(); }

function showModalWithoutKeyboard(dialog) {
  if (dialog.open) return;
  dialog.showModal();
  requestAnimationFrame(() => {
    if (document.activeElement && document.activeElement !== dialog) document.activeElement.blur();
    dialog.focus({ preventScroll: true });
  });
}

function field(label, name, type = 'text', value = '', options = {}) {
  const extraClass = options.full ? ' full' : '';
  const attrs = options.attrs || '';
  const hint = options.hint ? `<small>${escapeHTML(options.hint)}</small>` : '';
  if (type === 'select') return `<label class="field${extraClass}"><span>${escapeHTML(label)}</span><select name="${name}" ${attrs}>${options.choices.map(choice => `<option value="${escapeAttr(choice.value)}" ${String(choice.value) === String(value) ? 'selected' : ''}>${escapeHTML(choice.label)}</option>`).join('')}</select>${hint}</label>`;
  if (type === 'textarea') return `<label class="field${extraClass}"><span>${escapeHTML(label)}</span><textarea name="${name}" ${attrs}>${escapeHTML(value)}</textarea>${hint}</label>`;
  return `<label class="field${extraClass}"><span>${escapeHTML(label)}</span><input type="${type}" name="${name}" value="${escapeAttr(value)}" ${attrs}/>${hint}</label>`;
}
function openEditor(type, id = null, forcedAssetType = null) {
  editing = { type, id, forcedAssetType };
  const list = type === 'asset' ? state.assets : type === 'expense' ? state.expenses : type === 'debt' ? state.debts : state.desires;
  const item = id ? list.find(entry => entry.id === id) : null;
  const title = { asset:'Money object', expense:'Obligation', debt:'Debt dragon', desire:'Sanctioned life track' }[type];
  $('#dialogKicker').textContent = id ? `EDIT ${title.toUpperCase()}` : `NEW ${title.toUpperCase()}`;
  $('#dialogTitle').textContent = id ? `Edit ${title.toLowerCase()}` : `Place a ${title.toLowerCase()}`;
  let html = '';
  if (type === 'asset') {
    const data = item || { name:'', type:forcedAssetType || 'cash', amount:'', expectedDate:'', confidence:100, notes:'' };
    html = field('Name', 'name', 'text', data.name, { attrs:'required', hint:'Use a name that remains legible at a glance.' }) +
      field('Liquidity territory', 'type', 'select', data.type, { choices:Object.entries(ASSET_TYPES).map(([value, info]) => ({ value, label:info.label })) }) +
      field('Amount', 'amount', 'number', data.amount, { attrs:'min="0" step="1" inputmode="decimal" required' }) +
      field('Expected landing date', 'expectedDate', 'date', data.expectedDate, { hint:'Only relevant for pipeline money.' }) +
      field('Pipeline confidence %', 'confidence', 'number', data.confidence, { attrs:'min="0" max="100" step="1" inputmode="numeric"' }) +
      field('Notes', 'notes', 'textarea', data.notes, { full:true, hint:'Optional. Notes live locally with the board.' });
  }
  if (type === 'expense') {
    const data = item || { name:'', amount:'', cadence:'monthly', type:'essential', dueDay:1, dueDate:'', notes:'' };
    html = field('Name', 'name', 'text', data.name, { attrs:'required' }) + field('Amount', 'amount', 'number', data.amount, { attrs:'min="0" step="1" inputmode="decimal" required' }) +
      field('Cadence', 'cadence', 'select', data.cadence, { choices:[{value:'monthly',label:'Monthly / recurring'}, {value:'oneoff',label:'One-off'}] }) + field('Impact type', 'type', 'select', data.type, { choices:Object.entries(EXPENSE_TYPES).map(([value,info])=>({value,label:info.label})) }) +
      field('Monthly due day', 'dueDay', 'number', data.dueDay, { attrs:'min="1" max="31" step="1" inputmode="numeric"', hint:'Used only for monthly entries.' }) + field('One-off due date', 'dueDate', 'date', data.dueDate, { hint:'Used only for one-off entries.' }) +
      field('Notes', 'notes', 'textarea', data.notes, { full:true });
  }
  if (type === 'debt') {
    const data = item || { name:'', balance:'', minPayment:'', dueDay:1, apr:'', notes:'' };
    html = field('Dragon name', 'name', 'text', data.name, { attrs:'required' }) + field('Current balance', 'balance', 'number', data.balance, { attrs:'min="0" step="1" inputmode="decimal" required' }) +
      field('Monthly minimum', 'minPayment', 'number', data.minPayment, { attrs:'min="0" step="1" inputmode="decimal" required' }) + field('Due day', 'dueDay', 'number', data.dueDay, { attrs:'min="1" max="31" step="1" inputmode="numeric" required' }) +
      field('APR', 'apr', 'number', data.apr, { attrs:'min="0" max="100" step="0.01" inputmode="decimal"' }) + field('Notes', 'notes', 'textarea', data.notes, { full:true });
  }
  if (type === 'desire') {
    const data = item || { name:'', target:'', saved:'', notes:'' };
    html = field('Track name', 'name', 'text', data.name, { attrs:'required', hint:'Books, tools, travel, toys, weirdness—whatever gets a bounded home.' }) + field('Target amount', 'target', 'number', data.target, { attrs:'min="0" step="1" inputmode="decimal" required' }) +
      field('Already allocated', 'saved', 'number', data.saved, { attrs:'min="0" step="1" inputmode="decimal"' }) + field('Why it exists', 'notes', 'textarea', data.notes, { full:true });
  }
  $('#editorFields').innerHTML = html;
  $('#deleteBtn').hidden = !id;
  showModalWithoutKeyboard($('#editorDialog'));
}
function readForm(form) { return Object.fromEntries(new FormData(form).entries()); }
function saveEditor(event) {
  event.preventDefault();
  const data = readForm(event.currentTarget);
  const { type, id } = editing;
  const oldAssetType = type === 'asset' && id ? state.assets.find(entry => entry.id === id)?.type : null;
  let item;
  if (type === 'asset') item = { id:id || uid('asset'), name:data.name.trim() || 'Untitled money', type:ASSET_TYPES[data.type] ? data.type : 'cash', amount:numberOrZero(data.amount), expectedDate:data.expectedDate || '', confidence:clamp(number(data.confidence, 100),0,100), notes:(data.notes || '').trim() };
  if (type === 'expense') item = { id:id || uid('expense'), name:data.name.trim() || 'Untitled obligation', amount:numberOrZero(data.amount), cadence:data.cadence === 'oneoff' ? 'oneoff' : 'monthly', type:EXPENSE_TYPES[data.type] ? data.type : 'essential', dueDay:clamp(number(data.dueDay, 1),1,31), dueDate:data.dueDate || '', notes:(data.notes || '').trim() };
  if (type === 'debt') item = { id:id || uid('debt'), name:data.name.trim() || 'Untitled dragon', balance:numberOrZero(data.balance), minPayment:numberOrZero(data.minPayment), dueDay:clamp(number(data.dueDay,1),1,31), apr:numberOrZero(data.apr), notes:(data.notes || '').trim() };
  if (type === 'desire') item = { id:id || uid('desire'), name:data.name.trim() || 'Untitled track', target:numberOrZero(data.target), saved:numberOrZero(data.saved), notes:(data.notes || '').trim() };
  const list = type === 'asset' ? state.assets : type === 'expense' ? state.expenses : type === 'debt' ? state.debts : state.desires;
  const index = list.findIndex(entry => entry.id === item.id);
  if (index >= 0) list[index] = item; else list.push(item);
  if (type === 'asset') {
    if (oldAssetType) delete state.territoryTotals[oldAssetType];
    delete state.territoryTotals[item.type];
  }
  state.isDemo = false;
  $('#editorDialog').close();
  render();
}
function deleteEditing() {
  if (!editing?.id) return;
  const list = editing.type === 'asset' ? state.assets : editing.type === 'expense' ? state.expenses : editing.type === 'debt' ? state.debts : state.desires;
  const found = list.find(entry => entry.id === editing.id);
  if (!found) return;
  if (!confirm(`Delete “${found.name}” from the board?`)) return;
  if (editing.type === 'asset') delete state.territoryTotals[found.type];
  list.splice(list.findIndex(entry => entry.id === editing.id), 1);
  state.isDemo = false;
  $('#editorDialog').close();
  render();
}

function syncTerritoryTuner(value) {
  tuningValue = numberOrZero(value);
  $('#territoryAmountInput').value = tuningValue;
  $('#territoryDialValue').textContent = `${money(tuningValue)} · ${chunkCountLabel(tuningValue)}`;
  $('#territoryTunerPreview').innerHTML = tileSeries(tuningValue, tuningTerritory || 'cash', 80) || emptyBlock('Zero chunks.');
  $('#territoryDial').setAttribute('aria-valuenow', String(tuningValue));
}
function openTerritory(type) {
  if (!ASSET_TYPES[type]) return;
  tuningTerritory = type;
  const total = assetTotal(type);
  $('#territoryDialogTitle').textContent = ASSET_TYPES[type].title;
  $('#territoryDialogDescription').textContent = ASSET_TYPES[type].description;
  $('#territoryModeNote').textContent = territoryHasTotal(type)
    ? `TOTAL TUNER ACTIVE · named item sum is ${money(itemAssetTotal(type))}.`
    : `Named item sum is ${money(itemAssetTotal(type))}. This tuner can set a direct board-level total without deleting those entries.`;
  $('#quarterLabelMinus').textContent = money(quarterValue());
  $('#quarterLabelPlus').textContent = money(quarterValue());
  $('#territoryAmountInput').step = quarterValue();
  syncTerritoryTuner(total);
  $('#returnToItemsBtn').hidden = !territoryHasTotal(type);
  showModalWithoutKeyboard($('#territoryDialog'));
}
function saveTerritory(event) {
  event.preventDefault();
  if (!tuningTerritory) return;
  const amount = numberOrZero($('#territoryAmountInput').value);
  state.territoryTotals[tuningTerritory] = amount;
  state.isDemo = false;
  $('#territoryDialog').close();
  tuningTerritory = null;
  render();
}
function closeTerritory() { $('#territoryDialog').close(); tuningTerritory = null; }
function nudgeTerritory(steps) { syncTerritoryTuner(tuningValue + steps * quarterValue()); }
function startDialDrag(event) { dragStartX = event.clientX; $('#territoryDial').setPointerCapture?.(event.pointerId); }
function moveDialDrag(event) {
  if (dragStartX === null) return;
  const delta = event.clientX - dragStartX;
  const steps = Math.trunc(delta / 20);
  if (steps !== 0) {
    nudgeTerritory(steps);
    dragStartX += steps * 20;
  }
}
function endDialDrag() { dragStartX = null; }

function saveSettings(event) {
  event.preventDefault();
  state.settings.taskPayout = numberOrZero($('#taskPayoutInput').value);
  state.settings.chunkSize = majorTileScale($('#chunkSizeInput').value);
  state.settings.forecastDays = weekHorizon($('#forecastDaysInput').value);
  $('#settingsDialog').close();
  render();
}
function openSettings() {
  $('#taskPayoutInput').value = state.settings.taskPayout;
  $('#chunkSizeInput').value = state.settings.chunkSize;
  $('#forecastDaysInput').value = state.settings.forecastDays;
  showModalWithoutKeyboard($('#settingsDialog'));
}

function exportState() {
  const payload = { exportedAt:new Date().toISOString(), app:'CHUNK // SOLVENCY', version:VERSION, state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `chunk-solvency-backup-${toInputDate(todayAtNoon())}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
function importState(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      state = normalizeState(data.state || data);
      state.isDemo = false;
      render();
      alert('Board imported. This browser’s local board has been replaced.');
    } catch (error) {
      alert('That file was not a valid CHUNK board backup.');
    }
  };
  reader.readAsText(file);
}

function handleBoardClick(event) {
  const add = event.target.closest('[data-add]');
  if (add) { event.preventDefault(); const mode = add.dataset.add; openEditor(mode === 'asset' ? 'asset' : mode === 'expense' ? 'expense' : mode === 'debt' ? 'debt' : 'desire'); return; }
  const edit = event.target.closest('[data-edit-type]');
  if (edit) { event.preventDefault(); openEditor(edit.dataset.editType, edit.dataset.editId); return; }
  const territory = event.target.closest('[data-territory],[data-adjust-territory]');
  if (territory) { event.preventDefault(); openTerritory(territory.dataset.territory || territory.dataset.adjustTerritory); }
}
function handleKeyDown(event) {
  const target = event.target?.matches?.('[data-territory],[data-adjust-territory]') ? event.target : null;
  if (target && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openTerritory(target.dataset.territory || target.dataset.adjustTerritory); }
  if (event.target.id === 'territoryDial') {
    if (event.key === 'ArrowLeft') { event.preventDefault(); nudgeTerritory(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); nudgeTerritory(1); }
  }
}
function hardenAgainstAccidentalZoom() {
  document.addEventListener('gesturestart', event => event.preventDefault(), { passive:false });
  let lastTouchEnd = 0;
  document.addEventListener('touchend', event => {
    const now = Date.now();
    if (now - lastTouchEnd <= 280) event.preventDefault();
    lastTouchEnd = now;
  }, { passive:false });
}

function initialise() {
  $('#exportBtn').addEventListener('click', exportState);
  $('#importBtn').addEventListener('click', () => $('#importInput').click());
  $('#importInput').addEventListener('change', event => importState(event.target.files[0]));
  $('#settingsBtn').addEventListener('click', openSettings);
  $('#taskImpactBtn').addEventListener('click', openSettings);
  $('#editorForm').addEventListener('submit', saveEditor);
  $('#deleteBtn').addEventListener('click', deleteEditing);
  $('#closeDialogBtn').addEventListener('click', () => $('#editorDialog').close());
  $('#cancelBtn').addEventListener('click', () => $('#editorDialog').close());
  $('#territoryForm').addEventListener('submit', saveTerritory);
  $('#closeTerritoryBtn').addEventListener('click', closeTerritory);
  $('#cancelTerritoryBtn').addEventListener('click', closeTerritory);
  $('#territoryAmountInput').addEventListener('input', event => syncTerritoryTuner(event.target.value));
  $$('#territoryDialog [data-territory-nudge]').forEach(button => button.addEventListener('click', () => nudgeTerritory(Number(button.dataset.territoryNudge))));
  $('#returnToItemsBtn').addEventListener('click', () => {
    if (!tuningTerritory) return;
    delete state.territoryTotals[tuningTerritory];
    state.isDemo = false;
    $('#territoryDialog').close();
    tuningTerritory = null;
    render();
  });
  $('#territoryDial').addEventListener('pointerdown', startDialDrag);
  $('#territoryDial').addEventListener('pointermove', moveDialDrag);
  $('#territoryDial').addEventListener('pointerup', endDialDrag);
  $('#territoryDial').addEventListener('pointercancel', endDialDrag);
  $('#settingsForm').addEventListener('submit', saveSettings);
  $('#closeSettingsBtn').addEventListener('click', () => $('#settingsDialog').close());
  $('#cancelSettingsBtn').addEventListener('click', () => $('#settingsDialog').close());
  $('#clearDemoBtn').addEventListener('click', () => { if (confirm('Start a clean board? Demo terrain will be removed.')) { state = blankState(); render(); } });
  $('#loadDemoBtn').addEventListener('click', () => { if (confirm('Replace the current board with demo terrain? Export first if you want a backup.')) { state = seedDemo(); render(); } });
  $('#resetBtn').addEventListener('click', () => { if (confirm('Erase all local board data? This cannot be undone unless you exported a backup.')) { state = blankState(); render(); } });
  document.addEventListener('click', handleBoardClick);
  document.addEventListener('keydown', handleKeyDown);
  hardenAgainstAccidentalZoom();
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  render();
}

document.addEventListener('DOMContentLoaded', initialise);
