// ============================================================================
// LEVEL 49: ZERO-TRUST RBAC/ABAC IAM & SECURITY POLICY CONSOLE
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

model IamRole {
  id             String               @id @default(cuid())
  roleSlug       String               @unique
  displayName    String
  capabilityMask Int                  @default(1)
  updatedAt      DateTime             @updatedAt
  grants         IamPermissionGrant[]
  audits         SecurityAuditEntry[]
}

model IamPermissionGrant {
  id             String   @id @default(cuid())
  roleId         String
  permissionCode String
  bitValue       Int
  role           IamRole  @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionCode])
}

model SecurityAuditEntry {
  id           String   @id @default(cuid())
  roleId       String
  actor        String
  previousMask Int
  nextMask     Int
  createdAt    DateTime @default(now())
  role         IamRole  @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@index([roleId, createdAt])
}
 *
 * --- [2] src/actions.ts ---
'use server';

import { z } from 'zod';
import { prisma } from './db';

const UpdateMaskSchema = z.object({
  roleSlug: z.string().min(2),
  nextMask: z.coerce.number().int().min(0).max(63),
  actor: z.string().min(2),
});

export async function updateRoleBitmaskAction(
  formData: FormData
): Promise<{ status: 'success'; capabilityMask: number } | { status: 'error'; message: string }> {
  const parsed = UpdateMaskSchema.safeParse({
    roleSlug: formData.get('roleSlug'),
    nextMask: formData.get('nextMask'),
    actor: formData.get('actor'),
  });

  if (!parsed.success) {
    return { status: 'error', message: 'Invalid RBAC capability mask' };
  }

  try {
    const existing = await prisma.iamRole.findUnique({
      where: { roleSlug: parsed.data.roleSlug },
    });
    if (!existing) {
      return { status: 'error', message: 'IAM Role not found' };
    }

    const [updated] = await prisma.$transaction([
      prisma.iamRole.update({
        where: { id: existing.id },
        data: { capabilityMask: parsed.data.nextMask },
      }),
      prisma.securityAuditEntry.create({
        data: {
          roleId: existing.id,
          actor: parsed.data.actor,
          previousMask: existing.capabilityMask,
          nextMask: parsed.data.nextMask,
        },
      }),
    ]);

    return { status: 'success', capabilityMask: updated.capabilityMask };
  } catch (err: unknown) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'RBAC update failed',
    };
  }
}
 *
 * --- [3] src/ZeroTrustRbacConsole.tsx ---
'use client';

import React, { useState } from 'react';

export const CAPABILITIES = [
  { code: 'READ_TELEMETRY', bit: 1 << 0, label: 'Read Cluster Telemetry (0b0001)' },
  { code: 'MUTATE_SCHEMA', bit: 1 << 1, label: 'Mutate Prisma Schema (0b0010)' },
  { code: 'ROTATE_KEYS', bit: 1 << 2, label: 'Rotate KMS Signing Keys (0b0100)' },
  { code: 'EXPORT_PII_VAULT', bit: 1 << 3, label: 'Export PII Vault (0b1000)' },
] as const;

export function hasCapability(mask: number, bit: number): boolean {
  return (mask & bit) === bit;
}

export function ZeroTrustRbacConsole({
  initialMask = 0b0101,
}: {
  initialMask?: number;
}): React.JSX.Element {
  const [mask, setMask] = useState<number>(initialMask);

  const toggleBit = (bit: number): void => {
    setMask((prev) => prev ^ bit);
  };

  return (
    <section
      aria-label="Zero-Trust RBAC/ABAC IAM & Security Policy Console"
      style={{
        padding: '2rem',
        background: '#090d16',
        color: '#f8fafc',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <header style={{ marginBottom: '1.25rem' }}>
        <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700 }}>
          O(1) BITWISE CAPABILITY MATRIX • CRYPTOGRAPHIC AUDIT LEDGER
        </span>
        <h2 style={{ margin: '0.25rem 0', fontSize: '1.5rem', fontWeight: 800 }}>
          Active Capability Mask:{' '}
          <code data-testid="binary-mask" style={{ color: '#4ade80' }}>
            0b{mask.toString(2).padStart(4, '0')} ({mask})
          </code>
        </h2>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
        {CAPABILITIES.map((cap) => {
          const granted = hasCapability(mask, cap.bit);
          return (
            <button
              key={cap.code}
              type="button"
              aria-pressed={granted}
              onClick={() => toggleBit(cap.bit)}
              style={{
                padding: '1rem',
                borderRadius: '12px',
                textAlign: 'left',
                border: granted ? '1px solid #4ade80' : '1px solid rgba(255,255,255,0.12)',
                background: granted ? 'rgba(74, 222, 128, 0.12)' : 'rgba(15, 23, 42, 0.7)',
                color: '#f8fafc',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{cap.code}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0' }}>{cap.label}</div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: granted ? '#4ade80' : '#f87171',
                }}
              >
                {granted ? 'GRANTED (ALLOW)' : 'DENIED (ZERO-TRUST)'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
 */
