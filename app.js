/*
  CHUNK // SOLVENCY v0.2
  A static, local-first financial terrain board.
  No backend. No tracking. No accounts. No dependencies.
*/

const STORAGE_KEY = 'chunk-solvency-v2';
const LEGACY_STORAGE_KEY = 'chunk-solvency-v1';
const VERSION = 2;

const ASSET_TYPES = {
  hardAsset: { label: 'Hard asset', title: 'Hard assets', description: 'Sellable possessions. This layer is intentionally treated as least-liquid.' },
  pipeline: { label: 'Pipeline', title: 'Pipeline', description: 'Expected income that has not arrived yet.' },
  cash: { label: 'True cash', title: 'True cash', description: 'Money accessible right now.' },
  buffer: { label: 'Protected buffer', title: 'Buffer', description: 'Savings deliberately separated from active flow.' },
  investment: { label: 'Investment', title: 'Investments', description: 'Capital that can be sold, possibly at a cost.' }
};

const EXPENSE_TYPES = {
  essential: { label: 'Fixed / essential' },
  flexible: { label: 'Variable / flexible' },
  oneoff: { label: 'One-off' }
};

let state = loadState();
let editing = null;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

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
function weekDay(date) { return new Intl.DateTimeFormat('en-US', { weekday: 'narrow' }).format(date); }
function money(value, decimals = 0) {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(safe);
}
function compactMoney(value) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  if (abs >= 1000) return `$${(n / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  return money(n);
}
function uid(prefix) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function escapeHTML(value) { return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
function escapeAttr(value) { return escapeHTML(value).replace(/`/g, '&#96;'); }

function seedDemo() {
  const now = todayAtNoon();
  return {
    version: VERSION,
    isDemo: true,
    settings: { taskPayout: 66, chunkSize: 100, forecastDays: 28 },
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

function blankState() {
  return { version: VERSION, isDemo: false, settings: { taskPayout: 0, chunkSize: 100, forecastDays: 28 }, assets: [], expenses: [], debts: [], desires: [] };
}

function normalizeState(raw) {
  const source = raw && typeof raw === 'object' ? raw : seedDemo();
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  return {
    version: VERSION,
    isDemo: Boolean(source.isDemo),
    settings: {
      taskPayout: Math.max(0, number(source.settings?.taskPayout)),
      chunkSize: clamp(number(source.settings?.chunkSize, 100), 25, 1000),
      forecastDays: clamp(number(source.settings?.forecastDays, 28), 14, 60)
    },
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
    const old = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (old) return normalizeState(JSON.parse(old));
    return seedDemo();
  } catch (error) {
    console.warn('Could not read local board state.', error);
    return seedDemo();
  }
}
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    $('#savedAt').textContent = `SAVED ${new Intl.DateTimeFormat('en-US', { hour:'numeric', minute:'2-digit' }).format(new Date()).toUpperCase()}`;
  } catch (error) {
    console.warn('Could not save local board state.', error);
    $('#savedAt').textContent = 'LOCAL SAVE FAILED';
  }
}

function assetTotal(type) { return state.assets.filter(item => item.type === type).reduce((sum, item) => sum + item.amount, 0); }
function monthlyExpenseTotal() { return state.expenses.filter(item => item.cadence === 'monthly').reduce((sum, item) => sum + item.amount, 0); }
function monthlyMinimumTotal() { return state.debts.reduce((sum, item) => sum + item.minPayment, 0); }
function debtTotal() { return state.debts.reduce((sum, item) => sum + item.balance, 0); }
function totalMonthlyWall() { return monthlyExpenseTotal() + monthlyMinimumTotal(); }
function nextMonthlyDates(dueDay, start, end) {
  const dates = []; let cursor = new Date(start.getFullYear(), start.getMonth(), 1, 12, 0, 0, 0); const endMonth = new Date(end.getFullYear(), end.getMonth(), 1, 12, 0, 0, 0);
  while (cursor <= endMonth) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), Math.min(dueDay, daysInMonth(cursor.getFullYear(), cursor.getMonth())), 12, 0, 0, 0);
    if (date >= start && date <= end) dates.push(date);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1, 12, 0, 0, 0);
  }
  return dates;
}

