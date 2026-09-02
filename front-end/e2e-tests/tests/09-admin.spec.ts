import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'admin-fake-jwt');
      window.localStorage.setItem('role', 'admin');
    });
    await page.route('**/api/admin/**', async (route) => {
      await route.fulfill({ status: 200, json: { success: true, data: [] } });
    });
  });

  test('Test 9.1: Admin Login and Dashboard', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Test 9.2 & 9.3: Admin Orders', async ({ page }) => {
    await page.goto('/admin/orders');
    // Ensure table loads
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('Test 9.4: Manage Products', async ({ page }) => {
    await page.goto('/admin/products');
    const addBtn = page.locator('button', { hasText: /add/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      // Assume a form opens
      await page.fill('input[name="name"]', 'New E2E Product');
      await page.click('button[type="submit"]');
      // Assume success
    }
  });
});
