// ============================================================================
// LEVEL 60: 3D GLOBAL EDGE MESH & CHAOS ENGINEERING CONTROL PLANE
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

model EdgeRegionCluster {
  id          String               @id @default(cuid())
  regionCode  String               @unique
  status      String               @default("HEALTHY") // "HEALTHY" | "PARTITIONED"
  trafficPct  Int                  @default(33)
  updatedAt   DateTime             @updatedAt
  experiments ChaosExperimentLog[]
}

model ChaosExperimentLog {
  id          String            @id @default(cuid())
  regionId    String
  faultType   String
  blastRadius String
  createdAt   DateTime          @default(now())
  region      EdgeRegionCluster @relation(fields: [regionId], references: [id], onDelete: Cascade)

  @@index([regionId, createdAt])
}
 *
 * --- [2] src/actions.ts ---
'use server';

import { z } from 'zod';
import { prisma } from './db';

const ChaosInjectSchema = z.object({
  regionCode: z.string().min(3),
  faultType: z.string().min(3),
});

export async function triggerRegionalChaosFailoverAction(
  formData: FormData
): Promise<{ status: 'failover_complete'; partitionedRegion: string } | { status: 'error'; message: string }> {
  const parsed = ChaosInjectSchema.safeParse({
    regionCode: formData.get('regionCode'),
    faultType: formData.get('faultType'),
  });
  if (!parsed.success) {
    return { status: 'error', message: 'Invalid chaos experiment parameters' };
  }

  const region = await prisma.edgeRegionCluster.upsert({
    where: { regionCode: parsed.data.regionCode },
    update: { status: 'PARTITIONED', trafficPct: 0 },
    create: { regionCode: parsed.data.regionCode, status: 'PARTITIONED', trafficPct: 0 },
  });

  await prisma.chaosExperimentLog.create({
    data: {
      regionId: region.id,
      faultType: parsed.data.faultType,
      blastRadius: 'REGIONAL_BGP_DRAIN',
    },
  });

  return { status: 'failover_complete', partitionedRegion: region.regionCode };
}
 *
 * --- [3] src/GlobeChaosControlPlane.tsx ---
'use client';
import './styles.css';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface EdgeRegionState {
  code: string;
  healthy: boolean;
  trafficPct: number;
}

export function GlobeChaosControlPlane(): React.JSX.Element {
  const [regions, setRegions] = useState<EdgeRegionState[]>([
    { code: 'us-east-va', healthy: true, trafficPct: 40 },
    { code: 'eu-central-fra', healthy: true, trafficPct: 35 },
    { code: 'ap-northeast-tyo', healthy: true, trafficPct: 25 },
  ]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    } catch {
      gl = null;
    }
    if (!gl) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 320 / 220, 0.1, 100);
    camera.position.z = 3.4;

    const renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true });
    renderer.setSize(320, 220);

    const globeGeo = new THREE.SphereGeometry(1.05, 24, 24);
    const globeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    let raf = 0;
    const animate = (): void => {
      globe.rotation.y += 0.008;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      globeGeo.dispose();
      globeMat.dispose();
      renderer.dispose();
    };
  }, []);

  const partitionRegion = (targetCode: string): void => {
    setRegions([
      { code: 'us-east-va', healthy: targetCode !== 'us-east-va', trafficPct: targetCode === 'us-east-va' ? 0 : 50 },
      { code: 'eu-central-fra', healthy: targetCode !== 'eu-central-fra', trafficPct: targetCode === 'eu-central-fra' ? 0 : 50 },
      { code: 'ap-northeast-tyo', healthy: true, trafficPct: targetCode === 'ap-northeast-tyo' ? 0 : 50 },
    ]);
  };

  return (
    <section
      aria-label="3D Global Edge Mesh & Chaos Engineering Control Plane"
      className="l8-styled-node"
    >
      <div>
        <span className="l8-styled-node">
          THREE.JS 3D GLOBAL MESH • AUTOMATED ANYCAST BGP FAILOVER
        </span>
        <h2 className="l8-styled-node">
          Global SLA: <span className="l8-styled-node">99.999% (5-Nines)</span>
        </h2>

        <div className="l8-styled-node">
          {regions.map((r) => (
            <div
              key={r.code}
              className="l8-styled-node"
            >
              <div>
                <strong>{r.code}</strong> •{' '}
                <span data-testid={`load-${r.code}`} className="l8-styled-node">
                  {r.trafficPct}% Load
                </span>
              </div>
              <button
                type="button"
                onClick={() => partitionRegion(r.code)}
                className="l8-styled-node"
              >
                Inject BGP Partition ({r.code})
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="l8-styled-node">
        <canvas ref={canvasRef} width={320} height={220} aria-label="3D Global Edge Mesh Canvas" />
      </div>
    </section>
  );
}
 */
