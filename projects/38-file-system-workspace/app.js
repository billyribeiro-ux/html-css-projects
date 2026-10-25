/**
 * DPE L8++ STANDARDS: Level 38 - File System Access API Workspace
 * Architect: Distinguished Principal Engineer (L8++)
 * Direct local disk synchronization via FileSystemFileHandle & WritableStream.
 */

(() => {
  'use strict';

  // DOM Elements
  const editor = document.getElementById('file-editor');
  const fileNameEl = document.getElementById('file-name');
  const dirtyIndicator = document.getElementById('dirty-indicator');
  const metaLines = document.getElementById('meta-lines');
  const metaSize = document.getElementById('meta-size');
  const metaMode = document.getElementById('meta-mode');

  const btnOpen = document.getElementById('btn-open-file');
  const btnSave = document.getElementById('btn-save-file');
  const btnSaveAs = document.getElementById('btn-save-as');
  const btnNew = document.getElementById('btn-new-file');
  const fallbackFileInput = document.getElementById('fallback-file-input');

  // State
  let currentFileHandle = null;
  let isDirty = false;
  let currentFileName = 'untitled-document.ts';

  function updateMetadata() {
    const text = editor.value;
    const lines = text.split('\n').length;
    const bytes = new Blob([text]).size;

    metaLines.textContent = lines;
    metaSize.textContent = `${bytes} Bytes`;

    if (currentFileHandle) {
      metaMode.textContent = 'Disk Synced (Native FS Handle)';
    } else {
      metaMode.textContent = 'In-Memory Buffer (Unsaved)';
    }
  }

  function setDirty(dirty) {
    isDirty = dirty;
    if (dirty) {
      dirtyIndicator.classList.add('is-dirty');
      fileNameEl.textContent = `${currentFileName} *`;
    } else {
      dirtyIndicator.classList.remove('is-dirty');
      fileNameEl.textContent = currentFileName;
    }
    updateMetadata();
  }

  // 1. Open File
  async function openFile() {
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'Source Files',
            accept: { 'text/*': ['.ts', '.js', '.json', '.html', '.css', '.md', '.txt'] }
          }]
        });

        const file = await handle.getFile();
        const content = await file.text();

        currentFileHandle = handle;
        currentFileName = file.name;
        editor.value = content;
        setDirty(false);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('File open error:', err);
        }
      }
    } else {
      // Fallback
      fallbackFileInput.click();
    }
  }

  // Fallback file input change
  fallbackFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      currentFileHandle = null;
      currentFileName = file.name;
      editor.value = event.target.result;
      setDirty(false);
    };
    reader.readAsText(file);
  });

  // 2. Save File
  async function saveFile() {
    if (!currentFileHandle) {
      return saveAsFile();
    }

    try {
      const writable = await currentFileHandle.createWritable();
      await writable.write(editor.value);
      await writable.close();
      setDirty(false);
    } catch (err) {
      console.error('File save error:', err);
      saveAsFile();
    }
  }

  // 3. Save As
  async function saveAsFile() {
    const content = editor.value;

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: currentFileName,
          types: [{
            description: 'Source Files',
            accept: { 'text/*': ['.ts', '.js', '.json', '.html', '.css', '.md', '.txt'] }
          }]
        });

        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();

        currentFileHandle = handle;
        const file = await handle.getFile();
        currentFileName = file.name;
        setDirty(false);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Save as error:', err);
        }
      }
    } else {
      // Fallback Blob Download
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentFileName;
      a.click();
      URL.revokeObjectURL(url);
      setDirty(false);
    }
  }

  // 4. New File
  function newFile() {
    currentFileHandle = null;
    currentFileName = 'untitled-document.ts';
    editor.value = '';
    setDirty(false);
  }

  // Listeners
  editor.addEventListener('input', () => {
    setDirty(true);
  });

  btnOpen.addEventListener('click', openFile);
  btnSave.addEventListener('click', saveFile);
  btnSaveAs.addEventListener('click', saveAsFile);
  btnNew.addEventListener('click', newFile);

  // Global Keyboard Shortcut: Ctrl+S / Cmd+S
  window.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    if (modifier && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveFile();
    }
  });

  // Initial Sync
  updateMetadata();
})();
