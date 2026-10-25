/**
 * DPE L8++ STANDARDS: Level 22 - Real-time Core Web Vitals Observer
 * Architect: Distinguished Principal Engineer (L8++)
 * Standards: Native PerformanceObserver, INP/LCP/CLS Algorithms,
 *            Sub-millisecond Timing Precision, Strict Isolation
 */
'use strict';

// 1. Telemetry State
let maxInpDuration = 0;
let cumulativeLayoutShift = 0;
let largestContentfulPaint = 0;

// DOM Nodes
const scoreInp = document.getElementById('score-inp');
const badgeInp = document.getElementById('badge-inp');
const barInp = document.getElementById('bar-inp');
const noteInp = document.getElementById('note-inp');

const scoreLcp = document.getElementById('score-lcp');
const badgeLcp = document.getElementById('badge-lcp');
const barLcp = document.getElementById('bar-lcp');
const noteLcp = document.getElementById('note-lcp');

const scoreCls = document.getElementById('score-cls');
const badgeCls = document.getElementById('badge-cls');
const barCls = document.getElementById('bar-cls');
const noteCls = document.getElementById('note-cls');

const streamLog = document.getElementById('stream-log');
const btnFast = document.getElementById('btn-fast-click');
const btnStress = document.getElementById('btn-stress-click');
const btnHeavy = document.getElementById('btn-heavy-click');
const btnClear = document.getElementById('btn-clear-log');

// 2. Helper: Log Streaming Entry
function appendLog(type, val, detail) {
  const line = document.createElement('div');
  line.className = 'log-line';
  const time = new Date().toISOString().substring(11, 23);
  line.innerHTML = `
    <span class="time">[${time}]</span>
    <span class="type">&lt;${type}&gt;</span>
    <span class="val">${val}</span>
    <span class="detail">— ${detail}</span>
  `;
  streamLog.prepend(line);
}

// 3. Update INP Display
function updateInpDisplay(duration, targetName) {
  if (duration > maxInpDuration) {
    maxInpDuration = duration;
  }
  const rounded = Math.round(maxInpDuration);
  scoreInp.innerHTML = `${rounded} <small>ms</small>`;

  // Clear previous rating classes
  badgeInp.className = 'vital-rating';
  barInp.className = 'meter-fill';

  if (rounded <= 200) {
    badgeInp.classList.add('rating-good');
    badgeInp.textContent = 'GOOD';
    barInp.classList.add('fill-good');
    barInp.style.width = `${Math.min(100, (rounded / 200) * 50)}%`;
  } else if (rounded <= 500) {
    badgeInp.classList.add('rating-needs');
    badgeInp.textContent = 'NEEDS IMPROVEMENT';
    barInp.classList.add('fill-needs');
    barInp.style.width = `${50 + ((rounded - 200) / 300) * 35}%`;
  } else {
    badgeInp.classList.add('rating-poor');
    badgeInp.textContent = 'POOR';
    barInp.classList.add('fill-poor');
    barInp.style.width = '100%';
  }

  noteInp.textContent = `Worst latency outlier: ${targetName || 'interaction'} (${rounded}ms)`;
}

// 4. Update CLS Display
function updateClsDisplay(shiftVal) {
  cumulativeLayoutShift += shiftVal;
  const formatted = cumulativeLayoutShift.toFixed(3);
  scoreCls.textContent = formatted;

  badgeCls.className = 'vital-rating';
  barCls.className = 'meter-fill';

  if (cumulativeLayoutShift <= 0.1) {
    badgeCls.classList.add('rating-good');
    badgeCls.textContent = 'GOOD';
    barCls.classList.add('fill-good');
    barCls.style.width = `${(cumulativeLayoutShift / 0.1) * 50}%`;
  } else if (cumulativeLayoutShift <= 0.25) {
    badgeCls.classList.add('rating-needs');
    badgeCls.textContent = 'NEEDS IMPROVEMENT';
    barCls.classList.add('fill-needs');
    barCls.style.width = '75%';
  } else {
    badgeCls.classList.add('rating-poor');
    badgeCls.textContent = 'POOR';
    barCls.classList.add('fill-poor');
    barCls.style.width = '100%';
  }
}

