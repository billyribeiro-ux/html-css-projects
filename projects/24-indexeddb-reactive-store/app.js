/**
 * DPE L8++ STANDARDS: Level 24 - Offline-First IndexedDB Reactive Store
 * Architect: Distinguished Principal Engineer (L8++)
 * Standards: Native IndexedDB, Transaction Lifecycle, EventTarget Event Bus,
 *            Strict Typings & Error Handling, Zero Dependencies
 */
'use strict';

// 1. Reactive IndexedDB Store Wrapper extending native EventTarget
class IndexedDBStore extends EventTarget {
  constructor(dbName = 'PrincipalTelemetryDB', storeName = 'incidents', version = 1) {
    super();
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
          store.createIndex('severity', 'severity', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        this.dispatchEvent(new CustomEvent('store:ready'));
        resolve(this.db);
      };

      request.onerror = (e) => {
        reject(e.target.error);
      };
    });
  }

  async add(record) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.add({
        ...record,
        timestamp: new Date().toISOString()
      });

      req.onsuccess = () => {
        this.dispatchEvent(new CustomEvent('store:change', { detail: { action: 'add' } }));
        resolve(req.result);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async getAll() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.delete(id);

      req.onsuccess = () => {
        this.dispatchEvent(new CustomEvent('store:change', { detail: { action: 'delete', id } }));
        resolve(true);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async clear() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.clear();

      req.onsuccess = () => {
        this.dispatchEvent(new CustomEvent('store:change', { detail: { action: 'clear' } }));
        resolve(true);
      };

      req.onerror = () => reject(req.error);
    });
  }
}

// 2. Instantiate Store
const store = new IndexedDBStore();

// 3. DOM Elements
const form = document.getElementById('incident-form');
const inputService = document.getElementById('inc-service');
const selectSeverity = document.getElementById('inc-severity');
const textareaNotes = document.getElementById('inc-notes');
const recordsList = document.getElementById('records-list');
const recordCount = document.getElementById('record-count');
const btnPurge = document.getElementById('btn-purge-db');

// 4. Render Records
async function renderRecords() {
  const records = await store.getAll();
  recordCount.textContent = `${records.length} ${records.length === 1 ? 'Record' : 'Records'}`;

  if (records.length === 0) {
    recordsList.innerHTML = `<div class="empty-state">No telemetry incidents logged. Commit a record above to persist in IndexedDB.</div>`;
    return;
  }

  // Sort descending by ID / timestamp
  records.sort((a, b) => b.id - a.id);

  recordsList.innerHTML = '';
  records.forEach((rec) => {
    const item = document.createElement('article');
    item.className = 'record-item';
    const dateFormatted = new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    item.innerHTML = `
      <div class="record-top">
        <span class="record-service">${rec.service}</span>
        <span class="badge-severity sev-${rec.severity}">${rec.severity}</span>
      </div>
      <p class="record-notes">${rec.notes}</p>
      <div class="record-footer">
        <span>Recorded at ${dateFormatted}</span>
        <button type="button" class="btn-delete-record" data-id="${rec.id}">Delete</button>
      </div>
    `;

    const delBtn = item.querySelector('.btn-delete-record');
    delBtn.addEventListener('click', () => store.delete(rec.id));

    recordsList.appendChild(item);
  });
}

// 5. Reactive Event Subscription
store.addEventListener('store:change', () => {
  renderRecords();
});

// 6. Form Submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const service = inputService.value.trim();
  const severity = selectSeverity.value;
  const notes = textareaNotes.value.trim();

  if (!service || !notes) return;

  await store.add({ service, severity, notes });

  // Reset form
  inputService.value = '';
  textareaNotes.value = '';
  inputService.focus();
});

// 7. Purge Database
btnPurge.addEventListener('click', async () => {
  if (confirm('Purge all offline IndexedDB incident records?')) {
    await store.clear();
  }
});

// 8. Boot Initialization
(async function init() {
  await store.init();
  const existing = await store.getAll();
  // Seed sample initial records if freshly created
  if (existing.length === 0) {
    await store.add({ service: 'ingress-envoy-gw', severity: 'CRITICAL', notes: 'Upstream connection pool timeout across 4 worker replicas.' });
    await store.add({ service: 'auth-enclave-kyber', severity: 'MINOR', notes: 'Routine quantum key rotation cycle completed cleanly.' });
  } else {
    renderRecords();
  }
})();
