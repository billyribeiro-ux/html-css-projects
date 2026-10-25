/**
 * DPE L8++ STANDARDS: Level 33 - Resilient Fetch Circuit Breaker
 * Architect: Distinguished Principal Engineer (L8++)
 * Enterprise-grade state machine (CLOSED/OPEN/HALF-OPEN) with AbortController timeouts.
 */

(() => {
  'use strict';

  // Breaker Constants
  const STATES = {
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    HALF_OPEN: 'HALF_OPEN'
  };

  const CONFIG = {
    failureThreshold: 3,
    cooldownMs: 5000,
    halfOpenSuccessThreshold: 2
  };

  // State Variables
  let currentState = STATES.CLOSED;
  let consecutiveFailures = 0;
  let consecutiveSuccesses = 0;
  let nextAttemptTime = 0;
  let cooldownTimerInterval = null;

  // DOM Elements
  const breakerCard = document.getElementById('breaker-card');
  const stateBeacon = document.getElementById('state-beacon');
  const stateTitle = document.getElementById('state-title');
  const stateDesc = document.getElementById('state-description');
  const statFailures = document.getElementById('stat-failures');
  const statCooldown = document.getElementById('stat-cooldown');

  const chaosFailureRate = document.getElementById('chaos-failure-rate');
  const outFailureRate = document.getElementById('out-failure-rate');
  const chaosLatency = document.getElementById('chaos-latency');
  const outLatency = document.getElementById('out-latency');
  const chaosTimeout = document.getElementById('chaos-timeout');
  const outTimeout = document.getElementById('out-timeout');

  const btnSingle = document.getElementById('btn-single-request');
  const btnBurst = document.getElementById('btn-burst-request');
  const btnTrip = document.getElementById('btn-trip-circuit');
  const btnReset = document.getElementById('btn-reset-circuit');
  const logStream = document.getElementById('log-stream');
  const btnClearLog = document.getElementById('btn-clear-log');

  function log(msg, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    const time = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3
    }).format(new Date());
    entry.textContent = `[${time}] ${msg}`;
    logStream.appendChild(entry);
    logStream.scrollTop = logStream.scrollHeight;
  }

  function updateUI() {
    breakerCard.className = 'breaker-status-card';
    stateBeacon.className = 'pulse-beacon';

    if (currentState === STATES.CLOSED) {
      breakerCard.classList.add('state-closed-border');
      stateBeacon.classList.add('state-closed');
      stateTitle.textContent = 'CIRCUIT CLOSED';
      stateDesc.textContent = 'Normal operating conditions. All outbound requests pass to upstream endpoints.';
      statFailures.textContent = `${consecutiveFailures} / ${CONFIG.failureThreshold}`;
      statCooldown.textContent = '0s';
    } else if (currentState === STATES.OPEN) {
      breakerCard.classList.add('state-open-border');
      stateBeacon.classList.add('state-open');
      stateTitle.textContent = 'CIRCUIT OPEN (TRIPPED)';
      stateDesc.textContent = 'High failure threshold reached. Outbound requests are blocked locally (fast fail).';
      statFailures.textContent = `${consecutiveFailures} / ${CONFIG.failureThreshold}`;
    } else if (currentState === STATES.HALF_OPEN) {
      breakerCard.classList.add('state-half-border');
      stateBeacon.classList.add('state-half-open');
      stateTitle.textContent = 'CIRCUIT HALF-OPEN';
      stateDesc.textContent = 'Cooldown elapsed. Probing upstream with canary requests to verify recovery.';
      statFailures.textContent = `${consecutiveFailures} / ${CONFIG.failureThreshold}`;
      statCooldown.textContent = 'Probing...';
    }
  }

  function tripCircuit() {
    currentState = STATES.OPEN;
    nextAttemptTime = Date.now() + CONFIG.cooldownMs;
    log(`⚠️ Failure threshold (${CONFIG.failureThreshold}) reached! Circuit tripped OPEN for ${CONFIG.cooldownMs / 1000}s.`, 'error');

    if (cooldownTimerInterval) clearInterval(cooldownTimerInterval);
    cooldownTimerInterval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((nextAttemptTime - Date.now()) / 1000));
      statCooldown.textContent = `${remaining}s`;

      if (remaining <= 0) {
        clearInterval(cooldownTimerInterval);
        currentState = STATES.HALF_OPEN;
        consecutiveSuccesses = 0;
        log('⏱️ Cooldown elapsed. Transitioned to HALF-OPEN canary state.', 'info');
        updateUI();
      }
    }, 200);

    updateUI();
  }

  function resetCircuit() {
    if (cooldownTimerInterval) clearInterval(cooldownTimerInterval);
    currentState = STATES.CLOSED;
    consecutiveFailures = 0;
    consecutiveSuccesses = 0;
    nextAttemptTime = 0;
    log('✅ Circuit manually reset to CLOSED state.', 'success');
    updateUI();
  }

  /**
   * Resilient Fetch with Circuit Breaker and AbortController timeout
   */
  async function executeRequest(reqId) {
    // 1. Check Circuit
    if (currentState === STATES.OPEN) {
      log(`⛔ [Req #${reqId}] REJECTED: Circuit OPEN (Fast fail in 0.05ms)`, 'blocked');
      return;
    }

    const failureRate = parseFloat(chaosFailureRate.value);
    const latency = parseFloat(chaosLatency.value);
    const timeout = parseFloat(chaosTimeout.value);

    // 2. AbortController setup
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    const t0 = performance.now();

    try {
      log(`🚀 [Req #${reqId}] Dispatched (timeout: ${timeout}ms, expected latency: ${latency}ms)...`, 'info');

      // Synthetic network simulation
      await new Promise((resolve, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted due to timeout.', 'AbortError'));
        });

        setTimeout(() => {
          if (controller.signal.aborted) return;
          const isFailed = (Math.random() * 100) < failureRate;
          if (isFailed) {
            reject(new Error('Synthetic 500 Internal Server Error'));
          } else {
            resolve({ status: 200, payload: 'OK' });
          }
        }, latency);
      });

      clearTimeout(timeoutId);
      const elapsed = (performance.now() - t0).toFixed(0);

      // Handle Success
      log(`🟢 [Req #${reqId}] 200 OK (${elapsed}ms)`, 'success');

      if (currentState === STATES.HALF_OPEN) {
        consecutiveSuccesses++;
        if (consecutiveSuccesses >= CONFIG.halfOpenSuccessThreshold) {
          currentState = STATES.CLOSED;
          consecutiveFailures = 0;
          consecutiveSuccesses = 0;
          log(`🎉 Canary passed! Circuit transitioned back to CLOSED.`, 'success');
        }
      } else {
        consecutiveFailures = 0;
      }
      updateUI();

    } catch (err) {
      clearTimeout(timeoutId);
      const elapsed = (performance.now() - t0).toFixed(0);

      log(`🔴 [Req #${reqId}] FAILED (${elapsed}ms): ${err.message}`, 'error');

      if (currentState === STATES.HALF_OPEN) {
        tripCircuit();
      } else if (currentState === STATES.CLOSED) {
        consecutiveFailures++;
        if (consecutiveFailures >= CONFIG.failureThreshold) {
          tripCircuit();
        }
      }
      updateUI();
    }
  }

  // Event Listeners
  chaosFailureRate.addEventListener('input', (e) => {
    outFailureRate.textContent = `${e.target.value}%`;
  });

  chaosLatency.addEventListener('input', (e) => {
    outLatency.textContent = `${e.target.value}ms`;
  });

  chaosTimeout.addEventListener('input', (e) => {
    outTimeout.textContent = `${e.target.value}ms`;
  });

  let reqSeq = 1;

  btnSingle.addEventListener('click', () => {
    executeRequest(reqSeq++);
  });

  btnBurst.addEventListener('click', () => {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => executeRequest(reqSeq++), i * 80);
    }
  });

  btnTrip.addEventListener('click', () => {
    tripCircuit();
  });

  btnReset.addEventListener('click', () => {
    resetCircuit();
  });

  btnClearLog.addEventListener('click', () => {
    logStream.innerHTML = '';
  });

  // Initial State
  updateUI();
})();
