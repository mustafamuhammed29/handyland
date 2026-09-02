import { test, expect } from '@playwright/test';

test.describe('Order Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'fake-jwt');
    });
    await page.route('**/api/orders*', async (route) => {
      await route.fulfill({ status: 200, json: { orders: [{ id: 101, status: 'Processing', total: 699 }] } });
    });
  });

  test('Test 7.1 - 7.3: View and Track Orders', async ({ page }) => {
    await page.goto('/orders');
    
    // Ensure order is visible
    await expect(page.locator('text=101').first()).toBeVisible();
    
    // Click order details
    const orderLink = page.locator('a[href*="/order"]').first();
    if (await orderLink.isVisible()) {
      await orderLink.click();
      await expect(page.locator('text=Processing')).toBeVisible();
    }
  });
});
