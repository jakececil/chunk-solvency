const VERSION = 8;
const KEY = 'chunk-solvency-v8';
const OLD_KEYS = ['chunk-solvency-v7', 'chunk-solvency-v6', 'chunk-solvency-v5', 'chunk-solvency-v4', 'chunk-solvency-v3', 'chunk-solvency-v2', 'chunk-solvency-v1'];

const A = {
  hardAsset: ['Hard assets', 'HARD ASSET', 'hard', 'Sellable possessions. Least liquid.'],
  pipeline: ['Pipeline', 'PIPELINE', 'pipeline', 'Expected money. Not active cash until it lands.'],
  cash: ['True cash', 'TRUE CASH', 'cash', 'Immediately accessible money.'],
  buffer: ['Protected buffer', 'PROTECTED BUFFER', 'buffer', 'Money deliberately separated from active panic.'],
  investment: ['Investments', 'INVESTMENTS', 'invest', 'Conditional liquidity with a future cost.']
};
const ORDER = ['hardAsset', 'pipeline', 'cash', 'buffer', 'investment'];
const E = {
  essential: ['FIXED / ESSENTIAL', 'ess'],
  flexible: ['VARIABLE / FLEXIBLE', 'flex'],
  oneoff: ['ONE-OFF', 'one']
};
const COLOR = {
  hard: 'var(--hard)', pipeline: 'var(--pipe)', cash: 'var(--cash)', buffer: 'var(--buffer)',
  invest: 'var(--invest)', ess: 'var(--ess)', flex: 'var(--flex)', one: 'var(--one)',
  debt: 'var(--debt)', mass: 'var(--mass)'
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const nn = (value) => Math.max(0, n(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[character]));
const fmt = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(nn(value));
const today = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
};
const add = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};
const iso = (date) => {
  const value = date instanceof Date ? date : new Date(`${date}T12:00:00`);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
};
const parse = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? new Date(`${value}T12:00:00`) : null;
const label = (date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
const wk = (date) => new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date).toUpperCase();
const tuneStep = () => 25;
const nextCycleISO = () => {
  const base = today();
  return iso(new Date(base.getFullYear(), base.getMonth() + 1, 1, 12));
};
const safeCycleISO = (value) => {
  const candidate = parse(value);
  const start = today();
  return candidate && candidate >= start ? iso(candidate) : nextCycleISO();
};

let state;
let quick = null;
let qDraft = 0;
let dayKey = null;
let dayDraft = 0;
let earnedDraft = 0;
let editor = null;
let sheet = null;
let drag = null;

function blank() {
  return {
    version: VERSION,
    isDemo: false,
    settings: {
      taskPayout: 0,
      cellQuantum: 100,
      forecastDays: 28,
      bodyMode: 'ledger',
      tailMode: 'stacked',
      cardMode: 'exact',
      cycleDeadline: nextCycleISO(),
      hiddenSegments: {}
    },
    territoryTotals: {},
    calendarGoals: {},
    earningsLog: {},
    assets: [],
    expenses: [],
    debts: [],
    desires: []
  };
}

function demo() {
  const date = today();
  return {
    version: VERSION,
    isDemo: true,
    settings: { taskPayout: 66, cellQuantum: 100, forecastDays: 28, bodyMode: 'ledger', tailMode: 'stacked', cardMode: 'exact', cycleDeadline: nextCycleISO(), hiddenSegments: {} },
    territoryTotals: {},
    calendarGoals: {},
    earningsLog: {},
    assets: [
      { id: uid('a'), name: 'Checking / active cash', type: 'cash', amount: 420, expectedDate: '', confidence: 100, notes: '' },
      { id: uid('a'), name: 'Protected buffer', type: 'buffer', amount: 250, expectedDate: '', confidence: 100, notes: '' },
      { id: uid('a'), name: 'Likely DA payout', type: 'pipeline', amount: 66, expectedDate: iso(add(date, 2)), confidence: 90, notes: '' },
      { id: uid('a'), name: 'Portfolio / conditional', type: 'investment', amount: 950, expectedDate: '', confidence: 100, notes: '' },
      { id: uid('a'), name: 'Sellable misc.', type: 'hardAsset', amount: 130, expectedDate: '', confidence: 100, notes: '' }
    ],
    expenses: [
      { id: uid('e'), name: 'Rent', amount: 925, cadence: 'monthly', type: 'essential', dueDay: add(date, 9).getDate(), dueDate: '', notes: '' },
      { id: uid('e'), name: 'Insurance', amount: 86, cadence: 'monthly', type: 'essential', dueDay: add(date, 4).getDate(), dueDate: '', notes: '' },
      { id: uid('e'), name: 'Food + fuel reserve', amount: 280, cadence: 'monthly', type: 'flexible', dueDay: add(date, 14).getDate(), dueDate: '', notes: '' }
    ],
    debts: [
      { id: uid('d'), name: 'Credit card', balance: 9200, minPayment: 263, dueDay: add(date, 18).getDate(), apr: 18.99, notes: '' }
    ],
    desires: [
      { id: uid('l'), name: 'Hollow Press books', target: 100, saved: 0, notes: 'Bounded book hunger.' },
      { id: uid('l'), name: 'Tools', target: 200, saved: 0, notes: 'Useful object accumulation.' },
      { id: uid('l'), name: 'Candy / mystery', target: 25, saved: 0, notes: 'A little sanctioned nonsense.' }
    ]
  };
}

function normalize(input) {
  const source = input && typeof input === 'object' ? input : blank();
  const territoryTotals = {};
  const calendarGoals = {};
  const earningsLog = {};
  const hiddenSegments = source.settings?.hiddenSegments && typeof source.settings.hiddenSegments === 'object'
    ? source.settings.hiddenSegments
    : {};

  ORDER.forEach((type) => {
    if (Number.isFinite(Number(source.territoryTotals?.[type])) && Number(source.territoryTotals[type]) >= 0) {
      territoryTotals[type] = Number(source.territoryTotals[type]);
    }
  });

  Object.entries(source.calendarGoals || source.dayGoals || {}).forEach(([key, value]) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key) && nn(value) > 0) calendarGoals[key] = nn(value);
  });
  Object.entries(source.earningsLog || source.earnedLog || {}).forEach(([key, value]) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key) && nn(value) > 0) earningsLog[key] = nn(value);
  });

  const legacyBeforeSix = n(source.version, 0) < 6;
  const legacyBeforeSeven = n(source.version, 0) < 7;
  const migratedQuantum = legacyBeforeSix ? 100 : (source.settings?.cellQuantum ?? (source.settings?.chunkSize ? Math.max(25, Math.round(n(source.settings.chunkSize) / 4)) : 100));
  const cellQuantum = Number(migratedQuantum) === 100 ? 100 : 25;
  const cycleDeadline = safeCycleISO(source.settings?.cycleDeadline);
  const cardMode = source.settings?.cardMode === 'compact' ? 'compact' : 'exact';

  return {
    version: VERSION,
    isDemo: !!source.isDemo,
    settings: {
      taskPayout: nn(source.settings?.taskPayout),
      cellQuantum,
      forecastDays: clamp(Math.round(n(source.settings?.forecastDays, 28) / 7) * 7, 14, 84),
      bodyMode: legacyBeforeSix ? 'ledger' : (['ledger', 'flow', 'exploded'].includes(source.settings?.bodyMode) ? source.settings.bodyMode : 'ledger'),
      tailMode: legacyBeforeSeven ? 'stacked' : (source.settings?.tailMode === 'inline' ? 'inline' : 'stacked'),
      cardMode,
      cycleDeadline,
      hiddenSegments: Object.fromEntries(Object.entries(hiddenSegments).filter(([, hidden]) => !!hidden))
    },
    territoryTotals,
    calendarGoals,
    earningsLog,
    assets: (source.assets || []).map((item) => ({
      id: item.id || uid('a'), name: String(item.name || 'Untitled money'), type: A[item.type] ? item.type : 'cash',
      amount: nn(item.amount), expectedDate: item.expectedDate || '', confidence: clamp(n(item.confidence, 100), 0, 100), notes: String(item.notes || '')
    })),
    expenses: (source.expenses || []).map((item) => ({
      id: item.id || uid('e'), name: String(item.name || 'Untitled obligation'), amount: nn(item.amount),
      cadence: item.cadence === 'oneoff' ? 'oneoff' : 'monthly', type: E[item.type] ? item.type : 'essential',
      dueDay: clamp(Math.round(n(item.dueDay, 1)), 1, 31), dueDate: item.dueDate || '', notes: String(item.notes || '')
    })),
    debts: (source.debts || []).map((item) => ({
      id: item.id || uid('d'), name: String(item.name || 'Untitled dragon'), balance: nn(item.balance), minPayment: nn(item.minPayment),
      dueDay: clamp(Math.round(n(item.dueDay, 1)), 1, 31), apr: nn(item.apr), notes: String(item.notes || '')
    })),
    desires: (source.desires || []).map((item) => ({
      id: item.id || uid('l'), name: String(item.name || 'Untitled track'), target: nn(item.target), saved: nn(item.saved), notes: String(item.notes || '')
    }))
  };
}

