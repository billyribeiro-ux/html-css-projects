/**
 * DPE L8++ STANDARDS: Level 34 - Infinite Pan & Zoom Spatial Canvas
 * Architect: Distinguished Principal Engineer (L8++)
 * Native DOMMatrix 2D affine transformation engine with cursor-focal zoom & minimap.
 */

(() => {
  'use strict';

  // DOM Elements
  const viewport = document.getElementById('viewport');
  const worldContainer = document.getElementById('world-container');
  const valX = document.getElementById('val-x');
  const valY = document.getElementById('val-y');
  const valZoom = document.getElementById('val-zoom');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnReset = document.getElementById('btn-reset-view');
  const minimapBox = document.getElementById('minimap-viewport-box');
  const minimapArena = document.getElementById('minimap-arena');

  // Camera State (Affine Matrix Components)
  let panX = 0;
  let panY = 0;
  let scale = 1.0;

  const MIN_SCALE = 0.2;
  const MAX_SCALE = 3.5;

  let isPanning = false;
  let startPointerX = 0;
  let startPointerY = 0;
  let startPanX = 0;
  let startPanY = 0;

  function updateTransform() {
    // 1. Apply transform to world container
    worldContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;

    // 2. Procedural background grid alignment
    const gridSize = 32 * scale;
    viewport.style.backgroundSize = `${gridSize}px ${gridSize}px`;
    viewport.style.backgroundPosition = `${panX}px ${panY}px`;

    // 3. HUD telemetry
    valX.textContent = Math.round(-panX);
    valY.textContent = Math.round(-panY);
    valZoom.textContent = `${Math.round(scale * 100)}%`;

    // 4. Update Minimap Radar
    updateMinimap();
  }

  function updateMinimap() {
    const miniW = minimapArena.clientWidth || 160;
    const miniH = minimapArena.clientHeight || 120;
    const worldScale = 0.08; // scale factor to fit world in minimap

    const boxW = Math.max(16, (viewport.clientWidth * worldScale) / scale);
    const boxH = Math.max(12, (viewport.clientHeight * worldScale) / scale);

    const centerX = (miniW / 2) - (panX * worldScale);
    const centerY = (miniH / 2) - (panY * worldScale);

    minimapBox.style.width = `${boxW}px`;
    minimapBox.style.height = `${boxH}px`;
    minimapBox.style.left = `${centerX}px`;
    minimapBox.style.top = `${centerY}px`;
  }

  // Focal Point Zoom (scales centered around mouse cursor)
  function zoomAtPoint(focalX, focalY, zoomDelta) {
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * zoomDelta));
    if (newScale === scale) return;

    // Viewport coordinates relative to center
    const rect = viewport.getBoundingClientRect();
    const cx = focalX - rect.left - rect.width / 2;
    const cy = focalY - rect.top - rect.height / 2;

    // Adjust pan to preserve cursor focal point
    panX = cx - (cx - panX) * (newScale / scale);
    panY = cy - (cy - panY) * (newScale / scale);
    scale = newScale;

    updateTransform();
  }

  // Wheel Zoom Listener
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    zoomAtPoint(e.clientX, e.clientY, zoomFactor);
  }, { passive: false });

  // Pan Gestures via Pointer Events
  viewport.addEventListener('pointerdown', (e) => {
    // If clicking a spatial node, let node dragging handle it
    if (e.target.closest('.spatial-node')) return;

    isPanning = true;
    viewport.setPointerCapture(e.pointerId);
    startPointerX = e.clientX;
    startPointerY = e.clientY;
    startPanX = panX;
    startPanY = panY;
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!isPanning) return;
    const dx = e.clientX - startPointerX;
    const dy = e.clientY - startPointerY;
    panX = startPanX + dx;
    panY = startPanY + dy;
    updateTransform();
  });

  viewport.addEventListener('pointerup', (e) => {
    if (isPanning) {
      isPanning = false;
      viewport.releasePointerCapture(e.pointerId);
    }
  });

  // Node Dragging within Infinite World Coordinates
  document.querySelectorAll('.spatial-node').forEach(node => {
    let isDraggingNode = false;
    let nodeStartX = 0, nodeStartY = 0;
    let nodeInitLeft = 0, nodeInitTop = 0;

    node.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      isDraggingNode = true;
      node.setPointerCapture(e.pointerId);
      nodeStartX = e.clientX;
      nodeStartY = e.clientY;
      nodeInitLeft = parseFloat(node.style.left) || 0;
      nodeInitTop = parseFloat(node.style.top) || 0;
    });

    node.addEventListener('pointermove', (e) => {
      if (!isDraggingNode) return;
      // Convert screen delta to world delta dividing by current scale!
      const worldDx = (e.clientX - nodeStartX) / scale;
      const worldDy = (e.clientY - nodeStartY) / scale;
      node.style.left = `${nodeInitLeft + worldDx}px`;
      node.style.top = `${nodeInitTop + worldDy}px`;
    });

    node.addEventListener('pointerup', (e) => {
      if (isDraggingNode) {
        isDraggingNode = false;
        node.releasePointerCapture(e.pointerId);
      }
    });
  });

  // HUD Controls
  btnZoomIn.addEventListener('click', () => {
    const rect = viewport.getBoundingClientRect();
    zoomAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.25);
  });

  btnZoomOut.addEventListener('click', () => {
    const rect = viewport.getBoundingClientRect();
    zoomAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, 0.8);
  });

  btnReset.addEventListener('click', () => {
    panX = 0;
    panY = 0;
    scale = 1.0;
    updateTransform();
  });

  // Initial Sync
  updateTransform();
})();