// 5. Update LCP Display
function updateLcpDisplay(paintTime) {
  largestContentfulPaint = (paintTime / 1000).toFixed(2);
  scoreLcp.innerHTML = `${largestContentfulPaint} <small>s</small>`;

  badgeLcp.className = 'vital-rating';
  barLcp.className = 'meter-fill';

  if (paintTime <= 2500) {
    badgeLcp.classList.add('rating-good');
    badgeLcp.textContent = 'GOOD';
    barLcp.classList.add('fill-good');
    barLcp.style.width = `${Math.min(100, (paintTime / 2500) * 50)}%`;
  } else if (paintTime <= 4000) {
    badgeLcp.classList.add('rating-needs');
    badgeLcp.textContent = 'NEEDS IMPROVEMENT';
    barLcp.classList.add('fill-needs');
    barLcp.style.width = '75%';
  } else {
    badgeLcp.classList.add('rating-poor');
    badgeLcp.textContent = 'POOR';
    barLcp.classList.add('fill-poor');
    barLcp.style.width = '100%';
  }
}

// 6. Initialize PerformanceObserver Subscriptions
if (typeof PerformanceObserver !== 'undefined') {
  // A. Observer for Interaction to Next Paint (INP)
  try {
    const inpObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.interactionId) continue; // Exclude non-pointer/non-key interactions
        const duration = entry.duration;
        const targetNode = entry.target ? entry.target.id || entry.target.tagName : 'anonymous';
        updateInpDisplay(duration, targetNode);
        appendLog('INP', `${Math.round(duration)}ms`, `Target: <${targetNode}>`);
      }
    });
    inpObserver.observe({ type: 'event', durationThreshold: 16, buffered: true });
  } catch (err) {
    console.warn('INP Event observer not supported in current environment:', err);
  }

  // B. Observer for Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        updateLcpDisplay(lastEntry.startTime);
        appendLog('LCP', `${(lastEntry.startTime / 1000).toFixed(2)}s`, `Rendered candidate node: ${lastEntry.id || lastEntry.element?.tagName || 'root'}`);
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (err) {
    console.warn('LCP observer not supported:', err);
  }

  // C. Observer for Cumulative Layout Shift (CLS)
  try {
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          updateClsDisplay(entry.value);
          appendLog('CLS', `+${entry.value.toFixed(4)}`, 'Unexpected layout delta detected');
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (err) {
    console.warn('CLS observer not supported:', err);
  }
} else {
  appendLog('SYS_WARN', 'N/A', 'PerformanceObserver unavailable in this browser context.');
}

// 7. Interactive Stress Tests
btnFast.addEventListener('click', () => {
  // Fast click completes in <2ms
  const start = performance.now();
  let x = 0;
  for (let i = 0; i < 1000; i++) x += i;
  const elapsed = performance.now() - start;
  updateInpDisplay(Math.max(8, elapsed), 'btn-fast-click');
});

btnStress.addEventListener('click', () => {
  // Simulate synthetic computation (~180ms)
  const start = performance.now();
  while (performance.now() - start < 180) {
    Math.sqrt(Math.random() * 100000);
  }
  updateInpDisplay(180, 'btn-stress-click');
});

btnHeavy.addEventListener('click', () => {
  // Simulate heavy main-thread block (~350ms)
  const start = performance.now();
  while (performance.now() - start < 350) {
    Math.sin(Math.random() * 10000);
  }
  updateInpDisplay(350, 'btn-heavy-click');
});

btnClear.addEventListener('click', () => {
  streamLog.innerHTML = '';
  appendLog('SYS', 'CLEARED', 'Event stream history reset.');
});

// Boot entry
appendLog('SYS_BOOT', 'ACTIVE', 'PerformanceObserver initialized on main thread.');
