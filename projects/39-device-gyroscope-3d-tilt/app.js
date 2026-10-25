/**
 * DPE L8++ STANDARDS: Level 39 - Device Gyroscope 3D Tilt Controller
 * Architect: Distinguished Principal Engineer (L8++)
 * Dual-channel physics engine: Native DeviceOrientation gyroscope + pointer parallax fallback.
 */

(() => {
  'use strict';

  // DOM Elements
  const arena = document.getElementById('stage-arena');
  const card = document.getElementById('parallax-card');
  const glare = document.getElementById('specular-glare');
  const valGamma = document.getElementById('val-gamma');
  const valBeta = document.getElementById('val-beta');
  const valAlpha = document.getElementById('val-alpha');
  const btnPerm = document.getElementById('btn-request-perm');
  const sensorSub = document.getElementById('sensor-sub');

  // Physics State
  let targetPitch = 0; // rotateX
  let targetYaw = 0;   // rotateY
  let currentPitch = 0;
  let currentYaw = 0;
  let glareX = 50;
  let glareY = 50;
  let isGyroActive = false;

  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  // Update 3D Transform & Lighting
  function updateCardPhysics() {
    currentPitch = lerp(currentPitch, targetPitch, 0.12);
    currentYaw = lerp(currentYaw, targetYaw, 0.12);

    card.style.transform = `rotateX(${currentPitch.toFixed(2)}deg) rotateY(${currentYaw.toFixed(2)}deg)`;
    glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.3) 0%, transparent 65%)`;

    valBeta.textContent = `${currentPitch.toFixed(1)}°`;
    valGamma.textContent = `${currentYaw.toFixed(1)}°`;

    requestAnimationFrame(updateCardPhysics);
  }

  requestAnimationFrame(updateCardPhysics);

  // 1. Desktop Pointer Mode
  arena.addEventListener('pointermove', (e) => {
    if (isGyroActive) return;

    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normX = (e.clientX - centerX) / (rect.width / 2);
    const normY = (e.clientY - centerY) / (rect.height / 2);

    // Max rotation 22 degrees
    targetYaw = Math.max(-25, Math.min(25, normX * 22));
    targetPitch = Math.max(-25, Math.min(25, -normY * 22));

    glareX = Math.max(10, Math.min(90, 50 + normX * 40));
    glareY = Math.max(10, Math.min(90, 50 + normY * 40));
  });

  arena.addEventListener('pointerleave', () => {
    if (isGyroActive) return;
    targetPitch = 0;
    targetYaw = 0;
    glareX = 50;
    glareY = 50;
  });

  // 2. Mobile Gyroscope Mode
  function handleOrientation(event) {
    isGyroActive = true;
    sensorSub.textContent = 'Hardware Gyroscope Active';
    btnPerm.textContent = 'Gyroscope Streaming';

    const alpha = event.alpha || 0;
    const beta = event.beta || 0;   // [-180, 180] Pitch
    const gamma = event.gamma || 0; // [-90, 90] Roll

    valAlpha.textContent = `${alpha.toFixed(1)}°`;

    // Clamp tilt angles
    targetPitch = Math.max(-30, Math.min(30, (beta - 45) * 0.8));
    targetYaw = Math.max(-30, Math.min(30, gamma * 0.8));

    glareX = 50 + (gamma / 90) * 40;
    glareY = 50 + ((beta - 45) / 90) * 40;
  }

  // Request Gyroscope Permission (iOS 13+ standard)
  async function requestGyroPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          alert('Gyroscope permission was denied.');
        }
      } catch (err) {
        console.warn('Gyroscope permission error:', err);
      }
    } else if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', handleOrientation);
      sensorSub.textContent = 'Hardware Gyroscope Listening';
    } else {
      alert('DeviceOrientationEvent not supported on this device. Fallback pointer mode active.');
    }
  }

  btnPerm.addEventListener('click', requestGyroPermission);
})();
