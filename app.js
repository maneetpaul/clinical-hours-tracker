let totalChart = null;
let relChart   = null;
let prevTotalComplete = false;
let prevRelComplete   = false;

function makeDonut(id, value, max, color, trackColor) {
  const ctx = document.getElementById(id).getContext('2d');
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [Math.min(value, max), Math.max(0, max - value)],
        backgroundColor: [color, trackColor],
        borderWidth: 0,
        borderRadius: 4
      }]
    },
    options: {
      cutout: '76%',
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { duration: 700, easing: 'easeInOutQuart' }
    }
  });
}

function updateDonut(chart, value, max) {
  chart.data.datasets[0].data = [Math.min(value, max), Math.max(0, max - value)];
  chart.update();
}

// Badge based on caseload surplus relative to needed pace — no arbitrary fixed thresholds
function caseloadBadge(surplus, needed) {
  if (surplus >= 0)                        return ['badge-green',  '✓ Covered'];
  if (surplus >= -0.2 * needed)            return ['badge-yellow', '⚠ Close'];
  return                                          ['badge-red',    '↑ Below pace'];
}

// Project an estimated finish date from the current caseload pace (hrs generated per week)
function projectionLine(remaining, perWeek, weeksLeft) {
  if (remaining <= 0) {
    return `<span style="color:var(--green)">🎉 Requirement met!</span>`;
  }
  if (perWeek <= 0) return '';

  const weeksToFinish = remaining / perWeek;
  const finish = new Date();
  finish.setHours(0, 0, 0, 0);
  finish.setDate(finish.getDate() + Math.ceil(weeksToFinish * 7));
  const finishLabel = finish.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const diffWeeks = Math.round(Math.abs(weeksLeft - weeksToFinish));
  const wk = (n) => `${n} wk${n === 1 ? '' : 's'}`;

  let context;
  if (weeksToFinish <= weeksLeft) {
    context = diffWeeks === 0
      ? `right around your deadline`
      : `<strong style="color:var(--green)">~${wk(diffWeeks)} early</strong>`;
  } else {
    context = `<strong style="color:var(--red)">~${wk(diffWeeks)} past deadline</strong>`;
  }

  return `📅 On pace to finish <strong>${finishLabel}</strong> — ${context}.`;
}

function confettiBurst() {
  if (typeof confetti === 'undefined') return;
  confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.5 },
    colors: ['#5b5bd6', '#7c3aed', '#0d9488', '#111118']
  });
}

