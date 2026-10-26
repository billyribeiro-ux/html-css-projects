import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('DPE L8++ Curriculum Contract & Architectural Integrity', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const dataFile = path.join(rootDir, 'projects-data.js');

  it('projects-data.js exists and loads valid JSON', () => {
    expect(fs.existsSync(dataFile)).toBe(true);
    const content = fs.readFileSync(dataFile, 'utf-8');
    expect(content).toContain('const PROJECTS_DATA = ');
    const jsonStr = content.split('const PROJECTS_DATA = ')[1].replace(/;\s*$/, '');
    const data = JSON.parse(jsonStr);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(60);
  });

  const content = fs.readFileSync(dataFile, 'utf-8');
  const jsonStr = content.split('const PROJECTS_DATA = ')[1].replace(/;\s*$/, '');
  const projects = JSON.parse(jsonStr);

  it('every project folder exists on disk with index.html and styles.css (plus Prisma/Next.js/React artifacts for Series 3)', () => {
    projects.forEach((p, idx) => {
      const projectDir = path.join(rootDir, 'projects', p.folder);
      expect(fs.existsSync(projectDir), `Missing folder: ${p.folder}`).toBe(true);
      expect(fs.existsSync(path.join(projectDir, 'index.html')), `Missing index.html in ${p.folder}`).toBe(true);
      expect(fs.existsSync(path.join(projectDir, 'styles.css')), `Missing styles.css in ${p.folder}`).toBe(true);
      if (idx >= 20) {
        expect(fs.existsSync(path.join(projectDir, 'app.js')), `Missing app.js in ${p.folder}`).toBe(true);
      }
      if (idx >= 40) {
        expect(fs.existsSync(path.join(projectDir, 'prisma', 'schema.prisma')), `Missing schema.prisma in ${p.folder}`).toBe(true);
        expect(fs.existsSync(path.join(projectDir, 'src', 'actions.ts')), `Missing src/actions.ts in ${p.folder}`).toBe(true);
      }
    });
  });

  it('every project has exactly 5 deep, actionable reproduction steps (>240 chars)', () => {
    projects.forEach((p) => {
      expect(p.steps, `Project ${p.folder} step count mismatch`).toHaveLength(5);
      p.steps.forEach((step, sIdx) => {
        expect(step.title, `Empty step title in ${p.folder} step ${sIdx + 1}`).toBeTruthy();
        expect(step.content, `Empty step content in ${p.folder} step ${sIdx + 1}`).toBeTruthy();
        expect(step.content.length, `Step narrative too short in ${p.folder} step ${sIdx + 1}`).toBeGreaterThanOrEqual(240);
      });
    });
  });

  it('every project embeds valid Schema.org JSON-LD structured data', () => {
    projects.forEach((p) => {
      expect(p.html).toContain('application/ld+json');
      const matches = p.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      expect(matches, `Failed to extract JSON-LD from ${p.folder}`).not.toBeNull();
      const parsed = JSON.parse(matches[1]);
      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['headline'] || parsed['name']).toBeTruthy();
    });
  });

  it('maintains strict separation between Series 1 (Zero-JS) and Series 2 (Advanced JS)', () => {
    projects.forEach((p, idx) => {
      if (idx < 20) {
        // Series 1: Declarative CSS architecture, pure browser capabilities
        expect(p.js.trim(), `Series 1 project ${p.folder} should have zero JS runtime`).toBe('');
      } else {
        // Series 2: Advanced JavaScript & Systems architecture
        expect(p.js.trim().length, `Series 2 project ${p.folder} missing active JS engine`).toBeGreaterThan(50);
      }
    });
  });
});
