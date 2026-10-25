import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Automated WCAG 2.2 AAA Accessibility Audits', () => {
  test('Master Portal complies with WCAG 2.2 standards', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.project-nav-item');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Level 01 Fluid Typography Card complies with WCAG 2.2 AAA standards', async ({ page }) => {
    await page.goto('/projects/01-fluid-typography-card/index.html');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Level 06 Responsive Pricing Matrix complies with WCAG 2.2 AAA standards', async ({ page }) => {
    await page.goto('/projects/06-responsive-pricing-matrix/index.html');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
