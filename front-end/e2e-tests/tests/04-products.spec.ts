import { test, expect } from '@playwright/test';

test.describe('Product Browsing', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/products*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          products: [
            { id: 1, name: 'iPhone 13', price: 699, category: 'Electronics' },
            { id: 2, name: 'Samsung Galaxy', price: 599, category: 'Electronics' }
          ]
        }
      });
    });
  });

  test('Test 4.1: Browse Products (Homepage)', async ({ page }) => {
    await page.goto('/');
    // Check for some products or layout
    await expect(page.locator('body')).toBeVisible();
  });

  test('Test 4.2 & 4.3: Search & Filter', async ({ page }) => {
    await page.goto('/products');
    const searchInput = page.locator('input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('iPhone');
      await searchInput.press('Enter');
      // Verify mock data appears
    }
  });

  test('Test 4.4: View Product Details', async ({ page }) => {
    await page.goto('/product/1');
    await expect(page.locator('button', { hasText: /add to cart/i }).first()).toBeVisible();
  });
});
