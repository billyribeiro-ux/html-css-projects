/**
 * DPE L8++ STANDARDS: Level 35 - Web Speech Command Interface
 * Architect: Distinguished Principal Engineer (L8++)
 * Dual-channel Web Speech API (Recognition + Synthesis) with fallback intent parsing.
 */

(() => {
  'use strict';

  // DOM Elements
  const btnMic = document.getElementById('btn-mic');
  const micStatusLabel = document.getElementById('mic-status-label');
  const interimText = document.getElementById('interim-text');
  const confidenceBadge = document.getElementById('confidence-badge');
  const ledgerBody = document.getElementById('ledger-body');
  const commandPills = document.querySelectorAll('.cmd-pill');

  // Speech Recognition Support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isListening = false;

  function log(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `ledger-item ${type}`;
    const time = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date());
    el.textContent = `[${time}] ${msg}`;
    ledgerBody.appendChild(el);
    ledgerBody.scrollTop = ledgerBody.scrollHeight;
  }

  // Speech Synthesis Output
  function speak(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Abort previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      log(`🎙️ Spoken: "${text}"`, 'speech');
    }
  }

  // Intent Parsing Engine
  function processCommand(rawText, confidence = 1.0) {
    const text = rawText.trim().toLowerCase();
    log(`Heard: "${rawText}"`, 'command');
    confidenceBadge.textContent = `Confidence: ${(confidence * 100).toFixed(0)}%`;

    if (text.includes('diagnostic')) {
      const resp = 'Running system diagnostics. All 12 cluster nodes operational at 100% capacity.';
      speak(resp);
    } else if (text.includes('status')) {
      const resp = 'System status is nominal. Memory utilization is 24%, zero packet drops.';
      speak(resp);
    } else if (text.includes('theme emerald')) {
      document.documentElement.style.setProperty('--brand-cyan', 'oklch(0.75 0.2 145)');
      const resp = 'Visual theme updated to Emerald.';
      speak(resp);
    } else if (text.includes('theme cyan')) {
      document.documentElement.style.setProperty('--brand-cyan', 'oklch(0.76 0.18 190)');
      const resp = 'Visual theme reset to Cyan.';
      speak(resp);
    } else if (text.includes('clear')) {
      ledgerBody.innerHTML = '';
      speak('Execution ledger cleared.');
    } else {
      const resp = `Command "${rawText}" recognized, but no matching intent was registered.`;
      speak(resp);
    }
  }

  // Initialize Speech Recognition if supported
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListening = true;
      btnMic.classList.add('listening');
      micStatusLabel.textContent = 'Listening... Speak clearly into microphone';
      interimText.textContent = 'Detecting speech waveform...';
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      let confidence = 0.95;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
          confidence = event.results[i][0].confidence || 0.95;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        interimText.textContent = `Hearing: "${interim}"`;
      }

      if (final) {
        interimText.textContent = `Captured: "${final}"`;
        processCommand(final, confidence);
      }
    };

    recognition.onerror = (event) => {
      log(`Speech Recognition Error: ${event.error}`, 'error');
      btnMic.classList.remove('listening');
      isListening = false;
      micStatusLabel.textContent = `Speech error (${event.error}) • Click to retry`;
    };

    recognition.onend = () => {
      btnMic.classList.remove('listening');
      isListening = false;
      micStatusLabel.textContent = 'Microphone Idle • Click to Listen';
    };
  } else {
    micStatusLabel.textContent = 'SpeechRecognition API not available in this browser environment.';
    interimText.textContent = 'Use the synthetic quick command pills below to simulate voice input.';
  }

  // Toggle Mic
  btnMic.addEventListener('click', () => {
    if (!SpeechRecognition) {
      log('Web SpeechRecognition requires Chrome/Edge/Safari with microphone access.', 'error');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        recognition.stop();
      }
    }
  });

  // Synthetic Command Simulator Pills
  commandPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const cmd = pill.dataset.cmd;
      interimText.textContent = `Simulated: "${cmd}"`;
      processCommand(cmd, 1.0);
    });
  });
})();