function upcomingEvents(days = state.settings.forecastDays) {
  const start = todayAtNoon(); const end = addDays(start, days); const events = [];
  state.assets.filter(item => item.type === 'pipeline' && item.expectedDate).forEach(item => {
    const date = parseInputDate(item.expectedDate);
    if (date && date >= start && date <= end) events.push({ id: `asset-${item.id}`, sourceId:item.id, source:'asset', kind:'income', name:item.name, amount:item.amount, effectiveAmount:item.amount * (item.confidence / 100), date, meta:`${item.confidence}% confidence` });
  });
  state.expenses.forEach(item => {
    if (item.cadence === 'oneoff') {
      const date = parseInputDate(item.dueDate);
      if (date && date >= start && date <= end) events.push({ id:`expense-${item.id}-${toInputDate(date)}`,sourceId:item.id,source:'expense',kind:'expense',expenseType:item.type,name:item.name,amount:item.amount,date,meta:'one-off obligation' });
    } else {
      nextMonthlyDates(item.dueDay, start, end).forEach(date => events.push({ id:`expense-${item.id}-${toInputDate(date)}`,sourceId:item.id,source:'expense',kind:'expense',expenseType:item.type,name:item.name,amount:item.amount,date,meta:'monthly obligation' }));
    }
  });
  state.debts.forEach(item => {
    nextMonthlyDates(item.dueDay, start, end).forEach(date => events.push({ id:`debt-${item.id}-${toInputDate(date)}`,sourceId:item.id,source:'debt',kind:'debt',name:`${item.name} minimum`,amount:item.minPayment,date,meta:'debt minimum' }));
  });
  return events.sort((a,b) => a.date - b.date || (a.kind === 'income' ? -1 : 1));
}

function flowProjection() {
  const start = todayAtNoon(); let balance = assetTotal('cash'); const events = upcomingEvents(); const points = [{date:start,balance,event:null}]; let breach = null;
  events.forEach(event => {
    balance += event.kind === 'income' ? event.effectiveAmount : -event.amount;
    const point = { date:event.date,balance,event };
    points.push(point);
    if (balance < 0 && !breach) breach = point;
  });
  return { start, points, breach, ending:balance };
}

function nextObligation() {
  return upcomingEvents().filter(event => event.kind !== 'income').sort((a,b)=>a.date-b.date)[0] || null;
}

function chunkMarkup(amount, className, max = 42, label = '') {
  const size = state.settings.chunkSize;
  const count = Math.max(0, Math.ceil((Number(amount) || 0) / size));
  if (!count) return `<div class="empty-state">No ${escapeHTML(label || 'chunks')} placed.</div>`;
  const shown = Math.min(count, max);
  let html = Array.from({ length: shown }, () => `<span class="chunk ${className}"></span>`).join('');
  if (count > shown) html += `<span class="chunk more">+${count - shown}</span>`;
  return html;
}

function miniChunkMarkup(amount, className, max = 8) {
  const count = Math.max(0, Math.ceil((Number(amount) || 0) / state.settings.chunkSize));
  const shown = Math.min(count, max);
  return Array.from({ length: shown }, () => `<span class="${className}"></span>`).join('') + (count > shown ? `<span class="${className}"></span>` : '');
}

