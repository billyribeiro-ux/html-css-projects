/**
 * DPE L8++ STANDARDS: Level 40 - Micro-Frontend Kernel OS Capstone
 * Architect: Distinguished Principal Engineer (L8++)
 * Autonomous browser OS kernel: Shadow DOM CSS sandboxing, EventTarget pub/sub bus & window lifecycle.
 */

(() => {
  'use strict';

  // 1. Kernel Inter-MFE Event Bus (Decoupled Typed Broker)
  class KernelEventBus extends EventTarget {
    constructor() {
      super();
      this.eventCounter = 0;
    }

    publish(topic, payload = {}) {
      this.eventCounter++;
      this.dispatchEvent(new CustomEvent(topic, { detail: payload }));
      updateTelemetry();
    }

    subscribe(topic, handler) {
      const listener = (e) => handler(e.detail);
      this.addEventListener(topic, listener);
      return () => this.removeEventListener(topic, listener);
    }
  }

  const kernelBus = new KernelEventBus();

  // DOM Elements
  const osArena = document.getElementById('os-arena');
  const statActiveApps = document.getElementById('stat-active-apps');
  const statDomNodes = document.getElementById('stat-dom-nodes');
  const statBusEvents = document.getElementById('stat-bus-events');
  const btnBroadcastPing = document.getElementById('btn-broadcast-ping');
  const dockItems = document.querySelectorAll('.dock-item[data-app]');

  function updateTelemetry() {
    statBusEvents.textContent = kernelBus.eventCounter;
    statActiveApps.textContent = activeWindows.size;
    statDomNodes.textContent = document.querySelectorAll('*').length;
  }

  // 2. Micro-Frontend App Definitions
  const APPS = {
    telemetry: {
      id: 'telemetry',
      title: 'Cluster Telemetry Monitor',
      icon: '📊',
      defaultPos: { x: 30, y: 30, w: 320 },
      createInstance: () => {
        let timer = null;
        let unsubscribe = null;
        return {
          mount(shadow, bus) {
            shadow.innerHTML = `
              <style>
                :host { display: block; padding: 1.25rem; font-family: system-ui, sans-serif; color: #fff; }
                .metric { margin-bottom: 0.85rem; }
                .metric-label { font-size: 0.75rem; color: #888; text-transform: uppercase; font-weight: 700; }
                .metric-val { font-family: monospace; font-size: 1.2rem; font-weight: 800; color: #38bdf8; }
                .bar-bg { height: 6px; background: #222; border-radius: 3px; overflow: hidden; margin-top: 4px; }
                .bar-fill { height: 100%; width: 45%; background: #38bdf8; transition: width 0.3s ease; }
                .badge-pulse { font-size: 0.75rem; padding: 0.2rem 0.5rem; background: rgba(56,189,248,0.15); border-radius: 4px; }
              </style>
              <div class="metric">
                <span class="metric-label">Node Load Average</span>
                <div class="metric-val" id="val-load">42%</div>
                <div class="bar-bg"><div class="bar-fill" id="bar-load"></div></div>
              </div>
              <div class="metric">
                <span class="metric-label">Network Throughput</span>
                <div class="metric-val" id="val-net">1.84 Gbps</div>
              </div>
              <span class="badge-pulse" id="ping-status">Awaiting Kernel Ping...</span>
            `;

            const valLoad = shadow.getElementById('val-load');
            const barLoad = shadow.getElementById('bar-load');
            const pingStatus = shadow.getElementById('ping-status');

            timer = setInterval(() => {
              const load = (20 + Math.random() * 60).toFixed(0);
              valLoad.textContent = `${load}%`;
              barLoad.style.width = `${load}%`;
            }, 1500);

            unsubscribe = bus.subscribe('kernel:ping', (data) => {
              pingStatus.textContent = `⚡ PING RECEIVED: ${data.timestamp}`;
              pingStatus.style.background = 'rgba(74, 222, 128, 0.2)';
              pingStatus.style.color = '#4ade80';
            });
          },
          unmount() {
            if (timer) clearInterval(timer);
            if (unsubscribe) unsubscribe();
          }
        };
      }
    },

    tasks: {
      id: 'tasks',
      title: 'Decoupled Task Matrix',
      icon: '📋',
      defaultPos: { x: 380, y: 50, w: 340 },
      createInstance: () => {
        let unsubscribe = null;
        return {
          mount(shadow, bus) {
            shadow.innerHTML = `
              <style>
                :host { display: block; padding: 1.25rem; font-family: system-ui, sans-serif; color: #fff; }
                .task-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
                .task-item { display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; padding: 0.4rem 0.6rem; background: rgba(255,255,255,0.05); border-radius: 6px; }
                .task-item input { cursor: pointer; accent-color: #38bdf8; }
                .task-item.done { text-decoration: line-through; opacity: 0.5; }
              </style>
              <ul class="task-list">
                <li class="task-item"><input type="checkbox"> Verify Sub-Millisecond INP</li>
                <li class="task-item"><input type="checkbox"> Check Shadow DOM Isolation</li>
                <li class="task-item done"><input type="checkbox" checked> Mount Kernel Event Bus</li>
              </ul>
            `;

            shadow.querySelectorAll('.task-item input').forEach(box => {
              box.addEventListener('change', (e) => {
                const item = e.target.closest('.task-item');
                item.classList.toggle('done', e.target.checked);
                bus.publish('task:completed', { text: item.textContent.trim() });
              });
            });

            unsubscribe = bus.subscribe('kernel:ping', () => {
              shadow.host.style.filter = 'drop-shadow(0 0 12px rgba(56,189,248,0.5))';
              setTimeout(() => shadow.host.style.filter = '', 600);
            });
          },
          unmount() {
            if (unsubscribe) unsubscribe();
          }
        };
      }
    },

    clock: {
      id: 'clock',
      title: 'Precision Cyber Clock',
      icon: '⏱️',
      defaultPos: { x: 740, y: 80, w: 280 },
      createInstance: () => {
        let frameId = null;
        return {
          mount(shadow) {
            shadow.innerHTML = `
              <style>
                :host { display: block; padding: 1.5rem; font-family: monospace; color: #38bdf8; text-align: center; }
                .clock-digits { font-size: 1.7rem; font-weight: 800; letter-spacing: 0.05em; text-shadow: 0 0 15px rgba(56,189,248,0.4); }
                .clock-date { font-size: 0.75rem; color: #888; margin-top: 0.4rem; }
              </style>
              <div class="clock-digits" id="digits">00:00:00.000</div>
              <div class="clock-date" id="date-label">UTC SYNCHRONIZED</div>
            `;

            const digits = shadow.getElementById('digits');
            const dateLabel = shadow.getElementById('date-label');

            function tick() {
              const now = new Date();
              digits.textContent = new Intl.DateTimeFormat('en-US', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3, hour12: false
              }).format(now);
              dateLabel.textContent = now.toISOString().split('T')[0];
              frameId = requestAnimationFrame(tick);
            }
            tick();
          },
          unmount() {
            if (frameId) cancelAnimationFrame(frameId);
          }
        };
      }
    }
  };

  // 3. Kernel Window Manager
  const activeWindows = new Map();
  let highestZ = 10;

  function mountApp(appId) {
    if (activeWindows.has(appId)) {
      // Bring existing to front
      const win = activeWindows.get(appId).windowEl;
      bringToFront(win);
      return;
    }

    const appDef = APPS[appId];
    if (!appDef) return;

    // Build Window Frame
    const win = document.createElement('div');
    win.className = 'mfe-window active-window';
    win.id = `win-${appId}`;
    win.style.left = `${appDef.defaultPos.x}px`;
    win.style.top = `${appDef.defaultPos.y}px`;
    win.style.width = `${appDef.defaultPos.w}px`;
    win.style.zIndex = ++highestZ;

    win.innerHTML = `
      <div class="mfe-window-header">
        <span class="window-title">${appDef.icon} ${appDef.title}</span>
        <div class="window-controls">
          <button type="button" class="win-btn win-btn-close" title="Close App"></button>
        </div>
      </div>
      <div class="mfe-shadow-host" id="host-${appId}"></div>
    `;

    osArena.appendChild(win);

    // Create Isolated Shadow DOM Sandboxed Root
    const host = win.querySelector(`#host-${appId}`);
    const shadow = host.attachShadow({ mode: 'open' });

    // Mount App Instance
    const instance = appDef.createInstance();
    instance.mount(shadow, kernelBus);

    activeWindows.set(appId, {
      appDef,
      windowEl: win,
      instance
    });

    // Window Dragging & Focus
    setupWindowInteractions(win);

    win.querySelector('.win-btn-close').addEventListener('click', () => {
      unmountApp(appId);
    });

    updateTelemetry();
  }

  function unmountApp(appId) {
    const entry = activeWindows.get(appId);
    if (!entry) return;

    entry.instance.unmount();
    entry.windowEl.remove();
    activeWindows.delete(appId);
    updateTelemetry();
  }

  function bringToFront(win) {
    document.querySelectorAll('.mfe-window').forEach(w => w.classList.remove('active-window'));
    win.classList.add('active-window');
    win.style.zIndex = ++highestZ;
  }

  function setupWindowInteractions(win) {
    const header = win.querySelector('.mfe-window-header');
    let isDragging = false;
    let startX = 0, startY = 0;
    let initX = 0, initY = 0;

    win.addEventListener('pointerdown', () => bringToFront(win));

    header.addEventListener('pointerdown', (e) => {
      isDragging = true;
      header.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startY = e.clientY;
      initX = parseFloat(win.style.left) || 0;
      initY = parseFloat(win.style.top) || 0;
    });

    header.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      win.style.left = `${Math.max(0, initX + dx)}px`;
      win.style.top = `${Math.max(0, initY + dy)}px`;
    });

    header.addEventListener('pointerup', (e) => {
      if (isDragging) {
        isDragging = false;
        header.releasePointerCapture(e.pointerId);
      }
    });
  }

  // 4. Global Broadcast Ping
  btnBroadcastPing.addEventListener('click', () => {
    const timestamp = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3
    }).format(new Date());

    kernelBus.publish('kernel:ping', { timestamp });
  });

  // Dock items
  dockItems.forEach(item => {
    item.addEventListener('click', () => {
      const appId = item.dataset.app;
      mountApp(appId);
    });
  });

  // Initial Boot: Mount all 3 micro-apps
  mountApp('telemetry');
  mountApp('tasks');
  mountApp('clock');
})();
