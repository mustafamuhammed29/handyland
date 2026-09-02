import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  // Mobile test is defined by the 'Mobile Chrome' project in playwright.config.ts
  // This just runs generic layout assertions
  test('Test 12.1 & 12.2: Mobile Layout and Navigation', async ({ page, isMobile }) => {
    // Only run if the project is mobile
    if (!isMobile) return;

    await page.goto('/');
    
    // Hamburger menu should be visible on mobile
    const hamburger = page.locator('button[aria-label*="menu"], .hamburger, #menu-btn').first();
    if (await hamburger.isVisible()) {
      await hamburger.click();
      
      // Ensure navigation opens
      const navLinks = page.locator('nav').first();
      await expect(navLinks).toBeVisible();
    }
    
    // Ensure no horizontal scroll (a proxy for this is checking body width matches viewport)
    const viewportWidth = page.viewportSize()?.width || 0;
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });
});
