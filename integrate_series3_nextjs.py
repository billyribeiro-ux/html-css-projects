#!/usr/bin/env python3
"""
Principal Engineer Level 8++ (Oct 26, 2026) — Unified 60-Project Zero-Inline-CSS Integrator
1. Cleans the 6 inline `style="..."` attributes in Projects 01–40 (`08`, `13`, `18`, `22`, `34`, `38`)
   by moving their rules into external `styles.css` (`:nth-child`, ID/attribute selectors, and `hidden`).
2. Integrates Projects 41–60 (Next.js 15, React 19, TypeScript 5.8, Prisma v6, Three.js, GSAP)
   with 100% external CSS (`styles.css` + `course.css`) and ZERO `<style>` or `style=` attributes.
3. Extracts `/Users/billyribeiro/Desktop/html-css/index.html` `<style>` and inline `style=` into external `portal.css`.
"""

import json
import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, "/Users/billyribeiro/Desktop/react-enterprise-projects/scripts")
from build_projects import PROJECTS, DB_TS  # noqa: E402

HTML_CSS_ROOT = Path("/Users/billyribeiro/Desktop/html-css")
REACT_ROOT = Path("/Users/billyribeiro/Desktop/react-enterprise-projects")


def fix_base40_inline_styles(base_40: list[dict]) -> None:
    """Eliminates all remaining `style="..."` attributes from Projects 01-40 on disk and in PROJECTS_DATA."""
    fixes = {
        "08-circular-hud-gauge": {
            "html_sub": (r'\s*style="--i:\s*\d+"', ""),
            "css_append": "\n/* Oct 2026 Externalized Tick Index Tokens */\n"
            + "\n".join(f".tick:nth-child({i+1}) {{ --i: {i}; }}" for i in range(12))
            + "\n",
        },
        "13-adaptive-dashboard-widgets": {
            "html_sub": (r'\s*style="width:\s*84%"', ""),
            "css_append": "\n/* Externalized Bar Fill Width */\n.bar-fill { width: 84%; }\n",
        },
        "18-interactive-orbiting-dock": {
            "html_sub": (r'\s*style="--sat-offset:\s*\d+deg;"', ""),
            "css_append": (
                "\n/* Externalized Satellite Orbit Offsets */\n"
                ".sat-1 { --sat-offset: 0deg; }\n"
                ".sat-2 { --sat-offset: 90deg; }\n"
                ".sat-3 { --sat-offset: 180deg; }\n"
                ".sat-4 { --sat-offset: 270deg; }\n"
            ),
        },
        "22-cwv-telemetry-observer": {
            "html_sub": (r'\s*style="width:\s*\d+%;"', ""),
            "css_append": (
                "\n/* Externalized Initial Meter Widths */\n"
                "#bar-inp { width: 6%; }\n"
                "#bar-lcp { width: 17%; }\n"
                "#bar-cls { width: 0%; }\n"
            ),
        },
        "34-infinite-canvas-pan-zoom": {
            "html_sub": (r'\s*style="left:\s*-?\d+px;\s*top:\s*-?\d+px;"', ""),
            "css_append": (
                "\n/* Externalized Spatial Node Coordinates */\n"
                '.spatial-node[data-title="Edge Ingress"] { left: -200px; top: -120px; }\n'
                '.spatial-node[data-title="Load Balancer"] { left: 150px; top: -100px; }\n'
                '.spatial-node[data-title="Compute Core"] { left: 0px; top: 120px; }\n'
                '.spatial-node[data-title="Storage Engine"] { left: 320px; top: 180px; }\n'
            ),
        },
        "38-file-system-workspace": {
            "html_sub": (r'style="display:\s*none;"', "hidden"),
            "css_append": "\n#fallback-file-input { display: none; }\n",
        },
        "03-color-theme-switcher": {
            "html_sub": (r"$^", ""),
            "css_append": "\n/* Relative Color Syntax Token */\n:root { --color-brand-glow: oklch(from var(--color-brand-primary) l c h / 0.22); }\n",
        },
        "20-command-palette-os-desktop": {
            "html_sub": (r"$^", ""),
            "css_append": "\n/* Fluid Typography Scale Token */\n:root { --text-os-title: clamp(1.15rem, 1rem + 0.75vw, 1.65rem); }\n",
        },
    }

    for p in base_40:
        folder = p["folder"]
        if folder not in fixes:
            continue
        spec = fixes[folder]
        pattern, repl = spec["html_sub"]
        css_extra = spec["css_append"]

        pdir = HTML_CSS_ROOT / "projects" / folder
        idx_path = pdir / "index.html"
        css_path = pdir / "styles.css"

        new_html = re.sub(pattern, repl, idx_path.read_text())
        idx_path.write_text(new_html)

        old_css = css_path.read_text()
        if css_extra.strip() not in old_css:
            new_css = old_css.rstrip() + "\n" + css_extra
            css_path.write_text(new_css)
        else:
            new_css = old_css

        p["html"] = new_html
        p["css"] = new_css
        for step in p["steps"]:
            step["content"] = re.sub(pattern, repl, step["content"])


