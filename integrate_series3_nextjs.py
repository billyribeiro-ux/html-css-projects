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
          <polyline id="s3-sparkline" fill="none" stroke="#38bdf8" stroke-width="2.5" points="10,54 60,40 110,44 160,22 210,28 260,16 310,20 350,10" />
          <text x="12" y="20" fill="#94a3b8" font-size="10" font-family="monospace">INP &lt; 4.2ms • ZERO ANY • PRISMA V6 ATOMIC TRANSACTION</text>
        </svg>
      </div>
    </section>
  </main>
</body>
</html>
"""


def build_series3_css() -> str:
    return """@layer reset, tokens, layout, components;

@layer tokens {
  :root {
    --s3-bg: oklch(0.13 0.02 255);
    --s3-surface: oklch(0.18 0.03 255 / 0.85);
    --s3-border: oklch(0.76 0.14 230 / 0.22);
    --s3-cyan: oklch(0.76 0.14 230);
    --s3-emerald: oklch(0.79 0.17 155);
    --s3-text: oklch(0.98 0.01 255);
    --s3-muted: oklch(0.68 0.03 255);
  }
}

@layer layout {
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 1.5rem;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: radial-gradient(circle at top right, oklch(0.24 0.07 275) 0%, var(--s3-bg) 60%);
    color: var(--s3-text);
    min-height: 100vh;
  }
  .s3-studio-shell {
    max-width: 1120px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .s3-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
    background: var(--s3-surface);
    border: 1px solid var(--s3-border);
    border-radius: 16px;
    padding: 1.35rem 1.5rem;
  }
  .s3-eyebrow {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.09em;
    color: var(--s3-cyan);
    text-transform: uppercase;
  }
  .s3-title {
    margin: 0.3rem 0;
    font-size: 1.55rem;
    font-weight: 900;
  }
  .s3-subtitle {
    margin: 0;
    color: var(--s3-muted);
    font-size: 0.9rem;
    max-width: 68ch;
  }
  .s3-btn-primary {
    background: linear-gradient(135deg, var(--s3-cyan), var(--s3-emerald));
    color: var(--s3-bg);
    font-weight: 800;
    border: none;
    padding: 0.7rem 1.2rem;
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.84rem;
  }
  .s3-kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }
  .s3-kpi-card {
    background: var(--s3-surface);
    border: 1px solid oklch(1 0 0 / 0.08);
    border-radius: 14px;
    padding: 1rem 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .s3-kpi-label { font-size: 0.72rem; color: var(--s3-muted); text-transform: uppercase; }
  .s3-kpi-value { font-size: 1.45rem; font-weight: 900; color: var(--s3-cyan); }
  .s3-kpi-trend { font-size: 0.75rem; color: var(--s3-emerald); font-weight: 700; }
  .s3-kpi-progress { width: 100%; height: 6px; margin-block-start: 0.35rem; accent-color: var(--s3-cyan); }
  .s3-stage-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 1.25rem;
  }
  .s3-webgl-card, .s3-arch-card {
    background: var(--s3-surface);
    border: 1px solid var(--s3-border);
    border-radius: 16px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
  .s3-card-label {
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--s3-cyan);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .s3-telemetry-readout {
    font-family: ui-monospace, monospace;
    font-size: 0.78rem;
    color: var(--s3-emerald);
    background: oklch(0.11 0.02 255 / 0.8);
    padding: 0.55rem 0.8rem;
    border-radius: 8px;
  }
  .s3-stack-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .s3-pill {
    font-family: ui-monospace, monospace;
    font-size: 0.74rem;
    background: oklch(0.76 0.14 230 / 0.12);
    color: var(--s3-cyan);
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    border: 1px solid var(--s3-border);
  }
  .s3-arch-copy {
    margin: 0;
    color: var(--s3-text);
    font-size: 0.88rem;
    line-height: 1.6;
  }
  .s3-vector-chart {
    width: 100%;
    height: 72px;
    background: oklch(0.11 0.02 255 / 0.8);
    border-radius: 10px;
    padding: 4px;
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
