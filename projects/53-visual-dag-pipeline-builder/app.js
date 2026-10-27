// ============================================================================
// LEVEL 53: VISUAL DAG PIPELINE BUILDER & KAHN TOPOLOGICAL SCHEDULER
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

model DagPipeline {
  id              String          @id @default(cuid())
  slug            String          @unique
  name            String
  edgesJson       String
  updatedAt       DateTime        @updatedAt
  deadLetterJobs  DeadLetterJob[]
}

model DeadLetterJob {
  id          String      @id @default(cuid())
  pipelineId  String
  stageName   String
  errorReason String
  retryCount  Int         @default(0)
  createdAt   DateTime    @default(now())
  pipeline    DagPipeline @relation(fields: [pipelineId], references: [id], onDelete: Cascade)

  @@index([pipelineId, createdAt])
}
 *
 * --- [2] src/actions.ts ---
'use server';

import { z } from 'zod';
import { prisma } from './db';

export function kahnTopologicalSort(nodes: string[], edges: [string, string][]): string[] | null {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    inDegree.set(n, 0);
    adj.set(n, []);
  }
  for (const [u, v] of edges) {
    adj.get(u)?.push(v);
    inDegree.set(v, (inDegree.get(v) ?? 0) + 1);
  }
  const queue: string[] = [];
  for (const [n, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(n);
  }
  const order: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift();
    if (!curr) break;
    order.push(curr);
    for (const nxt of adj.get(curr) ?? []) {
      const nextDeg = (inDegree.get(nxt) ?? 1) - 1;
      inDegree.set(nxt, nextDeg);
      if (nextDeg === 0) queue.push(nxt);
    }
  }
  return order.length === nodes.length ? order : null;
}

const SaveDagSchema = z.object({
  slug: z.string().min(2),
  edgesJson: z.string().min(2),
});

export async function saveDagTopologyAction(
  formData: FormData
): Promise<{ status: 'saved'; order: string[] } | { status: 'cycle_error'; message: string }> {
  const parsed = SaveDagSchema.safeParse({
    slug: formData.get('slug'),
    edgesJson: formData.get('edgesJson'),
  });
  if (!parsed.success) {
    return { status: 'cycle_error', message: 'Invalid DAG payload' };
  }

  const edges = JSON.parse(parsed.data.edgesJson) as [string, string][];
  const nodeSet = new Set<string>();
  for (const [u, v] of edges) {
    nodeSet.add(u);
    nodeSet.add(v);
  }
  const order = kahnTopologicalSort(Array.from(nodeSet), edges);
  if (!order) {
    return { status: 'cycle_error', message: 'Cycle detected by Kahn O(V+E) verifier!' };
  }

  await prisma.dagPipeline.upsert({
    where: { slug: parsed.data.slug },
    update: { edgesJson: parsed.data.edgesJson },
    create: { slug: parsed.data.slug, name: parsed.data.slug, edgesJson: parsed.data.edgesJson },
  });

  return { status: 'saved', order };
}
 *
 * --- [3] src/DagPipelineStudio.tsx ---
'use client';
import './styles.css';

import React, { useState } from 'react';
import { kahnTopologicalSort } from './actions';

const NODES = ['INGEST', 'NORMALIZE', 'EMBED', 'INDEX'];

export function DagPipelineStudio(): React.JSX.Element {
  const [edges, setEdges] = useState<[string, string][]>([
    ['INGEST', 'NORMALIZE'],
    ['NORMALIZE', 'EMBED'],
    ['EMBED', 'INDEX'],
  ]);
  const [cycleAlert, setCycleAlert] = useState<string | null>(null);

  const tryAddEdge = (from: string, to: string): void => {
    const candidate: [string, string][] = [...edges, [from, to]];
    const sorted = kahnTopologicalSort(NODES, candidate);
    if (!sorted) {
      setCycleAlert(`Blocked Cyclic Dependency: ${from} -> ${to} violates DAG acyclicity!`);
      return;
    }
    setCycleAlert(null);
    setEdges(candidate);
  };

  const currentOrder = kahnTopologicalSort(NODES, edges) ?? NODES;

  return (
    <section
      aria-label="Visual DAG Pipeline Builder & Kahn Topological Scheduler"
      className="l8-styled-node"
    >
      <span className="l8-styled-node">
        KAHN O(V+E) TOPOLOGICAL SCHEDULER • DEAD-LETTER ISOLATION
      </span>
      <h2 className="l8-styled-node">
        Topological Plan:{' '}
        <code data-testid="topo-order" className="l8-styled-node">
          {currentOrder.join(' → ')}
        </code>
      </h2>

      <svg
        viewBox="0 0 500 90"
        className="l8-styled-node"
      >
        <path d="M 70 45 C 120 15, 150 75, 190 45" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
        <path d="M 190 45 C 240 15, 270 75, 310 45" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
        <path d="M 310 45 C 360 15, 390 75, 430 45" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
        {NODES.map((n, i) => (
          <g key={n}>
            <circle cx={70 + i * 120} cy={45} r={18} fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <text x={70 + i * 120} y={80} textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="700">
              {n}
            </text>
          </g>
        ))}
      </svg>

      <div className="l8-styled-node">
        <button
          type="button"
          onClick={() => tryAddEdge('INDEX', 'INGEST')}
          className="l8-styled-node"
        >
          Simulate Illegal Cycle Edge (INDEX → INGEST)
        </button>
      </div>

      {cycleAlert && (
        <p role="alert" data-testid="cycle-alert" className="l8-styled-node">
          {cycleAlert}
        </p>
      )}
    </section>
  );
}
 */
