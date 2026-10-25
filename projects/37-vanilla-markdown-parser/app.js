/**
 * DPE L8++ STANDARDS: Level 37 - Vanilla Markdown AST Parser & Safe Compiler
 * Architect: Distinguished Principal Engineer (L8++)
 * Two-phase AST tokenization pipeline with HTML entity sanitization & zero external bloat.
 */

(() => {
  'use strict';

  // DOM Elements
  const markdownInput = document.getElementById('markdown-input');
  const renderedOutput = document.getElementById('rendered-output');
  const statParseTime = document.getElementById('stat-parse-time');
  const statTokenCount = document.getElementById('stat-token-count');
  const astDrawer = document.getElementById('ast-drawer');
  const astJson = document.getElementById('ast-json');
  const btnToggleAst = document.getElementById('btn-toggle-ast');
  const btnCloseAst = document.getElementById('btn-close-ast');

  // HTML Entity Sanitizer
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Inline Tokenizer / Formatter
  function parseInline(text) {
    let out = escapeHtml(text);

    // 1. Inline code: `code`
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 2. Bold: **text**
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 3. Italic: *text*
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 4. Strikethrough: ~~text~~
    out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // 5. Links: [text](url) - validate safe protocol
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, txt, url) => {
      const cleanUrl = url.trim();
      if (/^(https?:\/\/|\/|#)/i.test(cleanUrl)) {
        return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${txt}</a>`;
      }
      return txt;
    });

    return out;
  }

  // Block Tokenizer -> AST
  function tokenize(markdown) {
    const lines = markdown.split(/\r?\n/);
    const ast = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Empty lines
      if (!line.trim()) {
        i++;
        continue;
      }

      // Fenced Code Block
      if (line.startsWith('```')) {
        const lang = line.slice(3).trim();
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++; // skip closing ```
        ast.push({
          type: 'code_block',
          lang: lang || 'text',
          content: codeLines.join('\n')
        });
        continue;
      }

      // Headings: #, ##, ###, ####, #####, ######
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        ast.push({
          type: 'heading',
          level: headingMatch[1].length,
          content: headingMatch[2].trim()
        });
        i++;
        continue;
      }

      // Blockquote: > text
      if (line.startsWith('>')) {
        const quoteLines = [];
        while (i < lines.length && lines[i].startsWith('>')) {
          quoteLines.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        ast.push({
          type: 'blockquote',
          content: quoteLines.join(' ')
        });
        continue;
      }

      // Unordered List: * or -
      if (/^[\*\-]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^[\*\-]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^[\*\-]\s+/, '').trim());
          i++;
        }
        ast.push({
          type: 'list',
          ordered: false,
          items: items
        });
        continue;
      }

      // Paragraph (accumulate contiguous lines)
      const pLines = [];
      while (i < lines.length && lines[i].trim() &&
             !lines[i].startsWith('```') &&
             !lines[i].startsWith('#') &&
             !lines[i].startsWith('>') &&
             !/^[\*\-]\s+/.test(lines[i])) {
        pLines.push(lines[i].trim());
        i++;
      }
      if (pLines.length > 0) {
        ast.push({
          type: 'paragraph',
          content: pLines.join(' ')
        });
      }
    }

    return ast;
  }

  // Compile AST -> Safe HTML
  function compileToHtml(ast) {
    const htmlChunks = [];

    for (const node of ast) {
      switch (node.type) {
        case 'heading':
          htmlChunks.push(`<h${node.level}>${parseInline(node.content)}</h${node.level}>`);
          break;
        case 'paragraph':
          htmlChunks.push(`<p>${parseInline(node.content)}</p>`);
          break;
        case 'blockquote':
          htmlChunks.push(`<blockquote>${parseInline(node.content)}</blockquote>`);
          break;
        case 'code_block':
          htmlChunks.push(`<pre><code class="lang-${node.lang}">${escapeHtml(node.content)}</code></pre>`);
          break;
        case 'list': {
          const listItems = node.items.map(it => `<li>${parseInline(it)}</li>`).join('');
          htmlChunks.push(`<ul>${listItems}</ul>`);
          break;
        }
      }
    }

    return htmlChunks.join('\n');
  }

  // Live Compiler Runner
  function runCompiler() {
    const t0 = performance.now();
    const source = markdownInput.value;

    const ast = tokenize(source);
    const html = compileToHtml(ast);

    renderedOutput.innerHTML = html;

    const elapsed = (performance.now() - t0).toFixed(2);
    statParseTime.textContent = `${elapsed}ms`;
    statTokenCount.textContent = ast.length;

    astJson.textContent = JSON.stringify(ast, null, 2);
  }

  // Listeners
  markdownInput.addEventListener('input', runCompiler);

  btnToggleAst.addEventListener('click', () => {
    astDrawer.hidden = !astDrawer.hidden;
    btnToggleAst.textContent = astDrawer.hidden ? 'Inspect AST JSON' : 'Hide AST JSON';
  });

  btnCloseAst.addEventListener('click', () => {
    astDrawer.hidden = true;
    btnToggleAst.textContent = 'Inspect AST JSON';
  });

  // Initial compilation
  runCompiler();
})();
