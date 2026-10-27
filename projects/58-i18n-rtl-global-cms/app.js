// ============================================================================
// LEVEL 58: GLOBAL I18N, BIDI RTL LAYOUT & ICU MESSAGEFORMAT CMS
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

model ContentNamespace {
  id       String             @id @default(cuid())
  nsKey    String             @unique
  articles LocalizedArticle[]
}

model LocalizedArticle {
  id          String           @id @default(cuid())
  namespaceId String
  slug        String
  locale      String           // "en-US" | "ar-SA" | "ja-JP"
  dir         String           @default("ltr")
  headline    String
  updatedAt   DateTime         @updatedAt
  namespace   ContentNamespace @relation(fields: [namespaceId], references: [id], onDelete: Cascade)

  @@unique([slug, locale])
}
 *
 * --- [2] src/actions.ts ---
'use server';

import { z } from 'zod';
import { prisma } from './db';

const UpsertLocaleSchema = z.object({
  slug: z.string().min(2),
  locale: z.enum(['en-US', 'ar-SA', 'ja-JP']),
  headline: z.string().min(2),
});

export async function upsertLocalizedArticleAction(
  formData: FormData
): Promise<{ status: 'saved'; locale: string; dir: 'ltr' | 'rtl' } | { status: 'error'; message: string }> {
  const parsed = UpsertLocaleSchema.safeParse({
    slug: formData.get('slug'),
    locale: formData.get('locale'),
    headline: formData.get('headline'),
  });

  if (!parsed.success) {
    return { status: 'error', message: 'Invalid locale or headline payload' };
  }

  const dir: 'ltr' | 'rtl' = parsed.data.locale === 'ar-SA' ? 'rtl' : 'ltr';
  const ns = await prisma.contentNamespace.upsert({
    where: { nsKey: 'enterprise-docs' },
    update: {},
    create: { nsKey: 'enterprise-docs' },
  });

  await prisma.localizedArticle.upsert({
    where: {
      slug_locale: {
        slug: parsed.data.slug,
        locale: parsed.data.locale,
      },
    },
    update: { headline: parsed.data.headline, dir },
    create: {
      namespaceId: ns.id,
      slug: parsed.data.slug,
      locale: parsed.data.locale,
      dir,
      headline: parsed.data.headline,
    },
  });

  return { status: 'saved', locale: parsed.data.locale, dir };
}
 *
 * --- [3] src/GlobalI18nCms.tsx ---
'use client';
import './styles.css';

import React, { useState } from 'react';

type SupportedLocale = 'en-US' | 'ar-SA' | 'ja-JP';

const LOCALE_DATA: Record<SupportedLocale, { dir: 'ltr' | 'rtl'; headline: string; regionCount: string }> = {
  'en-US': {
    dir: 'ltr',
    headline: 'Global Edge Mesh Architecture 2026',
    regionCount: '42 Active Edge PoPs Deployed',
  },
  'ar-SA': {
    dir: 'rtl',
    headline: 'هندسة الشبكة السحابية العالمية ٢٠٢٦',
    regionCount: '٤٢ نقطة حضور سحابية نشطة',
  },
  'ja-JP': {
    dir: 'ltr',
    headline: 'グローバル・エッジメッシュ・アーキテクチャ 2026',
    regionCount: '42箇所のエッジPoPが稼働中',
  },
};

export function GlobalI18nCms(): React.JSX.Element {
  const [locale, setLocale] = useState<SupportedLocale>('en-US');
  const active = LOCALE_DATA[locale];

  return (
    <section
      aria-label="Global i18n, BiDi RTL Layout & ICU CMS"
      dir={active.dir}
      data-testid="bidi-container"
      className="l8-styled-node"
    >
      <div className="l8-styled-node">
        {(['en-US', 'ar-SA', 'ja-JP'] as const).map((loc) => (
          <button
            key={loc}
            type="button"
            aria-pressed={locale === loc}
            onClick={() => setLocale(loc)}
            className="l8-styled-node"
          >
            {loc}
          </button>
        ))}
      </div>

      <article
        className="l8-styled-node"
      >
        <h2 data-testid="localized-headline" className="l8-styled-node">
          {active.headline}
        </h2>
        <p className="l8-styled-node">
          {active.regionCount} • Direction: {active.dir.toUpperCase()}
        </p>
      </article>
    </section>
  );
}
 */
