import { describe, it, expect } from 'vitest';

describe('Series 2 JavaScript Systems Engine Unit Tests', () => {
  // 1. Virtual Scroller Mathematical Windowing (Level 28)
  describe('Level 28: Virtual Scroller Mathematical Windowing', () => {
    function computeVirtualWindow({ scrollTop, viewportHeight, rowHeight, totalCount, overscan = 3 }) {
      const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
      const visibleCount = Math.ceil(viewportHeight / rowHeight);
      const endIndex = Math.min(totalCount - 1, startIndex + visibleCount + (overscan * 2));
      const offsetY = startIndex * rowHeight;
      const totalHeight = totalCount * rowHeight;
      return { startIndex, endIndex, offsetY, totalHeight, activeNodeCount: (endIndex - startIndex + 1) };
    }

    it('recycles only ~20-25 active nodes in memory for 100,000 records', () => {
      const windowState = computeVirtualWindow({
        scrollTop: 15000,
        viewportHeight: 600,
        rowHeight: 48,
        totalCount: 100000,
        overscan: 3
      });

      expect(windowState.totalHeight).toBe(4800000); // 4.8 million pixels virtual space
      expect(windowState.activeNodeCount).toBeLessThanOrEqual(25);
      expect(windowState.startIndex).toBeGreaterThan(300);
      expect(windowState.offsetY).toBe(windowState.startIndex * 48);
    });

    it('correctly clamps at boundary conditions (top and bottom of scroll)', () => {
      // Top boundary
      const topState = computeVirtualWindow({
        scrollTop: 0,
        viewportHeight: 600,
        rowHeight: 48,
        totalCount: 100000,
        overscan: 3
      });
      expect(topState.startIndex).toBe(0);
      expect(topState.offsetY).toBe(0);

      // Bottom boundary
      const bottomState = computeVirtualWindow({
        scrollTop: 4800000 - 600,
        viewportHeight: 600,
        rowHeight: 48,
        totalCount: 100000,
        overscan: 3
      });
      expect(bottomState.endIndex).toBe(99999);
    });
  });

  // 2. GoF Command Pattern with Undo/Redo Ledger (Level 30)
  describe('Level 30: Command Pattern with Time-Travel Ledger', () => {
    class CommandManager {
      constructor(maxHistory = 50) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = maxHistory;
      }

      execute(command) {
        command.execute();
        this.undoStack.push(command);
        if (this.undoStack.length > this.maxHistory) {
          this.undoStack.shift();
        }
        this.redoStack = []; // Clear redo stack on new action
      }

      undo() {
        if (!this.canUndo) return null;
        const cmd = this.undoStack.pop();
        cmd.undo();
        this.redoStack.push(cmd);
        return cmd;
      }

      redo() {
        if (!this.canRedo) return null;
        const cmd = this.redoStack.pop();
        cmd.execute();
        this.undoStack.push(cmd);
        return cmd;
      }

      get canUndo() { return this.undoStack.length > 0; }
      get canRedo() { return this.redoStack.length > 0; }
    }

    it('correctly manages atomic transactions, state mutation, and time travel', () => {
      const manager = new CommandManager();
      const state = { count: 0 };

      const createAddCommand = (val) => ({
        execute() { state.count += val; },
        undo() { state.count -= val; }
      });

      manager.execute(createAddCommand(5));
      expect(state.count).toBe(5);
      expect(manager.canUndo).toBe(true);
      expect(manager.canRedo).toBe(false);

      manager.execute(createAddCommand(10));
      expect(state.count).toBe(15);

      manager.undo();
      expect(state.count).toBe(5);
      expect(manager.canRedo).toBe(true);

      manager.redo();
      expect(state.count).toBe(15);
      expect(manager.canRedo).toBe(false);
    });
  });

  // 3. Client-Side Resilient Circuit Breaker (Level 33)
  describe('Level 33: Client-Side Resilient Circuit Breaker State Machine', () => {
    class CircuitBreaker {
      constructor({ failureThreshold = 3, cooldownMs = 1000 } = {}) {
        this.state = 'CLOSED'; // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
        this.failureThreshold = failureThreshold;
        this.cooldownMs = cooldownMs;
        this.failureCount = 0;
        this.lastFailureTime = null;
      }

      recordSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
      }

      recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.failureThreshold) {
          this.state = 'OPEN';
        }
      }

      canAttempt() {
        if (this.state === 'CLOSED') return true;
        if (this.state === 'OPEN') {
          if (Date.now() - this.lastFailureTime > this.cooldownMs) {
            this.state = 'HALF_OPEN';
            return true;
          }
          return false;
        }
        if (this.state === 'HALF_OPEN') return true;
        return false;
      }
    }

    it('transitions through CLOSED -> OPEN -> HALF_OPEN -> CLOSED states', () => {
      const cb = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 50 });
      expect(cb.state).toBe('CLOSED');
      expect(cb.canAttempt()).toBe(true);

      cb.recordFailure();
      expect(cb.state).toBe('CLOSED'); // threshold is 2

      cb.recordFailure();
      expect(cb.state).toBe('OPEN');
      expect(cb.canAttempt()).toBe(false); // fast-fail shedding load

      // Simulate cooldown expiration
      cb.lastFailureTime = Date.now() - 100;
      expect(cb.canAttempt()).toBe(true);
      expect(cb.state).toBe('HALF_OPEN');

      // Success recovers the circuit
      cb.recordSuccess();
      expect(cb.state).toBe('CLOSED');
      expect(cb.failureCount).toBe(0);
    });
  });

  // 4. Vanilla Markdown Tokenizer & AST Inspector (Level 37)
  describe('Level 37: Zero-Dependency Markdown Lexer & HTML Safe Compiler', () => {
    function compileMarkdown(src) {
      if (!src) return '';
      // Fenced code blocks
      let html = src.replace(/```(\w+)?\r?\n([\s\S]*?)```/g, (_, lang, code) => {
        const safeCode = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return `<pre><code class="lang-${lang || 'plain'}">${safeCode.trim()}</code></pre>`;
      });

      // Headers
      html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
      html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
      html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

      // Inline styles
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
      return html;
    }

    it('safely escapes HTML injection while parsing fenced blocks, bold, and code', () => {
      const md = "# Title\n\n**Bold Text** with `inline code`\n\n```html\n<div class=\"danger\">XSS</div>\n```";
      const compiled = compileMarkdown(md);

      expect(compiled).toContain('<h1>Title</h1>');
      expect(compiled).toContain('<strong>Bold Text</strong>');
      expect(compiled).toContain('<code>inline code</code>');
      expect(compiled).toContain('&lt;div class="danger"&gt;XSS&lt;/div&gt;');
      expect(compiled).not.toContain('<div class="danger">XSS</div>'); // strictly escaped
    });
  });
});
