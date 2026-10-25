/**
 * DPE L8++ STANDARDS: Level 25 - Autonomous Web Components Design System
 * Architect: Distinguished Principal Engineer (L8++)
 * Standards: Custom Elements v1, Shadow DOM Encapsulation, observedAttributes,
 *            Slot Projection, CustomEvent Dispatch, Zero Framework Overhead
 */
'use strict';

class DpeTelemetryCard extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'label', 'status'];
  }

  constructor() {
    super();
    // 1. Attach open Shadow DOM for style encapsulation
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.updateComponent();
    }
  }

  get value() {
    return parseInt(this.getAttribute('value') || '0', 10);
  }

  set value(val) {
    this.setAttribute('value', val);
  }

  get label() {
    return this.getAttribute('label') || 'Telemetry Gauge';
  }

  get status() {
    return this.getAttribute('status') || 'optimal';
  }

  updateComponent() {
    const valText = this.shadowRoot.querySelector('.card-value');
    const barFill = this.shadowRoot.querySelector('.bar-fill');
    const labelText = this.shadowRoot.querySelector('.card-label');
    const statusPill = this.shadowRoot.querySelector('.status-pill');

    if (valText) valText.textContent = `${this.value}%`;
    if (barFill) {
      barFill.style.width = `${Math.min(100, Math.max(0, this.value))}%`;
      // Dynamic color shift based on threshold
      if (this.value >= 90) {
        barFill.style.background = 'oklch(0.65 0.22 25)';
        if (statusPill) {
          statusPill.textContent = 'CRITICAL LOAD';
          statusPill.className = 'status-pill status-critical';
        }
        // Emit Custom Event to Host
        this.dispatchEvent(new CustomEvent('threshold:exceeded', {
          bubbles: true,
          composed: true, // Pierces Shadow DOM boundary
          detail: { label: this.label, value: this.value, timestamp: Date.now() }
        }));
      } else if (this.value >= 75) {
        barFill.style.background = 'oklch(0.8 0.18 80)';
        if (statusPill) {
          statusPill.textContent = 'HIGH UTILIZATION';
          statusPill.className = 'status-pill status-warning';
        }
      } else {
        barFill.style.background = 'oklch(0.75 0.2 145)';
        if (statusPill) {
          statusPill.textContent = 'OPTIMAL';
          statusPill.className = 'status-pill status-optimal';
        }
      }
    }
    if (labelText) labelText.textContent = this.label;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          contain: content;
        }

        .card-surface {
          background: oklch(0.15 0.03 260 / 0.85);
          border: 1px solid oklch(0.28 0.04 260 / 0.7);
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          box-shadow: 0 10px 30px -4px oklch(0 0 0 / 0.5);
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          color: oklch(0.98 0.01 260);
          transition: border-color 200ms ease, box-shadow 200ms ease;
        }

        .card-surface:hover {
          border-color: oklch(0.75 0.19 190);
          box-shadow: 0 16px 36px -4px oklch(0 0 0 / 0.6), 0 0 25px oklch(0.75 0.19 190 / 0.15);
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .icon-title-group {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .card-label {
          font-size: 0.95rem;
          font-weight: 700;
        }

        .status-pill {
          font-size: 0.7rem;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: 9999px;
          text-transform: uppercase;
        }

        .status-optimal {
          background: oklch(0.75 0.2 145 / 0.15);
          color: oklch(0.75 0.2 145);
          border: 1px solid oklch(0.75 0.2 145 / 0.3);
        }

        .status-warning {
          background: oklch(0.8 0.18 80 / 0.15);
          color: oklch(0.8 0.18 80);
          border: 1px solid oklch(0.8 0.18 80 / 0.3);
        }

        .status-critical {
          background: oklch(0.65 0.22 25 / 0.15);
          color: oklch(0.65 0.22 25);
          border: 1px solid oklch(0.65 0.22 25 / 0.3);
        }

        .value-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }

        .card-value {
          font-size: 2.25rem;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
          color: oklch(0.98 0.01 260);
          line-height: 1;
        }

        .meter-track {
          height: 6px;
          background: oklch(0.12 0.02 260);
          border-radius: 3px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          border-radius: 3px;
          background: oklch(0.75 0.2 145);
          transition: width 250ms ease, background-color 250ms ease;
        }

        .slot-content {
          padding-top: 0.5rem;
          border-top: 1px solid oklch(1 0 0 / 0.06);
        }
      </style>

      <div class="card-surface">
        <div class="header-row">
          <div class="icon-title-group">
            <slot name="icon"></slot>
            <span class="card-label">${this.label}</span>
          </div>
          <span class="status-pill status-optimal">OPTIMAL</span>
        </div>

        <div class="value-row">
          <span class="card-value">${this.value}%</span>
        </div>

        <div class="meter-track">
          <div class="bar-fill" style="width: ${this.value}%"></div>
        </div>

        <div class="slot-content">
          <slot name="description"></slot>
        </div>
      </div>
    `;

    this.updateComponent();
  }
}

// 2. Register Custom Element
customElements.define('dpe-telemetry-card', DpeTelemetryCard);

// 3. Demo Controller: Modulate Attributes Live
const gpuCard = document.getElementById('card-gpu');
const gpuSlider = document.getElementById('gpu-slider');
const gpuValDisplay = document.getElementById('gpu-val-display');
const eventLog = document.getElementById('component-event-log');

gpuSlider.addEventListener('input', (e) => {
  const val = e.target.value;
  gpuValDisplay.textContent = `${val}%`;
  // Trigger attributeChangedCallback on custom element
  gpuCard.setAttribute('value', val);
});

// 4. Listen for Custom Event dispatched from Shadow DOM
window.addEventListener('threshold:exceeded', (e) => {
  const detail = e.detail;
  const time = new Date(detail.timestamp).toLocaleTimeString();
  eventLog.innerHTML = `
    <span style="color: oklch(0.65 0.22 25); font-weight: 700;">[ALERT ${time}]</span>
    Threshold exceeded on <strong>${detail.label}</strong>: 
    <span style="color: oklch(0.75 0.19 190);">${detail.value}%</span> (Event pierced Shadow DOM successfully)
  `;
});