function load() {
  try {
    let saved = localStorage.getItem(KEY);
    if (saved) return normalize(JSON.parse(saved));
    for (const oldKey of OLD_KEYS) {
      saved = localStorage.getItem(oldKey);
      if (saved) return normalize(JSON.parse(saved));
    }
  } catch (error) {
    console.warn('Unable to load local CHUNK state.', error);
  }
  return demo();
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Unable to save local CHUNK state.', error);
  }
  const saved = $('#saved');
  if (saved) saved.textContent = `SAVED LOCALLY · ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date())}`;
}

const sum = (items, key) => items.reduce((total, item) => total + nn(item[key]), 0);
const itemTotal = (type) => sum(state.assets.filter((item) => item.type === type), 'amount');
const hasOverride = (type) => Object.prototype.hasOwnProperty.call(state.territoryTotals, type);
const total = (type) => hasOverride(type) ? nn(state.territoryTotals[type]) : itemTotal(type);
const debtTotal = () => sum(state.debts, 'balance');
const minTotal = () => sum(state.debts, 'minPayment');
const expenseTotal = () => sum(state.expenses.filter((item) => item.cadence === 'monthly'), 'amount');
const wall = () => expenseTotal() + minTotal();
const quantum = () => state.settings.cellQuantum === 100 ? 100 : 25;
const sameMonth = (date, reference = today()) => date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear();
const loggedInMonth = (offset = 0) => {
  const reference = new Date(today().getFullYear(), today().getMonth() + offset, 1, 12);
  return Object.entries(state.earningsLog || {}).reduce((total, [key, value]) => {
    const date = parse(key);
    return date && date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear() ? total + nn(value) : total;
  }, 0);
};
const goalInRange = (start, end) => Object.entries(state.calendarGoals || {}).reduce((total, [key, value]) => {
  const date = parse(key);
  return date && date >= start && date <= end ? total + nn(value) : total;
}, 0);
const loggedInRange = (start, end) => Object.entries(state.earningsLog || {}).reduce((total, [key, value]) => {
  const date = parse(key);
  return date && date >= start && date <= end ? total + nn(value) : total;
}, 0);
const mappedWorkInRange = (start, end) => {
  const keys = new Set([...Object.keys(state.calendarGoals || {}), ...Object.keys(state.earningsLog || {})]);
  return [...keys].reduce((total, key) => {
    const date = parse(key);
    if (!date || date < start || date > end) return total;
    // A logged day replaces, rather than doubles, that day’s planned goal.
    return total + Math.max(nn(state.calendarGoals[key]), nn(state.earningsLog[key]));
  }, 0);
};
const segmentId = (target) => `${target.k}:${target.id || ''}`;
const isVisible = (target) => !state.settings.hiddenSegments[segmentId(target)];

function monthly(day, start, end) {
  const dates = [];
  let month = new Date(start.getFullYear(), start.getMonth(), 1, 12);
  const stop = new Date(end.getFullYear(), end.getMonth(), 1, 12);
  while (month <= stop) {
    const date = new Date(month.getFullYear(), month.getMonth(), Math.min(day, new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()), 12);
    if (date >= start && date <= end) dates.push(date);
    month = new Date(month.getFullYear(), month.getMonth() + 1, 1, 12);
  }
  return dates;
}

function events(days = state.settings.forecastDays) {
  const start = today();
  const end = add(start, days - 1);
  const output = [];

  state.assets.filter((item) => item.type === 'pipeline' && item.expectedDate).forEach((item) => {
    const date = parse(item.expectedDate);
    if (date && date >= start && date <= end) {
      output.push({ source: 'asset', id: item.id, kind: 'income', name: item.name, amount: item.amount, effective: item.amount * item.confidence / 100, date, meta: `${item.confidence}% confidence` });
    }
  });

  Object.entries(state.calendarGoals || {}).forEach(([key, amount]) => {
    const date = parse(key);
    if (date && date >= start && date <= end && nn(amount) > 0) {
      output.push({ source: 'goal', id: key, kind: 'goal', name: 'Earning goal', amount: nn(amount), effective: nn(amount), date, meta: 'planned earnings goal' });
    }
  });

  Object.entries(state.earningsLog || {}).forEach(([key, amount]) => {
    const date = parse(key);
    if (date && date >= start && date <= end && nn(amount) > 0) {
      output.push({ source: 'log', id: key, kind: 'logged', name: 'Logged earnings', amount: nn(amount), effective: nn(amount), date, meta: 'confirmed work log' });
    }
  });

  state.expenses.forEach((item) => {
    const dates = item.cadence === 'oneoff' ? [parse(item.dueDate)].filter(Boolean) : monthly(item.dueDay, start, end);
    dates.forEach((date) => {
      if (date >= start && date <= end) output.push({ source: 'expense', id: item.id, kind: 'expense', name: item.name, amount: item.amount, date, meta: item.cadence === 'oneoff' ? 'one-off obligation' : 'monthly obligation' });
    });
  });

  state.debts.forEach((item) => {
    monthly(item.dueDay, start, end).forEach((date) => output.push({ source: 'debt', id: item.id, kind: 'debt', name: `${item.name} minimum`, amount: item.minPayment, date, meta: 'debt minimum' }));
  });

  return output.sort((left, right) => left.date - right.date || ((left.kind === 'income' || left.kind === 'goal') ? -1 : 1));
}

function projection(options = {}) {
  const includeGoals = options.includeGoals !== false;
  let balance = total('cash');
  let breach = null;
  events().forEach((event) => {
    if (event.kind === 'income' || (includeGoals && event.kind === 'goal')) balance += event.effective;
    else if (event.kind === 'expense' || event.kind === 'debt') balance -= event.amount;
    if (balance < 0 && !breach) breach = event;
  });
  return { balance, breach };
}

function hardCycle() {
  const date = parse(safeCycleISO(state.settings.cycleDeadline));
  return { date, label: 'hard monthly cycle' };
}

function campaign() {
  const start = today();
  const cycle = hardCycle();
  const daysRemaining = Math.max(1, Math.round((cycle.date - start) / 86400000) + 1);
  const horizon = daysRemaining;
  const windowEvents = events(horizon);
  const out = windowEvents
    .filter((event) => event.kind === 'expense' || event.kind === 'debt')
    .reduce((total, event) => total + event.amount, 0);
  const pipeline = windowEvents
    .filter((event) => event.kind === 'income')
    .reduce((total, event) => total + event.effective, 0);
  const mappedWork = mappedWorkInRange(start, cycle.date);
  const rawGap = Math.max(0, out - total('cash'));
  const postPlanGap = Math.max(0, rawGap - pipeline - mappedWork);
  const tasks = state.settings.taskPayout > 0 ? Math.ceil(postPlanGap / state.settings.taskPayout) : 0;
  const dailySuggested = postPlanGap > 0 ? Math.ceil((postPlanGap / daysRemaining) / tuneStep()) * tuneStep() : 0;
  const todayGoal = nn(state.calendarGoals[iso(start)]);
  const todayLogged = nn(state.earningsLog[iso(start)]);
  return {
    cycle, out, pipeline, mappedWork, rawGap, postPlanGap, tasks, daysRemaining,
    dailySuggested, todayGoal, todayLogged,
    loggedMonth: loggedInMonth(), previousMonth: loggedInMonth(-1)
  };
}

