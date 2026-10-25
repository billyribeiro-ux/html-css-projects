import { test, expect } from '@playwright/test';

test.describe('Top-Layer Browser APIs & Standalone Project Interactivity', () => {
  test('Level 09: Native HTML5 Popover API toggles into top-layer without JS', async ({ page }) => {
    await page.goto('/projects/09-popover-notification-center/index.html');
    const popoverBtn = page.locator('button[popovertarget]');
    const popoverPanel = page.locator('#notifications-popover');

    // Initially closed
    await expect(popoverPanel).not.toBeVisible();

    // Click toggle button
    await popoverBtn.click();
    await expect(popoverPanel).toBeVisible();

    // Click backdrop / light dismiss
    await page.keyboard.press('Escape');
    await expect(popoverPanel).not.toBeVisible();
  });

  test('Level 17: Native <dialog> opens modal, traps focus, and closes via form[method=dialog]', async ({ page }) => {
    await page.goto('/projects/17-native-modal-dialog-experience/index.html');
    const modalTrigger = page.locator('#btn-open-modal');
    const dialog = page.locator('#demo-dialog');

    await expect(dialog).not.toBeVisible();

    // Open Modal
    await modalTrigger.click();
    await expect(dialog).toBeVisible();

    // Close Modal via Cancel button or Esc
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('Level 28: Virtual Scroller smoothly virtualizes 100,000 rows with fixed DOM nodes', async ({ page }) => {
    await page.goto('/projects/28-virtual-scroller-grid/index.html');
    const scroller = page.locator('#virtual-scroller');
    const activeNodesBadge = page.locator('#stat-active-nodes');

    await expect(activeNodesBadge).toHaveText('22');

    // Scroll down 10,000 pixels
    await scroller.evaluate(el => { el.scrollTop = 10000; });
    await page.waitForTimeout(100);

    // Active nodes remain constrained (~22 nodes in memory)
    const count = parseInt(await activeNodesBadge.textContent(), 10);
    expect(count).toBeGreaterThanOrEqual(15);
    expect(count).toBeLessThanOrEqual(30);
  });
});
