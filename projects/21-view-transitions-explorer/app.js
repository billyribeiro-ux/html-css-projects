/**
 * DPE L8++ STANDARDS: Level 21 - Autonomous View Transitions Explorer
 * Architect: Distinguished Principal Engineer (L8++)
 * Standards: Native View Transitions API, Shared-Element Tagging,
 *            Strict Feature Detection Fallbacks, Zero NPM Dependencies
 */
'use strict';

// 1. Data Store
const CLUSTER_NODES = [
  {
    id: 'node-alpha',
    title: 'Topological Quantum Lattice #01',
    category: 'Quantum Hardware',
    symbol: '⚛',
    color: 'radial-gradient(circle at 30% 30%, oklch(0.55 0.22 290), oklch(0.18 0.05 260))',
    status: 'Coherent • 15mK',
    desc: 'Fault-tolerant non-Abelian anyon storage module sustaining 256 physical qubits with zero active decoherence leakage.',
    metrics: { tflops: '4,096', fidelity: '99.99%', latency: '0.12 ms' }
  },
  {
    id: 'node-beta',
    title: 'Photonic Silicon Transceiver Mesh',
    category: 'Optical Networking',
    symbol: '⚯',
    color: 'radial-gradient(circle at 30% 30%, oklch(0.65 0.2 190), oklch(0.18 0.05 260))',
    status: 'Nominal • 3.2 Tbps',
    desc: 'Dense wavelength division multiplexing (DWDM) optical switch routing inter-rack tensor buffers at light speed.',
    metrics: { tflops: '12,800', fidelity: '99.98%', latency: '0.04 ms' }
  },
  {
    id: 'node-gamma',
    title: 'eBPF Kernel Mesh Dispatcher',
    category: 'Microkernel Hypervisor',
    symbol: '⚡',
    color: 'radial-gradient(circle at 30% 30%, oklch(0.68 0.2 145), oklch(0.18 0.05 260))',
    status: 'Zero Packet Drop',
    desc: 'In-kernel bytecode filters bypassing userspace networking stacks for zero-copy remote procedure calls.',
    metrics: { tflops: '8,192', fidelity: '100.0%', latency: '0.08 ms' }
  },
  {
    id: 'node-delta',
    title: 'Kyber-1024 Cryptographic Enclave',
    category: 'Quantum Security',
    symbol: '🛡',
    color: 'radial-gradient(circle at 30% 30%, oklch(0.65 0.22 55), oklch(0.18 0.05 260))',
    status: 'Air-Gapped Root',
    desc: 'NIST FIPS 203 standardized module generating post-quantum key encodings across 10,000 distributed cluster endpoints.',
    metrics: { tflops: '2,048', fidelity: '99.99%', latency: '0.22 ms' }
  }
];

// 2. DOM Elements
const container = document.getElementById('explorer-container');
const btnGrid = document.getElementById('btn-grid');
const btnList = document.getElementById('btn-list');
const detailModal = document.getElementById('detail-modal');
const detailHero = document.getElementById('detail-hero');
const detailTitle = document.getElementById('detail-title');
const detailCategory = document.getElementById('detail-category');
const detailDesc = document.getElementById('detail-desc');
const detailMetrics = document.getElementById('detail-metrics');
const btnCloseDetail = document.getElementById('btn-close-detail');
const btnBack = document.getElementById('btn-back');

let activeNode = null;

// 3. Helper: Resilient View Transition Executor
function transition(updateCallback) {
  if (!document.startViewTransition) {
    updateCallback();
    return Promise.resolve();
  }
  return document.startViewTransition(updateCallback).finished;
}