function targetAttrs(target) {
  return `data-k="${target.k}" data-id="${target.id || ''}"`;
}

function meta(target) {
  if (target.k === 'territory') {
    const config = A[target.id];
    return config && { title: config[0], kicker: 'LIQUIDITY TERRITORY', desc: config[3], color: config[2], label: 'TERRITORY TOTAL', edit: 'asset' };
  }
  if (target.k === 'expense') {
    const item = state.expenses.find((entry) => entry.id === target.id);
    return item && { title: item.name, kicker: item.cadence === 'monthly' ? 'OBLIGATION / MONTHLY' : 'OBLIGATION / ONE-OFF', desc: 'Tune this amount directly. Its date and category stay on the named record.', color: E[item.type][1], label: 'OBLIGATION AMOUNT', edit: 'expense' };
  }
  if (target.k === 'balance' || target.k === 'minimum') {
    const item = state.debts.find((entry) => entry.id === target.id);
    return item && {
      title: `${item.name} ${target.k === 'balance' ? 'body' : 'minimum'}`,
      kicker: target.k === 'balance' ? 'DRAGON BODY MASS' : 'MONTHLY DRAGON BITE',
      desc: target.k === 'balance' ? 'Erase or add to the total balance. This is the dragon’s visible mass.' : 'Tune the monthly bite. It auto-populates its due date in the corridor.',
      color: target.k === 'balance' ? 'mass' : 'debt', label: target.k === 'balance' ? 'DEBT BALANCE' : 'MINIMUM PAYMENT', edit: 'debt'
    };
  }
  if (target.k === 'saved') {
    const item = state.desires.find((entry) => entry.id === target.id);
    return item && { title: item.name, kicker: 'SANCTIONED LIFE TRACK', desc: 'Adjust the amount already set aside. The target remains intact.', color: 'invest', label: 'AMOUNT RESERVED', edit: 'desire' };
  }
  return null;
}

function get(target) {
  if (target.k === 'territory') return total(target.id);
  if (target.k === 'expense') return state.expenses.find((item) => item.id === target.id)?.amount || 0;
  if (target.k === 'balance') return state.debts.find((item) => item.id === target.id)?.balance || 0;
  if (target.k === 'minimum') return state.debts.find((item) => item.id === target.id)?.minPayment || 0;
  if (target.k === 'saved') return state.desires.find((item) => item.id === target.id)?.saved || 0;
  return 0;
}

function set(target, value) {
  const numeric = nn(value);
  if (target.k === 'territory') state.territoryTotals[target.id] = numeric;
  if (target.k === 'expense') {
    const item = state.expenses.find((entry) => entry.id === target.id);
    if (item) item.amount = numeric;
  }
  if (target.k === 'balance') {
    const item = state.debts.find((entry) => entry.id === target.id);
    if (item) item.balance = numeric;
  }
  if (target.k === 'minimum') {
    const item = state.debts.find((entry) => entry.id === target.id);
    if (item) item.minPayment = numeric;
  }
  if (target.k === 'saved') {
    const item = state.desires.find((entry) => entry.id === target.id);
    if (item) item.saved = numeric;
  }
  state.isDemo = false;
}

function segments() {
  const output = [];
  ORDER.forEach((type) => output.push({ name: A[type][0], short: A[type][1], amount: total(type), color: A[type][2], target: { k: 'territory', id: type }, kind: 'territory', side: 'in' }));
  state.desires.forEach((item) => output.push({ name: item.name, short: 'SANCTIONED LIFE', amount: item.saved, targetAmount: item.target, color: 'invest', target: { k: 'saved', id: item.id }, kind: 'life', side: 'out' }));
  state.expenses.forEach((item) => output.push({ name: item.name, short: E[item.type][0], amount: item.amount, color: E[item.type][1], target: { k: 'expense', id: item.id }, kind: 'expense', side: 'out' }));
  state.debts.forEach((item) => {
    output.push({ name: `${item.name} minimum`, short: 'MIN BITE', amount: item.minPayment, color: 'debt', target: { k: 'minimum', id: item.id }, kind: 'minimum', side: 'out' });
    output.push({ name: `${item.name} body`, short: 'DRAGON MASS', amount: item.balance, color: 'mass', target: { k: 'balance', id: item.id }, kind: 'balance', side: 'out' });
  });
  return output;
}

function visualUnits(amount, unit = quantum()) {
  const safe = nn(amount);
  const full = Math.floor(safe / unit);
  const remainder = safe - full * unit;
  const tail = remainder > 0.0001 ? remainder / unit : 0;
  return { full, tail };
}

function amountDescription(amount, unit = quantum()) {
  const visual = visualUnits(amount, unit);
  const whole = visual.full === 1 ? 'cell' : 'cells';
  const tail = visual.tail ? ' + tail' : '';
  return `${visual.full} ${whole}${tail}`;
}

function bodyCells(segment, options = {}) {
  const unit = options.unit ?? quantum();
  const max = options.max ?? Infinity;
  const includeTail = options.includeTail !== false;
  const extraClass = options.extraClass || '';
  const visual = visualUnits(segment.amount, unit);
  const count = Math.min(visual.full, max);
  const parts = [];
  const title = `${segment.name}: ${fmt(segment.amount)}. Tap to tune.`;

  for (let index = 0; index < count; index += 1) {
    const first = index === 0 ? 'seg-start' : '';
    const tileStart = unit === 25 && index % 4 === 0 ? 'tile-start' : '';
    parts.push(`<button class="bodycell ${first} ${tileStart} ${extraClass}" style="--c:${COLOR[segment.color]};--fill:1" title="${esc(title)}" ${targetAttrs(segment.target)} type="button"></button>`);
  }
  if (includeTail && visual.full < max && visual.tail > 0) {
    const first = visual.full === 0 ? 'seg-start' : '';
    const tileStart = unit === 25 && visual.full % 4 === 0 ? 'tile-start' : '';
    parts.push(`<button class="bodycell partial ${first} ${tileStart} ${extraClass}" style="--c:${COLOR[segment.color]};--fill:${visual.tail}" title="${esc(title)}" ${targetAttrs(segment.target)} type="button"></button>`);
  }
  return parts.join('');
}

function stackedTailCell(segment, extraClass = '') {
  const visual = visualUnits(segment.amount, quantum());
  if (!visual.tail) return '';
  const remainder = segment.amount % quantum();
  const title = `${segment.name}: retained tail ${fmt(remainder)}. Tap to tune.`;
  // In the packed ledger, this is a physically narrow clickable block, not a hollow cell.
  // Its width is assigned after render from the exact fraction of one visible cell.
  return `<button class="bodycell tailstack ${extraClass}" data-tail="${visual.tail}" style="--c:${COLOR[segment.color]};--fill:${visual.tail}" title="${esc(title)}" aria-label="${esc(title)}" ${targetAttrs(segment.target)} type="button"></button>`;
}

function cardSpec(amount) {
  const exact = state.settings.cardMode !== 'compact';
  const totalCells = Math.ceil(nn(amount) / 25);
  return {
    exact,
    maxCells: exact ? 480 : 48,
    wide: exact && nn(amount) >= 800,
    totalCells
  };
}