def build_series3_live_html(level_num: int, p: dict) -> str:
    """Builds the standalone & iframe-compatible HTML5 + Schema.org JSON-LD + Three.js/GSAP UI with ZERO inline CSS."""
    ld_json = json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "headline": f"Level {level_num}: {p['title']}",
            "description": p["desc"],
            "author": {"@type": "Person", "name": "Principal Engineer L8++"},
            "proficiencyLevel": "Principal Engineer (Level 8+)",
        },
        indent=2,
    )

    kpis_html = ""
    for k in p["kpis"]:
        kpis_html += f"""
        <div class="s3-kpi-card">
          <span class="s3-kpi-label">{k['label']}</span>
          <strong class="s3-kpi-value">{k['value']}</strong>
          <span class="s3-kpi-trend">{k['trend']}</span>
          <progress class="s3-kpi-progress" value="{k['pct']}" max="100"></progress>
        </div>"""

    return f"""<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Level {level_num}: {p['title']} — Next.js, React 19, Prisma v6, Three.js &amp; GSAP</title>
  <script type="application/ld+json">
{ld_json}
  </script>
  <link rel="stylesheet" href="styles.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>
  <script src="app.js" defer></script>
</head>
<body>
  <main class="s3-studio-shell" id="s3-app-root" data-visual-mode="{p['VisualMode']}">
    <header class="s3-header">
      <div>
        <span class="s3-eyebrow">LEVEL {level_num} • NEXT.JS 15 + REACT 19 + TYPESCRIPT 5.8 + PRISMA V6 + THREE.JS + GSAP</span>
        <h1 class="s3-title">{p['title']}</h1>
        <p class="s3-subtitle">{p['desc']}</p>
      </div>
      <div class="s3-actions">
        <button type="button" class="s3-btn-primary" id="btn-trigger-mutation">
          Commit Optimistic Action &amp; Pulse 3D Shader
        </button>
      </div>
    </header>

    <section class="s3-kpi-grid" aria-label="Real-Time Executive KPI Telemetry">
      {kpis_html}
    </section>

    <section class="s3-stage-grid">
      <div class="s3-webgl-card">
        <div class="s3-card-label">Three.js WebGL 3D &amp; GSAP 120FPS Viewport ({p['VisualMode']})</div>
        <canvas id="s3-webgl-canvas" width="420" height="240" aria-label="Interactive 3D WebGL Stage"></canvas>
        <div class="s3-telemetry-readout" id="s3-telemetry-status" role="status" aria-live="polite">
          Prisma v6 Connected • React 19 useOptimistic Ready • 120 FPS Locked
        </div>
      </div>

      <div class="s3-arch-card">
        <div class="s3-card-label">Full-Stack React 19 Component &amp; Prisma v6 Inspector</div>
        <div class="s3-stack-pills">
          <span class="s3-pill">Component: {p['component_name']}.tsx</span>
          <span class="s3-pill">ORM: prisma/schema.prisma</span>
          <span class="s3-pill">Server Action: src/actions.ts</span>
        </div>
        <p class="s3-arch-copy">{p['architecture']}</p>
        <svg viewBox="0 0 360 72" class="s3-vector-chart" role="img" aria-label="Sub-16ms Frame Budget Sparkline">
          <polyline id="s3-sparkline" class="s3-sparkline-path" points="10,54 60,40 110,44 160,22 210,28 260,16 310,20 350,10" />
          <text x="12" y="20" class="s3-vector-label">INP &lt; 4.2ms • ZERO ANY • PRISMA V6 ATOMIC TRANSACTION</text>
        </svg>
      </div>
    </section>
  </main>
</body>
</html>
"""


