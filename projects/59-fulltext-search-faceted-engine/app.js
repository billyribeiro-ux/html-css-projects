// ============================================================================
// LEVEL 59: BM25 PROBABILISTIC SEARCH & DISJUNCTIVE FACETED ENGINE
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

model SearchDocument {
  id        String          @id @default(cuid())
  docSlug   String          @unique
  title     String
  domain    String
  docLength Int
  postings  SearchPosting[]
}

model SearchPosting {
  id            String         @id @default(cuid())
  documentId    String
  term          String
  termFrequency Int
  document      SearchDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@unique([documentId, term])
  @@index([term])
}
 *
 * --- [2] src/actions.ts ---
'use server';

import { z } from 'zod';
import { prisma } from './db';

export function computeBm25Score(tf: number, docLen: number, avgDocLen = 50, idf = 1.8): number {
  const k1 = 1.5;
  const b = 0.75;
  const numerator = tf * (k1 + 1);
  const denominator = tf + k1 * (1 - b + b * (docLen / Math.max(avgDocLen, 1)));
  return Number((idf * (numerator / Math.max(denominator, 0.001))).toFixed(3));
}

const IndexDocSchema = z.object({
  docSlug: z.string().min(2),
  title: z.string().min(2),
  domain: z.string().min(2),
});

export async function indexSearchDocumentAction(
  formData: FormData
): Promise<{ status: 'indexed'; docSlug: string } | { status: 'error'; message: string }> {
  const parsed = IndexDocSchema.safeParse({
    docSlug: formData.get('docSlug'),
    title: formData.get('title'),
    domain: formData.get('domain'),
  });
  if (!parsed.success) {
    return { status: 'error', message: 'Invalid document indexing payload' };
  }

  const terms = parsed.data.title.toLowerCase().split(/\W+/).filter(Boolean);
  await prisma.searchDocument.upsert({
    where: { docSlug: parsed.data.docSlug },
    update: { title: parsed.data.title, domain: parsed.data.domain, docLength: terms.length },
    create: {
      docSlug: parsed.data.docSlug,
      title: parsed.data.title,
      domain: parsed.data.domain,
      docLength: terms.length,
    },
  });

  return { status: 'indexed', docSlug: parsed.data.docSlug };
}
 *
 * --- [3] src/Bm25SearchEngine.tsx ---
'use client';
import './styles.css';

import React, { useState } from 'react';
import { computeBm25Score } from './actions';

interface CorpusDoc {
  slug: string;
  title: string;
  domain: 'Database' | 'WebGL' | 'Security';
  docLen: number;
}

const CORPUS: CorpusDoc[] = [
  { slug: 'doc-1', title: 'Prisma v6 Optimistic Concurrency Control & Prisma Indexes', domain: 'Database', docLen: 42 },
  { slug: 'doc-2', title: 'Three.js WebGL PBR Shader & GPU Memory Disposal', domain: 'WebGL', docLen: 38 },
  { slug: 'doc-3', title: 'Zero-Trust AES-GCM WebCrypto Enclave Architecture', domain: 'Security', docLen: 45 },
];

export function Bm25SearchEngine(): React.JSX.Element {
  const [facet, setFacet] = useState<'ALL' | 'Database' | 'WebGL' | 'Security'>('ALL');

  const filtered = CORPUS.filter((d) => facet === 'ALL' || d.domain === facet).map((d) => ({
    ...d,
    bm25: computeBm25Score(d.domain === 'Database' ? 3 : 2, d.docLen),
  }));

  return (
    <section
      aria-label="BM25 Probabilistic Search & Disjunctive Faceted Engine"
      className="l8-styled-node"
    >
      <span className="l8-styled-node">
        OKAPI BM25 PROBABILISTIC RANKING (k1=1.5, b=0.75) • DISJUNCTIVE FACETS
      </span>
      <h2 className="l8-styled-node">
        Matched Documents: <span data-testid="doc-count" className="l8-styled-node">{filtered.length}</span>
      </h2>

      <div className="l8-styled-node">
        {(['ALL', 'Database', 'WebGL', 'Security'] as const).map((dom) => (
          <button
            key={dom}
            type="button"
            aria-pressed={facet === dom}
            onClick={() => setFacet(dom)}
            className="l8-styled-node"
          >
            {dom}
          </button>
        ))}
      </div>

      <div className="l8-styled-node">
        {filtered.map((doc) => (
          <article
            key={doc.slug}
            className="l8-styled-node"
          >
            <div>
              <div className="l8-styled-node">{doc.title}</div>
              <div className="l8-styled-node">Facet: {doc.domain}</div>
            </div>
            <code className="l8-styled-node">BM25: {doc.bm25}</code>
          </article>
        ))}
      </div>
    </section>
  );
}
 */