function miniTiles(amount, color) {
  const spec = cardSpec(amount);
  const visual = visualUnits(amount, 25);
  const pieces = [];
  const complete = Math.min(visual.full, spec.maxCells);
  for (let index = 0; index < complete; index += 1) pieces.push('<i style="--fill:1"></i>');
  if (visual.full < spec.maxCells && visual.tail > 0) pieces.push(`<i class="partial" style="--fill:${visual.tail}"></i>`);
  const renderedCells = visual.full + (visual.tail ? 1 : 0);
  if (renderedCells > spec.maxCells) pieces.push(`<span class="more">+${renderedCells - spec.maxCells}</span>`);
  return `<div class="minitiles c-${color} ${spec.exact ? 'exact' : 'compact'}" aria-label="${esc(amountDescription(amount, 25))}">${pieces.join('')}</div>`;
}

function hollowTiles(saved, target) {
  const exact = state.settings.cardMode !== 'compact';
  const maxCells = exact ? 480 : 48;
  const targetCells = Math.max(1, Math.ceil(nn(target) / 25));
  const visible = Math.min(targetCells, maxCells);
  const savedVisual = visualUnits(saved, 25);
  const parts = [];
  for (let index = 0; index < visible; index += 1) {
    const remaining = savedVisual.full - index;
    let className = '';
    let fill = 0;
    if (remaining > 0) { className = 'filled'; fill = 1; }
    else if (remaining === 0 && savedVisual.tail > 0) { className = 'filled'; fill = savedVisual.tail; }
    parts.push(`<i class="${className}" style="--fill:${fill}"></i>`);
  }
  if (targetCells > maxCells) parts.push(`<span class="more">+${targetCells - maxCells}</span>`);
  return `<div class="hollowtiles ${exact ? 'exact' : 'compact'}" aria-label="${esc(`${fmt(saved)} reserved of ${fmt(target)} target`)}">${parts.join('')}</div>`;
}

function renderStatus() {
  const next = events().find((event) => event.kind === 'expense' || event.kind === 'debt');
  const p = projection({ includeGoals: false });
  const plan = projection({ includeGoals: true });
  const cash = total('cash');
  const monthlyWall = wall();
  const c = campaign();

  $('#cashReadout').textContent = fmt(cash);
  $('#monthlyReadout').textContent = fmt(monthlyWall);
  $('#debtReadout').textContent = fmt(debtTotal());
  $('#taskValue').textContent = state.settings.taskPayout ? fmt(state.settings.taskPayout) : '—';
  $('#taskCopy').textContent = state.settings.taskPayout ? (c.postPlanGap ? `${c.tasks} complete task${c.tasks === 1 ? '' : 's'} remain in the current plan.` : 'Current plan closes the mapped gap.') : 'Calibrate your usual completed-task payout.';

  if (next) {
    const days = Math.max(0, Math.round((next.date - today()) / 86400000));
    $('#countdown').textContent = `T−${days}`;
    $('#countdownLabel').textContent = `${next.name} · ${fmt(next.amount)} · ${label(next.date)}`;
  } else {
    $('#countdown').textContent = 'OPEN';
    $('#countdownLabel').textContent = 'No timed obligation placed yet.';
  }

  let verdict = 'The board is empty. Place the first true number and the terrain begins to exist.';
  if (state.assets.length || state.expenses.length || state.debts.length || Object.keys(state.territoryTotals).length) {
    if (p.breach && !plan.breach) verdict = `Bare cash breaches after ${p.breach.name}; the scheduled plan holds only if its expected earnings land.`;
    else if (p.breach) verdict = `Active cash breaches after ${p.breach.name}. A route is needed before ${label(p.breach.date)}.`;
    else if (monthlyWall && cash >= monthlyWall) verdict = 'The baseline monthly wall is funded by true cash. Protection and acceleration are now the real questions.';
    else if (monthlyWall) verdict = `True cash covers ${Math.round(cash / monthlyWall * 100)}% of the monthly wall. The remaining gap still needs matter.`;
    else verdict = 'No recurring wall is defined yet. Place obligations before asking the board to forecast survival.';
  }
  $('#verdict').textContent = verdict;
  $('#demoBanner').hidden = !state.isDemo;
  renderCampaign(c);
}

function renderCampaign(c) {
  const hardLabel = label(c.cycle.date);
  const todayCopy = c.todayGoal
    ? `${fmt(c.todayGoal)} planned today · ${state.settings.taskPayout ? `${Math.max(1, Math.ceil(c.todayGoal / state.settings.taskPayout))} task equivalent${Math.ceil(c.todayGoal / state.settings.taskPayout) === 1 ? '' : 's'}` : 'tap to adjust'}`
    : c.dailySuggested
      ? `Suggested ${fmt(c.dailySuggested)} today to close ${fmt(c.postPlanGap)} by ${hardLabel}.`
      : `No daily target needed from the current mapped cycle.`;
  $('#todayDuty').textContent = c.todayGoal ? fmt(c.todayGoal) : (c.dailySuggested ? fmt(c.dailySuggested) : 'CLEAR');
  $('#todayDutyCopy').textContent = todayCopy;
  $('#cycleNeed').textContent = fmt(c.rawGap);
  $('#cycleCopy').textContent = c.rawGap ? `${fmt(c.out)} due by ${hardLabel} · ${c.daysRemaining} day${c.daysRemaining === 1 ? '' : 's'} remain.` : `True cash clears the hard cycle through ${hardLabel}.`;
  $('#planIn').textContent = fmt(c.pipeline + c.mappedWork);
  $('#planCopy').textContent = `${fmt(c.pipeline)} pipeline + ${fmt(c.mappedWork)} planned / logged work by ${hardLabel}.`;
  $('#taskNeed').textContent = state.settings.taskPayout && c.postPlanGap ? `${c.tasks}` : '—';
  $('#taskNeedCopy').textContent = state.settings.taskPayout ? (c.postPlanGap ? `${fmt(c.postPlanGap)} still unplanned at ${fmt(state.settings.taskPayout)} per full task.` : 'No unplanned gap after mapped inbound.') : 'Set task payout to derive task equivalents.';
  $('#monthEarned').textContent = fmt(c.loggedMonth);
  const delta = c.loggedMonth - c.previousMonth;
  $('#monthCopy').textContent = c.previousMonth ? `${delta >= 0 ? '+' : '−'}${fmt(Math.abs(delta))} versus the prior month’s logged work.` : 'Log completed earnings on any calendar day to start the run history.';
}

function renderBodyControls() {
  $$('[data-quantum]').forEach((button) => button.classList.toggle('active', Number(button.dataset.quantum) === quantum()));
  $$('[data-bodymode]').forEach((button) => button.classList.toggle('active', button.dataset.bodymode === state.settings.bodyMode));
  $$('[data-tailmode]').forEach((button) => button.classList.toggle('active', button.dataset.tailmode === state.settings.tailMode));
  $$('[data-cardmode]').forEach((button) => button.classList.toggle('active', button.dataset.cardmode === state.settings.cardMode));
  $('#quantum').textContent = `${fmt(quantum())} / CELL`;
}