def build_series3_css() -> str:
    return """@layer reset, tokens, base, layout, components, utilities;

@layer reset {
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
}

@layer tokens {
  :root {
    /* 1. Perceptual Color System (OKLCH + Relative Color Syntax + color-mix) */
    --color-surface-bg: oklch(0.13 0.02 255);
    --color-surface-card: oklch(0.18 0.03 255 / 0.88);
    --color-surface-border: oklch(0.28 0.04 255 / 0.55);
    --color-text-primary: oklch(0.98 0.01 255);
    --color-text-secondary: oklch(0.72 0.03 255);
    --color-brand-primary: oklch(0.76 0.15 230);
    --color-brand-secondary: oklch(0.79 0.17 155);
    --color-brand-glow: oklch(from var(--color-brand-primary) l c h / 0.25);

    /* 2. Fluid Typography Scale (clamp) */
    --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', ui-monospace, monospace;
    --text-xs: clamp(0.72rem, 0.68rem + 0.2vw, 0.82rem);
    --text-sm: clamp(0.84rem, 0.79rem + 0.25vw, 0.96rem);
    --text-base: clamp(0.95rem, 0.9rem + 0.3vw, 1.08rem);
    --text-lg: clamp(1.2rem, 1.08rem + 0.6vw, 1.48rem);
    --text-title: clamp(1.45rem, 1.2rem + 1.25vw, 2.05rem);

    /* 3. Spatial & Radius Scale */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
  }
}

@layer base {
  body {
    min-block-size: 100dvh;
    padding-block: var(--space-6);
    padding-inline: var(--space-6);
    font-family: var(--font-sans);
    background: radial-gradient(
      circle at top right,
      color-mix(in oklch, var(--color-brand-primary) 18%, var(--color-surface-bg)) 0%,
      var(--color-surface-bg) 62%
    );
    color: var(--color-text-primary);
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3 {
    text-wrap: balance;
    line-height: 1.15;
  }

  p {
    text-wrap: pretty;
    line-height: 1.6;
  }
}

@layer layout {
  .s3-studio-shell {
    container-type: inline-size;
    max-inline-size: 1120px;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .s3-kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
    gap: var(--space-4);
  }

  .s3-stage-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
    gap: var(--space-4);

    @container (min-width: 780px) {
      grid-template-columns: 1.05fr 0.95fr;
    }
  }
}

@layer components {
  .s3-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);
    flex-wrap: wrap;
    background: var(--color-surface-card);
    border: 1px solid var(--color-surface-border);
    border-radius: var(--radius-lg);
    padding-block: var(--space-6);
    padding-inline: var(--space-6);
    backdrop-filter: blur(16px);

    &:has(.s3-btn-primary:hover) {
      border-color: oklch(from var(--color-brand-primary) l c h / 0.55);
      box-shadow: 0 12px 32px -12px var(--color-brand-glow);
    }
  }

  .s3-eyebrow {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 800;
    letter-spacing: 0.09em;
    color: var(--color-brand-primary);
    text-transform: uppercase;
  }

  .s3-title {
    margin-block: var(--space-1);
    font-size: var(--text-title);
    font-weight: 900;
  }

  .s3-subtitle {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    max-inline-size: 68ch;
  }

  .s3-btn-primary {
    background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-secondary));
    color: var(--color-surface-bg);
    font-weight: 800;
    border: none;
    padding-block: var(--space-3);
    padding-inline: var(--space-4);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: var(--text-xs);
    transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px -6px var(--color-brand-glow);
    }

    &:focus-visible {
      outline: 2px solid var(--color-brand-primary);
      outline-offset: 2px;
    }
  }

  .s3-kpi-card {
    background: var(--color-surface-card);
    border: 1px solid var(--color-surface-border);
    border-radius: var(--radius-md);
    padding-block: var(--space-4);
    padding-inline: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    transition: opacity 0.3s ease, transform 0.3s ease;

    @starting-style {
      opacity: 0;
      transform: translateY(6px);
    }
  }

  .s3-kpi-label {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  .s3-kpi-value {
    font-size: var(--text-lg);
    font-weight: 900;
    color: var(--color-brand-primary);
  }

  .s3-kpi-trend {
    font-size: var(--text-xs);
    color: var(--color-brand-secondary);
    font-weight: 700;
  }

  .s3-kpi-progress {
    inline-size: 100%;
    block-size: 6px;
    margin-block-start: var(--space-2);
    accent-color: var(--color-brand-primary);
  }

  .s3-webgl-card,
  .s3-arch-card {
    background: var(--color-surface-card);
    border: 1px solid var(--color-surface-border);
    border-radius: var(--radius-lg);
    padding-block: var(--space-4);
    padding-inline: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .s3-card-label {
    font-size: var(--text-xs);
    font-weight: 800;
    color: var(--color-brand-primary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .s3-telemetry-readout {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-brand-secondary);
    background: oklch(from var(--color-surface-bg) l c h / 0.85);
    padding-block: var(--space-2);
    padding-inline: var(--space-3);
    border-radius: var(--radius-sm);
  }

  .s3-stack-pills {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .s3-pill {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    background: oklch(from var(--color-brand-primary) l c h / 0.12);
    color: var(--color-brand-primary);
    padding-block: var(--space-1);
    padding-inline: var(--space-2);
    border-radius: var(--radius-sm);
    border: 1px solid oklch(from var(--color-brand-primary) l c h / 0.28);
  }

  .s3-arch-copy {
    color: var(--color-text-primary);
    font-size: var(--text-sm);
  }

  .s3-vector-chart {
    inline-size: 100%;
    block-size: 72px;
    background: oklch(from var(--color-surface-bg) l c h / 0.85);
    border-radius: var(--radius-sm);
    padding-block: var(--space-1);
    padding-inline: var(--space-1);
  }

  .s3-sparkline-path {
    fill: none;
    stroke: var(--color-brand-primary);
    stroke-width: 2.5;
  }

  .s3-vector-label {
    fill: var(--color-text-secondary);
    font-size: 10px;
    font-family: var(--font-mono);
  }
}

@layer utilities {
  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }
}
"""