function renderHeader() {
  const cash = assetTotal('cash'); const wall = totalMonthlyWall(); const next = nextObligation(); const days = state.settings.forecastDays;
  $('#activeCashReadout').textContent = money(cash); $('#bridgeTotal').textContent = money(cash); $('#monthlyWallTotal').textContent = money(wall); $('#minimumTotal').textContent = `${money(monthlyMinimumTotal())} / month`; $('#debtTotal').textContent = money(debtTotal());
  $('#taskPayout').textContent = state.settings.taskPayout ? money(state.settings.taskPayout) : '—';
  const taskText = state.settings.taskPayout ? `${Math.ceil((state.settings.taskPayout / state.settings.chunkSize) * 10) / 10} chunk(s) of matter added to true cash.` : 'Set the usual complete-task payout in settings.';
  $('#taskImpactText').textContent = taskText;
  if (!next) {
    $('#countdownNumber').textContent = 'OPEN'; $('#countdownLabel').textContent = 'No timed obligation is placed yet.';
  } else {
    const delta = Math.max(0, daysBetween(todayAtNoon(), next.date));
    $('#countdownNumber').textContent = `T−${delta}`; $('#countdownLabel').textContent = `${next.name} · ${money(next.amount)} · ${dateLabel(next.date)}`;
  }
  const projection = flowProjection();
  let verdict;
  if (!state.assets.length && !state.expenses.length && !state.debts.length) verdict = 'The board is empty. Place the first true number and the map will begin to exist.';
  else if (projection.breach) verdict = `Active cash becomes negative after ${projection.breach.event.name}. The wall needs another route before ${dateLabel(projection.breach.date)}.`;
  else if (cash >= wall && wall > 0) verdict = `The first monthly wall is funded by true cash. The next decision is about protecting or accelerating.`;
  else if (wall > 0) verdict = `True cash covers ${Math.round((cash / wall) * 100)}% of the baseline monthly wall. The remaining terrain still needs a route.`;
  else verdict = `No monthly wall is defined. Place obligations before asking the board to forecast survival.`;
  $('#verdictText').textContent = verdict;
  $('#demoBanner').hidden = !state.isDemo;
}

function renderTimeBoard() {
  const start = todayAtNoon(); const numberOfDays = state.settings.forecastDays; const events = upcomingEvents(numberOfDays); const map = new Map();
  events.forEach(event => { const key = toInputDate(event.date); if (!map.has(key)) map.set(key, []); map.get(key).push(event); });
  const cells = [];
  for (let index = 0; index < numberOfDays; index += 1) {
    const date = addDays(start, index); const list = map.get(toInputDate(date)) || []; const income = list.some(event => event.kind === 'income'); const expense = list.some(event => event.kind === 'expense'); const debt = list.some(event => event.kind === 'debt'); const isCritical = list.some(event => event.kind !== 'income' && event.amount >= Math.max(assetTotal('cash'), 1));
    const pips = list.slice(0,3).map(event => `<span class="event-pip ${event.kind === 'income' ? '' : event.kind}"></span>`).join('') + (list.length > 3 ? '<span class="event-pip more"></span>' : '');
    cells.push(`<div class="time-cell ${index === 0 ? 'today' : ''} ${income ? 'has-income' : ''} ${expense || debt ? 'has-expense' : ''} ${isCritical ? 'is-critical' : ''}" title="${escapeAttr(list.map(event => `${event.name}: ${money(event.amount)}`).join(' · ') || dateLabel(date))}"><span class="time-day">${index === 0 ? 'NOW' : weekDay(date)}</span><span class="time-date">${date.getDate()}</span><div class="time-events">${pips}</div></div>`);
  }
  const corridor = $('#timeCorridor'); corridor.style.setProperty('--days', numberOfDays); corridor.innerHTML = cells.join('');
  $('#timeStart').textContent = `${dateLabel(start)} / now`; $('#timeEnd').textContent = `${dateLabel(addDays(start, numberOfDays - 1))} / horizon`;
  const soon = events.filter(event => event.kind !== 'income').slice(0, 6);
  $('#nextEvents').innerHTML = soon.length ? soon.map(event => `<button class="event-card ${event.kind === 'income' ? 'income' : ''}" data-edit-type="${event.source}" data-edit-id="${event.sourceId}"><span class="event-date">${dateLabel(event.date)} · ${escapeHTML(event.meta)}</span><strong>${escapeHTML(event.name)}</strong><b>${money(event.amount)}</b></button>`).join('') : '<div class="empty-state">No timed expenses in the current corridor. That may be true, or it may mean the board still needs data.</div>';
}

