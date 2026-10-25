/**
 * DPE L8++ STANDARDS: Level 26 - BroadcastChannel Multi-Tab Synchronization
 * Architect: Distinguished Principal Engineer (L8++)
 * Standards: Native BroadcastChannel API, Peer Heartbeat Protocol,
 *            Distributed Mutex Simulation, Zero Third-Party Dependencies
 */
'use strict';

// 1. Generate unique Tab ID
const TAB_ID = 'tab-' + Math.random().toString(36).substring(2, 7);

// 2. Initialize BroadcastChannel
const channel = new BroadcastChannel('dpe_cluster_sync_bus');

// 3. State
let peers = new Set([TAB_ID]);
let lockHolder = null; // null or tabId

// 4. DOM Elements
const tabChip = document.getElementById('tab-id-chip');
const peerCount = document.getElementById('peer-count');
const lockHolderLabel = document.getElementById('lock-holder');
const btnLock = document.getElementById('btn-acquire-lock');
const btnPing = document.getElementById('btn-ping-peers');
const busStream = document.getElementById('bus-stream');

tabChip.textContent = TAB_ID;

// 5. Helper: Append Packet to Log
function appendPacket(origin, type, body) {
  const line = document.createElement('div');
  line.className = 'stream-packet';
  const time = new Date().toISOString().substring(11, 19);
  line.innerHTML = `
    <span class="p-time">[${time}]</span>
    <span class="p-origin">${origin === TAB_ID ? 'THIS_TAB' : origin}</span>
    <span class="p-type">&lt;${type}&gt;</span>
    <span class="p-body">${body}</span>
  `;
  busStream.prepend(line);
}

// 6. Channel Dispatcher
function broadcast(type, payload = {}) {
  const packet = {
    origin: TAB_ID,
    type,
    payload,
    timestamp: Date.now()
  };
  channel.postMessage(packet);
  appendPacket(TAB_ID, type, JSON.stringify(payload));
}

// 7. Update UI
function updateUI() {
  peerCount.textContent = `${peers.size} ${peers.size === 1 ? 'Tab (Self)' : 'Tabs Connected'}`;

  if (!lockHolder) {
    lockHolderLabel.textContent = 'Available (Unlocked)';
    lockHolderLabel.className = 'stat-highlight text-green';
    btnLock.textContent = 'Acquire Exclusive Mutex';
    btnLock.classList.remove('holding-lock');
  } else if (lockHolder === TAB_ID) {
    lockHolderLabel.textContent = 'Held by THIS TAB';
    lockHolderLabel.className = 'stat-highlight text-amber';
    btnLock.textContent = 'Release Mutex';
    btnLock.classList.add('holding-lock');
  } else {
    lockHolderLabel.textContent = `Held by ${lockHolder}`;
    lockHolderLabel.className = 'stat-highlight text-amber';
    btnLock.textContent = 'Mutex Locked by Peer';
    btnLock.classList.remove('holding-lock');
  }
}

// 8. Handle Incoming Packets
channel.onmessage = function(e) {
  const { origin, type, payload } = e.data;
  peers.add(origin);
  appendPacket(origin, type, JSON.stringify(payload));

  switch (type) {
    case 'HEARTBEAT':
      // Respond with presence
      broadcast('HEARTBEAT_ACK');
      break;

    case 'HEARTBEAT_ACK':
      // Peer acknowledged
      break;

    case 'LOCK_ACQUIRE':
      lockHolder = origin;
      break;

    case 'LOCK_RELEASE':
      if (lockHolder === origin) {
        lockHolder = null;
      }
      break;
  }

  updateUI();
};

// 9. Interactive Actions
btnLock.addEventListener('click', () => {
  if (lockHolder === TAB_ID) {
    // Release
    lockHolder = null;
    broadcast('LOCK_RELEASE', { reason: 'User voluntary release' });
  } else if (!lockHolder) {
    // Acquire
    lockHolder = TAB_ID;
    broadcast('LOCK_ACQUIRE', { priority: 'P0_EXCLUSIVE' });
  }
  updateUI();
});

btnPing.addEventListener('click', () => {
  broadcast('HEARTBEAT', { sender: TAB_ID });
});

// Announce presence on entry
broadcast('TAB_JOIN', { tabId: TAB_ID });

// Announce departure on unload
window.addEventListener('beforeunload', () => {
  if (lockHolder === TAB_ID) {
    broadcast('LOCK_RELEASE', { reason: 'Tab closing' });
  }
  broadcast('TAB_LEAVE', { tabId: TAB_ID });
});

updateUI();