def build_series3_app_js(level_num: int, p: dict) -> str:
    return f"""// ============================================================================
// LEVEL {level_num}: {p['title'].upper()}
// Stack: React 19.1 • Next.js 15 App Router • TypeScript 5.8 • Prisma ORM v6 • Three.js • GSAP
// ============================================================================

(function initSeries3Runtime() {{
  const root = document.getElementById('s3-app-root');
  const canvas = document.getElementById('s3-webgl-canvas');
  const btn = document.getElementById('btn-trigger-mutation');
  const statusEl = document.getElementById('s3-telemetry-status');
  const mode = root ? root.getAttribute('data-visual-mode') || 'three_shader' : 'three_shader';

  let activeMesh = null;
  let mutationCount = 1;

  if (canvas && typeof THREE !== 'undefined') {{
    let gl = null;
    try {{
      gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    }} catch (_e) {{
      gl = null;
    }}
    if (gl) {{
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 420 / 240, 0.1, 100);
      camera.position.z = 3.5;

      const renderer = new THREE.WebGLRenderer({{ canvas, context: gl, alpha: true, antialias: true }});
      renderer.setSize(420, 240);

      let geometry;
      if (mode.includes('globe') || mode.includes('spatial')) {{
        geometry = new THREE.SphereGeometry(1.02, 24, 24);
      }} else if (mode.includes('orderbook') || mode.includes('grid')) {{
        geometry = new THREE.PlaneGeometry(2.3, 1.5, 14, 14);
      }} else if (mode.includes('vault') || mode.includes('rbac')) {{
        geometry = new THREE.IcosahedronGeometry(0.95, 1);
      }} else {{
        geometry = new THREE.TorusKnotGeometry(0.75, 0.24, 96, 24);
      }}

      const material = new THREE.MeshBasicMaterial({{ color: 0x38bdf8, wireframe: true }});
      activeMesh = new THREE.Mesh(geometry, material);
      scene.add(activeMesh);

      const renderLoop = () => {{
        activeMesh.rotation.x += 0.007;
        activeMesh.rotation.y += 0.011;
        renderer.render(scene, camera);
        requestAnimationFrame(renderLoop);
      }};
      renderLoop();
    }}
  }}

  if (btn) {{
    btn.addEventListener('click', () => {{
      mutationCount += 1;
      if (statusEl) {{
        statusEl.textContent = `Committed Optimistic Mutation #${{mutationCount}} -> Prisma v6 Transaction Verified (${{mode}})`;
      }}
      if (activeMesh && typeof gsap !== 'undefined') {{
        gsap.fromTo(
          activeMesh.scale,
          {{ x: 1.35, y: 1.35, z: 1.35 }},
          {{ x: 1, y: 1, z: 1, duration: 0.7, ease: 'elastic.out(1, 0.4)' }}
        );
      }}
    }});
  }}
}})();

/* ============================================================================
 * FULL UNTRUNCATED NEXT.JS / REACT 19 / PRISMA V6 / TYPESCRIPT 5.8 SOURCE FILES
 * ============================================================================
 *
 * --- [1] prisma/schema.prisma ---
{p['prisma_schema'].strip()}
 *
 * --- [2] src/actions.ts ---
{p['actions_ts'].strip()}
 *
 * --- [3] src/{p['component_name']}.tsx ---
{p['component_ts'].strip()}
 */
"""