function render() {
  const totalNow       = parseFloat(document.getElementById('totalHours').value) || 0;
  const relNow         = parseFloat(document.getElementById('relHours').value)   || 0;
  const deadlineVal    = document.getElementById('deadline').value;
  const TOTAL_REQUIRED = parseFloat(document.getElementById('reqTotal').value)   || 500;
  const REL_REQUIRED   = parseFloat(document.getElementById('reqRel').value)     || 250;

  const totalClients = parseFloat(document.getElementById('totalClients').value) || 0;
  const relClients   = parseFloat(document.getElementById('relClients').value)   || 0;

  // Charts
  if (!totalChart) {
    totalChart = makeDonut('totalChart', totalNow, TOTAL_REQUIRED, '#5b5bd6', '#ededff');
    relChart   = makeDonut('relChart',   relNow,   REL_REQUIRED,   '#0d9488', '#ccfbf1');
  } else {
    updateDonut(totalChart, totalNow, TOTAL_REQUIRED);
    updateDonut(relChart,   relNow,   REL_REQUIRED);
  }

  // Percentages
  const totalPct = Math.min(100, (totalNow / TOTAL_REQUIRED) * 100);
  const relPct   = Math.min(100, (relNow   / REL_REQUIRED)   * 100);
  document.getElementById('totalPct').textContent = totalPct.toFixed(1) + '%';
  document.getElementById('relPct').textContent   = relPct.toFixed(1)   + '%';

  document.getElementById('totalCaption').innerHTML = `<strong>${totalNow}</strong> of ${TOTAL_REQUIRED} hours`;
  document.getElementById('relCaption').innerHTML   = `<strong>${relNow}</strong> of ${REL_REQUIRED} hours`;

  // Keep the hero tile targets in sync with the requirements
  document.getElementById('totalReqTile').textContent = TOTAL_REQUIRED;
  document.getElementById('relReqTile').textContent   = REL_REQUIRED;

  const totalRem = Math.max(0, TOTAL_REQUIRED - totalNow);
  const relRem   = Math.max(0, REL_REQUIRED   - relNow);
  document.getElementById('totalRemLabel').textContent = `${totalRem} hrs remaining`;
  document.getElementById('relRemLabel').textContent   = `${relRem} hrs remaining`;

  // Completion glow + confetti
  const totalComplete = totalNow >= TOTAL_REQUIRED;
  const relComplete   = relNow   >= REL_REQUIRED;
  document.querySelector('.card.total-card').classList.toggle('complete-total', totalComplete);
  document.querySelector('.card.rel-card').classList.toggle('complete-rel',   relComplete);
  if (totalComplete && !prevTotalComplete) confettiBurst();
  if (relComplete   && !prevRelComplete)   confettiBurst();
  prevTotalComplete = totalComplete;
  prevRelComplete   = relComplete;

  // Deadline + pace
  const totalCaseloadEl = document.getElementById('totalCaseloadPace');
  const relCaseloadEl   = document.getElementById('relCaseloadPace');

  if (deadlineVal) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dl = new Date(deadlineVal + 'T00:00:00');
    const weeksLeft  = Math.max(0, (dl - today) / (1000 * 60 * 60 * 24 * 7));
    const weeksFloor = Math.floor(weeksLeft);
    const label = dl.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    document.getElementById('deadlinePill').textContent = `🎓 Deadline: ${label}`;
    document.getElementById('weeksRemainingNote').textContent =
      weeksFloor === 1 ? '1 week remaining' : `${weeksFloor} weeks remaining`;

    if (weeksLeft > 0) {
      const totalPerWeek = totalRem / weeksLeft;
      const relPerWeek   = relRem   / weeksLeft;

      // Hrs/week numbers are neutral — color only comes from caseload comparison
      document.getElementById('totalPerWeek').textContent = totalPerWeek.toFixed(1);
      document.getElementById('relPerWeek').textContent   = relPerWeek.toFixed(1);

      // Caseload projection (1 session/week per client = 1 hr/week per client)
      if (totalClients > 0 || relClients > 0) {
        const caseloadTotalPerWeek = totalClients;
        const caseloadRelPerWeek   = relClients;

        const totalSurplus = caseloadTotalPerWeek - totalPerWeek;
        const relSurplus   = caseloadRelPerWeek   - relPerWeek;
        const fmt = (n) => Math.abs(n).toFixed(1);

        const [tClass, tLabel] = caseloadBadge(totalSurplus, totalPerWeek);
        const [rClass, rLabel] = caseloadBadge(relSurplus,   relPerWeek);

        document.getElementById('totalPaceBadge').innerHTML =
          totalClients > 0 ? `<span class="pace-badge ${tClass}">${tLabel}</span>` : '';
        document.getElementById('relPaceBadge').innerHTML =
          relClients > 0   ? `<span class="pace-badge ${rClass}">${rLabel}</span>` : '';

        const totalProj = projectionLine(totalRem, caseloadTotalPerWeek, weeksLeft);
        const relProj   = projectionLine(relRem,   caseloadRelPerWeek,   weeksLeft);

        totalCaseloadEl.style.display = 'block';
        totalCaseloadEl.innerHTML = totalClients > 0
          ? `Your caseload generates ~<strong>${caseloadTotalPerWeek} hrs/wk</strong> — ${totalSurplus >= 0 ? `<strong style="color:var(--green)">+${fmt(totalSurplus)} above</strong>` : `<strong style="color:var(--red)">−${fmt(totalSurplus)} below</strong>`} what you need.`
            + (totalProj ? `<div class="projection">${totalProj}</div>` : '')
          : '';

        relCaseloadEl.style.display = 'block';
        relCaseloadEl.innerHTML = relClients > 0
          ? `Your relational caseload generates ~<strong>${caseloadRelPerWeek} hrs/wk</strong> — ${relSurplus >= 0 ? `<strong style="color:var(--green)">+${fmt(relSurplus)} above</strong>` : `<strong style="color:var(--red)">−${fmt(relSurplus)} below</strong>`} what you need.`
            + (relProj ? `<div class="projection">${relProj}</div>` : '')
          : '';
      } else {
        document.getElementById('totalPaceBadge').innerHTML = '';
        document.getElementById('relPaceBadge').innerHTML   = '';
        totalCaseloadEl.style.display = 'none';
        relCaseloadEl.style.display   = 'none';
      }
    } else {
      document.getElementById('totalPerWeek').textContent   = '—';
      document.getElementById('totalPaceBadge').innerHTML   = '';
      document.getElementById('relPerWeek').textContent     = '—';
      document.getElementById('relPaceBadge').innerHTML     = '';
      totalCaseloadEl.style.display = 'none';
      relCaseloadEl.style.display   = 'none';
    }
  } else {
    document.getElementById('deadlinePill').textContent   = '🎓 Set a deadline above';
    document.getElementById('weeksRemainingNote').textContent = '';
    document.getElementById('totalPerWeek').textContent   = '—';
    document.getElementById('totalPaceBadge').innerHTML   = '';
    document.getElementById('relPerWeek').textContent     = '—';
    document.getElementById('relPaceBadge').innerHTML     = '';
    totalCaseloadEl.style.display = 'none';
    relCaseloadEl.style.display   = 'none';
  }
}

window.addEventListener('load', () => {
  document.getElementById('deadline').value = '2027-06-01';
  render();
});
