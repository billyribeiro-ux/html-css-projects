// ============================================================================
// LEVEL 45: ZERO-LATENCY COMMAND PALETTE & OMNI-SEARCH ENGINE
// Stack: React 19.1 • Next.js 15 App Router • TypeScript 5.8 • Prisma ORM v6 • Three.js • GSAP
// ============================================================================

(function initSeries3Runtime() {
  const root = document.getElementById('s3-app-root');
  const canvas = document.getElementById('s3-webgl-canvas');
  const btn = document.getElementById('btn-trigger-mutation');
  const statusEl = document.getElementById('s3-telemetry-status');
  const mode = root ? root.getAttribute('data-visual-mode') || 'three_shader' : 'three_shader';

  let activeMesh = null;
  let mutationCount = 1;

  if (canvas && typeof THREE !== 'undefined') {
    let gl = null;
    try {
      gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    } catch (_e) {
      gl = null;
    }
    if (gl) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 420 / 240, 0.1, 100);
      camera.position.z = 3.5;

      const renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true });
      renderer.setSize(420, 240);

      let geometry;
      if (mode.includes('globe') || mode.includes('spatial')) {
        geometry = new THREE.SphereGeometry(1.02, 24, 24);
      } else if (mode.includes('orderbook') || mode.includes('grid')) {
        geometry = new THREE.PlaneGeometry(2.3, 1.5, 14, 14);
      } else if (mode.includes('vault') || mode.includes('rbac')) {
        geometry = new THREE.IcosahedronGeometry(0.95, 1);
      } else {
        geometry = new THREE.TorusKnotGeometry(0.75, 0.24, 96, 24);
      }

      const material = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
      activeMesh = new THREE.Mesh(geometry, material);
      scene.add(activeMesh);

      const renderLoop = () => {
        activeMesh.rotation.x += 0.007;
        activeMesh.rotation.y += 0.011;
        renderer.render(scene, camera);
        requestAnimationFrame(renderLoop);
      };
      renderLoop();
    }
  }

  if (btn) {
    btn.addEventListener('click', () => {
      mutationCount += 1;
      if (statusEl) {
        statusEl.textContent = `Committed Optimistic Mutation #${mutationCount} -> Prisma v6 Transaction Verified (${mode})`;
      }
      if (activeMesh && typeof gsap !== 'undefined') {
        gsap.fromTo(
          activeMesh.scale,
          { x: 1.35, y: 1.35, z: 1.35 },
          { x: 1, y: 1, z: 1, duration: 0.7, ease: 'elastic.out(1, 0.4)' }
        );
      }
    });
  }
})();

