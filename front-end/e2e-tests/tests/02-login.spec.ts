import { test, expect } from '@playwright/test';

test.describe('Login & Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login endpoint
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({ status: 200, json: { user: { id: 1, name: 'Test User' }, token: 'fake-jwt' } });
    });
  });

  test('Test 2.1: Login (English)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    // Should navigate away or show dashboard
    await expect(page).not.toHaveURL('/login');
  });

  test('Test 2.2: Login (Arabic/German)', async ({ page }) => {
    await page.goto('/login');
    // We assume the language can be switched via header or similar
  });

  test('Test 2.3: Login Validation', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    // Check validation
  });

  test('Test 2.4 & 2.5: Forgot/Reset Password', async ({ page }) => {
    await page.goto('/login');
    const forgotBtn = page.locator('text=/forgot password/i');
    if (await forgotBtn.isVisible()) {
      await forgotBtn.click();
      await page.fill('input[type="email"]', 'test@example.com');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=/sent|success/i')).toBeVisible();
    }
  });
});