function renderAssets() {
  Object.keys(ASSET_TYPES).forEach(type => {
    const total = assetTotal(type); const items = state.assets.filter(item => item.type === type);
    $(`#total-${type}`).textContent = money(total);
    $(`#chunks-${type}`).innerHTML = chunkMarkup(total, '', type === 'cash' ? 48 : 28, ASSET_TYPES[type].title.toLowerCase());
    const list = $(`#items-${type}`);
    list.innerHTML = items.length ? items.map(item => `<button class="item-chip" data-edit-type="asset" data-edit-id="${item.id}" title="Edit ${escapeAttr(item.name)}">${escapeHTML(item.name)} · ${money(item.amount)}${type === 'pipeline' && item.expectedDate ? ` · ${dateLabel(parseInputDate(item.expectedDate))}` : ''}</button>`).join('') : '<span class="item-chip">PLACE ENTRY</span>';
  });
}

function renderObligations() {
  const all = [...state.expenses].sort((a,b) => (a.cadence === 'monthly' ? 0 : 1) - (b.cadence === 'monthly' ? 0 : 1) || a.amount - b.amount);
  const board = $('#obligationBoard');
  if (!all.length) { board.innerHTML = '<div class="empty-state">No obligations placed. Add rent, insurance, food/fuel, utilities, one-offs—whatever becomes materially true.</div>'; return; }
  board.innerHTML = all.map(item => {
    const due = item.cadence === 'monthly' ? `monthly · day ${item.dueDay}` : `one-off · ${item.dueDate ? dateLabel(parseInputDate(item.dueDate)) : 'date required'}`;
    return `<button class="obligation ${item.type}" data-edit-type="expense" data-edit-id="${item.id}"><div class="obligation-top"><span>${escapeHTML(EXPENSE_TYPES[item.type].label)}</span><span>${due}</span></div><div class="obligation-name">${escapeHTML(item.name)}</div><div class="obligation-amount">${money(item.amount)}</div><div class="obligation-chunks">${miniChunkMarkup(item.amount, 'block')}</div><div class="obligation-bottom"><span>${item.cadence === 'monthly' ? 'RECURRING' : 'SINGLE IMPACT'}</span><span>EDIT ↗</span></div></button>`;
  }).join('');
}

function renderDebts() {
  const board = $('#debtBoard');
  if (!state.debts.length) { board.innerHTML = '<div class="empty-state">No dragons released. Add a debt account to make its mass and monthly bite visible.</div>'; return; }
  board.innerHTML = state.debts.map(debt => {
    const scale = Math.max(state.settings.chunkSize, Math.ceil(debt.balance / 100) / 10 * state.settings.chunkSize);
    const count = Math.ceil(debt.balance / scale); const shown = Math.min(count, 100);
    const cells = Array.from({ length: shown }, () => '<span class="dragon-cell"></span>').join('') + (count > shown ? `<span class="dragon-cell more">+${count - shown}</span>` : '');
    const label = scale === state.settings.chunkSize ? `${money(scale)} cells` : `${money(scale)} cells (adaptive)`;
    return `<button class="dragon-card" data-edit-type="debt" data-edit-id="${debt.id}"><div class="dragon-top"><span>DEBT DRAGON</span><span>${debt.apr ? `${debt.apr.toFixed(2)}% APR` : 'APR unspecified'}</span></div><div class="dragon-name">${escapeHTML(debt.name)}</div><div class="dragon-balance">${money(debt.balance)}</div><div class="dragon-meta"><span>minimum ${money(debt.minPayment)} / month</span><span>due day ${debt.dueDay}</span><span>${label}</span></div><div class="dragon-grid">${cells}</div><div class="dragon-bottom"><span>EDIT DRAGON ↗</span><strong>${Math.max(0, Math.ceil(debt.balance / Math.max(debt.minPayment,1)))} MINIMUM PAYMENTS*</strong></div></button>`;
  }).join('');
}