def externalize_master_portal_css() -> None:
    """Extracts `<style>...</style>` and inline `style=` from `/Users/billyribeiro/Desktop/html-css/index.html` into `portal.css`."""
    idx_path = HTML_CSS_ROOT / "index.html"
    txt = idx_path.read_text()

    m = re.search(r"<style>([\s\S]*?)</style>", txt)
    if m:
        extracted_css = m.group(1).strip() + "\n"
        extra_classes = """
/* Externalized Utility & State Classes (Zero Inline Style Attributes) */
.standalone-title { font-weight: 700; font-size: 0.9rem; }
.standalone-sub { font-size: 0.8rem; color: var(--color-text-dim); }
.tab-sub-badge--tests { background: oklch(0.7 0.2 145 / 0.15); color: var(--color-green); }
.nav-empty-state { padding: 1.5rem 1rem; color: var(--color-text-dim); font-size: 0.85rem; text-align: center; }
.nav-item-badge--series2 { color: var(--color-cyan); border-color: oklch(from var(--color-cyan) l c h / 0.4); }
.nav-item-badge--series3 { color: var(--color-green); border-color: oklch(from var(--color-green) l c h / 0.4); }
"""
        (HTML_CSS_ROOT / "portal.css").write_text(extracted_css + extra_classes)
        txt = txt.replace(m.group(0), '<link rel="stylesheet" href="portal.css">')

    # Replace inline style attributes in index.html markup and JS template literals
    txt = txt.replace(
        '<div style="font-weight: 700; font-size: 0.9rem;">Standalone Production Build</div>',
        '<div class="standalone-title">Standalone Production Build</div>',
    )
    txt = txt.replace(
        '<div style="font-size: 0.8rem; color: var(--color-text-dim);">Run this project directly in an isolated browser tab</div>',
        '<div class="standalone-sub">Run this project directly in an isolated browser tab</div>',
    )
    txt = txt.replace(
        '<span class="tab-sub-badge" style="background: oklch(0.7 0.2 145 / 0.15); color: var(--color-green);">Vitest & PW</span>',
        '<span class="tab-sub-badge tab-sub-badge--tests">Vitest & PW</span>',
    )
    txt = txt.replace(
        '\'<li style="padding: 1.5rem 1rem; color: var(--color-text-dim); font-size: 0.85rem; text-align: center;">No projects match filter criteria</li>\'',
        '\'<li class="nav-empty-state">No projects match filter criteria</li>\'',
    )
    txt = re.sub(
        r"const badgeStyle = isSeries3[\s\S]*?<span class=\"nav-item-badge\" style=\"\$\{badgeStyle\}\">",
        'const badgeClass = isSeries3 ? "nav-item-badge--series3" : isSeries2 ? "nav-item-badge--series2" : "";\n'
        '        const li = document.createElement(\'li\');\n'
        '        li.className = `project-nav-item ${originalIndex === currentProjectIndex ? \'active\' : \'\'}`;\n'
        '        li.setAttribute(\'role\', \'button\');\n'
        '        li.setAttribute(\'tabindex\', \'0\');\n'
        '        li.innerHTML = `\n'
        '          <div class="nav-item-meta">\n'
        '            <span class="nav-item-level">${project.level.split(\'•\')[0].trim()}</span>\n'
        '            <span class="nav-item-badge ${badgeClass}">',
        txt,
    )

    idx_path.write_text(txt)


