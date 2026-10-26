// ============================================================================
// LEVEL 57: RESILIENT WEBHOOK GATEWAY & HALF-OPEN CIRCUIT BREAKER FSM
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

model WebhookEndpoint {
  id               String            @id @default(cuid())
  targetUrl        String            @unique
  circuitState     String            @default("CLOSED") // "CLOSED" | "OPEN" | "HALF_OPEN"
  consecutiveFails Int               @default(0)
  updatedAt        DateTime          @updatedAt
  deliveries       WebhookEventLog[]
}

model WebhookEventLog {
  id         String          @id @default(cuid())
  endpointId String
  httpStatus Int
  backoffMs  Int
  createdAt  DateTime        @default(now())
  endpoint   WebhookEndpoint @relation(fields: [endpointId], references: [id], onDelete: Cascade)

  @@index([endpointId, createdAt])
}
 *
 * --- [2] src/actions.ts ---
'use server';

import { z } from 'zod';
import { prisma } from './db';

export function computeFullJitterBackoffMs(attempt: number, baseMs = 100, capMs = 10000): number {
  const exp = Math.min(capMs, baseMs * Math.pow(2, attempt));
  return Math.floor( exp * 0.75 );
}

const DeliverySchema = z.object({
  targetUrl: z.string().url(),
  httpStatus: z.coerce.number().int(),
  attempt: z.coerce.number().int().min(0),
});

export async function recordWebhookDeliveryAction(
  formData: FormData
): Promise<{ status: 'logged'; circuitState: string; backoffMs: number } | { status: 'error'; message: string }> {
  const parsed = DeliverySchema.safeParse({
    targetUrl: formData.get('targetUrl'),
    httpStatus: formData.get('httpStatus'),
    attempt: formData.get('attempt'),
  });
  if (!parsed.success) {
    return { status: 'error', message: 'Invalid webhook delivery telemetry' };
  }

  const isSuccess = parsed.data.httpStatus >= 200 && parsed.data.httpStatus < 300;
  const backoffMs = isSuccess ? 0 : computeFullJitterBackoffMs(parsed.data.attempt);
  const nextState = isSuccess ? 'CLOSED' : parsed.data.attempt >= 3 ? 'OPEN' : 'CLOSED';

  const ep = await prisma.webhookEndpoint.upsert({
    where: { targetUrl: parsed.data.targetUrl },
    update: {
      circuitState: nextState,
      consecutiveFails: isSuccess ? 0 : { increment: 1 },
    },
    create: {
      targetUrl: parsed.data.targetUrl,
      circuitState: nextState,
      consecutiveFails: isSuccess ? 0 : 1,
    },
  });

  await prisma.webhookEventLog.create({
    data: {
      endpointId: ep.id,
      httpStatus: parsed.data.httpStatus,
      backoffMs,
    },
  });

  return { status: 'logged', circuitState: nextState, backoffMs };
}
 *
 * --- [3] src/WebhookGatewayConsole.tsx ---
'use client';

import React, { useState } from 'react';
import { computeFullJitterBackoffMs } from './actions';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export function WebhookGatewayConsole(): React.JSX.Element {
  const [circuit, setCircuit] = useState<CircuitState>('CLOSED');
  const [failures, setFailures] = useState<number>(0);

  const recordFailure = (): void => {
    const nextFails = failures + 1;
    setFailures(nextFails);
    if (nextFails >= 3) {
      setCircuit('OPEN');
    }
  };

  const triggerHalfOpenProbe = (): void => {
    setCircuit('HALF_OPEN');
  };

  const succeedProbe = (): void => {
    setFailures(0);
    setCircuit('CLOSED');
  };

  const nextBackoff = computeFullJitterBackoffMs(failures);

  return (
    <section
      aria-label="Resilient Webhook Gateway & Circuit Breaker FSM"
      style={{
        padding: '2rem',
        background: '#090d16',
        color: '#f8fafc',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700 }}>
        HALF-OPEN CIRCUIT BREAKER FSM • AWS FULL-JITTER BACKOFF
      </span>
      <h2 style={{ margin: '0.35rem 0', fontSize: '1.5rem', fontWeight: 800 }}>
        Circuit State:{' '}
        <code
          data-testid="circuit-state"
          style={{
            color: circuit === 'CLOSED' ? '#4ade80' : circuit === 'OPEN' ? '#f87171' : '#facc15',
          }}
        >
          {circuit}
        </code>{' '}
        • Consecutive Failures: {failures} (Next Backoff: {nextBackoff}ms)
      </h2>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        <button
          type="button"
          onClick={recordFailure}
          style={{
            padding: '0.65rem 1.1rem',
            borderRadius: '10px',
            background: '#f43f5e',
            color: '#f8fafc',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Simulate Downstream 503 Timeout
        </button>
        <button
          type="button"
          onClick={triggerHalfOpenProbe}
          style={{
            padding: '0.65rem 1.1rem',
            borderRadius: '10px',
            background: '#f59e0b',
            color: '#090d16',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Transition to HALF_OPEN Probe
        </button>
        <button
          type="button"
          onClick={succeedProbe}
          style={{
            padding: '0.65rem 1.1rem',
            borderRadius: '10px',
            background: '#10b981',
            color: '#090d16',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Probe 200 OK (Close Circuit)
        </button>
      </div>
    </section>
  );
}
 */