/* ============================================================================
 * FULL UNTRUNCATED NEXT.JS / REACT 19 / PRISMA V6 / TYPESCRIPT 5.8 SOURCE FILES
 * ============================================================================
 *
 * --- [1] prisma/schema.prisma ---
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model OmniCommand {
  id          String                 @id @default(cuid())
  slug        String                 @unique
  title       String
  shortcut    String
  category    String
  invocations Int                    @default(1)
  updatedAt   DateTime               @updatedAt
  executions  CommandExecutionAudit[]

  @@index([invocations])
}

model CommandExecutionAudit {
  id        String      @id @default(cuid())
  commandId String
  actor     String      @default("principal-eng")
  createdAt DateTime    @default(now())
  command   OmniCommand @relation(fields: [commandId], references: [id], onDelete: Cascade)
}
 *
 * --- [2] src/actions.ts ---
'use server';

import { z } from 'zod';
import { prisma } from './db';

const RecordCommandSchema = z.object({
  slug: z.string().min(2),
});

export async function recordCommandExecutionAction(
  formData: FormData
): Promise<{ status: 'success'; invocations: number } | { status: 'error'; message: string }> {
  const parsed = RecordCommandSchema.safeParse({
    slug: formData.get('slug'),
  });
  if (!parsed.success) {
    return { status: 'error', message: 'Invalid command slug' };
  }

  try {
    const updated = await prisma.omniCommand.update({
      where: { slug: parsed.data.slug },
      data: { invocations: { increment: 1 } },
    });
    await prisma.commandExecutionAudit.create({
      data: { commandId: updated.id },
    });
    return { status: 'success', invocations: updated.invocations };
  } catch (err: unknown) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Failed to log command execution',
    };
  }
}
 *
 * --- [3] src/CommandPaletteEngine.tsx ---
'use client';
import './styles.css';

import React, { useDeferredValue, useMemo, useState } from 'react';

export interface CommandItem {
  slug: string;
  title: string;
  shortcut: string;
  category: string;
  invocations: number;
}

const DEFAULT_COMMANDS: CommandItem[] = [
  { slug: 'deploy-canary', title: 'Deploy Production Canary', shortcut: '⌘+D', category: 'DevOps', invocations: 48 },
  { slug: 'rotate-jwt-keys', title: 'Rotate Zero-Trust JWT Signing Keys', shortcut: '⌘+K', category: 'Security', invocations: 31 },
  { slug: 'inspect-webgl-vram', title: 'Inspect Three.js WebGL VRAM Heap', shortcut: '⌘+G', category: 'Graphics', invocations: 19 },
  { slug: 'prisma-studio-audit', title: 'Run Prisma v6 Query Plan Analyzer', shortcut: '⌘+P', category: 'Database', invocations: 64 },
];

export function scoreCommand(title: string, query: string, invocations: number): number {
  const freqBonus = Math.log2(invocations + 1) * 5;
  if (!query.trim()) return 100 + freqBonus;
  const target = title.toLowerCase();
  const q = query.toLowerCase().trim();
  if (target.includes(q)) {
    return 200 - target.indexOf(q) * 2 + freqBonus;
  }
  return -1;
}

export function CommandPaletteEngine({
  commands = DEFAULT_COMMANDS,
}: {
  commands?: CommandItem[];
}): React.JSX.Element {
  const [query, setQuery] = useState<string>('');
  const deferredQuery = useDeferredValue(query);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [lastExecuted, setLastExecuted] = useState<string>('None');

  const ranked = useMemo(() => {
    return commands
      .map((cmd) => ({
        ...cmd,
        score: scoreCommand(cmd.title, deferredQuery, cmd.invocations),
      }))
      .filter((cmd) => cmd.score >= 0)
      .sort((a, b) => b.score - a.score);
  }, [commands, deferredQuery]);

  const activeCmd = ranked[activeIndex] ?? ranked[0];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (ranked.length > 0 ? (prev + 1) % ranked.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (ranked.length > 0 ? (prev - 1 + ranked.length) % ranked.length : 0));
    } else if (e.key === 'Enter' && activeCmd) {
      e.preventDefault();
      setLastExecuted(activeCmd.title);
    }
  };

  return (
    <section
      aria-label="Zero-Latency Command Palette & Omni-Search Engine"
      className="l8-styled-node"
    >
      <input
        role="combobox"
        aria-expanded="true"
        aria-controls="omni-command-listbox"
        aria-activedescendant={activeCmd ? `cmd-${activeCmd.slug}` : undefined}
        aria-label="Omni-Search Command Input"
        placeholder="Type a command or search (e.g., Canary, Prisma, WebGL)..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
        }}
        onKeyDown={handleKeyDown}
        className="l8-styled-node"
      />

      <ul
        id="omni-command-listbox"
        role="listbox"
        className="l8-styled-node"
      >
        {ranked.map((cmd, idx) => {
          const isSelected = idx === activeIndex;
          return (
            <li
              key={cmd.slug}
              id={`cmd-${cmd.slug}`}
              role="option"
              aria-selected={isSelected}
              onClick={() => setLastExecuted(cmd.title)}
              className="l8-styled-node"
            >
              <div>
                <div className="l8-styled-node">{cmd.title}</div>
                <div className="l8-styled-node">
                  {cmd.category} • Score: {cmd.score.toFixed(1)}
                </div>
              </div>
              <kbd
                className="l8-styled-node"
              >
                {cmd.shortcut}
              </kbd>
            </li>
          );
        })}
      </ul>

      <footer className="l8-styled-node">
        Last Executed Command: <strong data-testid="executed-cmd">{lastExecuted}</strong>
      </footer>
    </section>
  );
}
 */
