/**
 * DPE L8++ STANDARDS: Level 27 - Web Audio API Synthesizer & Canvas FFT Spectrum
 * Architect: Distinguished Principal Engineer (L8++)
 * Zero runtime dependencies. Clean functional audio graph + 120fps hardware canvas loop.
 */

(() => {
  'use strict';

  // DOM Elements
  const canvas = document.getElementById('spectrum-canvas');
  const ctx = canvas.getContext('2d');
  const btnPower = document.getElementById('btn-power');
  const powerText = document.getElementById('power-text');
  const waveButtons = document.querySelectorAll('.btn-wave');
  const freqSlider = document.getElementById('freq-slider');
  const freqOut = document.getElementById('freq-out');
  const gainSlider = document.getElementById('gain-slider');
  const gainOut = document.getElementById('gain-out');

  // Audio Graph State
  let audioCtx = null;
  let oscillator = null;
  let gainNode = null;
  let analyserNode = null;
  let isPlaying = false;
  let currentWave = 'sine';
  let animationFrameId = null;

  // Retina Canvas Resolution Sync
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  /**
   * Note frequency lookup helper for human-friendly telemetry
   */
  function getNoteName(freq) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const midi = Math.round(69 + 12 * Math.log2(freq / 440));
    const note = notes[(midi % 12 + 12) % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${Math.round(freq)} Hz (${note}${octave})`;
  }

  /**
   * Initialize or resume the Web Audio Graph
   */
  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();

      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.82;

      gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(gainSlider.value / 100, audioCtx.currentTime);

      gainNode.connect(analyserNode);
      analyserNode.connect(audioCtx.destination);
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function startSynthesizer() {
    initAudio();

    oscillator = audioCtx.createOscillator();
    oscillator.type = currentWave;
    oscillator.frequency.setValueAtTime(parseFloat(freqSlider.value), audioCtx.currentTime);

    oscillator.connect(gainNode);
    oscillator.start();

    isPlaying = true;
    btnPower.classList.add('active');
    powerText.textContent = 'Active (Playing) • Click to Stop';
  }

  function stopSynthesizer() {
    if (oscillator) {
      try {
        oscillator.stop();
        oscillator.disconnect();
      } catch (err) {
        // already stopped
      }
      oscillator = null;
    }

    isPlaying = false;
    btnPower.classList.remove('active');
    powerText.textContent = 'Initialize Audio Engine';
  }

  // Event Listeners
  btnPower.addEventListener('click', () => {
    if (isPlaying) {
      stopSynthesizer();
    } else {
      startSynthesizer();
    }
  });

  waveButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      waveButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentWave = btn.dataset.wave;
      if (oscillator) {
        oscillator.type = currentWave;
      }
    });
  });

  freqSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    freqOut.textContent = getNoteName(val);
    if (oscillator && audioCtx) {
      oscillator.frequency.setTargetAtTime(val, audioCtx.currentTime, 0.015);
    }
  });

  gainSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    gainOut.textContent = `${val}%`;
    if (gainNode && audioCtx) {
      gainNode.gain.setTargetAtTime(val / 100, audioCtx.currentTime, 0.015);
    }
  });

  // Render Visualizer Loop (120fps Canvas Loop)
  let idlePhase = 0;

  function renderSpectrum() {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    if (isPlaying && analyserNode) {
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteFrequencyData(dataArray);

      const barCount = 48;
      const barWidth = (width / barCount) - 3;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] || 0;
        const percent = value / 255;
        const barHeight = Math.max(4, percent * (height - 20));

        const x = i * (barWidth + 3) + 3;
        const y = height - barHeight;

        // Dynamic gradient based on amplitude
        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, 'oklch(0.65 0.22 285)');
        grad.addColorStop(0.5, 'oklch(0.72 0.24 330)');
        grad.addColorStop(1, 'oklch(0.78 0.18 195)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();

        // Peak floating cap
        ctx.fillStyle = 'oklch(0.98 0.02 195)';
        ctx.fillRect(x, Math.max(0, y - 3), barWidth, 2);
      }
    } else {
      // Idle ambient neon wave
      idlePhase += 0.03;
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'oklch(0.75 0.18 195 / 0.45)';
      ctx.beginPath();

      const centerY = height / 2;
      for (let x = 0; x < width; x += 4) {
        const y = centerY + Math.sin(x * 0.02 + idlePhase) * 12 + Math.cos(x * 0.04 - idlePhase) * 6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Ambient text watermark
      ctx.fillStyle = 'oklch(0.75 0.03 280 / 0.5)';
      ctx.font = '600 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AUDIO CONTEXT IDLE • CLICK INITIALIZE TO ACTIVATE REAL-TIME FFT', width / 2, centerY - 25);
    }

    animationFrameId = requestAnimationFrame(renderSpectrum);
  }

  // Kick off visualizer loop
  renderSpectrum();

  // Clean-up on page unload
  window.addEventListener('beforeunload', () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (audioCtx) audioCtx.close();
  });
})();
