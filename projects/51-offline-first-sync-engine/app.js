// ============================================================================
// LEVEL 51: OFFLINE-FIRST LOCAL-FIRST SYNC & OUTBOX ENGINE
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

model SyncDocument {
  id           String            @id @default(cuid())
  docKey       String            @unique
  title        String
  body         String
  globalClock  Int               @default(1)
  updatedAt    DateTime          @updatedAt
  vectorClocks SyncVectorClock[]
}

model SyncVectorClock {
  id         String       @id @default(cuid())
  documentId String
  replicaId  String
  counter    Int          @default(1)
  updatedAt  DateTime     @updatedAt
  document   SyncDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@unique([documentId, replicaId])
}
 *
 * --- [2] src/actions.ts ---
'use server';

import { z } from 'zod';
import { prisma } from './db';

const DrainOutboxSchema = z.object({
  docKey: z.string().min(2),
  replicaId: z.string().min(2),
  body: z.string().min(1),
  deltaCount: z.coerce.number().int().min(1),
});

export async function drainOfflineOutboxAction(
  formData: FormData
): Promise<{ status: 'synced'; globalClock: number } | { status: 'error'; message: string }> {
  const parsed = DrainOutboxSchema.safeParse({
    docKey: formData.get('docKey'),
    replicaId: formData.get('replicaId'),
    body: formData.get('body'),
    deltaCount: formData.get('deltaCount'),
  });

  if (!parsed.success) {
    return { status: 'error', message: 'Invalid outbox sync payload' };
  }

  try {
    const doc = await prisma.syncDocument.upsert({
      where: { docKey: parsed.data.docKey },
      update: {
        body: parsed.data.body,
        globalClock: { increment: parsed.data.deltaCount },
      },
      create: {
        docKey: parsed.data.docKey,
        title: 'Synced Document',
        body: parsed.data.body,
        globalClock: parsed.data.deltaCount,
      },
    });

    await prisma.syncVectorClock.upsert({
      where: {
        documentId_replicaId: {
          documentId: doc.id,
          replicaId: parsed.data.replicaId,
        },
      },
      update: { counter: { increment: parsed.data.deltaCount } },
      create: {
        documentId: doc.id,
        replicaId: parsed.data.replicaId,
        counter: parsed.data.deltaCount,
      },
    });

    return { status: 'synced', globalClock: doc.globalClock };
  } catch (err: unknown) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Outbox drain failed',
    };
  }
}
 *
 * --- [3] src/OfflineSyncEngine.tsx ---
'use client';
import './styles.css';

import React, { useState } from 'react';

export interface OutboxMutation {
  id: string;
  patch: string;
}

export function OfflineSyncEngine(): React.JSX.Element {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [vectorClock, setVectorClock] = useState<number>(1);
  const [outbox, setOutbox] = useState<OutboxMutation[]>([
    { id: 'mut-1', patch: 'Append CRDT section 2.1' },
  ]);

  const queueMutation = (): void => {
    const nextId = `mut-${outbox.length + 1}`;
    if (isOnline) {
      setVectorClock((c) => c + 1);
    } else {
      setOutbox((prev) => [...prev, { id: nextId, patch: `Offline delta #${prev.length + 1}` }]);
    }
  };

  const toggleNetworkAndFlush = (): void => {
    const nextOnline = !isOnline;
    setIsOnline(nextOnline);
    if (nextOnline && outbox.length > 0) {
      setVectorClock((c) => c + outbox.length);
      setOutbox([]);
    }
  };

  return (
    <section
      aria-label="Offline-First Local-First Sync & Outbox Engine"
      className="l8-styled-node"
    >
      <header className="l8-styled-node">
        <div>
          <span className="l8-styled-node">
            LOCAL-FIRST OUTBOX • MONOTONIC VECTOR CLOCK
          </span>
          <h2 className="l8-styled-node">
            Vector Clock: <code data-testid="vector-clock" className="l8-styled-node">v{vectorClock}</code> • Outbox:{' '}
            <span data-testid="outbox-count">{outbox.length}</span> queued
          </h2>
        </div>

        <button
          type="button"
          aria-pressed={isOnline}
          onClick={toggleNetworkAndFlush}
          className="l8-styled-node"
        >
          {isOnline ? 'Status: ONLINE (Synced)' : 'Status: OFFLINE (Click to Reconnect & Drain)'}
        </button>
      </header>

      <button
        type="button"
        onClick={queueMutation}
        className="l8-styled-node"
      >
        Commit Local Document Edit
      </button>
    </section>
  );
}
 */
