/**
 * DPE L8++ STANDARDS: Level 36 - Biometric WebAuthn & Passkey Security Enclave
 * Architect: Distinguished Principal Engineer (L8++)
 * Cryptographic FIDO2 / WebAuthn simulator with hardware challenge signing & attestation.
 */

(() => {
  'use strict';

  // State
  let registeredCredential = null;
  let signCount = 0;

  // DOM Elements
  const inputUsername = document.getElementById('input-username');
  const biometricScanner = document.getElementById('biometric-scanner');
  const sensorHint = document.getElementById('sensor-hint');
  const btnRegister = document.getElementById('btn-register-passkey');
  const btnVerify = document.getElementById('btn-verify-passkey');
  const enclaveStatus = document.getElementById('enclave-status');
  const auditBody = document.getElementById('audit-body');

  function toHex(uint8) {
    return Array.from(uint8).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function log(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `audit-row ${type}`;
    const time = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3
    }).format(new Date());
    el.textContent = `[${time}] ${msg}`;
    auditBody.appendChild(el);
    auditBody.scrollTop = auditBody.scrollHeight;
  }

  function setScanning(active, text) {
    if (active) {
      biometricScanner.classList.add('scanning');
      sensorHint.textContent = text || 'Scanning Biometric / TouchID...';
    } else {
      biometricScanner.classList.remove('scanning');
      sensorHint.textContent = 'Hardware Enclave Ready • TouchID / Security Key';
    }
  }

  // 1. Passkey Registration (Attestation)
  async function registerPasskey() {
    const username = inputUsername.value.trim();
    if (!username) return;

    btnRegister.disabled = true;
    setScanning(true, 'Verifying Biometric Fingerprint (TouchID)...');
    log(`Initiating FIDO2 navigator.credentials.create() for user "${username}"...`, 'info');

    // Cryptographic 32-byte challenge
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    log(`Server Challenge (32-bytes): 0x${toHex(challenge).slice(0, 32)}...`, 'crypto');

    // Hardware enclave delay simulation (800ms)
    await new Promise(r => setTimeout(r, 800));

    // Generate simulated EC P-256 public key
    const rawCredId = new Uint8Array(16);
    window.crypto.getRandomValues(rawCredId);
    const credentialId = toHex(rawCredId);

    const rawPubKey = new Uint8Array(65);
    rawPubKey[0] = 0x04; // Uncompressed EC point
    window.crypto.getRandomValues(rawPubKey.subarray(1));
    const publicKeyHex = toHex(rawPubKey);

    registeredCredential = {
      id: credentialId,
      username: username,
      publicKey: publicKeyHex,
      rpId: 'dpe.infra.local'
    };

    setScanning(false);
    btnRegister.disabled = false;
    btnVerify.disabled = false;

    log(`✅ Passkey Attestation Succeeded!`, 'success');
    log(`Credential ID: 0x${credentialId}`, 'crypto');
    log(`EC P-256 Public Key (Uncompressed): 0x${publicKeyHex.slice(0, 48)}...`, 'crypto');
    log(`Enclave Attestation Format: "packed" (ES256, User Verification: Verified)`, 'info');
  }

  // 2. Passkey Authentication (Assertion)
  async function authenticatePasskey() {
    if (!registeredCredential) return;

    btnVerify.disabled = true;
    setScanning(true, 'Hardware Enclave Prompt • Verifying Fingerprint...');
    log(`Initiating FIDO2 navigator.credentials.get() assertion...`, 'info');

    const authChallenge = new Uint8Array(32);
    window.crypto.getRandomValues(authChallenge);
    log(`Auth Server Challenge: 0x${toHex(authChallenge).slice(0, 32)}...`, 'crypto');

    await new Promise(r => setTimeout(r, 900));

    signCount++;

    // Simulated signature
    const signature = new Uint8Array(64);
    window.crypto.getRandomValues(signature);

    setScanning(false);
    btnVerify.disabled = false;

    enclaveStatus.textContent = 'AUTHENTICATED';
    enclaveStatus.classList.add('authenticated');

    log(`🎉 Passkey Assertion Signature Verified!`, 'success');
    log(`ECDSA Signature (r,s): 0x${toHex(signature).slice(0, 48)}...`, 'crypto');
    log(`Authenticator Data: Flags: UP (0x01) | UV (0x04), SignCount: ${signCount}`, 'info');
    log(`Bearer Session Token issued for ${registeredCredential.username}`, 'success');
  }

  // Event Listeners
  btnRegister.addEventListener('click', registerPasskey);
  btnVerify.addEventListener('click', authenticatePasskey);
})();