function renderBody() {
  const allSegments = segments();
  const visibleSegments = allSegments.filter((segment) => isVisible(segment.target));
  const activeSegments = visibleSegments.filter((segment) => segment.amount > 0);

  $('#flowMap').innerHTML = allSegments.map((segment) => {
    const shown = isVisible(segment.target);
    const target = segment.target;
    const zero = segment.amount === 0 ? ' · ZERO' : '';
    return `<article class="mapitem c-${segment.color}">
      <button class="maptune" ${targetAttrs(target)} type="button"><i></i><span><b>${esc(segment.name)}</b><small>${fmt(segment.amount)}${zero} · <em class="side-${segment.side}">${segment.side === 'in' ? 'IN' : 'OUT'}</em></small></span></button>
      <button class="visToggle ${shown ? 'on' : ''}" data-visible="${segmentId(target)}" type="button">${shown ? 'ON' : 'OFF'}</button>
    </article>`;
  }).join('');

  const frame = $('#bodyFrame');
  const grid = $('#bodyGrid');
  frame.classList.toggle('exploded', state.settings.bodyMode === 'exploded');
  frame.classList.toggle('ledger', state.settings.bodyMode === 'ledger');

  if (!activeSegments.length) {
    grid.className = 'bodygrid';
    grid.innerHTML = '<div class="empty">No visible financial matter yet. The tuning key still holds every zero territory in readiness.</div>';
    $('#bodyCaption').textContent = 'The tuning key keeps zero territories alive even while the visible Body is empty.';
    return;
  }

  if (state.settings.bodyMode === 'exploded') {
    grid.className = 'explodedbody';
    grid.innerHTML = visibleSegments.map((segment) => {
      const columns = quantum() === 25 ? 20 : 5;
      return `<article class="explodedgroup c-${segment.color}">
        <div class="explodedtitle"><b>${esc(segment.name)}</b><span>${fmt(segment.amount)}</span></div>
        ${segment.amount > 0 ? `<div class="bodygrid" style="--cols:${columns}">${bodyCells(segment)}</div>` : '<div class="explodedzero">ZERO · READY</div>'}
      </article>`;
    }).join('') || '<div class="empty">Everything is hidden. Turn a segment ON in the tuning key to restore it.</div>';
    $('#bodyCaption').textContent = 'EXPLODED VIEW · each visible category becomes a clean contained rectangle. Use this to read territory scale without the macro flow.';
    return;
  }

  if (state.settings.bodyMode === 'flow') {
    grid.className = 'bodygrid';
    grid.innerHTML = activeSegments.map((segment) => bodyCells(segment)).join('');
    $('#bodyCaption').textContent = 'DETAILED FLOW · every category retains its own exact tail inline, in its original sequence.';
    return;
  }

  const inSegments = activeSegments.filter((segment) => segment.side === 'in');
  const outSegments = activeSegments.filter((segment) => segment.side === 'out');
  const sideAmount = (list) => list.reduce((sum, item) => sum + item.amount, 0);
  const buildLine = (labelText, side, sideSegments) => {
    const full = sideSegments.map((segment) => bodyCells(segment, { includeTail: false })).join('');
    const tails = state.settings.tailMode === 'stacked'
      ? sideSegments.map((segment) => stackedTailCell(segment)).join('')
      : sideSegments.map((segment) => bodyCells(segment)).join('');
    const cells = state.settings.tailMode === 'stacked' ? `${full}${tails}` : tails;
    const modeLabel = state.settings.tailMode === 'stacked' ? 'FULL CELLS → PACKED TAILS' : 'EVERY TAIL INLINE';
    return `<section class="ledgerline ${side}">
      <header><span>${labelText}</span><b>${fmt(sideAmount(sideSegments))}</b><small>${modeLabel}</small></header>
      <div class="ledgercells" data-ledger-side="${side}">${cells || '<div class="empty">ZERO VISIBLE MATTER</div>'}</div>
    </section>`;
  };
  grid.className = 'ledgerbody';
  grid.innerHTML = `${buildLine('IN', 'in', inSegments)}${buildLine('OUT', 'out', outSegments)}`;
  $('#bodyCaption').textContent = state.settings.tailMode === 'stacked'
    ? `IN / OUT LEDGER · each category’s full ${fmt(quantum())} cells stay in sequence. Every partial remnant is then packed as its own solid, clickable colored block at the end of its own side—no hollow remainder cells.`
    : 'IN / OUT LEDGER · every category—including its partial tail—stays inline. Switch to PACK TAILS when you want the clean macro read.';
}

function renderTime() {
  const start = today();
  const byDate = {};
  events().forEach((event) => {
    const key = iso(event.date);
    (byDate[key] ??= []).push(event);
  });

  const cells = [];
  for (let index = 0; index < state.settings.forecastDays; index += 1) {
    const date = add(start, index);
    const key = iso(date);
    const calendarEvents = byDate[key] || [];
    const goal = nn(state.calendarGoals[key]);
    const dots = [
      goal && 'goal',
      calendarEvents.some((event) => event.kind === 'income') && 'income',
      calendarEvents.some((event) => event.kind === 'logged') && 'logged',
      calendarEvents.some((event) => event.kind === 'expense') && 'bill',
      calendarEvents.some((event) => event.kind === 'debt') && 'debt'
    ].filter(Boolean).map((type) => `<i class="${type}"></i>`).join('');

    cells.push(`<button class="day ${index === 0 ? 'today' : ''}" data-day="${key}" type="button">
      <span class="daytop"><span><b class="daynum">DAY ${String(index + 1).padStart(2, '0')}</b><small class="dayweek">${wk(date)}</small></span><strong class="daydate">${date.getDate()}</strong></span>
      <span class="indicators">${dots}</span>${goal ? `<span class="daygoal">GOAL ${fmt(goal)}</span>` : ''}${nn(state.earningsLog[key]) ? `<span class="daylogged">LOG ${fmt(state.earningsLog[key])}</span>` : ''}
    </button>`);
  }
  $('#timeGrid').innerHTML = cells.join('');
  $('#timeStart').textContent = `TODAY · ${wk(start)} ${label(start)}`;
  $('#timeEnd').textContent = `${label(add(start, state.settings.forecastDays - 1))} / horizon`;
}

function renderTerritories() {
  $('#territories').innerHTML = ORDER.map((type) => {
    const config = A[type];
    const value = total(type);
    const spec = cardSpec(value);
    return `<button class="territory c-${config[2]} ${spec.wide ? 'wide' : ''}" ${targetAttrs({ k: 'territory', id: type })} type="button">
      <span class="tk"><span>${config[1]}</span><span>${hasOverride(type) ? 'DIRECT TOTAL' : 'ITEM SUM'}</span></span>
      <h3>${config[0]}</h3><strong>${fmt(value)}</strong><p>${config[3]}</p>
      ${miniTiles(value, config[2])}
      <small>${amountDescription(value, 25)} · ${spec.exact ? 'EXACT MAP' : 'TIGHT MAP'} · TUNE ↔</small>
    </button>`;
  }).join('');
}

function renderExpenses() {
  $('#expenses').innerHTML = state.expenses.length ? state.expenses.map((item) => {
    const timing = item.cadence === 'monthly' ? `monthly · day ${item.dueDay}` : `one-off · ${item.dueDate ? label(parse(item.dueDate)) : 'date needed'}`;
    const color = E[item.type][1];
    const spec = cardSpec(item.amount);
    return `<button class="card c-${color} ${spec.wide ? 'wide' : ''}" ${targetAttrs({ k: 'expense', id: item.id })} type="button">
      <span class="ctop"><span>${E[item.type][0]}</span><span>${timing}</span></span>
      <strong class="cname">${esc(item.name)}</strong><b class="camount">${fmt(item.amount)}</b>
      ${miniTiles(item.amount, color)}
      <span class="cmeta"><span>${amountDescription(item.amount, 25)} · ${spec.exact ? 'exact evidence' : 'tight evidence'}</span><span>${item.cadence === 'monthly' ? 'recurring pressure' : 'single impact'}</span></span><span class="hint">TAP TO TUNE ↔</span>
    </button>`;
  }).join('') : '<div class="empty">No obligations placed. Add rent, insurance, food/fuel, utilities, or one-off impact events.</div>';
}

function renderDebts() {
  $('#debts').innerHTML = state.debts.length ? state.debts.map((item) => {
    const spec = cardSpec(item.balance);
    return `<article class="card c-debt dragoncard ${spec.wide ? 'wide' : ''}" ${targetAttrs({ k: 'balance', id: item.id })} role="button" tabindex="0" aria-label="Tune ${esc(item.name)} debt body">
      <span class="ctop"><span>DEBT DRAGON</span><span>${item.apr ? `${item.apr.toFixed(2)}% APR` : 'APR unspecified'}</span></span>
      <strong class="cname">${esc(item.name)}</strong><b class="camount">${fmt(item.balance)}</b>
      ${miniTiles(item.balance, 'mass')}
      <span class="cmeta"><span>${amountDescription(item.balance, 25)} · ${spec.exact ? 'exact mass' : 'tight mass'}</span><span>due day ${item.dueDay}</span></span>
      <span class="hint">TAP BODY TO TUNE ↔</span>
      <div class="dragonbuttons">
        <button ${targetAttrs({ k: 'balance', id: item.id })} type="button">TUNE BODY<br>${fmt(item.balance)}</button>
        <button ${targetAttrs({ k: 'minimum', id: item.id })} type="button">TUNE MINIMUM<br>${fmt(item.minPayment)}</button>
      </div>
    </article>`;
  }).join('') : '<div class="empty">No dragons placed. Add a debt account to make its full mass and monthly bite visible.</div>';
}

