/**
 * DPE L8++ STANDARDS: Level 32 - Collaborative Multi-Agent Cursor Bus
 * Architect: Distinguished Principal Engineer (L8++)
 * 12-byte packed binary ArrayBuffer transport protocol + 60fps LERP interpolation.
 */

(() => {
  'use strict';

  // Packet Structure (12 Bytes Total):
  // [0]: Uint8 agentId
  // [1]: Uint8 flags (1 = click, 2 = pulse)
  // [2..3]: Uint16 sequence
  // [4..7]: Float32 normX
  // [8..11]: Float32 normY
  const PACKET_SIZE = 12;

  function encodePacket(agentId, flags, seq, normX, normY) {
    const buffer = new ArrayBuffer(PACKET_SIZE);
    const view = new DataView(buffer);
    view.setUint8(0, agentId);
    view.setUint8(1, flags);
    view.setUint16(2, seq, true); // little-endian
    view.setFloat32(4, normX, true);
    view.setFloat32(8, normY, true);
    return buffer;
  }

  function decodePacket(buffer) {
    const view = new DataView(buffer);
    return {
      agentId: view.getUint8(0),
      flags: view.getUint8(1),
      seq: view.getUint16(2, true),
      normX: view.getFloat32(4, true),
      normY: view.getFloat32(8, true)
    };
  }

  // DOM Elements
  const arena = document.getElementById('canvas-arena');
  const cursorLayer = document.getElementById('cursor-layer');
  const statPeerCount = document.getElementById('stat-peer-count');
  const statPacketSize = document.getElementById('stat-packet-size');
  const statThroughput = document.getElementById('stat-throughput');
  const statFps = document.getElementById('stat-fps');
  const btnToggleBots = document.getElementById('btn-toggle-bots');
  const btnPingBroadcast = document.getElementById('btn-ping-broadcast');

  // Peer State Registry
  const PEERS = [
    { id: 0, name: 'You (Local)', color: 'oklch(0.76 0.18 190)', isLocal: true },
    { id: 1, name: 'Alex (Tokyo)', color: 'oklch(0.68 0.22 290)', isLocal: false },
    { id: 2, name: 'Elena (Zurich)', color: 'oklch(0.75 0.2 145)', isLocal: false },
    { id: 3, name: 'Marcus (Austin)', color: 'oklch(0.8 0.18 80)', isLocal: false },
    { id: 4, name: 'Amina (Nairobi)', color: 'oklch(0.7 0.22 25)', isLocal: false }
  ];

  const peerStates = new Map();
  let botsActive = true;
  let packetCounter = 0;
  let packetsPerSec = 0;
  let localSeq = 0;

  // Initialize Peer Elements & State
  PEERS.forEach(peer => {
    const el = document.createElement('div');
    el.className = 'peer-cursor';
    el.id = `peer-cursor-${peer.id}`;

    // SVG Cursor Arrow
    el.innerHTML = `
      <svg class="cursor-pointer-icon" viewBox="0 0 24 24" fill="none">
        <path d="M5 3L19 12L12 14L9 21L5 3Z" fill="${peer.color}" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
      <span class="cursor-label" style="background-color: ${peer.color};">${peer.name}</span>
    `;

    cursorLayer.appendChild(el);

    peerStates.set(peer.id, {
      id: peer.id,
      name: peer.name,
      color: peer.color,
      isLocal: peer.isLocal,
      el: el,
      currentX: 0.5,
      currentY: 0.5,
      targetX: 0.5,
      targetY: 0.5,
      // Bot trajectory variables
      angle: Math.random() * Math.PI * 2,
      speed: 0.002 + Math.random() * 0.004,
      turnRate: 0.05
    });
  });

  // Telemetry Monitor
  setInterval(() => {
    packetsPerSec = packetCounter;
    packetCounter = 0;
    statThroughput.textContent = `${packetsPerSec} pkts/s`;
  }, 1000);

  // Linear Interpolation
  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  // Simulated Bus Packet Dispatcher
  function dispatchToBus(buffer) {
    packetCounter++;
    const data = decodePacket(buffer);
    const peer = peerStates.get(data.agentId);
    if (!peer) return;

    peer.targetX = data.normX;
    peer.targetY = data.normY;

    if (data.flags & 1) { // Click
      spawnRipple(peer.targetX, peer.targetY, peer.color);
    }
  }

  function spawnRipple(normX, normY, color) {
    const rect = arena.getBoundingClientRect();
    const ripple = document.createElement('div');
    ripple.className = 'pulse-ripple';
    ripple.style.left = `${normX * rect.width}px`;
    ripple.style.top = `${normY * rect.height}px`;
    ripple.style.borderColor = color;
    arena.appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
  }

  // Local User Input
  arena.addEventListener('pointermove', (e) => {
    const rect = arena.getBoundingClientRect();
    const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const packet = encodePacket(0, 0, localSeq++, normX, normY);
    dispatchToBus(packet);
  });

  arena.addEventListener('pointerdown', (e) => {
    const rect = arena.getBoundingClientRect();
    const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const packet = encodePacket(0, 1, localSeq++, normX, normY);
    dispatchToBus(packet);
  });

  // Bot Simulator Loop
  function simulateBots() {
    if (!botsActive) return;

    PEERS.forEach(peer => {
      if (peer.isLocal) return;
      const state = peerStates.get(peer.id);

      // Random wander physics
      state.angle += (Math.random() - 0.5) * state.turnRate * 2;
      let nextX = state.targetX + Math.cos(state.angle) * state.speed;
      let nextY = state.targetY + Math.sin(state.angle) * state.speed;

      // Bounce against bounds
      if (nextX < 0.05 || nextX > 0.95) state.angle = Math.PI - state.angle;
      if (nextY < 0.05 || nextY > 0.95) state.angle = -state.angle;

      nextX = Math.max(0.05, Math.min(0.95, nextX));
      nextY = Math.max(0.05, Math.min(0.95, nextY));

      const isClick = Math.random() < 0.01;
      const packet = encodePacket(peer.id, isClick ? 1 : 0, 0, nextX, nextY);
      dispatchToBus(packet);
    });
  }

  setInterval(simulateBots, 16); // ~60 updates/sec

  // Render & LERP Loop (120fps rAF)
  let lastFrameTime = performance.now();
  let frameCount = 0;

  function renderLoop(now) {
    const rect = arena.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    peerStates.forEach(peer => {
      // 0.25 LERP smoothing
      peer.currentX = lerp(peer.currentX, peer.targetX, 0.25);
      peer.currentY = lerp(peer.currentY, peer.targetY, 0.25);

      const pxX = peer.currentX * width;
      const pxY = peer.currentY * height;

      peer.el.style.transform = `translate3d(${pxX}px, ${pxY}px, 0)`;
    });

    // FPS Meter
    frameCount++;
    if (now - lastFrameTime >= 1000) {
      statFps.textContent = `${frameCount} FPS`;
      frameCount = 0;
      lastFrameTime = now;
    }

    requestAnimationFrame(renderLoop);
  }

  requestAnimationFrame(renderLoop);

  // Controls
  btnToggleBots.addEventListener('click', () => {
    botsActive = !botsActive;
    btnToggleBots.textContent = botsActive ? 'Pause Bots' : 'Resume Bots';
  });

  btnPingBroadcast.addEventListener('click', () => {
    peerStates.forEach(peer => {
      spawnRipple(peer.currentX, peer.currentY, peer.color);
    });
  });
})();
