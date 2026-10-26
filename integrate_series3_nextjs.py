#!/usr/bin/env python3
"""
Integrates Series 3 (Levels 41–60: Next.js, React 19, TypeScript 5.8, Node 24 LTS, Prisma v6, Three.js & GSAP)
into `/Users/billyribeiro/Desktop/html-css` alongside Series 1 (01–20 HTML/CSS) and Series 2 (21–40 HTML/CSS/JS).
Preserves Projects 01–40 100% untouched and appends Projects 41–60 with full L8+ source files,
Three.js + GSAP Live Preview, Schema.org JSON-LD, and 100% untruncated 5-step blueprints.
"""

import json
import shutil
import sys
from pathlib import Path

sys.path.insert(0, "/Users/billyribeiro/Desktop/react-enterprise-projects/scripts")
from build_projects import PROJECTS, DB_TS, STYLES_CSS  # noqa: E402

HTML_CSS_ROOT = Path("/Users/billyribeiro/Desktop/html-css")
REACT_ROOT = Path("/Users/billyribeiro/Desktop/react-enterprise-projects")


def build_series3_live_html(level_num: int, p: dict) -> str:
    """Builds the standalone & iframe-compatible HTML5 + Schema.org JSON-LD + Three.js/GSAP UI for Levels 41-60."""
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
          <div class="s3-kpi-bar"><div class="s3-kpi-fill" style="width:{k['pct']}%"></div></div>
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
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <link rel="stylesheet" href="styles.css">
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
  <script src="app.js"></script>
</body>
</html>
"""


def build_series3_css() -> str:
    return """@layer reset, tokens, layout, components;

@layer tokens {
  :root {
    --s3-bg: #060913;
    --s3-surface: rgba(15, 23, 42, 0.82);
    --s3-border: rgba(56, 189, 248, 0.22);
    --s3-cyan: #38bdf8;
    --s3-emerald: #4ade80;
    --s3-text: #f8fafc;
    --s3-muted: #94a3b8;
  }
}

@layer layout {
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 1.5rem;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: radial-gradient(circle at top right, #1e1b4b 0%, var(--s3-bg) 60%);
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
    color: #060913;
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
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 1rem 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .s3-kpi-label { font-size: 0.72rem; color: var(--s3-muted); text-transform: uppercase; }
  .s3-kpi-value { font-size: 1.45rem; font-weight: 900; color: var(--s3-cyan); }
  .s3-kpi-trend { font-size: 0.75rem; color: var(--s3-emerald); font-weight: 700; }
  .s3-kpi-bar { height: 5px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; margin-top: 0.35rem; overflow: hidden; }
  .s3-kpi-fill { height: 100%; background: linear-gradient(90deg, var(--s3-cyan), var(--s3-emerald)); }
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
    font-family: monospace;
    font-size: 0.78rem;
    color: var(--s3-emerald);
    background: rgba(6, 9, 19, 0.75);
    padding: 0.55rem 0.8rem;
    border-radius: 8px;
  }
  .s3-stack-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .s3-pill {
    font-family: monospace;
    font-size: 0.74rem;
    background: rgba(56, 189, 248, 0.12);
    color: var(--s3-cyan);
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    border: 1px solid var(--s3-border);
  }
  .s3-arch-copy {
    margin: 0;
    color: #e2e8f0;
    font-size: 0.88rem;
    line-height: 1.6;
  }
  .s3-vector-chart {
    width: 100%;
    height: 72px;
    background: rgba(6, 9, 19, 0.75);
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


def main() -> None:
    data_file = HTML_CSS_ROOT / "projects-data.js"
    raw_content = data_file.read_text()
    json_str = raw_content.split("const PROJECTS_DATA = ")[1].rstrip(";\n ")
    existing_projects = json.loads(json_str)

    # Keep the first 40 projects (01-20 HTML/CSS and 21-40 HTML/CSS/JS) 100% intact
    base_40 = existing_projects[:40]
    assert len(base_40) == 40, f"Expected 40 base projects, got {len(base_40)}"

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

        # Save standalone course html as course.html and write unified index.html, styles.css, app.js
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
                    f"{p['steps'][3]['rationale']} Implement `{p['component_name']}.tsx` with React 19 transitions, headless-safe WebGL lifecycle, and GSAP telemetry:\n"
                    f"```tsx\n{p['component_ts'].strip()}\n```"
                ),
            },
            {
                "title": f"Step 4: Interactive 3D Simulation Stage & OKLCH Cascade Stylesheet (projects/{folder_name}/index.html & styles.css)",
                "content": (
                    f"Assemble the interactive studio preview (`index.html`, `styles.css`, and `app.js`) with Schema.org JSON-LD and Three.js/GSAP telemetry:\n"
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
    assert len(all_60) == 60, f"Expected 60 total projects, got {len(all_60)}"
    data_file.write_text("const PROJECTS_DATA = " + json.dumps(all_60, indent=2) + ";\n")
    print("Successfully generated all 60 projects (01-20 HTML/CSS, 21-40 HTML/CSS/JS, 41-60 Next.js/React/Prisma/3D) in html-css!")


if __name__ == "__main__":
    main()
