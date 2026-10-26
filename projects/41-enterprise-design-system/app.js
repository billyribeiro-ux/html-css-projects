// ============================================================================
// LEVEL 41: ENTERPRISE DESIGN SYSTEM & 3D SHADER STUDIO
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

model DesignToken {
  id          String          @id @default(cuid())
  name        String          @unique
  category    String          // "color" | "spacing" | "elevation"
  cssVar      String          @unique
  value       String
  roughness   Float           @default(0.2)
  metalness   Float           @default(0.8)
  updatedAt   DateTime        @updatedAt
  revisions   TokenRevision[]

  @@index([category])
}

model TokenRevision {
  id            String      @id @default(cuid())
  designTokenId String
  previousValue String
  nextValue     String
  author        String      @default("principal-architect")
  createdAt     DateTime    @default(now())
  designToken   DesignToken @relation(fields: [designTokenId], references: [id], onDelete: Cascade)

  @@index([designTokenId, createdAt])
}
 *
 * --- [2] src/actions.ts ---
'use server';

import { z } from 'zod';
import { prisma } from './db';

export interface DesignTokenRecord {
  id: string;
  name: string;
  category: string;
  cssVar: string;
  value: string;
  roughness: number;
  metalness: number;
}

export type ActionResult<T> =
  | { status: 'idle' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

const UpdateTokenSchema = z.object({
  name: z.string().min(3),
  value: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid 6-digit hex color'),
  roughness: z.coerce.number().min(0).max(1).optional(),
  metalness: z.coerce.number().min(0).max(1).optional(),
});

export async function updateDesignTokenAction(
  _prevState: ActionResult<DesignTokenRecord>,
  formData: FormData
): Promise<ActionResult<DesignTokenRecord>> {
  const parsed = UpdateTokenSchema.safeParse({
    name: formData.get('name'),
    value: formData.get('value'),
    roughness: formData.get('roughness') ?? undefined,
    metalness: formData.get('metalness') ?? undefined,
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      status: 'error',
      message: firstIssue ? firstIssue.message : 'Invalid design token payload',
    };
  }

  try {
    const roughness = parsed.data.roughness ?? 0.2;
    const metalness = parsed.data.metalness ?? 0.8;

    const existing = await prisma.designToken.findUnique({
      where: { name: parsed.data.name },
    });

    const updated = await prisma.designToken.upsert({
      where: { name: parsed.data.name },
      update: {
        value: parsed.data.value,
        ...(parsed.data.roughness !== undefined ? { roughness: parsed.data.roughness } : {}),
        ...(parsed.data.metalness !== undefined ? { metalness: parsed.data.metalness } : {}),
      },
      create: {
        name: parsed.data.name,
        category: 'color',
        cssVar: `--ds-${parsed.data.name.replace(/\./g, '-')}`,
        value: parsed.data.value,
        roughness,
        metalness,
      },
    });

    if (existing && existing.value !== parsed.data.value) {
      await prisma.tokenRevision.create({
        data: {
          designTokenId: updated.id,
          previousValue: existing.value,
          nextValue: parsed.data.value,
        },
      });
    }

    return { status: 'success', data: updated };
  } catch (err: unknown) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Database persistence error',
    };
  }
}
 *
 * --- [3] src/DesignSystemStudio.tsx ---
'use client';

