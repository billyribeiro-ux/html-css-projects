/**
 * DPE L8++ STANDARDS: Level 23 - Off-Main-Thread Computation Engine
 * Architect: Distinguished Principal Engineer (L8++)
 * Standards: Native Web Workers, Blob URL Inline Compilation,
 *            FPS Frame-Drop Auditing, Non-blocking Execution
 */
'use strict';

// 1. Inline Web Worker Source Code (Blob URL Pattern guarantees zero origin/CORS friction)
const WORKER_SCRIPT = `
self.onmessage = function(e) {
  const depth = e.data.depth;
  const start = performance.now();

  // Sieve of Eratosthenes Prime Matrix Calculation
  const isPrime = new Uint8Array(depth + 1);
  isPrime.fill(1);
  isPrime[0] = 0;
  isPrime[1] = 0;

  for (let p = 2; p * p <= depth; p++) {
    if (isPrime[p] === 1) {
      for (let i = p * p; i <= depth; i += p) {
        isPrime[i] = 0;
      }
    }
  }

  let primeCount = 0;
  let largestPrime = 0;
  for (let i = 2; i <= depth; i++) {
    if (isPrime[i] === 1) {
      primeCount++;
      largestPrime = i;
    }
  }

  const duration = performance.now() - start;
  self.postMessage({
    primeCount: primeCount,
    largestPrime: largestPrime,
    depth: depth,
    duration: duration,
    bytesAllocated: isPrime.byteLength
  });
};
`;

// 2. Instantiate Worker via Blob
const workerBlob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(workerBlob);
let computeWorker = new Worker(workerUrl);

// 3. DOM Elements
const depthSelect = document.getElementById('compute-depth');
const btnWorker = document.getElementById('btn-run-worker');
const btnMain = document.getElementById('btn-run-main');
const workerStatus = document.getElementById('worker-status');
const timeElapsed = document.getElementById('time-elapsed');
const resultsOutput = document.getElementById('results-output');
const fpsLabel = document.getElementById('fps-label');

// 4. Live FPS Frame Loop Monitor
let lastFrameTime = performance.now();
let frameCount = 0;
let currentFps = 60;

function frameLoop() {
  const now = performance.now();
  const delta = now - lastFrameTime;
  frameCount++;

  if (delta >= 1000) {
    currentFps = Math.round((frameCount * 1000) / delta);
    fpsLabel.textContent = `Live Main Thread: ${currentFps} FPS`;
    if (currentFps < 45) {
      fpsLabel.style.color = 'var(--brand-red)';
    } else {
      fpsLabel.style.color = 'var(--brand-green)';
    }
    frameCount = 0;
    lastFrameTime = now;
  }

  requestAnimationFrame(frameLoop);
}
requestAnimationFrame(frameLoop);

// 5. Worker Message Listener
computeWorker.onmessage = function(e) {
  const data = e.data;
  workerStatus.textContent = 'IDLE';
  workerStatus.className = 'worker-status-chip';
  btnWorker.disabled = false;
  btnMain.disabled = false;

  timeElapsed.textContent = `${data.duration.toFixed(2)} ms`;
  resultsOutput.textContent = 
    `✓ WORKER TASK COMPLETE (Off-Main-Thread)\n` +
    `— Primes Computed: ${data.primeCount.toLocaleString()} primes up to ${data.depth.toLocaleString()}\n` +
    `— Largest Prime Found: ${data.largestPrime.toLocaleString()}\n` +
    `— TypedArray Memory: ${(data.bytesAllocated / 1024 / 1024).toFixed(2)} MB allocated\n` +
    `— Execution Latency: ${data.duration.toFixed(2)}ms (Main thread frame rate untouched!)\n` +
    `— Worker Status: Released to standby.`;
};

// 6. Execute via Web Worker
btnWorker.addEventListener('click', () => {
  const depth = parseInt(depthSelect.value, 10);
  workerStatus.textContent = 'EXECUTING';
  workerStatus.className = 'worker-status-chip status-active';
  btnWorker.disabled = true;
  btnMain.disabled = true;
  resultsOutput.textContent = `// Dispatching calculation job to isolated background thread...\n// Notice the 3D gyroscope spinner continues to rotate at locked 60 FPS!`;

  computeWorker.postMessage({ depth: depth });
});

// 7. Execute on Main Thread (Demonstration of what NOT to do)
btnMain.addEventListener('click', () => {
  const depth = parseInt(depthSelect.value, 10);
  workerStatus.textContent = 'MAIN_BLOCKED';
  workerStatus.className = 'worker-status-chip status-active';
  btnWorker.disabled = true;
  btnMain.disabled = true;

  resultsOutput.textContent = `// WARNING: Executing on Main Thread!\n// The UI event loop will freeze completely during calculation...`;

  // Use minimal timeout so DOM renders the warning message before freeze
  setTimeout(() => {
    const start = performance.now();
    const isPrime = new Uint8Array(depth + 1);
    isPrime.fill(1);
    isPrime[0] = 0;
    isPrime[1] = 0;

    for (let p = 2; p * p <= depth; p++) {
      if (isPrime[p] === 1) {
        for (let i = p * p; i <= depth; i += p) {
          isPrime[i] = 0;
        }
      }
    }

    let primeCount = 0;
    let largestPrime = 0;
    for (let i = 2; i <= depth; i++) {
      if (isPrime[i] === 1) {
        primeCount++;
        largestPrime = i;
      }
    }

    const duration = performance.now() - start;

    workerStatus.textContent = 'IDLE';
    workerStatus.className = 'worker-status-chip';
    btnWorker.disabled = false;
    btnMain.disabled = false;

    timeElapsed.textContent = `${duration.toFixed(2)} ms`;
    resultsOutput.textContent = 
      `⚠ MAIN THREAD EXECUTION COMPLETED (Heavy Dropped Frames)\n` +
      `— Primes Computed: ${primeCount.toLocaleString()}\n` +
      `— Largest Prime: ${largestPrime.toLocaleString()}\n` +
      `— Main Thread Block Time: ${duration.toFixed(2)} ms (Animation was frozen!)\n` +
      `— DPE L8++ Rule: Always delegate CPU-intensive work to dedicated Web Workers!`;
  }, 50);
});