function renderDesires() {
  $('#desires').innerHTML = state.desires.length ? state.desires.map((item) => {
    const percentage = item.target ? clamp(item.saved / item.target * 100, 0, 100) : 0;
    const spec = cardSpec(item.target || item.saved);
    return `<button class="card c-invest ${spec.wide ? 'wide' : ''}" ${targetAttrs({ k: 'saved', id: item.id })} type="button">
      <span class="ctop"><span>TRACKED DESIRE</span><span>${Math.round(percentage)}%</span></span>
      <strong class="cname">${esc(item.name)}</strong><b class="camount">${fmt(item.saved)} <small>/ ${fmt(item.target)}</small></b>
      ${hollowTiles(item.saved, item.target)}
      <span class="cmeta"><span>${esc(item.notes || 'A bounded place for something alive.')}</span><span>${spec.exact ? 'exact target map' : 'tight target map'}</span></span><span class="hint">TAP TO TUNE ↔</span>
    </button>`;
  }).join('') : '<div class="empty">No sanctioned life tracks yet. Books, tools, toys, travel, food pleasures, and weirdness can all have a bounded address here.</div>';
}

function sizeLedgerCells() {
  // The ledger uses a flex-packed physical field, so each tail can occupy only
  // its actual fraction of one cell rather than showing a dark hollow remainder.
  $$('.ledgercells').forEach((line) => {
    const computed = getComputedStyle(line);
    const columns = Math.max(1, Number.parseInt(computed.getPropertyValue('--cols'), 10) || 32);
    const cell = line.clientWidth / columns;
    if (!Number.isFinite(cell) || cell <= 0) return;
    line.style.setProperty('--cellpx', `${cell}px`);
    line.querySelectorAll('.bodycell:not(.tailstack)').forEach((cellNode) => {
      cellNode.style.flexBasis = `${cell}px`;
      cellNode.style.width = `${cell}px`;
      cellNode.style.height = `${cell}px`;
    });
    line.querySelectorAll('.tailstack[data-tail]').forEach((tailNode) => {
      const fraction = clamp(n(tailNode.dataset.tail, 1), 0.01, 1);
      const width = cell * fraction;
      tailNode.style.flexBasis = `${width}px`;
      tailNode.style.width = `${width}px`;
      tailNode.style.height = `${cell}px`;
    });
  });
}

function scheduleLedgerSizing() {
  window.requestAnimationFrame(sizeLedgerCells);
}

function render() {
  renderStatus();
  renderBodyControls();
  renderBody();
  renderTime();
  renderTerritories();
  renderExpenses();
  renderDebts();
  renderDesires();
  scheduleLedgerSizing();
  save();
}

function open(id) {
  if (sheet && sheet !== id) close(sheet, false);
  sheet = id;
  const node = $(`#${id}`);
  node.classList.add('open');
  node.setAttribute('aria-hidden', 'false');
  $('#backdrop').hidden = false;
  document.body.classList.add('sheetopen');
}

function close(id = sheet, clear = true) {
  if (!id) return;
  const node = $(`#${id}`);
  node.classList.remove('open');
  node.setAttribute('aria-hidden', 'true');
  if (clear && id === 'quickSheet') quick = null;
  if (clear && id === 'daySheet') dayKey = null;
  if (clear && id === 'editorSheet') editor = null;
  if (sheet === id) sheet = null;
  if (!sheet) {
    $('#backdrop').hidden = true;
    document.body.classList.remove('sheetopen');
  }
}

function preview(value, color) {
  const visual = visualUnits(value, 25);
  const max = 180;
  const parts = [];
  for (let index = 0; index < Math.min(visual.full, max); index += 1) parts.push(`<i style="--c:${COLOR[color]};--fill:1"></i>`);
  if (visual.full < max && visual.tail > 0) parts.push(`<i style="--c:${COLOR[color]};--fill:${visual.tail}"></i>`);
  return parts.join('');
}

function syncQuick(value) {
  qDraft = nn(value);
  const info = meta(quick);
  $('#quickInput').value = qDraft;
  $('#quickReadout').textContent = fmt(qDraft);
  $('#quickDialValue').textContent = `${fmt(qDraft)} · ${amountDescription(qDraft, 25)}`;
  $('#quickPreview').innerHTML = preview(qDraft, info.color);
}

function openQuick(target) {
  const info = meta(target);
  if (!info) return;
  quick = target;
  $('#quickKicker').textContent = info.kicker;
  $('#quickTitle').textContent = info.title;
  $('#quickDesc').textContent = info.desc;
  $('#quickExactLabel').textContent = info.label;
  $('#quickStepMinus').textContent = fmt(tuneStep());
  $('#quickStepPlus').textContent = fmt(tuneStep());
  $('#quickInput').step = tuneStep();
  $('#quickDetails').textContent = target.k === 'territory' ? 'ADD / DETAILS' : 'DETAILS';
  const shown = isVisible(target);
  $('#quickVisibility').textContent = shown ? 'HIDE FROM CONTINUOUS BODY' : 'SHOW IN CONTINUOUS BODY';
  $('#quickVisibility').classList.toggle('on', shown);
  syncQuick(get(target));
  open('quickSheet');
}

function applyQuick() {
  if (!quick) return;
  set(quick, $('#quickInput').value);
  close('quickSheet');
  render();
}

function toggleVisibility(target) {
  const id = segmentId(target);
  if (state.settings.hiddenSegments[id]) delete state.settings.hiddenSegments[id];
  else state.settings.hiddenSegments[id] = true;
  state.isDemo = false;
  render();
  if (quick && segmentId(quick) === id) {
    const shown = isVisible(target);
    $('#quickVisibility').textContent = shown ? 'HIDE FROM CONTINUOUS BODY' : 'SHOW IN CONTINUOUS BODY';
    $('#quickVisibility').classList.toggle('on', shown);
  }
}

function details() {
  if (!quick) return;
  const target = quick;
  close('quickSheet');
  if (target.k === 'territory') edit('asset', null, { type: target.id });
  else edit(meta(target).edit, target.id);
}

function syncDay(value) {
  dayDraft = nn(value);
  $('#dayInput').value = dayDraft;
  $('#dayReadout').textContent = dayDraft ? fmt(dayDraft) : 'NO GOAL';
  $('#dayDialValue').textContent = `${fmt(dayDraft)} · ${amountDescription(dayDraft, 25)}`;
}

function syncEarned(value) {
  earnedDraft = nn(value);
  $('#earnedInput').value = earnedDraft;
  $('#earnedReadout').textContent = earnedDraft ? fmt(earnedDraft) : 'NOT LOGGED';
}

