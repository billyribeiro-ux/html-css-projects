// ============================================================================
// LEVEL 42: MULTI-TENANT SAAS BILLING & EXECUTIVE KPI COCKPIT
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

model TenantSubscription {
  id         String            @id @default(cuid())
  tenantSlug String            @unique
  planTier   String            // "STARTER" | "GROWTH" | "ENTERPRISE"
  seats      Int               @default(25)
  mrrCents   Int               @default(249000)
  nrrPercent Float             @default(134.8)
  version    Int               @default(1)
  updatedAt  DateTime          @updatedAt
  invoices   InvoiceLineItem[]

  @@index([planTier])
}

model InvoiceLineItem {
  id             String             @id @default(cuid())
  subscriptionId String
  description    String
  amountCents    Int
  createdAt      DateTime           @default(now())
  subscription   TenantSubscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@index([subscriptionId, createdAt])
}
 *
 * --- [2] src/actions.ts ---
'use server';

import { z } from 'zod';
import { prisma } from './db';

export interface BillingSnapshot {
  tenantSlug: string;
  planTier: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  seats: number;
  mrrCents: number;
  version: number;
}

export type BillingActionResult =
  | { status: 'idle' }
  | { status: 'success'; data: BillingSnapshot }
  | { status: 'conflict'; message: string }
  | { status: 'error'; message: string };

const UpgradeSchema = z.object({
  tenantSlug: z.string().min(2),
  planTier: z.enum(['STARTER', 'GROWTH', 'ENTERPRISE']),
  seats: z.coerce.number().int().min(1).max(10000),
  expectedVersion: z.coerce.number().int().min(1),
});

const TIER_RATE_CENTS: Record<'STARTER' | 'GROWTH' | 'ENTERPRISE', number> = {
  STARTER: 4900,
  GROWTH: 8900,
  ENTERPRISE: 12000,
};

export async function upgradeTenantPlanAction(
  _prev: BillingActionResult,
  formData: FormData
): Promise<BillingActionResult> {
  const parsed = UpgradeSchema.safeParse({
    tenantSlug: formData.get('tenantSlug'),
    planTier: formData.get('planTier'),
    seats: formData.get('seats'),
    expectedVersion: formData.get('expectedVersion'),
  });

  if (!parsed.success) {
    return { status: 'error', message: 'Invalid billing allocation parameters' };
  }

  const { tenantSlug, planTier, seats, expectedVersion } = parsed.data;
  const mrrCents = seats * TIER_RATE_CENTS[planTier];

  try {
    const result = await prisma.tenantSubscription.updateMany({
      where: { tenantSlug, version: expectedVersion },
      data: {
        planTier,
        seats,
        mrrCents,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      return {
        status: 'conflict',
        message: 'OCC Version Conflict: Another administrator modified this subscription.',
      };
    }

    const updated = await prisma.tenantSubscription.findUnique({
      where: { tenantSlug },
    });

    if (updated) {
      await prisma.invoiceLineItem.create({
        data: {
          subscriptionId: updated.id,
          description: `Upgraded to ${planTier} (${seats} seats)`,
          amountCents: mrrCents,
        },
      });
    }

    return {
      status: 'success',
      data: {
        tenantSlug,
        planTier,
        seats,
        mrrCents,
        version: expectedVersion + 1,
      },
    };
  } catch (err: unknown) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Billing mutation failed',
    };
  }
}
 *
 * --- [3] src/BillingKpiDashboard.tsx ---
'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { upgradeTenantPlanAction, type BillingActionResult } from './actions';

const TIERS = [
  { id: 'STARTER' as const, name: 'Starter Cloud', pricePerSeat: 49, nrr: 108 },
  { id: 'GROWTH' as const, name: 'Growth Scale', pricePerSeat: 89, nrr: 124 },
  { id: 'ENTERPRISE' as const, name: 'Enterprise AI', pricePerSeat: 120, nrr: 138 },
];

