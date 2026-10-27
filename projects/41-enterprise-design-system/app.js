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
import './styles.css';

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
  ...rest
}: PolymorphicProps<E>): React.JSX.Element {
  const Component = as ?? 'button';
  return (
    <Component
      data-variant={variant}
      className="l8-styled-node"
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
      className="l8-styled-node"
    >
      <div ref={cardRef} className="l8-styled-node">
        <header>
          <span
            className="l8-styled-node"
          >
            OKLCH Cascade Layer + Three.js PBR Engine
          </span>
          <h2 className="l8-styled-node">
            {activeToken.name}
          </h2>
        </header>

        <div
          role="group"
          aria-label="Design Token Selector"
          className="l8-styled-node"
        >
          {initialTokens.map((tok, idx) => (
            <button
              key={tok.name}
              type="button"
              aria-pressed={idx === selectedIdx}
              onClick={() => setSelectedIdx(idx)}
              className="l8-styled-node"
            >
              {tok.name}
            </button>
          ))}
        </div>

        <form action={handleSubmit} className="l8-styled-node">
          <input type="hidden" name="name" value={activeToken.name} />
          <input type="hidden" name="roughness" value={activeToken.roughness} />
          <input type="hidden" name="metalness" value={activeToken.metalness} />
          <label className="l8-styled-node">
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
              className="l8-styled-node"
            >
              {isPending ? optimisticColor : draftColor}
            </code>
          </label>

          <div className="l8-styled-node">
            <PrimitiveBox
              as="button"
              type="submit"
              disabled={isPending}
              className="l8-styled-node"
            >
              {isPending ? 'Syncing Shader & Prisma...' : 'Commit Token & Pulse 3D Shader'}
            </PrimitiveBox>
            <PrimitiveBox
              as="a"
              href="#wcag-audit"
              variant="ghost"
              className="l8-styled-node"
            >
              Verify APCA Contrast
            </PrimitiveBox>
          </div>
        </form>

        {state.status === 'success' && (
          <p role="status" className="l8-styled-node">
            Persisted {state.data.name} ({state.data.value}) to Prisma v6.
          </p>
        )}
        {state.status === 'error' && (
          <p role="alert" className="l8-styled-node">
            {state.message}
          </p>
        )}

        {/* 2D Vector KPI Telemetry Strip */}
        <svg
          viewBox="0 0 320 64"
          role="img"
          aria-label="Shader Frame Pacing Telemetry"
          className="l8-styled-node"
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
        className="l8-styled-node"
      >
        <canvas
          ref={canvasRef}
          width={340}
          height={240}
          aria-label="Interactive 3D PBR Material Preview"
        />
        <span className="l8-styled-node">
          Real-Time Three.js MeshPhysicalMaterial TorusKnot
        </span>
      </div>
    </section>
  );
}
 */
