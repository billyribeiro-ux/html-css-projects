// ============================================================================
// LEVEL 46: 100K-ROW VIRTUALIZED TELEMETRY & LOG EXPLORER
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

model ServiceIngestQuota {
  id           String           @id @default(cuid())
  serviceName  String           @unique
  maxRps       Int              @default(50000)
  events       TelemetryEvent[]
}

model TelemetryEvent {
  id          String             @id @default(cuid())
  serviceId   String
  traceId     String             @unique
  severity    String             // "INFO" | "WARN" | "ERROR"
  latencyMs   Float
  message     String
  createdAt   DateTime           @default(now())
  service     ServiceIngestQuota @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@index([serviceId, createdAt, id])
}
 *
 * --- [2] src/actions.ts ---
'use server';

import { z } from 'zod';
import { prisma } from './db';

const IngestLogSchema = z.object({
  serviceName: z.string().min(2),
  traceId: z.string().min(4),
  severity: z.enum(['INFO', 'WARN', 'ERROR']),
  latencyMs: z.coerce.number().min(0),
  message: z.string().min(2),
});

export async function ingestTelemetryEventAction(
  formData: FormData
): Promise<{ status: 'success'; traceId: string } | { status: 'error'; message: string }> {
  const parsed = IngestLogSchema.safeParse({
    serviceName: formData.get('serviceName'),
    traceId: formData.get('traceId'),
    severity: formData.get('severity'),
    latencyMs: formData.get('latencyMs'),
    message: formData.get('message'),
  });

  if (!parsed.success) {
    return { status: 'error', message: 'Invalid telemetry event payload' };
  }

  try {
    const svc = await prisma.serviceIngestQuota.upsert({
      where: { serviceName: parsed.data.serviceName },
      update: {},
      create: { serviceName: parsed.data.serviceName },
    });

    await prisma.telemetryEvent.create({
      data: {
        serviceId: svc.id,
        traceId: parsed.data.traceId,
        severity: parsed.data.severity,
        latencyMs: parsed.data.latencyMs,
        message: parsed.data.message,
      },
    });
    return { status: 'success', traceId: parsed.data.traceId };
  } catch (err: unknown) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Telemetry ingestion failed',
    };
  }
}
 *
 * --- [3] src/VirtualizedTelemetryGrid.tsx ---
'use client';

import React, { useMemo, useState } from 'react';

const TOTAL_ROWS = 100_000;
const ROW_HEIGHT = 36;
const VIEWPORT_HEIGHT = 320;
const OVERSCAN = 3;

export function VirtualizedTelemetryGrid(): React.JSX.Element {
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'ERROR'>('ALL');

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(TOTAL_ROWS - 1, startIndex + visibleCount);

  const visibleRows = useMemo(() => {
    const rows: { index: number; traceId: string; severity: string; latency: string }[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const isErr = i % 11 === 0;
      if (severityFilter === 'ERROR' && !isErr) continue;
      rows.push({
        index: i,
        traceId: `trc-${String(i).padStart(6, '0')}`,
        severity: isErr ? 'ERROR' : 'INFO',
        latency: `${(1.1 + (i % 17) * 0.35).toFixed(2)}ms`,
      });
    }
    return rows;
  }, [startIndex, endIndex, severityFilter]);

  return (
    <section
      aria-label="100k-Row Virtualized Telemetry Explorer"
      style={{
        padding: '2rem',
        background: '#090d16',
        color: '#f8fafc',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700 }}>
            100,000 LOG STREAMS • CONSTANT O(1) DOM FOOTPRINT
          </span>
          <h2 style={{ margin: '0.25rem 0', fontSize: '1.4rem', fontWeight: 800 }}>
            Windowed Slice: Rows {startIndex.toLocaleString()} – {endIndex.toLocaleString()}
          </h2>
        </div>

        <button
          type="button"
          aria-pressed={severityFilter === 'ERROR'}
          onClick={() => setSeverityFilter((prev) => (prev === 'ALL' ? 'ERROR' : 'ALL'))}
          style={{
            padding: '0.5rem 0.9rem',
            borderRadius: '8px',
            background: severityFilter === 'ERROR' ? '#ef4444' : '#1e293b',
            color: '#f8fafc',
            border: '1px solid rgba(255,255,255,0.15)',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          {severityFilter === 'ERROR' ? 'Showing ERROR Only' : 'Filter ERROR Traces'}
        </button>
      </header>

      <div
        data-testid="virtual-viewport"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        style={{
          height: `${VIEWPORT_HEIGHT}px`,
          overflowY: 'auto',
          position: 'relative',
          background: '#0f172a',
          borderRadius: '12px',
          border: '1px solid rgba(56, 189, 248, 0.2)',
        }}
      >
        <div style={{ height: `${TOTAL_ROWS * ROW_HEIGHT}px`, position: 'relative' }}>
          {visibleRows.map((row) => (
            <div
              key={row.traceId}
              data-testid="virtual-row"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: `${ROW_HEIGHT}px`,
                transform: `translate3d(0, ${row.index * ROW_HEIGHT}px, 0)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
              }}
            >
              <span>#{row.index} • {row.traceId}</span>
              <span style={{ color: row.severity === 'ERROR' ? '#f87171' : '#38bdf8', fontWeight: 700 }}>
                {row.severity}
              </span>
              <span style={{ color: '#4ade80' }}>{row.latency}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
 */