function renderDesires() {
  const board = $('#desireBoard');
  if (!state.desires.length) { board.innerHTML = '<div class="empty-state">No sanctioned life tracks yet. This is where books, tools, toys, travel, weirdness, and non-punitive desire get a bounded address.</div>'; return; }
  board.innerHTML = state.desires.map(item => {
    const percent = item.target ? clamp((item.saved / item.target) * 100, 0, 100) : 0;
    return `<button class="desire-card" data-edit-type="desire" data-edit-id="${item.id}"><div class="desire-top"><span>TRACKED DESIRE</span><span>${Math.round(percent)}%</span></div><div class="desire-name">${escapeHTML(item.name)}</div><div class="desire-amount">${money(item.saved)} <small>/ ${money(item.target)}</small></div><div class="desire-line"><span style="width:${percent}%"></span></div><p class="desire-caption">${escapeHTML(item.notes || 'A bounded place for something that makes life feel like life.')}</p></button>`;
  }).join('');
}

function render() { renderHeader(); renderTimeBoard(); renderAssets(); renderObligations(); renderDebts(); renderDesires(); saveState(); }

function field(label, name, type = 'text', value = '', options = {}) {
  const extraClass = options.full ? ' full' : ''; const attributes = options.attrs || ''; const hint = options.hint ? `<small>${escapeHTML(options.hint)}</small>` : '';
  if (type === 'select') return `<label class="field${extraClass}"><span>${escapeHTML(label)}</span><select name="${name}" ${attributes}>${options.choices.map(choice => `<option value="${escapeAttr(choice.value)}" ${String(choice.value) === String(value) ? 'selected' : ''}>${escapeHTML(choice.label)}</option>`).join('')}</select>${hint}</label>`;
  if (type === 'textarea') return `<label class="field${extraClass}"><span>${escapeHTML(label)}</span><textarea name="${name}" ${attributes}>${escapeHTML(value)}</textarea>${hint}</label>`;
  return `<label class="field${extraClass}"><span>${escapeHTML(label)}</span><input type="${type}" name="${name}" value="${escapeAttr(value)}" ${attributes}/>${hint}</label>`;
}

function openEditor(type, id = null, forcedAssetType = null) {
  editing = { type, id, forcedAssetType };
  const isNew = !id; let item;
  if (id) item = (type === 'asset' ? state.assets : type === 'expense' ? state.expenses : type === 'debt' ? state.debts : state.desires).find(entry => entry.id === id);
  const title = { asset:'Money object', expense:'Obligation', debt:'Debt dragon', desire:'Sanctioned life track' }[type];
  $('#dialogKicker').textContent = isNew ? `NEW ${title.toUpperCase()}` : `EDIT ${title.toUpperCase()}`;
  $('#dialogTitle').textContent = isNew ? `Place a ${title.toLowerCase()}` : `Edit ${title.toLowerCase()}`;
  let html = '';
  if (type === 'asset') {
    const data = item || { name:'', type:forcedAssetType || 'cash', amount:'', expectedDate:'', confidence:100, notes:'' };
    html = field('Name', 'name', 'text', data.name, { attrs:'required autofocus', hint:'Use a name that remains legible at a glance.' }) +
      field('Liquidity territory', 'type', 'select', data.type, { choices:Object.entries(ASSET_TYPES).map(([value, info]) => ({ value, label:info.label })) }) +
      field('Amount', 'amount', 'number', data.amount, { attrs:'min="0" step="1" inputmode="decimal" required' }) +
      field('Expected landing date', 'expectedDate', 'date', data.expectedDate, { hint:'Only relevant for pipeline money.' }) +
      field('Pipeline confidence %', 'confidence', 'number', data.confidence, { attrs:'min="0" max="100" step="1" inputmode="numeric"' }) +
      field('Notes', 'notes', 'textarea', data.notes, { full:true, hint:'Optional. Notes live locally with the board.' });
  }
  if (type === 'expense') {
    const data = item || { name:'', amount:'', cadence:'monthly', type:'essential', dueDay:1, dueDate:'', notes:'' };
    html = field('Name', 'name', 'text', data.name, { attrs:'required autofocus' }) + field('Amount', 'amount', 'number', data.amount, { attrs:'min="0" step="1" inputmode="decimal" required' }) +
      field('Cadence', 'cadence', 'select', data.cadence, { choices:[{value:'monthly',label:'Monthly / recurring'}, {value:'oneoff',label:'One-off'}] }) + field('Impact type', 'type', 'select', data.type, { choices:Object.entries(EXPENSE_TYPES).map(([value,info])=>({value,label:info.label})) }) +
      field('Monthly due day', 'dueDay', 'number', data.dueDay, { attrs:'min="1" max="31" step="1" inputmode="numeric"', hint:'Used only for monthly entries.' }) + field('One-off due date', 'dueDate', 'date', data.dueDate, { hint:'Used only for one-off entries.' }) +
      field('Notes', 'notes', 'textarea', data.notes, { full:true });
  }
  if (type === 'debt') {
    const data = item || { name:'', balance:'', minPayment:'', dueDay:1, apr:'', notes:'' };
    html = field('Dragon name', 'name', 'text', data.name, { attrs:'required autofocus' }) + field('Current balance', 'balance', 'number', data.balance, { attrs:'min="0" step="1" inputmode="decimal" required' }) +
      field('Monthly minimum', 'minPayment', 'number', data.minPayment, { attrs:'min="0" step="1" inputmode="decimal" required' }) + field('Due day', 'dueDay', 'number', data.dueDay, { attrs:'min="1" max="31" step="1" inputmode="numeric" required' }) +
      field('APR', 'apr', 'number', data.apr, { attrs:'min="0" max="100" step="0.01" inputmode="decimal"' }) + field('Notes', 'notes', 'textarea', data.notes, { full:true });
  }
  if (type === 'desire') {
    const data = item || { name:'', target:'', saved:'', notes:'' };
    html = field('Track name', 'name', 'text', data.name, { attrs:'required autofocus', hint:'Books, tools, travel, toys, weirdness—whatever gets a bounded home.' }) + field('Target amount', 'target', 'number', data.target, { attrs:'min="0" step="1" inputmode="decimal" required' }) +
      field('Already allocated', 'saved', 'number', data.saved, { attrs:'min="0" step="1" inputmode="decimal"' }) + field('Why it exists', 'notes', 'textarea', data.notes, { full:true });
  }
  $('#editorFields').innerHTML = html;
  $('#deleteBtn').hidden = isNew;
  $('#editorDialog').showModal();
}