// 4. Render Grid / List Cards
function renderNodes() {
  container.innerHTML = '';
  CLUSTER_NODES.forEach((node) => {
    const card = document.createElement('article');
    card.className = 'node-card';
    card.id = `card-${node.id}`;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Inspect ${node.title}`);

    card.innerHTML = `
      <div class="card-visual" id="hero-${node.id}" style="background: ${node.color}">
        <span class="visual-symbol">${node.symbol}</span>
      </div>
      <div class="card-body">
        <span class="card-category">${node.category}</span>
        <h3 class="card-title" id="title-${node.id}">${node.title}</h3>
        <div class="card-status-row">
          <span>Status:</span>
          <span class="status-text">${node.status}</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => openDetail(node));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDetail(node);
      }
    });

    container.appendChild(card);
  });
}

// 5. Open Detail View with Shared Element Transition
function openDetail(node) {
  activeNode = node;
  const sourceHero = document.getElementById(`hero-${node.id}`);
  const sourceTitle = document.getElementById(`title-${node.id}`);

  // Tag shared elements with transition names
  if (sourceHero) sourceHero.style.viewTransitionName = 'detail-hero';
  if (sourceTitle) sourceTitle.style.viewTransitionName = 'detail-title';
  detailHero.style.viewTransitionName = 'detail-hero';
  detailTitle.style.viewTransitionName = 'detail-title';

  transition(() => {
    detailHero.style.background = node.color;
    detailHero.innerHTML = `<span class="visual-symbol" style="font-size: 4rem;">${node.symbol}</span>`;
    detailCategory.textContent = node.category;
    detailTitle.textContent = node.title;
    detailDesc.textContent = node.desc;

    detailMetrics.innerHTML = `
      <div class="metric-box"><span class="m-label">Throughput</span><span class="m-val">${node.metrics.tflops} TF</span></div>
      <div class="metric-box"><span class="m-label">Fidelity</span><span class="m-val">${node.metrics.fidelity}</span></div>
      <div class="metric-box"><span class="m-label">Jitter</span><span class="m-val">${node.metrics.latency}</span></div>
    `;

    detailModal.hidden = false;
    btnCloseDetail.focus();
  }).finally(() => {
    // Clear transition names after animation completes
    if (sourceHero) sourceHero.style.viewTransitionName = '';
    if (sourceTitle) sourceTitle.style.viewTransitionName = '';
  });
}

// 6. Close Detail View with Reverse Shared Element Transition
function closeDetail() {
  if (!activeNode) return;
  const sourceHero = document.getElementById(`hero-${activeNode.id}`);
  const sourceTitle = document.getElementById(`title-${activeNode.id}`);

  if (sourceHero) sourceHero.style.viewTransitionName = 'detail-hero';
  if (sourceTitle) sourceTitle.style.viewTransitionName = 'detail-title';

  transition(() => {
    detailModal.hidden = true;
  }).finally(() => {
    if (sourceHero) sourceHero.style.viewTransitionName = '';
    if (sourceTitle) sourceTitle.style.viewTransitionName = '';
    detailHero.style.viewTransitionName = '';
    detailTitle.style.viewTransitionName = '';
    if (sourceHero) sourceHero.closest('.node-card').focus();
    activeNode = null;
  });
}

// 7. Event Listeners for Controls
btnGrid.addEventListener('click', () => {
  if (!btnGrid.classList.contains('active')) {
    transition(() => {
      container.classList.remove('layout-list');
      btnGrid.classList.add('active');
      btnGrid.setAttribute('aria-pressed', 'true');
      btnList.classList.remove('active');
      btnList.setAttribute('aria-pressed', 'false');
    });
  }
});

btnList.addEventListener('click', () => {
  if (!btnList.classList.contains('active')) {
    transition(() => {
      container.classList.add('layout-list');
      btnList.classList.add('active');
      btnList.setAttribute('aria-pressed', 'true');
      btnGrid.classList.remove('active');
      btnGrid.setAttribute('aria-pressed', 'false');
    });
  }
});

btnCloseDetail.addEventListener('click', closeDetail);
btnBack.addEventListener('click', closeDetail);
detailModal.addEventListener('click', (e) => {
  if (e.target === detailModal) closeDetail();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !detailModal.hidden) {
    closeDetail();
  }
});

// Initial boot
renderNodes();
