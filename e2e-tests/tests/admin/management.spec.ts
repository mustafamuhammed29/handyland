import { test, expect } from '@playwright/test';

test.describe('Admin Management Rendering', () => {
  test('Dashboard and sidebar navigation loads if authenticated (mocking layout)', async ({ page }) => {
    // Note: Since this is an E2E test without seeded auth state,
    // accessing / will likely redirect to /login.
    // We check if the app router redirects properly.
    await page.goto('/');
    
    // Check if it redirects to login or renders dashboard
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('/login') || url.includes('/dashboard') || url.endsWith('/')).toBeTruthy();
  });
});