function readForm(form) { return Object.fromEntries(new FormData(form).entries()); }
function numberOrZero(value) { return Math.max(0, Number(value) || 0); }
function saveEditor(event) {
  event.preventDefault(); const data = readForm(event.currentTarget); const { type, id } = editing; let item;
  if (type === 'asset') item = { id:id || uid('asset'), name:data.name.trim(), type:ASSET_TYPES[data.type] ? data.type : 'cash', amount:numberOrZero(data.amount), expectedDate:data.expectedDate || '', confidence:clamp(Number(data.confidence) || 0,0,100), notes:data.notes.trim() };
  if (type === 'expense') item = { id:id || uid('expense'), name:data.name.trim(), amount:numberOrZero(data.amount), cadence:data.cadence === 'oneoff' ? 'oneoff' : 'monthly', type:EXPENSE_TYPES[data.type] ? data.type : 'essential', dueDay:clamp(Number(data.dueDay) || 1,1,31), dueDate:data.dueDate || '', notes:data.notes.trim() };
  if (type === 'debt') item = { id:id || uid('debt'), name:data.name.trim(), balance:numberOrZero(data.balance), minPayment:numberOrZero(data.minPayment), dueDay:clamp(Number(data.dueDay) || 1,1,31), apr:numberOrZero(data.apr), notes:data.notes.trim() };
  if (type === 'desire') item = { id:id || uid('desire'), name:data.name.trim(), target:numberOrZero(data.target), saved:numberOrZero(data.saved), notes:data.notes.trim() };
  const list = type === 'asset' ? state.assets : type === 'expense' ? state.expenses : type === 'debt' ? state.debts : state.desires;
  const oldIndex = list.findIndex(entry => entry.id === item.id);
  if (oldIndex >= 0) list[oldIndex] = item; else list.push(item);
  state.isDemo = false; $('#editorDialog').close(); render();
}
function deleteEditing() {
  if (!editing?.id) return; const list = editing.type === 'asset' ? state.assets : editing.type === 'expense' ? state.expenses : editing.type === 'debt' ? state.debts : state.desires;
  const found = list.find(entry => entry.id === editing.id); if (!found) return; if (!confirm(`Delete “${found.name}” from the board?`)) return;
  const index = list.findIndex(entry => entry.id === editing.id); list.splice(index, 1); state.isDemo = false; $('#editorDialog').close(); render();
}

