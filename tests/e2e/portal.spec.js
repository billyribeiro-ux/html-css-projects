import { test, expect } from '@playwright/test';

test.describe('Master Teaching Portal Studio & Monaco IDE', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the project navigation list to be populated
    await page.waitForSelector('.project-nav-item');
  });

  test('loads all 40 progressive curriculum projects in the sidebar', async ({ page }) => {
    const navItems = page.locator('.project-nav-item');
    await expect(navItems).toHaveCount(40);
  });

  test('filters projects correctly using series segmented filter pills', async ({ page }) => {
    const filterAll = page.locator('button[data-filter="all"]');
    const filterSeries1 = page.locator('button[data-filter="series1"]');
    const filterSeries2 = page.locator('button[data-filter="series2"]');
    const navItems = page.locator('.project-nav-item');

    // Filter Series 1: Declarative CSS Architecture (01-20)
    await filterSeries1.click();
    await expect(navItems).toHaveCount(20);
    await expect(page.locator('.project-nav-item').first()).toContainText('Level 01');

    // Filter Series 2: Advanced JS & Systems (21-40)
    await filterSeries2.click();
    await expect(navItems).toHaveCount(20);
    await expect(page.locator('.project-nav-item').first()).toContainText('Level 21');

    // Reset to All
    await filterAll.click();
    await expect(navItems).toHaveCount(40);
  });

  test('filters projects in real time using the search bar', async ({ page }) => {
    const searchInput = page.locator('#project-search');
    await searchInput.fill('Subgrid');
    const navItems = page.locator('.project-nav-item');
    // At least Level 06 and Level 20 feature Subgrid
    const count = await navItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await expect(navItems.first()).toContainText('Subgrid');
  });

  test('navigates sequentially using [ and ] keyboard hotkeys and header buttons', async ({ page }) => {
    const headerCounter = page.locator('#header-counter');
    const btnNext = page.locator('#btn-next-project');
    const btnPrev = page.locator('#btn-prev-project');

    await expect(headerCounter).toHaveText('Project 01 of 40');
    await expect(btnPrev).toBeDisabled();

    // Click next button
    await btnNext.click();
    await expect(headerCounter).toHaveText('Project 02 of 40');
    await expect(btnPrev).toBeEnabled();

    // Press '[' keyboard shortcut to go back
    await page.keyboard.press('[');
    await expect(headerCounter).toHaveText('Project 01 of 40');

    // Press ']' keyboard shortcut to step forward
    await page.keyboard.press(']');
    await expect(headerCounter).toHaveText('Project 02 of 40');
  });

  test('switches editor tabs and renders Live Preview iframe', async ({ page }) => {
    const tabHtml = page.locator('#tab-html');
    const tabCss = page.locator('#tab-css');
    const tabJs = page.locator('#tab-js');
    const tabPreview = page.locator('#tab-preview');
    const previewIframe = page.locator('#preview-iframe');

    // HTML active by default
    await expect(tabHtml).toHaveClass(/active/);

    // Switch to CSS
    await tabCss.click();
    await expect(tabCss).toHaveClass(/active/);

    // Switch to JS
    await tabJs.click();
    await expect(tabJs).toHaveClass(/active/);

    // Switch to Live Preview
    await tabPreview.click();
    await expect(tabPreview).toHaveClass(/active/);
    await expect(previewIframe).toBeVisible();
  });

  test('opens and dismisses the Keyboard Navigation HUD dialog (? shortcut)', async ({ page }) => {
    const dialog = page.locator('#shortcuts-dialog');
    await expect(dialog).not.toBeVisible();

    // Trigger HUD via '?' shortcut
    await page.keyboard.press('?');
    await expect(dialog).toBeVisible();

    // Dismiss HUD via Escape
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});
