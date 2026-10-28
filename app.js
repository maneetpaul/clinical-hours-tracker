// ── Program settings: the one place a future maintainer edits ──
const CONFIG = {
  requirements: { total: 500, rel: 250 },
  hoursPerClientPerWeek: 1,
  deadline: { month: 5, day: 1 },          // June 1 (months are 0-based)
  storageKey: 'mft-hours:v1',
};
const NAMES = { total: 'total', rel: 'relational' };
const DAY = 864e5, WEEK = 7 * DAY, MONTH_WEEKS = 4.345;

let state = load();
let prevDone = null;

function defaults() {
  return { totalHours: '', relHours: '', totalClients: '', relClients: '',
           req: { ...CONFIG.requirements }, preset: 'next', customDate: '' };
}
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG.storageKey));
    if (saved && typeof saved === 'object') return { ...defaults(), ...saved };
  } catch (e) {}
  return defaults();
}
function save() {
  try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(state)); } catch (e) {}
}

// ── Dates ──
function today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function nextDeadline() {
  const t = today(), { month, day } = CONFIG.deadline;
  let d = new Date(t.getFullYear(), month, day);
  if (d < t) d = new Date(t.getFullYear() + 1, month, day);
  return d;
}
function followingDeadline() { const n = nextDeadline(); return new Date(n.getFullYear() + 1, n.getMonth(), n.getDate()); }
function currentDeadline() {
  if (state.preset === 'next') return nextDeadline();
  if (state.preset === 'following') return followingDeadline();
  return state.customDate ? new Date(state.customDate + 'T00:00:00') : null;
}
// Finish dates are estimates, so they are only ever shown as a month.
const fmtMonth = (d) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const fmtDay   = (d) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const plural   = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const num      = (v) => Math.max(0, parseFloat(v) || 0);
const fmtNum   = (n) => (Math.round(n * 10) / 10).toLocaleString('en-US');
const fmtHrs   = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const filled   = (v) => String(v ?? '').trim() !== '';

// "about 2 months" / "a few weeks" — never more precise than the estimate deserves
function roughGap(weeks) {
  const w = Math.abs(weeks);
  if (w < 3) return null;
  if (w < 6) return 'a few weeks';
  const m = Math.round(w / MONTH_WEEKS);
  return `about ${plural(m, 'month')}`;
}

// ── The math ──
function compute() {
  const t = today();
  const dl = currentDeadline();
  const weeksLeft = dl ? (dl - t) / WEEK : null;
  const rows = {};
  for (const k of ['total', 'rel']) {
    const have = num(state[k + 'Hours']);
    const req = Math.max(1, num(state.req[k]) || CONFIG.requirements[k]);
    const rem = Math.max(0, req - have);
    const clients = num(state[k + 'Clients']);
    const perWeek = clients * CONFIG.hoursPerClientPerWeek;
    const need = weeksLeft > 0 ? rem / weeksLeft : null;
    const finish = rem === 0 ? t : perWeek > 0 ? new Date(t.getTime() + (rem / perWeek) * WEEK) : null;
    let tone = '', status = '';
    if (rem === 0) { tone = 'good'; status = 'Done'; }
    else if (need !== null && perWeek > 0) {
      if (perWeek >= need)            { tone = 'good'; status = 'On pace'; }
      else if (perWeek >= need * 0.8) { tone = 'warn'; status = 'Close'; }
      else                            { tone = 'bad';  status = 'Behind'; }
    }
    rows[k] = { k, have, req, rem, clients, perWeek, need, finish, tone, status, pct: Math.min(100, (have / req) * 100) };
  }
  return { t, dl, weeksLeft, rows };
}

// ── Render ──
const $ = (id) => document.getElementById(id);

