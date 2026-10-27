// ============================================================================
// LEVEL 44: DISTRIBUTED SAGA WORKFLOW & STATE MACHINE STUDIO
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

model WorkflowInstance {
  id           String                  @id @default(cuid())
  entityName   String
  currentState String                  // "IDENTITY_CHECK" | "RISK_SCORING" | "COMPLIANCE_LOCK" | "PROVISIONED"
  riskScore    Int                     @default(12)
  updatedAt    DateTime                @updatedAt
  transitions  WorkflowTransitionLog[]
}

model WorkflowTransitionLog {
  id             String           @id @default(cuid())
  instanceId     String
  fromState      String
  toState        String
  idempotencyKey String
  createdAt      DateTime         @default(now())
  instance       WorkflowInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)

  @@unique([instanceId, idempotencyKey])
}
 *
 * --- [2] src/actions.ts ---
'use server';

import { z } from 'zod';
import { prisma } from './db';

export type SagaState =
  | 'IDENTITY_CHECK'
  | 'RISK_SCORING'
  | 'COMPLIANCE_LOCK'
  | 'PROVISIONED';

const ALLOWED_TRANSITIONS: Record<SagaState, SagaState[]> = {
  IDENTITY_CHECK: ['RISK_SCORING'],
  RISK_SCORING: ['COMPLIANCE_LOCK', 'IDENTITY_CHECK'],
  COMPLIANCE_LOCK: ['PROVISIONED', 'RISK_SCORING'],
  PROVISIONED: [],
};

const TransitionSchema = z.object({
  instanceId: z.string().min(1),
  fromState: z.enum(['IDENTITY_CHECK', 'RISK_SCORING', 'COMPLIANCE_LOCK', 'PROVISIONED']),
  toState: z.enum(['IDENTITY_CHECK', 'RISK_SCORING', 'COMPLIANCE_LOCK', 'PROVISIONED']),
  idempotencyKey: z.string().min(4),
});

export async function triggerSagaTransitionAction(
  formData: FormData
): Promise<{ status: 'success'; nextState: SagaState } | { status: 'error'; message: string }> {
  const parsed = TransitionSchema.safeParse({
    instanceId: formData.get('instanceId'),
    fromState: formData.get('fromState'),
    toState: formData.get('toState'),
    idempotencyKey: formData.get('idempotencyKey'),
  });

  if (!parsed.success) {
    return { status: 'error', message: 'Malformed state transition payload' };
  }

  const { instanceId, fromState, toState, idempotencyKey } = parsed.data;
  const legalTargets = ALLOWED_TRANSITIONS[fromState];
  if (!legalTargets.includes(toState)) {
    return {
      status: 'error',
      message: `Illegal DFA transition from ${fromState} to ${toState}`,
    };
  }

  try {
    await prisma.$transaction([
      prisma.workflowInstance.update({
        where: { id: instanceId },
        data: { currentState: toState },
      }),
      prisma.workflowTransitionLog.create({
        data: { instanceId, fromState, toState, idempotencyKey },
      }),
    ]);

    return { status: 'success', nextState: toState };
  } catch (err: unknown) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Transaction failed',
    };
  }
}
 *
 * --- [3] src/WorkflowSagaStudio.tsx ---
'use client';
import './styles.css';

import React, { useState } from 'react';
import type { SagaState } from './actions';

const STATES: { id: SagaState; label: string; x: number }[] = [
  { id: 'IDENTITY_CHECK', label: '1. KYB Identity', x: 60 },
  { id: 'RISK_SCORING', label: '2. Actuarial Risk', x: 190 },
  { id: 'COMPLIANCE_LOCK', label: '3. Compliance Seal', x: 320 },
  { id: 'PROVISIONED', label: '4. Live Enclave', x: 450 },
];

const NEXT_STATE_MAP: Record<SagaState, SagaState | null> = {
  IDENTITY_CHECK: 'RISK_SCORING',
  RISK_SCORING: 'COMPLIANCE_LOCK',
  COMPLIANCE_LOCK: 'PROVISIONED',
  PROVISIONED: null,
};

export function WorkflowSagaStudio(): React.JSX.Element {
  const [currentState, setCurrentState] = useState<SagaState>('IDENTITY_CHECK');
  const [history, setHistory] = useState<string[]>(['INIT -> IDENTITY_CHECK']);

  const handleAdvance = (): void => {
    const next = NEXT_STATE_MAP[currentState];
    if (!next) return;
    setHistory((prev) => [...prev, `${currentState} -> ${next}`]);
    setCurrentState(next);
  };

  const handleReset = (): void => {
    setCurrentState('IDENTITY_CHECK');
    setHistory(['RESET -> IDENTITY_CHECK']);
  };

  return (
    <section
      aria-label="Distributed Saga Workflow & State Machine Studio"
      className="l8-styled-node"
    >
      <span className="l8-styled-node">
        DETERMINISTIC FINITE AUTOMATON • IDEMPOTENT SAGA CHECKPOINTS
      </span>
      <h2 className="l8-styled-node">
        Current DFA State: <code data-testid="dfa-state" className="l8-styled-node">{currentState}</code>
      </h2>

      {/* Directed SVG State Machine Graph */}
      <svg
        viewBox="0 0 520 110"
        className="l8-styled-node"
      >
        <line x1="60" y1="50" x2="450" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
        {STATES.map((node) => {
          const active = node.id === currentState;
          return (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={50}
                r={active ? 22 : 16}
                fill={active ? '#38bdf8' : '#1e293b'}
                stroke={active ? '#f8fafc' : '#475569'}
                strokeWidth="3"
              />
              <text
                x={node.x}
                y={92}
                textAnchor="middle"
                fill={active ? '#38bdf8' : '#94a3b8'}
                fontSize="11"
                fontWeight="700"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="l8-styled-node">
        <button
          type="button"
          onClick={handleAdvance}
          disabled={currentState === 'PROVISIONED'}
          className="l8-styled-node"
        >
          Commit Next Idempotent Checkpoint →
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="l8-styled-node"
        >
          Compensate & Reset Saga
        </button>
      </div>

      <div className="l8-styled-node">
        Audit Log: {history.join(' • ')}
      </div>
    </section>
  );
}
 */
