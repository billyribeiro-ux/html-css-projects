// Global Application State
    let currentProjectIndex = 0;
    let currentTab = 'html'; // 'html' | 'css' | 'js' | 'preview'
    let currentSeriesFilter = 'all'; // 'all' | 'series1' | 'series2'
    let monacoEditor = null;
    let isMonacoReady = false;

    // Core Elements
    const navList = document.getElementById('nav-list');
    const currLevel = document.getElementById('curr-level');
    const currTitle = document.getElementById('curr-title');
    const currFeatures = document.getElementById('curr-features');
    const currArchitecture = document.getElementById('curr-architecture');
    const currDeepdive = document.getElementById('curr-deepdive');
    const currSeo = document.getElementById('curr-seo');
    const currSteps = document.getElementById('curr-steps');
    const currStandaloneLink = document.getElementById('curr-standalone-link');

    // Header Navigation Elements
    const btnPrevProject = document.getElementById('btn-prev-project');
    const btnNextProject = document.getElementById('btn-next-project');
    const headerCounter = document.getElementById('header-counter');
    const btnOpenShortcuts = document.getElementById('btn-open-shortcuts');
    const btnCloseDialog = document.getElementById('btn-close-dialog');
    const shortcutsDialog = document.getElementById('shortcuts-dialog');

    // Studio Elements
    const tabHtml = document.getElementById('tab-html');
    const tabCss = document.getElementById('tab-css');
    const tabJs = document.getElementById('tab-js');
    const tabTests = document.getElementById('tab-tests');
    const jsTabBadge = document.getElementById('js-tab-badge');
    const tabPreview = document.getElementById('tab-preview');
    const monacoContainer = document.getElementById('monaco-container');
    const fallbackContainer = document.getElementById('fallback-code-container');
    const previewIframe = document.getElementById('preview-iframe');

    // Action Elements
    const btnCopyCode = document.getElementById('btn-copy-code');
    const btnCopyAll = document.getElementById('btn-copy-all');
    const copyText = document.getElementById('copy-text');
    const copyAllText = document.getElementById('copy-all-text');
    const searchInput = document.getElementById('project-search');

    // 1. Initialize Monaco Editor
    if (typeof require !== 'undefined') {
      require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
      require(['vs/editor/editor.main'], function() {
        monacoEditor = monaco.editor.create(monacoContainer, {
          value: PROJECTS_DATA[0].html,
          language: 'html',
          theme: 'vs-dark',
          automaticLayout: true,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          renderWhitespace: 'selection',
          padding: { top: 16 }
        });

        isMonacoReady = true;

        // Sync changes made inside Monaco directly into live preview
        monacoEditor.onDidChangeModelContent(() => {
          if (currentTab === 'html') {
            PROJECTS_DATA[currentProjectIndex].html = monacoEditor.getValue();
          } else if (currentTab === 'css') {
            PROJECTS_DATA[currentProjectIndex].css = monacoEditor.getValue();
          } else if (currentTab === 'js') {
            PROJECTS_DATA[currentProjectIndex].js = monacoEditor.getValue();
          }
          updateLivePreview();
        });

        renderProject(0);
      });
    } else {
      // Fallback if CDN blocked
      showFallbackView();
      renderProject(0);
    }

    function showFallbackView() {
      monacoContainer.style.display = 'none';
      fallbackContainer.style.display = 'block';
    }

    // 2. Filter & Navigation Engine
    function getFilteredProjects() {
      const q = searchInput.value.toLowerCase().trim();
      return PROJECTS_DATA.filter((p, index) => {
        // Series filter
        if (currentSeriesFilter === 'series1' && index >= 20) return false;
        if (currentSeriesFilter === 'series2' && (index < 20 || index >= 40)) return false;
        if (currentSeriesFilter === 'series3' && index < 40) return false;

        // Query filter
        if (!q) return true;
        return (
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.features.some(f => f.toLowerCase().includes(q)) ||
          p.level.toLowerCase().includes(q) ||
          (p.seoArchitecture && p.seoArchitecture.toLowerCase().includes(q)) ||
          (p.js && p.js.toLowerCase().includes(q))
        );
      });
    }

    function renderSidebar() {
      const filtered = getFilteredProjects();
      navList.innerHTML = '';
      if (filtered.length === 0) {
        navList.innerHTML = '<li class="nav-empty-state">No projects match filter criteria</li>';
        return;
      }
      filtered.forEach((project) => {
        const originalIndex = PROJECTS_DATA.findIndex(p => p.id === project.id);
        const isSeries2 = originalIndex >= 20 && originalIndex < 40;
        const isSeries3 = originalIndex >= 40;
        const badgeClass = isSeries3 ? "nav-item-badge--series3" : isSeries2 ? "nav-item-badge--series2" : "";
        const li = document.createElement('li');
        li.className = `project-nav-item ${originalIndex === currentProjectIndex ? 'active' : ''}`;
        li.setAttribute('role', 'button');
        li.setAttribute('tabindex', '0');
        li.innerHTML = `
          <div class="nav-item-meta">
            <span class="nav-item-level">${project.level.split('•')[0].trim()}</span>
            <span class="nav-item-badge ${badgeClass}">${project.category}</span>
          </div>
          <span class="nav-item-title">${project.title}</span>
        `;
        li.addEventListener('click', () => {
          selectProject(originalIndex);
        });
        li.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectProject(originalIndex);
          }
        });
        navList.appendChild(li);
      });
    }

    // Series Filter Pills
    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        currentSeriesFilter = btn.dataset.filter;
        renderSidebar();
      });
    });

    function formatMarkdown(text) {
      if (!text) return '';
      let out = text.replace(/```(\w+)?\r?\n([\s\S]*?)```/g, (match, lang, code) => {
        const escaped = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return `<pre><code>${escaped.trim()}</code></pre>`;
      });
      out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
      return out;
    }

    // 3. Render Active Project
    function renderProject(index) {
      currentProjectIndex = index;
      const p = PROJECTS_DATA[index];

      // Update Header Stepper & Controls
      if (headerCounter) {
        headerCounter.textContent = `Project ${String(index + 1).padStart(2, '0')} of ${PROJECTS_DATA.length}`;
      }
      if (btnPrevProject) {
        btnPrevProject.disabled = index === 0;
      }
      if (btnNextProject) {
        btnNextProject.disabled = index === PROJECTS_DATA.length - 1;
      }

      // Update JS Tab Badge
      if (jsTabBadge) {
        if (index >= 40) {
          jsTabBadge.textContent = 'TSX / Prisma / 3D';
          jsTabBadge.className = 'tab-sub-badge';
        } else if (p.js && p.js.trim().length > 0) {
          jsTabBadge.textContent = 'Active JS';
          jsTabBadge.className = 'tab-sub-badge';
        } else {
          jsTabBadge.textContent = 'Pure CSS';
          jsTabBadge.className = 'tab-sub-badge pure-css';
        }
      }

      // Update Narrative Pane
      currLevel.textContent = p.level;
      currTitle.textContent = p.title;

      const headingDeepdive = document.getElementById('heading-deepdive');
      if (headingDeepdive) {
        headingDeepdive.textContent = index >= 40
          ? 'Next.js 15, React 19, Prisma v6 & 3D WebGL Mechanics Deep Dive'
          : index >= 20
            ? 'Advanced JavaScript & Systems Mechanics Deep Dive'
            : '2026 CSS Standard Mechanics Deep Dive';
      }

      // Feature Tags
      currFeatures.innerHTML = p.features.map(f => `<span class="feature-tag">${f}</span>`).join('');

      // Architecture & Deepdive
      currArchitecture.innerHTML = `<p>${formatMarkdown(p.architecture)}</p>`;
      currDeepdive.innerHTML = p.deepDive.split('\n').map(line => `<p>${formatMarkdown(line)}</p>`).join('');

      // Google SEO & Core Web Vitals (INP) Architecture
      if (p.seoArchitecture) {
        currSeo.innerHTML = p.seoArchitecture.split('\n').map(line => `<p>${formatMarkdown(line)}</p>`).join('');
      } else {
        currSeo.innerHTML = '<p>Universal Core Web Vitals and semantic HTML5 standards applied.</p>';
      }

      // Steps with Markdown Code Formatting
      currSteps.innerHTML = p.steps.map(step => `
        <div class="step-card">
          <div class="step-card-header">${step.title}</div>
          <div class="step-card-body">${formatMarkdown(step.content)}</div>
        </div>
      `).join('');

      // Standalone link
      currStandaloneLink.href = `projects/${p.folder}/index.html`;

      // Update Sidebar active state
      const items = navList.querySelectorAll('.project-nav-item');
      items.forEach((item) => {
        const itemTitle = item.querySelector('.nav-item-title');
        const isActive = itemTitle && itemTitle.textContent.trim() === p.title.trim();
        item.classList.toggle('active', isActive);
        if (isActive) {
          item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      });

      // Update Editor Content & Live Preview
      syncEditorContent();
      updateLivePreview();
    }

    function selectProject(index) {
      renderProject(index);
      // Scroll narrative to top
      document.getElementById('narrative-pane').scrollTop = 0;
    }

    // Header Stepper Click Handlers
    if (btnPrevProject) {
      btnPrevProject.addEventListener('click', () => {
        if (currentProjectIndex > 0) {
          selectProject(currentProjectIndex - 1);
        }
      });
    }

    if (btnNextProject) {
      btnNextProject.addEventListener('click', () => {
        if (currentProjectIndex < PROJECTS_DATA.length - 1) {
          selectProject(currentProjectIndex + 1);
        }
      });
    }

    // 4. Editor Tab Switching & Layout Resilience
    function setTab(tab) {
      currentTab = tab;
      [tabHtml, tabCss, tabJs, tabTests, tabPreview].forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });

      if (tab === 'html') {
        tabHtml.classList.add('active');
        tabHtml.setAttribute('aria-selected', 'true');
        previewIframe.style.display = 'none';
        if (isMonacoReady) {
          monacoContainer.style.display = 'block';
          fallbackContainer.style.display = 'none';
          monaco.editor.setModelLanguage(monacoEditor.getModel(), 'html');
          monacoEditor.setValue(PROJECTS_DATA[currentProjectIndex].html);
          setTimeout(() => monacoEditor.layout(), 25);
        } else {
          fallbackContainer.style.display = 'block';
          fallbackContainer.textContent = PROJECTS_DATA[currentProjectIndex].html;
        }
      } else if (tab === 'css') {
        tabCss.classList.add('active');
        tabCss.setAttribute('aria-selected', 'true');
        previewIframe.style.display = 'none';
        if (isMonacoReady) {
          monacoContainer.style.display = 'block';
          fallbackContainer.style.display = 'none';
          monaco.editor.setModelLanguage(monacoEditor.getModel(), 'css');
          monacoEditor.setValue(PROJECTS_DATA[currentProjectIndex].css);
          setTimeout(() => monacoEditor.layout(), 25);
        } else {
          fallbackContainer.style.display = 'block';
          fallbackContainer.textContent = PROJECTS_DATA[currentProjectIndex].css;
        }
      } else if (tab === 'js') {
        tabJs.classList.add('active');
        tabJs.setAttribute('aria-selected', 'true');
        previewIframe.style.display = 'none';
        const jsCode = PROJECTS_DATA[currentProjectIndex].js || '// Zero JavaScript runtime required for this pure declarative architecture.';
        if (isMonacoReady) {
          monacoContainer.style.display = 'block';
          fallbackContainer.style.display = 'none';
          monaco.editor.setModelLanguage(monacoEditor.getModel(), 'javascript');
          monacoEditor.setValue(jsCode);
          setTimeout(() => monacoEditor.layout(), 25);
        } else {
          fallbackContainer.style.display = 'block';
          fallbackContainer.textContent = jsCode;
        }
      } else if (tab === 'tests') {
        tabTests.classList.add('active');
        tabTests.setAttribute('aria-selected', 'true');
        previewIframe.style.display = 'none';
        const testCode = PROJECTS_DATA[currentProjectIndex].testCode || '// Automated Vitest & Playwright verification suite';
        if (isMonacoReady) {
          monacoContainer.style.display = 'block';
          fallbackContainer.style.display = 'none';
          monaco.editor.setModelLanguage(monacoEditor.getModel(), 'javascript');
          monacoEditor.setValue(testCode);
          setTimeout(() => monacoEditor.layout(), 25);
        } else {
          fallbackContainer.style.display = 'block';
          fallbackContainer.textContent = testCode;
        }
      } else if (tab === 'preview') {
        tabPreview.classList.add('active');
        tabPreview.setAttribute('aria-selected', 'true');
        monacoContainer.style.display = 'none';
        fallbackContainer.style.display = 'none';
        previewIframe.style.display = 'block';
        updateLivePreview();
      }
    }

    tabHtml.addEventListener('click', () => setTab('html'));
    tabCss.addEventListener('click', () => setTab('css'));
    tabJs.addEventListener('click', () => setTab('js'));
    tabTests.addEventListener('click', () => setTab('tests'));
    tabPreview.addEventListener('click', () => setTab('preview'));

    function syncEditorContent() {
      const p = PROJECTS_DATA[currentProjectIndex];
      if (currentTab === 'html') {
        if (isMonacoReady) {
          monaco.editor.setModelLanguage(monacoEditor.getModel(), 'html');
          monacoEditor.setValue(p.html);
        } else {
          fallbackContainer.textContent = p.html;
        }
      } else if (currentTab === 'css') {
        if (isMonacoReady) {
          monaco.editor.setModelLanguage(monacoEditor.getModel(), 'css');
          monacoEditor.setValue(p.css);
        } else {
          fallbackContainer.textContent = p.css;
        }
      } else if (currentTab === 'js') {
        const jsCode = p.js || '// Zero JavaScript runtime required for this pure declarative architecture.';
        if (isMonacoReady) {
          monaco.editor.setModelLanguage(monacoEditor.getModel(), 'javascript');
          monacoEditor.setValue(jsCode);
        } else {
          fallbackContainer.textContent = jsCode;
        }
      } else if (currentTab === 'tests') {
        const testCode = p.testCode || '// Automated Vitest & Playwright verification suite';
        if (isMonacoReady) {
          monaco.editor.setModelLanguage(monacoEditor.getModel(), 'javascript');
          monacoEditor.setValue(testCode);
        } else {
          fallbackContainer.textContent = testCode;
        }
      }
    }

    // 5. Update Live Preview Iframe with Injected CSS and JS
    function updateLivePreview() {
      const p = PROJECTS_DATA[currentProjectIndex];
      let doc = p.html;

      // Inject Stylesheet
      if (doc.includes('<link rel="stylesheet" href="styles.css">')) {
        doc = doc.replace('<link rel="stylesheet" href="styles.css">', `<style>${p.css}<\/style>`);
      } else {
        doc = doc.replace('<\/head>', `<style>${p.css}<\/style><\/head>`);
      }

      // Inject Modular JS if present
      if (p.js && p.js.trim().length > 0) {
        if (doc.includes('<script src="app.js"><\/script>')) {
          doc = doc.replace('<script src="app.js"><\/script>', `<script>${p.js}<\/script>`);
        } else if (doc.includes('<\/body>')) {
          doc = doc.replace('<\/body>', `<script>${p.js}<\/script><\/body>`);
        }
      }

      previewIframe.srcdoc = doc;
    }

    // 6. Tactile Diagnostics & Clipboard Handlers
    btnCopyCode.addEventListener('click', () => {
      const p = PROJECTS_DATA[currentProjectIndex];
      let code = p.html;
      if (currentTab === 'css') code = p.css;
      else if (currentTab === 'js') code = p.js || '// Zero JavaScript runtime required';
      else if (currentTab === 'tests') code = p.testCode || '// Automated Vitest & Playwright verification suite';
      
      const lines = code.split('\n').length;
      const bytes = new Blob([code]).size;
      const kb = (bytes / 1024).toFixed(1);

      navigator.clipboard.writeText(code).then(() => {
        btnCopyCode.classList.add('copied');
        copyText.textContent = `Copied ${lines} lines (${kb} KB)`;
        setTimeout(() => {
          btnCopyCode.classList.remove('copied');
          copyText.textContent = 'Copy Code';
        }, 2200);
      });
    });

    btnCopyAll.addEventListener('click', () => {
      const p = PROJECTS_DATA[currentProjectIndex];
      let combined = `<!-- Combined Single-File Production Build: ${p.title} -->\n` +
        p.html.replace('<link rel="stylesheet" href="styles.css">', `<style>\n${p.css}\n<\/style>`);
      if (p.js && p.js.trim().length > 0) {
        if (combined.includes('<script src="app.js"><\/script>')) {
          combined = combined.replace('<script src="app.js"><\/script>', `<script>\n${p.js}\n<\/script>`);
        } else if (combined.includes('<\/body>')) {
          combined = combined.replace('<\/body>', `<script>\n${p.js}\n<\/script>\n<\/body>`);
        }
      }

      const lines = combined.split('\n').length;
      const bytes = new Blob([combined]).size;
      const kb = (bytes / 1024).toFixed(1);

      navigator.clipboard.writeText(combined).then(() => {
        btnCopyAll.classList.add('copied');
        copyAllText.textContent = `Bundle Copied (${kb} KB)`;
        setTimeout(() => {
          btnCopyAll.classList.remove('copied');
          copyAllText.textContent = 'Copy Combined';
        }, 2200);
      });
    });

    // 7. Search Filtering across all 40 projects
    searchInput.addEventListener('input', () => {
      renderSidebar();
    });

    // 8. Keyboard Navigation & Shortcuts Engine
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      // Global Escape
      if (e.key === 'Escape') {
        if (shortcutsDialog && shortcutsDialog.open) {
          shortcutsDialog.close();
        } else if (isInput) {
          activeEl.blur();
        }
        return;
      }

      // If user is typing in an input field, do not hijack other hotkeys
      if (isInput) return;

      // Project navigation
      if (e.key === '[' || e.key === 'k') {
        e.preventDefault();
        if (currentProjectIndex > 0) {
          selectProject(currentProjectIndex - 1);
        }
      } else if (e.key === ']' || e.key === 'j') {
        e.preventDefault();
        if (currentProjectIndex < PROJECTS_DATA.length - 1) {
          selectProject(currentProjectIndex + 1);
        }
      }
      // Tab switching: Alt+1 to Alt+5
      else if (e.altKey && e.key === '1') {
        e.preventDefault();
        setTab('html');
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        setTab('css');
      } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        setTab('js');
      } else if (e.altKey && e.key === '4') {
        e.preventDefault();
        setTab('tests');
      } else if (e.altKey && e.key === '5') {
        e.preventDefault();
        setTab('preview');
      }
      // Search Focus: /
      else if (e.key === '/') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
      // Shortcuts Modal: ? or Shift+/
      else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        if (shortcutsDialog) {
          if (shortcutsDialog.open) {
            shortcutsDialog.close();
          } else {
            shortcutsDialog.showModal();
          }
        }
      }
    });

    // Shortcuts Dialog Handlers
    if (btnOpenShortcuts && shortcutsDialog) {
      btnOpenShortcuts.addEventListener('click', () => {
        shortcutsDialog.showModal();
      });
    }
    if (btnCloseDialog && shortcutsDialog) {
      btnCloseDialog.addEventListener('click', () => {
        shortcutsDialog.close();
      });
    }
    if (shortcutsDialog) {
      shortcutsDialog.addEventListener('click', (e) => {
        const rect = shortcutsDialog.getBoundingClientRect();
        const isInDialog = (
          rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX && e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
          shortcutsDialog.close();
        }
      });
    }

    // Initialize sidebar and default to Level 01
    renderSidebar();
    renderProject(0);