function render() {
  const { dl, weeksLeft, rows } = compute();
  const list = [rows.total, rows.rel];

  // Deadline buttons
  $('presetNext').textContent = `June 1, ${nextDeadline().getFullYear()}`;
  $('presetFollowing').textContent = `June 1, ${followingDeadline().getFullYear()}`;
  document.querySelectorAll('.segmented button').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.preset === state.preset)));
  $('customDate').hidden = state.preset !== 'custom';
  $('reqTotalLabel').textContent = fmtNum(rows.total.req);
  $('reqRelLabel').textContent = fmtNum(rows.rel.req);

  // Nothing to say until there are hours to work from
  $('clearAll').hidden = !FIELDS.some((id) => filled(state[id]));
  const started = filled(state.totalHours) || filled(state.relHours);
  $('emptyState').hidden = started;
  $('result').hidden = !started;
  $('row-total').hidden = !started;
  $('row-rel').hidden = !started;
  if (!started) { prevDone = null; return; }

  for (const r of list) {
    $(`count-${r.k}`).innerHTML = `<b>${fmtNum(r.have)}</b> of ${fmtNum(r.req)} hrs · ${Math.floor(r.pct)}%`;
    $(`bar-${r.k}`).style.width = r.pct + '%';
    $(`pace-${r.k}`).textContent =
      r.rem === 0 ? 'All done here.' :
      r.need === null ? `${fmtNum(r.rem)} hrs to go` :
      `Need about ${fmtHrs(r.need)} hrs a week` + (r.perWeek > 0 ? `, you have about ${fmtNum(r.perWeek)}` : '');
    const chip = $(`chip-${r.k}`);
    chip.hidden = !r.status;
    chip.textContent = r.status;
    chip.dataset.tone = r.tone;
  }

  // The one-sentence answer
  const open = list.filter((r) => r.rem > 0);
  let eyebrow = dl ? `Deadline: ${fmtDay(dl)}` : 'No deadline picked yet';
  let head, sub = '', mood = 'neutral';

  if (!dl) {
    head = 'Pick a deadline to see your pace.';
    sub = 'Choose a date in “Your deadline” above.';
  } else if (open.length === 0) {
    head = 'You’ve met every requirement!';
    sub = 'Every hour is logged. Go celebrate.';
    mood = 'good';
  } else if (weeksLeft <= 0) {
    head = 'That deadline has already passed.';
    sub = 'Pick a new date above to see your pace.';
    mood = 'bad';
  } else if (open.some((r) => r.perWeek === 0)) {
    head = `You need about ${open.map((r) => `${fmtHrs(r.need)} ${NAMES[r.k]}`).join(' and ')} hours a week.`;
    sub = 'Add how many clients you see each week to estimate when you’ll finish.';
  } else {
    const finish = new Date(Math.max(...open.map((r) => r.finish.getTime())));
    const gapWeeks = (finish - dl) / WEEK;
    const gap = roughGap(gapWeeks);
    if (!gap) {
      mood = 'warn';
      head = `You’re on track to finish around <mark>${fmtMonth(finish)}</mark>.`;
      sub = 'That’s cutting it close to your deadline. A client or two more would give you some breathing room.';
    } else if (gapWeeks < 0) {
      mood = 'good';
      head = `You’re on track to finish around <mark>${fmtMonth(finish)}</mark>.`;
      sub = `That’s ${gap} before your deadline. Nice work.`;
    } else {
      mood = 'bad';
      const late = open.filter((r) => r.finish > dl);
      const targets = late.map((r) => `${Math.ceil(r.need / CONFIG.hoursPerClientPerWeek)} ${NAMES[r.k]}`).join(' and ');
      head = `At this pace, you’ll finish around <mark>${fmtMonth(finish)}</mark>.`;
      sub = `That’s ${gap} after your deadline. To finish on time, aim for about ${targets} clients a week.`;
    }
  }
  $('eyebrow').textContent = eyebrow;
  $('headline').innerHTML = head;
  $('subline').textContent = sub;
  $('answer').dataset.mood = mood;

  // Confetti when a requirement flips to done while typing (not on page load)
  const done = { total: rows.total.rem === 0, rel: rows.rel.rem === 0 };
  if (prevDone && ((done.total && !prevDone.total) || (done.rel && !prevDone.rel))) confetti();
  prevDone = done;
}

// ── Small, dependency-free confetti ──
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:50';
  document.body.appendChild(c);
  const ctx = c.getContext('2d'), dpr = devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const colors = ['--total', '--rel', '--good', '--warn'].map((v) => css.getPropertyValue(v).trim());
  const parts = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2, y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 14, vy: Math.random() * -14 - 4,
    s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
    c: colors[(Math.random() * colors.length) | 0], square: Math.random() < 0.5,
  }));
  const start = performance.now();
  (function frame(now) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      if (p.square) ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
      else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    if (now - start < 2600) requestAnimationFrame(frame); else c.remove();
  })(start);
}

// ── Wiring ──
const FIELDS = ['totalHours', 'relHours', 'totalClients', 'relClients'];
for (const id of FIELDS) {
  const el = $(id);
  el.value = state[id];
  el.addEventListener('input', () => { state[id] = el.value; save(); render(); });
}

document.querySelectorAll('.segmented button').forEach((b) => b.addEventListener('click', () => {
  state.preset = b.dataset.preset;
  if (state.preset === 'custom' && !state.customDate) state.customDate = toISO(followingDeadline());
  $('customDate').value = state.customDate;
  save(); render();
  if (state.preset === 'custom') $('customDate').focus();
}));
$('customDate').value = state.customDate;
$('customDate').addEventListener('input', (e) => { state.customDate = e.target.value; save(); render(); });
function toISO(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

const dlg = $('reqDialog');
$('openReqs').addEventListener('click', () => {
  $('reqTotal').value = state.req.total; $('reqRel').value = state.req.rel;
  dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
});
for (const [id, k] of [['reqTotal', 'total'], ['reqRel', 'rel']]) {
  $(id).addEventListener('input', (e) => { state.req[k] = e.target.value; save(); render(); });
}

// Clearing takes two taps so it can't happen by accident
let clearTimer = null;
$('clearAll').addEventListener('click', (e) => {
  const btn = e.currentTarget;
  if (!btn.classList.contains('armed')) {
    btn.classList.add('armed');
    btn.textContent = 'Yes, clear all';
    clearTimer = setTimeout(() => { btn.classList.remove('armed'); btn.textContent = 'Clear all'; }, 4000);
    return;
  }
  clearTimeout(clearTimer);
  btn.classList.remove('armed');
  btn.textContent = 'Clear all';
  state = { ...defaults(), req: state.req, preset: state.preset, customDate: state.customDate };
  FIELDS.forEach((id) => { $(id).value = ''; });
  save(); render();
  $('totalHours').focus();
});

render();