function saveSettings(event) {
  event.preventDefault(); state.settings.taskPayout = numberOrZero($('#taskPayoutInput').value); state.settings.chunkSize = clamp(Number($('#chunkSizeInput').value) || 100,25,1000); state.settings.forecastDays = clamp(Number($('#forecastDaysInput').value) || 28,14,60); $('#settingsDialog').close(); render();
}
function openSettings() { $('#taskPayoutInput').value = state.settings.taskPayout; $('#chunkSizeInput').value = state.settings.chunkSize; $('#forecastDaysInput').value = state.settings.forecastDays; $('#settingsDialog').showModal(); }

function exportState() {
  const payload = { exportedAt:new Date().toISOString(), app:'CHUNK // SOLVENCY', version:VERSION, state };
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'}); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href=url; anchor.download=`chunk-solvency-backup-${toInputDate(todayAtNoon())}.json`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
}
function importState(file) {
  if (!file) return; const reader = new FileReader(); reader.onload = () => {
    try { const data = JSON.parse(reader.result); state = normalizeState(data.state || data); state.isDemo = false; render(); alert('Board imported. The local browser state has been replaced.'); }
    catch (error) { alert('That file was not a valid CHUNK board backup.'); }
  }; reader.readAsText(file);
}

function handleBoardClick(event) {
  const add = event.target.closest('[data-add]'); if (add) { const mode = add.dataset.add; openEditor(mode === 'asset' ? 'asset' : mode === 'expense' ? 'expense' : mode === 'debt' ? 'debt' : 'desire'); return; }
  const edit = event.target.closest('[data-edit-type]'); if (edit) { openEditor(edit.dataset.editType, edit.dataset.editId); return; }
  const territory = event.target.closest('[data-territory]'); if (territory) { openEditor('asset', null, territory.dataset.territory); }
}
function handleKeyDown(event) {
  const territory = event.target.closest?.('[data-territory]');
  if (territory && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openEditor('asset', null, territory.dataset.territory); }
}

function initialise() {
  $('#exportBtn').addEventListener('click', exportState); $('#importBtn').addEventListener('click', () => $('#importInput').click()); $('#importInput').addEventListener('change', event => importState(event.target.files[0]));
  $('#settingsBtn').addEventListener('click', openSettings); $('#taskImpactBtn').addEventListener('click', openSettings); $('#editorForm').addEventListener('submit', saveEditor); $('#deleteBtn').addEventListener('click', deleteEditing); $('#closeDialogBtn').addEventListener('click', () => $('#editorDialog').close()); $('#cancelBtn').addEventListener('click', () => $('#editorDialog').close());
  $('#settingsForm').addEventListener('submit', saveSettings); $('#closeSettingsBtn').addEventListener('click', () => $('#settingsDialog').close()); $('#cancelSettingsBtn').addEventListener('click', () => $('#settingsDialog').close());
  $('#clearDemoBtn').addEventListener('click', () => { if (confirm('Start a clean board? Demo terrain will be removed.')) { state = blankState(); render(); }});
  $('#loadDemoBtn').addEventListener('click', () => { if (confirm('Replace the current board with demo terrain? Export first if you want a backup.')) { state = seedDemo(); render(); }});
  $('#resetBtn').addEventListener('click', () => { if (confirm('Erase all local board data? This cannot be undone unless you exported a backup.')) { state = blankState(); render(); }});
  document.addEventListener('click', handleBoardClick); document.addEventListener('keydown', handleKeyDown);
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  render();
}

document.addEventListener('DOMContentLoaded', initialise);