function openDay(key) {
  dayKey = key;
  const date = parse(key);
  $('#dayTitle').textContent = `${wk(date)} · ${label(date)}`;
  $('#dayStepMinus').textContent = fmt(tuneStep());
  $('#dayStepPlus').textContent = fmt(tuneStep());
  $('#dayInput').step = tuneStep();
  const c = campaign();
  const isToday = key === iso(today());
  $('#daySuggestion').textContent = c.dailySuggested
    ? `${isToday ? 'Suggested duty today' : 'Suggested daily pace'}: ${fmt(c.dailySuggested)} to close ${fmt(c.postPlanGap)} by ${label(c.cycle.date)}.`
    : `Current mapped plan has no remaining daily minimum through ${label(c.cycle.date)}.`;
  $('#setSuggested').hidden = !c.dailySuggested;
  syncDay(state.calendarGoals[key] || 0);
  syncEarned(state.earningsLog[key] || 0);
  const dayEvents = events().filter((event) => iso(event.date) === key && !['goal', 'logged'].includes(event.kind));
  $('#dayEvents').innerHTML = dayEvents.length ? dayEvents.map((event) => `<button class="dayevent ${event.kind}" data-edit="${event.source}" data-id="${event.id}" type="button"><span>${esc(event.name)} · ${esc(event.meta)}</span><b>${fmt(event.amount)}</b></button>`).join('') : '<p class="dayempty">No fixed money event on this day yet. Add a landing or an obligation below when needed.</p>';
  open('daySheet');
}

function saveDay() {
  if (!dayKey) return;
  const value = nn($('#dayInput').value);
  const earned = nn($('#earnedInput').value);
  if (value) state.calendarGoals[dayKey] = value;
  else delete state.calendarGoals[dayKey];
  if (earned) state.earningsLog[dayKey] = earned;
  else delete state.earningsLog[dayKey];
  state.isDemo = false;
  close('daySheet');
  render();
}

