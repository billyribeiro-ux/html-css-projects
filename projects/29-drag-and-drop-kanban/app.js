/**
 * DPE L8++ STANDARDS: Level 29 - HTML5 Drag-and-Drop Accessible Kanban Board
 * Architect: Distinguished Principal Engineer (L8++)
 * Dual-input architecture: Full HTML5 DataTransfer drag + WCAG 2.2 AAA Keyboard Spatial Grid.
 */

(() => {
  'use strict';

  // Seed Initial Cards
  const INITIAL_TASKS = [
    { id: 'TASK-101', title: 'Implement View Transitions Cross-Fade Architecture', col: 'backlog', tag: 'Core Web' },
    { id: 'TASK-102', title: 'Migrate State Store to Native IndexedDB v3 EventTarget', col: 'in-flight', tag: 'Database' },
    { id: 'TASK-103', title: 'Profile INP Telemetry with PerformanceObserver', col: 'shipped', tag: 'Telemetry' },
    { id: 'TASK-104', title: 'Compile WebAssembly Polyfill into SharedArrayBuffer', col: 'backlog', tag: 'WASM' },
    { id: 'TASK-105', title: 'Configure Hardware Canvas 120fps Spectrum Node', col: 'in-flight', tag: 'WebAudio' }
  ];

  // DOM Elements
  const dropZones = {
    backlog: document.getElementById('zone-backlog'),
    'in-flight': document.getElementById('zone-in-flight'),
    shipped: document.getElementById('zone-shipped')
  };

  const counters = {
    backlog: document.getElementById('count-backlog'),
    'in-flight': document.getElementById('count-in-flight'),
    shipped: document.getElementById('count-shipped')
  };

  const hudStatus = document.getElementById('hud-status');
  const btnAddCard = document.getElementById('btn-add-card');

  // State
  let draggedCard = null;
  let keyboardGrabbedCard = null;
  let taskIdCounter = 106;

  function updateCounters() {
    for (const [key, zone] of Object.entries(dropZones)) {
      counters[key].textContent = zone.querySelectorAll('.kanban-card').length;
    }
  }

  function announce(msg) {
    hudStatus.textContent = msg;
  }

  function createCardElement({ id, title, col, tag }) {
    const card = document.createElement('article');
    card.className = 'kanban-card';
    card.id = `card-${id}`;
    card.setAttribute('draggable', 'true');
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-grabbed', 'false');

    card.innerHTML = `
      <div class="card-top">
        <span class="card-id">${id}</span>
        <button type="button" class="card-del" aria-label="Delete card ${id}">&times;</button>
      </div>
      <div class="card-body">${title}</div>
      <div class="card-meta">
        <span class="card-tag">${tag}</span>
        <span class="card-hint">Press Space to Grab</span>
      </div>
    `;

    // Drag Events
    card.addEventListener('dragstart', (e) => {
      draggedCard = card;
      card.classList.add('is-dragging');
      e.dataTransfer.setData('text/plain', card.id);
      e.dataTransfer.effectAllowed = 'move';
      announce(`Picked up ${id}. Drag over a column and release to drop.`);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('is-dragging');
      draggedCard = null;
      document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));
      updateCounters();
    });

    // Delete Button
    card.querySelector('.card-del').addEventListener('click', (e) => {
      e.stopPropagation();
      const parentZone = card.closest('.drop-zone');
      card.remove();
      updateCounters();
      announce(`Deleted task ${id}.`);
    });

    // Keyboard Accessibility (WCAG 2.2 AAA spatial manipulation)
    card.addEventListener('keydown', (e) => {
      handleCardKeydown(e, card);
    });

    return card;
  }

  // Keyboard navigation logic
  function handleCardKeydown(e, card) {
    const cardId = card.querySelector('.card-id').textContent;
    const currentZone = card.closest('.drop-zone');
    const cols = ['zone-backlog', 'zone-in-flight', 'zone-shipped'];

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (keyboardGrabbedCard === card) {
        // Drop card
        card.classList.remove('is-grabbed-kbd');
        card.setAttribute('aria-grabbed', 'false');
        keyboardGrabbedCard = null;
        announce(`Dropped ${cardId} in ${currentZone.closest('.kanban-col').dataset.col} column.`);
        updateCounters();
      } else {
        // Grab card
        if (keyboardGrabbedCard) {
          keyboardGrabbedCard.classList.remove('is-grabbed-kbd');
          keyboardGrabbedCard.setAttribute('aria-grabbed', 'false');
        }
        keyboardGrabbedCard = card;
        card.classList.add('is-grabbed-kbd');
        card.setAttribute('aria-grabbed', 'true');
        announce(`Grabbed ${cardId}. Use Arrow keys (Up/Down/Left/Right) to move, Space/Enter to place.`);
      }
      return;
    }

    if (e.key === 'Escape' && keyboardGrabbedCard === card) {
      card.classList.remove('is-grabbed-kbd');
      card.setAttribute('aria-grabbed', 'false');
      keyboardGrabbedCard = null;
      announce(`Cancelled movement of ${cardId}.`);
      return;
    }

    if (!keyboardGrabbedCard || keyboardGrabbedCard !== card) return;

    // Movement when grabbed
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = card.previousElementSibling;
      if (prev) {
        currentZone.insertBefore(card, prev);
        card.focus();
        announce(`Moved ${cardId} up.`);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = card.nextElementSibling;
      if (next) {
        currentZone.insertBefore(next, card);
        card.focus();
        announce(`Moved ${cardId} down.`);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const currentIdx = cols.indexOf(currentZone.id);
      if (currentIdx < cols.length - 1) {
        const nextZone = document.getElementById(cols[currentIdx + 1]);
        nextZone.appendChild(card);
        card.focus();
        announce(`Moved ${cardId} right to ${nextZone.closest('.kanban-col').dataset.col}.`);
        updateCounters();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const currentIdx = cols.indexOf(currentZone.id);
      if (currentIdx > 0) {
        const prevZone = document.getElementById(cols[currentIdx - 1]);
        prevZone.appendChild(card);
        card.focus();
        announce(`Moved ${cardId} left to ${prevZone.closest('.kanban-col').dataset.col}.`);
        updateCounters();
      }
    }
  }

  // Setup Drop Zones
  Object.values(dropZones).forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.classList.add('drag-over');

      // Calculate insertion offset
      const afterElement = getDragAfterElement(zone, e.clientY);
      if (draggedCard) {
        if (afterElement == null) {
          zone.appendChild(draggedCard);
        } else {
          zone.insertBefore(draggedCard, afterElement);
        }
      }
    });

    zone.addEventListener('dragleave', (e) => {
      // Only remove if leaving the zone boundary entirely
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove('drag-over');
      }
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const colName = zone.closest('.kanban-col').dataset.col;
      announce(`Dropped task into ${colName}.`);
      updateCounters();
    });
  });

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.kanban-card:not(.is-dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // Add Task Button
  btnAddCard.addEventListener('click', () => {
    const newId = `TASK-${taskIdCounter++}`;
    const titles = [
      'Refactor WebGL Shader Pipeline to WebGPU',
      'Benchmark BroadcastChannel Cross-Origin Latency',
      'Optimize CSS Anchor Positioning Tooltips',
      'Harden Content Security Policy Headers',
      'Audit Sub-Millisecond Input Latency (INP)'
    ];
    const tags = ['Infra', 'Performance', 'Security', 'Architecture'];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const randomTag = tags[Math.floor(Math.random() * tags.length)];

    const card = createCardElement({
      id: newId,
      title: randomTitle,
      col: 'backlog',
      tag: randomTag
    });

    dropZones.backlog.prepend(card);
    updateCounters();
    announce(`Created new card ${newId} in Backlog.`);
    card.focus();
  });

  // Initialize Initial Dataset
  INITIAL_TASKS.forEach(task => {
    const cardEl = createCardElement(task);
    dropZones[task.col].appendChild(cardEl);
  });

  updateCounters();
})();