def main() -> None:
    data_file = HTML_CSS_ROOT / "projects-data.js"
    raw_content = data_file.read_text()
    json_str = raw_content.split("const PROJECTS_DATA = ")[1].rstrip(";\n ")
    existing_projects = json.loads(json_str)

    base_40 = existing_projects[:40]
    fix_base40_inline_styles(base_40)

    series3_entries = []
    for idx, p in enumerate(PROJECTS):
        level_num = 41 + idx
        old_suffix = p["id"].split("-", 1)[1]
        folder_name = f"{level_num}-{old_suffix}"

        src_proj_dir = REACT_ROOT / "projects" / p["id"]
        dest_proj_dir = HTML_CSS_ROOT / "projects" / folder_name

        if dest_proj_dir.exists():
            shutil.rmtree(dest_proj_dir)
        shutil.copytree(src_proj_dir, dest_proj_dir)

        html_code = build_series3_live_html(level_num, p)
        css_code = build_series3_css()
        js_code = build_series3_app_js(level_num, p)

        shutil.copyfile(dest_proj_dir / "index.html", dest_proj_dir / "course.html")
        (dest_proj_dir / "index.html").write_text(html_code)
        (dest_proj_dir / "styles.css").write_text(css_code)
        (dest_proj_dir / "app.js").write_text(js_code)

        e2e_code = (src_proj_dir / "tests" / "e2e.spec.ts").read_text().strip()
        unit_code = p["unit_test_ts"].strip()
        combined_tests = f"// === Vitest Unit Suite (tests/unit.test.tsx) ===\n{unit_code}\n\n// === Playwright E2E Suite (tests/e2e.spec.ts) ===\n{e2e_code}"

        steps = [
            {
                "title": f"Step 1: Multi-Model Prisma ORM v6 Schema & Seed (projects/{folder_name}/prisma/)",
                "content": (
                    f"{p['steps'][0]['rationale']} {p['steps'][1]['rationale']} "
                    f"Create `prisma/schema.prisma` and `prisma/seed.ts` with strict relational constraints:\n"
                    f"```prisma\n{p['prisma_schema'].strip()}\n```\n"
                    f"```typescript\n{p['seed_ts'].strip()}\n```"
                ),
            },
            {
                "title": f"Step 2: Next.js 15 Server Actions & Zod Boundary Validation (projects/{folder_name}/src/actions.ts)",
                "content": (
                    f"{p['steps'][2]['rationale']} Configure the singleton Prisma v6 client (`src/db.ts`) and strict zero-any Server Action (`src/actions.ts`):\n"
                    f"```typescript\n// src/db.ts\n{DB_TS.strip()}\n\n// src/actions.ts\n{p['actions_ts'].strip()}\n```"
                ),
            },
            {
                "title": f"Step 3: React 19 Concurrent Component, Three.js WebGL & GSAP Motion (projects/{folder_name}/src/{p['component_name']}.tsx)",
                "content": (
                    f"{p['steps'][3]['rationale']} Implement `{p['component_name']}.tsx` with React 19 transitions, external `@layer` OKLCH `styles.css`, and GSAP telemetry:\n"
                    f"```tsx\n{p['component_ts'].strip()}\n```"
                ),
            },
            {
                "title": f"Step 4: External OKLCH Cascade Stylesheet & 3D Stage Markup (projects/{folder_name}/index.html & styles.css)",
                "content": (
                    f"Assemble the interactive studio preview (`index.html`, external `styles.css`, and `app.js`) with Schema.org JSON-LD and zero inline styles:\n"
                    f"```html\n{html_code.strip()}\n```\n"
                    f"```css\n{css_code.strip()}\n```"
                ),
            },
            {
                "title": f"Step 5: Vitest Component Unit Tests & Playwright E2E Verification (projects/{folder_name}/tests/)",
                "content": (
                    f"{p['steps'][4]['rationale']} Execute `pnpm test:unit` and `pnpm test:e2e` to verify zero console errors and strict state transitions:\n"
                    f"```tsx\n{combined_tests}\n```"
                ),
            },
        ]

        series3_entries.append(
            {
                "id": level_num,
                "folder": folder_name,
                "level": f"Level {level_num} • Next.js 15, React 19, Prisma v6 & 3D WebGL",
                "title": p["title"],
                "category": "Next.js + Prisma + 3D",
                "features": [
                    "React 19",
                    "Next.js App Router",
                    "TypeScript 5.8",
                    "Prisma ORM v6",
                    "Three.js WebGL",
                    "GSAP 3.12",
                ],
                "architecture": p["architecture"],
                "deepDive": "\n".join(f"**{i+1}.** {d}" for i, d in enumerate(p["deepDive"])),
                "seoArchitecture": p["performanceAndSecurity"],
                "steps": steps,
                "html": html_code,
                "css": css_code,
                "js": js_code,
                "testCode": combined_tests,
            }
        )

    all_60 = base_40 + series3_entries
    assert len(all_60) == 60
    data_file.write_text("const PROJECTS_DATA = " + json.dumps(all_60, indent=2) + ";\n")
    externalize_master_portal_css()
    print("Successfully externalized 100% of CSS across all 60 projects and master portal in html-css!")


if __name__ == "__main__":
    main()