function field(labelText, name, type = 'text', value = '', options = {}) {
  const full = options.full ? 'full' : '';
  const attrs = options.attrs || '';
  if (type === 'select') {
    return `<label class="${full}"><span>${labelText}</span><select name="${name}" ${attrs}>${options.choices.map(([key, text]) => `<option value="${key}" ${String(key) === String(value) ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;
  }
  if (type === 'textarea') return `<label class="${full}"><span>${labelText}</span><textarea name="${name}" ${attrs}>${esc(value)}</textarea></label>`;
  return `<label class="${full}"><span>${labelText}</span><input type="${type}" name="${name}" value="${esc(value)}" ${attrs}/></label>`;
}

function record(type, id) {
  const items = type === 'asset' ? state.assets : type === 'expense' ? state.expenses : type === 'debt' ? state.debts : state.desires;
  return id ? items.find((item) => item.id === id) : null;
}

function edit(type, id = null, preset = {}) {
  editor = { type, id, preset };
  let item = record(type, id);
  const title = { asset: 'money object', expense: 'obligation', debt: 'debt dragon', desire: 'sanctioned life track' }[type];
  $('#editorKicker').textContent = id ? `EDIT ${title.toUpperCase()}` : `NEW ${title.toUpperCase()}`;
  $('#editorTitle').textContent = id ? `Edit ${title}` : `Place a ${title}`;
  $('#deleteBtn').hidden = !id;

  let html = '';
  if (type === 'asset') {
    item = item || { name: '', type: preset.type || 'cash', amount: '', expectedDate: preset.expectedDate || '', confidence: 100, notes: '' };
    html = field('Name', 'name', 'text', item.name, { full: true, attrs: 'required' })
      + field('Liquidity territory', 'type', 'select', item.type, { choices: ORDER.map((entry) => [entry, A[entry][0]]) })
      + field('Amount', 'amount', 'number', item.amount, { attrs: 'min="0" step="1" required' })
      + field('Expected landing date', 'expectedDate', 'date', item.expectedDate)
      + field('Pipeline confidence %', 'confidence', 'number', item.confidence, { attrs: 'min="0" max="100" step="1"' })
      + field('Notes', 'notes', 'textarea', item.notes, { full: true });
  }
  if (type === 'expense') {
    item = item || { name: '', amount: '', cadence: preset.cadence || 'monthly', type: preset.type || 'essential', dueDay: today().getDate(), dueDate: preset.dueDate || '', notes: '' };
    html = field('Name', 'name', 'text', item.name, { full: true, attrs: 'required' })
      + field('Amount', 'amount', 'number', item.amount, { attrs: 'min="0" step="1" required' })
      + field('Category', 'type', 'select', item.type, { choices: Object.entries(E).map(([key, value]) => [key, value[0]]) })
      + field('Cadence', 'cadence', 'select', item.cadence, { choices: [['monthly', 'Monthly recurring'], ['oneoff', 'One-off date']] })
      + field('Monthly due day', 'dueDay', 'number', item.dueDay, { attrs: 'min="1" max="31" step="1"' })
      + field('One-off due date', 'dueDate', 'date', item.dueDate, { full: true })
      + field('Notes', 'notes', 'textarea', item.notes, { full: true });
  }
  if (type === 'debt') {
    item = item || { name: '', balance: '', minPayment: '', dueDay: today().getDate(), apr: '', notes: '' };
    html = field('Name', 'name', 'text', item.name, { full: true, attrs: 'required' })
      + field('Current balance', 'balance', 'number', item.balance, { attrs: 'min="0" step="1" required' })
      + field('Monthly minimum', 'minPayment', 'number', item.minPayment, { attrs: 'min="0" step="1" required' })
      + field('Due day', 'dueDay', 'number', item.dueDay, { attrs: 'min="1" max="31" step="1"' })
      + field('APR', 'apr', 'number', item.apr, { attrs: 'min="0" step="0.01"' })
      + field('Notes', 'notes', 'textarea', item.notes, { full: true });
  }
  if (type === 'desire') {
    item = item || { name: '', target: '', saved: '', notes: '' };
    html = field('Name', 'name', 'text', item.name, { full: true, attrs: 'required' })
      + field('Target amount', 'target', 'number', item.target, { attrs: 'min="0" step="1" required' })
      + field('Already reserved', 'saved', 'number', item.saved, { attrs: 'min="0" step="1"' })
      + field('Why this matters', 'notes', 'textarea', item.notes, { full: true });
  }
  $('#editorFields').innerHTML = html;
  open('editorSheet');
}

function saveEdit(event) {
  event.preventDefault();
  if (!editor) return;
  const { type, id } = editor;
  const data = Object.fromEntries(new FormData($('#editorForm')).entries());
  const old = record(type, id);
  let item;
  if (type === 'asset') item = { id: id || uid('a'), name: data.name.trim() || 'Untitled money', type: A[data.type] ? data.type : 'cash', amount: nn(data.amount), expectedDate: data.expectedDate || '', confidence: clamp(n(data.confidence, 100), 0, 100), notes: data.notes.trim() };
  if (type === 'expense') item = { id: id || uid('e'), name: data.name.trim() || 'Untitled obligation', amount: nn(data.amount), cadence: data.cadence === 'oneoff' ? 'oneoff' : 'monthly', type: E[data.type] ? data.type : 'essential', dueDay: clamp(Math.round(n(data.dueDay, 1)), 1, 31), dueDate: data.dueDate || '', notes: data.notes.trim() };
  if (type === 'debt') item = { id: id || uid('d'), name: data.name.trim() || 'Untitled dragon', balance: nn(data.balance), minPayment: nn(data.minPayment), dueDay: clamp(Math.round(n(data.dueDay, 1)), 1, 31), apr: nn(data.apr), notes: data.notes.trim() };
  if (type === 'desire') item = { id: id || uid('l'), name: data.name.trim() || 'Untitled track', target: nn(data.target), saved: nn(data.saved), notes: data.notes.trim() };

  const items = type === 'asset' ? state.assets : type === 'expense' ? state.expenses : type === 'debt' ? state.debts : state.desires;
  const index = items.findIndex((entry) => entry.id === item.id);
  if (index >= 0) items[index] = item;
  else items.push(item);
  if (type === 'asset') {
    if (old?.type) delete state.territoryTotals[old.type];
    delete state.territoryTotals[item.type];
  }
  state.isDemo = false;
  close('editorSheet');
  render();
}

function del() {
  if (!editor?.id) return;
  const item = record(editor.type, editor.id);
  if (!item || !confirm(`Delete “${item.name}” from the board?`)) return;
  const items = editor.type === 'asset' ? state.assets : editor.type === 'expense' ? state.expenses : editor.type === 'debt' ? state.debts : state.desires;
  items.splice(items.findIndex((entry) => entry.id === item.id), 1);
  if (editor.type === 'asset') delete state.territoryTotals[item.type];
  state.isDemo = false;
  close('editorSheet');
  render();
}

function settings() {
  $('#taskPayoutInput').value = state.settings.taskPayout;
  $('#cellQuantumInput').value = quantum();
  $('#horizonInput').value = state.settings.forecastDays;
  $('#cycleDeadlineInput').value = safeCycleISO(state.settings.cycleDeadline);
  $('#bodyModeInput').value = state.settings.bodyMode;
  $('#tailModeInput').value = state.settings.tailMode;
  $('#cardModeInput').value = state.settings.cardMode;
  open('settingsSheet');
}

function saveSettings(event) {
  event.preventDefault();
  state.settings.taskPayout = nn($('#taskPayoutInput').value);
  state.settings.cellQuantum = Number($('#cellQuantumInput').value) === 100 ? 100 : 25;
  state.settings.forecastDays = clamp(Math.round(n($('#horizonInput').value, 28) / 7) * 7, 14, 84);
  state.settings.cycleDeadline = safeCycleISO($('#cycleDeadlineInput').value);
  state.settings.bodyMode = ['ledger', 'flow', 'exploded'].includes($('#bodyModeInput').value) ? $('#bodyModeInput').value : 'ledger';
  state.settings.tailMode = $('#tailModeInput').value === 'inline' ? 'inline' : 'stacked';
  state.settings.cardMode = $('#cardModeInput').value === 'compact' ? 'compact' : 'exact';
  state.isDemo = false;
  close('settingsSheet');
  render();
}

function exportBoard() {
  const blob = new Blob([JSON.stringify({ app: 'CHUNK // SOLVENCY', version: VERSION, exportedAt: new Date().toISOString(), state }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chunk-solvency-backup-${iso(today())}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importBoard(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      state = normalize(imported.state || imported);
      state.isDemo = false;
      render();
      alert('Board imported. This browser now holds the imported local board.');
    } catch (error) {
      alert('That file was not a valid CHUNK board backup.');
    }
  };
  reader.readAsText(file);
}

function begin(event, type) {
  event.preventDefault();
  drag = { type, x: event.clientX };
  event.currentTarget.setPointerCapture?.(event.pointerId);
}

function move(event) {
  if (!drag) return;
  event.preventDefault();
  const steps = Math.trunc((event.clientX - drag.x) / 18);
  if (!steps) return;
  drag.x += steps * 18;
  if (drag.type === 'q') syncQuick(qDraft + steps * tuneStep());
  else syncDay(dayDraft + steps * tuneStep());
}

function end() { drag = null; }

function click(event) {
  let node = event.target.closest('[data-close]');
  if (node) { close(node.dataset.close); return; }

  node = event.target.closest('[data-visible]');
  if (node) {
    const [kind, id] = node.dataset.visible.split(':');
    toggleVisibility({ k: kind, id });
    return;
  }

  node = event.target.closest('[data-add]');
  if (node) { edit(node.dataset.add); return; }

  node = event.target.closest('[data-day]');
  if (node) { openDay(node.dataset.day); return; }

  node = event.target.closest('[data-edit]');
  if (node && ['asset', 'expense', 'debt', 'desire'].includes(node.dataset.edit)) { close('daySheet'); edit(node.dataset.edit, node.dataset.id); return; }

  node = event.target.closest('[data-k]');
  if (node) { openQuick({ k: node.dataset.k, id: node.dataset.id }); }
}

function keys(event) {
  if ((event.key === 'Enter' || event.key === ' ') && event.target?.matches?.('.dragoncard[data-k]')) { event.preventDefault(); openQuick({ k: event.target.dataset.k, id: event.target.dataset.id }); }
  if (event.key === 'Escape') close();
  if (event.target === $('#quickDial')) {
    if (event.key === 'ArrowLeft') syncQuick(qDraft - tuneStep());
    if (event.key === 'ArrowRight') syncQuick(qDraft + tuneStep());
  }
  if (event.target === $('#dayDial')) {
    if (event.key === 'ArrowLeft') syncDay(dayDraft - tuneStep());
    if (event.key === 'ArrowRight') syncDay(dayDraft + tuneStep());
  }
}

function init() {
  $('#exportBtn').onclick = exportBoard;
  $('#importBtn').onclick = () => $('#importInput').click();
  $('#importInput').onchange = (event) => importBoard(event.target.files[0]);
  $('#settingsBtn').onclick = settings;
  $('#taskBtn').onclick = settings;
  $('#todayPlanBtn').onclick = () => openDay(iso(today()));
  $('#cycleConfigBtn').onclick = settings;
  $('#cleanBtn').onclick = () => { if (confirm('Start a clean board?')) { state = blank(); render(); } };
  $('#loadDemoBtn').onclick = () => { if (confirm('Replace this local board with demo terrain? Export first if you want a backup.')) { state = demo(); render(); } };
  $('#resetBtn').onclick = () => { if (confirm('Erase all local board data?')) { state = blank(); render(); } };

  $('#bodyAddBtn').onclick = () => edit($('#bodyAddType').value);
  $$('[data-quantum]').forEach((button) => {
    button.onclick = () => { state.settings.cellQuantum = Number(button.dataset.quantum) === 100 ? 100 : 25; state.isDemo = false; render(); };
  });
  $$('[data-bodymode]').forEach((button) => {
    button.onclick = () => { state.settings.bodyMode = ['ledger', 'flow', 'exploded'].includes(button.dataset.bodymode) ? button.dataset.bodymode : 'ledger'; state.isDemo = false; render(); };
  });
  $$('[data-tailmode]').forEach((button) => {
    button.onclick = () => { state.settings.tailMode = button.dataset.tailmode === 'inline' ? 'inline' : 'stacked'; state.isDemo = false; render(); };
  });
  $$('[data-cardmode]').forEach((button) => {
    button.onclick = () => { state.settings.cardMode = button.dataset.cardmode === 'compact' ? 'compact' : 'exact'; state.isDemo = false; render(); };
  });

  $('#quickInput').oninput = (event) => syncQuick(event.target.value);
  $('#quickMinus').onclick = () => syncQuick(qDraft - tuneStep());
  $('#quickPlus').onclick = () => syncQuick(qDraft + tuneStep());
  $('#quickApply').onclick = applyQuick;
  $('#quickDetails').onclick = details;
  $('#quickVisibility').onclick = () => { if (quick) toggleVisibility(quick); };

  $('#dayInput').oninput = (event) => syncDay(event.target.value);
  $('#earnedInput').oninput = (event) => syncEarned(event.target.value);
  $('#dayMinus').onclick = () => syncDay(dayDraft - tuneStep());
  $('#dayPlus').onclick = () => syncDay(dayDraft + tuneStep());
  $('#clearGoal').onclick = () => syncDay(0);
  $('#setSuggested').onclick = () => syncDay(campaign().dailySuggested);
  $('#saveDay').onclick = saveDay;
  $('#addIncomeDay').onclick = () => { const key = dayKey; close('daySheet'); edit('asset', null, { type: 'pipeline', expectedDate: key }); };
  $('#addExpenseDay').onclick = () => { const key = dayKey; close('daySheet'); edit('expense', null, { cadence: 'oneoff', dueDate: key }); };

  $('#editorForm').onsubmit = saveEdit;
  $('#deleteBtn').onclick = del;
  $('#settingsForm').onsubmit = saveSettings;
  $('#backdrop').onclick = () => close();
  $('#quickDial').onpointerdown = (event) => begin(event, 'q');
  $('#dayDial').onpointerdown = (event) => begin(event, 'd');
  window.addEventListener('pointermove', move, { passive: false });
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  window.addEventListener('resize', scheduleLedgerSizing);
  document.addEventListener('click', click);
  document.addEventListener('keydown', keys);
  document.addEventListener('gesturestart', (event) => event.preventDefault(), { passive: false });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
  render();
}

state = load();
document.addEventListener('DOMContentLoaded', init);
