/**
 * DPE L8++ STANDARDS: Level 30 - GoF Command Pattern Undo/Redo Engine
 * Architect: Distinguished Principal Engineer (L8++)
 * Transactional Command ledger with time-travel branching and zero mutable state leakage.
 */

(() => {
  'use strict';

  // Base Command Interface
  class Command {
    constructor(description) {
      this.description = description;
      this.timestamp = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3
      }).format(new Date());
    }
    execute() { throw new Error('execute() must be implemented'); }
    undo() { throw new Error('undo() must be implemented'); }
  }

  // Concrete Commands
  class AddShapeCommand extends Command {
    constructor(stage, shapeData) {
      super(`Created ${shapeData.type} #${shapeData.id}`);
      this.stage = stage;
      this.shapeData = shapeData;
      this.element = null;
    }

    execute() {
      if (!this.element) {
        this.element = document.createElement('div');
        this.element.id = `shape-${this.shapeData.id}`;
        this.element.className = `canvas-shape shape-${this.shapeData.type}`;
        this.element.style.width = `${this.shapeData.w}px`;
        this.element.style.height = `${this.shapeData.h}px`;
        this.element.style.backgroundColor = this.shapeData.color;
        this.element.textContent = `#${this.shapeData.id}`;
        this.element.dataset.id = this.shapeData.id;
        setupShapeInteractions(this.element, this.stage);
      }
      this.element.style.left = `${this.shapeData.x}px`;
      this.element.style.top = `${this.shapeData.y}px`;
      this.stage.appendChild(this.element);
    }

    undo() {
      if (this.element && this.element.parentNode) {
        this.element.remove();
      }
    }
  }

  class MoveShapeCommand extends Command {
    constructor(element, oldPos, newPos) {
      super(`Moved #${element.dataset.id} to (${Math.round(newPos.x)}, ${Math.round(newPos.y)})`);
      this.element = element;
      this.oldPos = oldPos;
      this.newPos = newPos;
    }

    execute() {
      this.element.style.left = `${this.newPos.x}px`;
      this.element.style.top = `${this.newPos.y}px`;
    }

    undo() {
      this.element.style.left = `${this.oldPos.x}px`;
      this.element.style.top = `${this.oldPos.y}px`;
    }
  }

  class ColorCycleCommand extends Command {
    constructor(stage, newPalette) {
      super('Cycled Canvas OKLCH Palette');
      this.stage = stage;
      this.newPalette = newPalette;
      this.previousColors = [];
    }

    execute() {
      const shapes = [...this.stage.querySelectorAll('.canvas-shape')];
      this.previousColors = shapes.map(s => s.style.backgroundColor);
      shapes.forEach((s, idx) => {
        s.style.backgroundColor = this.newPalette[idx % this.newPalette.length];
      });
    }

    undo() {
      const shapes = [...this.stage.querySelectorAll('.canvas-shape')];
      shapes.forEach((s, idx) => {
        if (this.previousColors[idx]) {
          s.style.backgroundColor = this.previousColors[idx];
        }
      });
    }
  }

  class ClearCanvasCommand extends Command {
    constructor(stage) {
      super('Cleared Entire Canvas');
      this.stage = stage;
      this.savedElements = [];
    }

    execute() {
      this.savedElements = [...this.stage.querySelectorAll('.canvas-shape')];
      this.savedElements.forEach(s => s.remove());
    }

    undo() {
      this.savedElements.forEach(s => this.stage.appendChild(s));
    }
  }

  // Command History Manager (Invoker)
  class CommandManager {
    constructor(onStateChange) {
      this.undoStack = [];
      this.redoStack = [];
      this.onStateChange = onStateChange;
    }

    execute(cmd) {
      cmd.execute();
      this.undoStack.push(cmd);
      this.redoStack = []; // Clear redo tree on new branch action
      this.notify();
    }

    undo() {
      if (this.undoStack.length === 0) return;
      const cmd = this.undoStack.pop();
      cmd.undo();
      this.redoStack.push(cmd);
      this.notify();
    }

    redo() {
      if (this.redoStack.length === 0) return;
      const cmd = this.redoStack.pop();
      cmd.execute();
      this.undoStack.push(cmd);
      this.notify();
    }

    timeTravel(targetUndoLength) {
      while (this.undoStack.length > targetUndoLength) {
        this.undo();
      }
      while (this.undoStack.length < targetUndoLength && this.redoStack.length > 0) {
        this.redo();
      }
    }

    notify() {
      if (this.onStateChange) {
        this.onStateChange({
          canUndo: this.undoStack.length > 0,
          canRedo: this.redoStack.length > 0,
          undoStack: [...this.undoStack],
          redoStack: [...this.redoStack]
        });
      }
    }
  }

  // DOM Elements
  const stage = document.getElementById('canvas-stage');
  const btnAddRect = document.getElementById('btn-add-rect');
  const btnAddCircle = document.getElementById('btn-add-circle');
  const btnRandomize = document.getElementById('btn-randomize');
  const btnClearCanvas = document.getElementById('btn-clear-canvas');
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const historyList = document.getElementById('history-list');
  const historyCounter = document.getElementById('history-counter');

  let shapeSeq = 1;
  const PALETTES = [
    'oklch(0.65 0.22 280)',
    'oklch(0.72 0.2 195)',
    'oklch(0.75 0.22 145)',
    'oklch(0.8 0.18 80)',
    'oklch(0.7 0.22 25)',
    'oklch(0.7 0.24 330)'
  ];

  // Initialize Command Manager
  const cmdManager = new CommandManager(renderTimeline);

  function renderTimeline(state) {
    btnUndo.disabled = !state.canUndo;
    btnRedo.disabled = !state.canRedo;

    const totalActions = state.undoStack.length + state.redoStack.length;
    historyCounter.textContent = `${totalActions} Action${totalActions === 1 ? '' : 's'}`;

    historyList.innerHTML = '';

    // Render active undo stack items
    state.undoStack.forEach((cmd, idx) => {
      const li = document.createElement('li');
      li.className = 'history-item is-current';
      li.innerHTML = `
        <span class="history-dot"></span>
        <span class="history-text">${cmd.description}</span>
        <time class="history-time">${cmd.timestamp}</time>
      `;
      li.addEventListener('click', () => {
        cmdManager.timeTravel(idx + 1);
      });
      historyList.appendChild(li);
    });

    // Render redo stack items (undone actions)
    state.redoStack.slice().reverse().forEach((cmd, rIdx) => {
      const li = document.createElement('li');
      li.className = 'history-item is-undone';
      li.innerHTML = `
        <span class="history-dot"></span>
        <span class="history-text">${cmd.description} (Undone)</span>
        <time class="history-time">${cmd.timestamp}</time>
      `;
      li.addEventListener('click', () => {
        cmdManager.timeTravel(state.undoStack.length + (state.redoStack.length - rIdx));
      });
      historyList.appendChild(li);
    });

    historyList.scrollTop = historyList.scrollHeight;
  }

  // Pointer drag on shapes
  function setupShapeInteractions(el, stageEl) {
    let startX = 0, startY = 0;
    let initialX = 0, initialY = 0;
    let hasMoved = false;

    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startY = e.clientY;
      initialX = parseFloat(el.style.left) || 0;
      initialY = parseFloat(el.style.top) || 0;
      hasMoved = false;

      function onPointerMove(moveEvent) {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          hasMoved = true;
          el.style.left = `${initialX + dx}px`;
          el.style.top = `${initialY + dy}px`;
        }
      }

      function onPointerUp(upEvent) {
        el.releasePointerCapture(e.pointerId);
        el.removeEventListener('pointermove', onPointerMove);
        el.removeEventListener('pointerup', onPointerUp);

        if (hasMoved) {
          const finalX = parseFloat(el.style.left) || 0;
          const finalY = parseFloat(el.style.top) || 0;
          const moveCmd = new MoveShapeCommand(
            el,
            { x: initialX, y: initialY },
            { x: finalX, y: finalY }
          );
          cmdManager.execute(moveCmd);
        }
      }

      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('pointerup', onPointerUp);
    });
  }

  // Button Listeners
  btnAddRect.addEventListener('click', () => {
    const rectCmd = new AddShapeCommand(stage, {
      id: shapeSeq++,
      type: 'rect',
      w: 88,
      h: 64,
      x: 40 + Math.random() * (stage.clientWidth - 160),
      y: 40 + Math.random() * (stage.clientHeight - 120),
      color: PALETTES[(shapeSeq) % PALETTES.length]
    });
    cmdManager.execute(rectCmd);
  });

  btnAddCircle.addEventListener('click', () => {
    const circleCmd = new AddShapeCommand(stage, {
      id: shapeSeq++,
      type: 'circle',
      w: 72,
      h: 72,
      x: 40 + Math.random() * (stage.clientWidth - 160),
      y: 40 + Math.random() * (stage.clientHeight - 120),
      color: PALETTES[(shapeSeq) % PALETTES.length]
    });
    cmdManager.execute(circleCmd);
  });

  btnRandomize.addEventListener('click', () => {
    const shuffled = [...PALETTES].sort(() => Math.random() - 0.5);
    const colorCmd = new ColorCycleCommand(stage, shuffled);
    cmdManager.execute(colorCmd);
  });

  btnClearCanvas.addEventListener('click', () => {
    if (stage.querySelectorAll('.canvas-shape').length > 0) {
      const clearCmd = new ClearCanvasCommand(stage);
      cmdManager.execute(clearCmd);
    }
  });

  btnUndo.addEventListener('click', () => cmdManager.undo());
  btnRedo.addEventListener('click', () => cmdManager.redo());

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    if (modifier && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        cmdManager.redo();
      } else {
        cmdManager.undo();
      }
    } else if (modifier && e.key.toLowerCase() === 'y' && !isMac) {
      e.preventDefault();
      cmdManager.redo();
    }
  });

  // Seed default items
  btnAddRect.click();
  btnAddCircle.click();
})();