export function BillingKpiDashboard({
  tenantSlug = 'acme-global-ai',
  initialSeats = 120,
  initialVersion = 1,
}: {
  tenantSlug?: string;
  initialSeats?: number;
  initialVersion?: number;
}): React.JSX.Element {
  const [selectedTier, setSelectedTier] = useState<'STARTER' | 'GROWTH' | 'ENTERPRISE'>('ENTERPRISE');
  const [seats, setSeats] = useState<number>(initialSeats);
  const [state, formAction, isPending] = useActionState<BillingActionResult, FormData>(
    upgradeTenantPlanAction,
    { status: 'idle' }
  );

  const ringRef = useRef<SVGCircleElement | null>(null);
  const activeTierMeta = TIERS.find((t) => t.id === selectedTier) ?? TIERS[2]!;
  const projectedMrr = seats * activeTierMeta.pricePerSeat;
  const projectedArr = projectedMrr * 12;
  const activeVersion = state.status === 'success' ? state.data.version : initialVersion;

  useEffect(() => {
    if (ringRef.current) {
      const circumference = 2 * Math.PI * 52;
      const ratio = Math.min(projectedArr / 250000, 1);
      gsap.to(ringRef.current, {
        strokeDashoffset: circumference * (1 - ratio),
        duration: 0.75,
        ease: 'power3.out',
      });
    }
  }, [projectedArr]);

  return (
    <section
      aria-label="Multi-Tenant SaaS Billing & Executive KPI Cockpit"
      style={{
        padding: '2rem',
        background: 'linear-gradient(145deg, #090d16 0%, #111827 100%)',
        color: '#f8fafc',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
      }}
    >
      <div>
        <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
          Tenant: {tenantSlug} • OCC Lock v{activeVersion}
        </span>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.4rem 0 1rem' }}>
          Executive ARR & Seat Allocation
        </h2>

        <div
          role="group"
          aria-label="Subscription Plan Tiers"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginBottom: '1.25rem' }}
        >
          {TIERS.map((tier) => {
            const isSelected = selectedTier === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedTier(tier.id)}
                style={{
                  padding: '0.85rem',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.12)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.14)' : 'rgba(15, 23, 42, 0.6)',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{tier.name}</div>
                <div style={{ color: '#38bdf8', fontSize: '1.1rem', fontWeight: 800 }}>
                  ${tier.pricePerSeat}/seat
                </div>
              </button>
            );
          })}
        </div>

        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="hidden" name="tenantSlug" value={tenantSlug} />
          <input type="hidden" name="planTier" value={selectedTier} />
          <input type="hidden" name="expectedVersion" value={activeVersion} />

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontWeight: 600 }}>
            <span>Provisioned Seats: {seats}</span>
            <input
              type="range"
              name="seats"
              min={10}
              max={500}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              background: '#38bdf8',
              color: '#090d16',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {isPending ? 'Verifying OCC Lock...' : 'Commit Multi-Tenant Seat Allocation'}
          </button>
        </form>

        {state.status === 'conflict' && (
          <p role="alert" style={{ color: '#f87171', marginTop: '0.75rem' }}>
            {state.message}
          </p>
        )}
      </div>

      {/* Hollywood Radial KPI Telemetry Gauge */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.7)',
          borderRadius: '16px',
          padding: '1.5rem',
        }}
      >
        <svg width="150" height="150" viewBox="0 0 130 130" aria-label="Projected ARR Radial Gauge">
          <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle
            ref={ringRef}
            cx="65"
            cy="65"
            r="52"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 52}
            strokeDashoffset={2 * Math.PI * 52 * 0.25}
            transform="rotate(-90 65 65)"
          />
          <text x="65" y="62" textAnchor="middle" fill="#f8fafc" fontSize="14" fontWeight="800">
            ${(projectedArr / 1000).toFixed(1)}k
          </text>
          <text x="65" y="80" textAnchor="middle" fill="#94a3b8" fontSize="9">
            ANNUAL RUN RATE
          </text>
        </svg>
        <div data-testid="projected-mrr" style={{ marginTop: '0.75rem', fontWeight: 700, color: '#4ade80' }}>
          MRR: ${projectedMrr.toLocaleString()}/mo • NRR: {activeTierMeta.nrr}%
        </div>
      </div>
    </section>
  );
}
 */