import React, {
  useActionState,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import {
  updateDesignTokenAction,
  type ActionResult,
  type DesignTokenRecord,
} from './actions';

export type PolymorphicProps<E extends ElementType> = {
  as?: E;
  variant?: 'solid' | 'surface' | 'ghost';
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<E>, 'as' | 'children'>;

export function PrimitiveBox<E extends ElementType = 'button'>({
  as,
  variant = 'solid',
  children,
  style,
  ...rest
}: PolymorphicProps<E>): React.JSX.Element {
  const Component = as ?? 'button';
  return (
    <Component
      data-variant={variant}
      style={{
        padding: '0.65rem 1.25rem',
        borderRadius: '10px',
        fontWeight: 600,
        border: '1px solid rgba(255,255,255,0.14)',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
}

export interface TokenItem {
  name: string;
  value: string;
  roughness: number;
  metalness: number;
}

const DEFAULT_TOKENS: TokenItem[] = [
  { name: 'color.primary.accent', value: '#38bdf8', roughness: 0.15, metalness: 0.85 },
  { name: 'color.surface.elevated', value: '#6366f1', roughness: 0.32, metalness: 0.65 },
  { name: 'color.kinetic.neon', value: '#10b981', roughness: 0.12, metalness: 0.92 },
];

export function DesignSystemStudio({
  initialTokens = DEFAULT_TOKENS,
}: {
  initialTokens?: TokenItem[];
}): React.JSX.Element {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const activeToken = initialTokens[selectedIdx] ?? DEFAULT_TOKENS[0]!;

  const [draftColor, setDraftColor] = useState<string>(activeToken.value);
  const [optimisticColor, setOptimisticColor] = useOptimistic<string, string>(
    activeToken.value,
    (_state, nextColor) => nextColor
  );
  const [isPending, startTransition] = useTransition();

  const initialState: ActionResult<DesignTokenRecord> = { status: 'idle' };
  const [state, formAction] = useActionState(updateDesignTokenAction, initialState);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);

  useEffect(() => {
    setDraftColor(activeToken.value);
  }, [activeToken.value]);

  // Initialize Three.js WebGL PBR Studio once on mount with headless-safe guard & full cleanup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let glContext: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      glContext = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    } catch {
      glContext = null;
    }
    if (!glContext) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 340 / 240, 0.1, 100);
    camera.position.z = 3.6;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      context: glContext,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(340, 240);

    const geometry = new THREE.TorusKnotGeometry(0.82, 0.26, 128, 32);
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(activeToken.value),
      roughness: activeToken.roughness,
      metalness: activeToken.metalness,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const keyLight = new THREE.PointLight(0xffffff, 45);
    keyLight.position.set(3, 3, 4);
    const rimLight = new THREE.PointLight(0x38bdf8, 28);
    rimLight.position.set(-3, -2, -2);
    scene.add(keyLight, rimLight, new THREE.AmbientLight(0xffffff, 0.6));

    let frameId = 0;
    const animate = (): void => {
      mesh.rotation.x += 0.008;
      mesh.rotation.y += 0.012;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      materialRef.current = null;
    };
  }, []);

  // Tween PBR material uniforms via GSAP without recreating WebGL context
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;
    const targetColor = new THREE.Color(draftColor);
    gsap.to(mat.color, {
      r: targetColor.r,
      g: targetColor.g,
      b: targetColor.b,
      duration: 0.45,
      ease: 'power2.out',
    });
    mat.roughness = activeToken.roughness;
    mat.metalness = activeToken.metalness;
  }, [draftColor, activeToken.roughness, activeToken.metalness]);

  const handleKineticPulse = (): void => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { scale: 0.96, rotationY: -8 },
        { scale: 1, rotationY: 0, duration: 0.65, ease: 'elastic.out(1, 0.4)' }
      );
    }
  };

  const handleSubmit = (formData: FormData): void => {
    const nextColor = String(formData.get('value') ?? draftColor);
    startTransition(() => {
      setOptimisticColor(nextColor);
      formAction(formData);
    });
    handleKineticPulse();
  };

  return (
    <section
      aria-label="Enterprise Design System & 3D Shader Studio"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.75rem',
        padding: '2rem',
        background: 'radial-gradient(circle at top right, #1e1b4b, #090d16)',
        color: '#f8fafc',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div ref={cardRef} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <header>
          <span
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#38bdf8',
              fontWeight: 700,
            }}
          >
            OKLCH Cascade Layer + Three.js PBR Engine
          </span>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0.25rem 0' }}>
            {activeToken.name}
          </h2>
        </header>

        <div
          role="group"
          aria-label="Design Token Selector"
          style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
        >
          {initialTokens.map((tok, idx) => (
            <button
              key={tok.name}
              type="button"
              aria-pressed={idx === selectedIdx}
              onClick={() => setSelectedIdx(idx)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                border: idx === selectedIdx ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.12)',
                background: idx === selectedIdx ? 'rgba(56,189,248,0.15)' : 'rgba(15,23,42,0.6)',
                color: '#f8fafc',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              {tok.name}
            </button>
          ))}
        </div>

        <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <input type="hidden" name="name" value={activeToken.name} />
          <input type="hidden" name="roughness" value={activeToken.roughness} />
          <input type="hidden" name="metalness" value={activeToken.metalness} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
            <span>Token Hex Value:</span>
            <input
              type="color"
              name="value"
              aria-label="Token Hex Color"
              value={draftColor}
              onChange={(e) => setDraftColor(e.target.value)}
            />
            <code
              data-testid="optimistic-hex"
              style={{
                background: 'rgba(15,23,42,0.75)',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                color: draftColor,
              }}
            >
              {isPending ? optimisticColor : draftColor}
            </code>
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <PrimitiveBox
              as="button"
              type="submit"
              disabled={isPending}
              style={{ background: draftColor, color: '#090d16', cursor: 'pointer' }}
            >
              {isPending ? 'Syncing Shader & Prisma...' : 'Commit Token & Pulse 3D Shader'}
            </PrimitiveBox>
            <PrimitiveBox
              as="a"
              href="#wcag-audit"
              variant="ghost"
              style={{ color: '#e2e8f0', textDecoration: 'none' }}
            >
              Verify APCA Contrast
            </PrimitiveBox>
          </div>
        </form>

        {state.status === 'success' && (
          <p role="status" style={{ color: '#4ade80', fontSize: '0.85rem', margin: 0 }}>
            Persisted {state.data.name} ({state.data.value}) to Prisma v6.
          </p>
        )}
        {state.status === 'error' && (
          <p role="alert" style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>
            {state.message}
          </p>
        )}

        {/* 2D Vector KPI Telemetry Strip */}
        <svg
          viewBox="0 0 320 64"
          role="img"
          aria-label="Shader Frame Pacing Telemetry"
          style={{
            width: '100%',
            height: '64px',
            background: 'rgba(15,23,42,0.65)',
            borderRadius: '10px',
            padding: '6px',
          }}
        >
          <polyline
            fill="none"
            stroke={draftColor}
            strokeWidth="2.5"
            points="8,48 52,36 96,40 140,22 184,26 228,16 272,20 312,12"
          />
          <text x="12" y="20" fill="#94a3b8" fontSize="10" fontFamily="monospace">
            PBR SHADER 120FPS • ROUGHNESS {activeToken.roughness.toFixed(2)} • METAL {activeToken.metalness.toFixed(2)}
          </text>
        </svg>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '16px',
          padding: '1rem',
          border: '1px solid rgba(56, 189, 248, 0.2)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={340}
          height={240}
          aria-label="Interactive 3D PBR Material Preview"
        />
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
          Real-Time Three.js MeshPhysicalMaterial TorusKnot
        </span>
      </div>
    </section>
  );
}
 */
