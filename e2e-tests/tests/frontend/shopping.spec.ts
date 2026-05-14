import { test, expect } from '@playwright/test';

test.describe('Frontend Shopping Flow', () => {
  test('Cart page renders empty state correctly', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    // Empty cart shows "Your Cart is Empty" or the German equivalent
    await expect(page.getByText(/cart is empty|warenkorb ist leer|Your Cart/i).first()).toBeVisible({ timeout: 10000 });
    
    // Should have a "Continue Shopping" button
    await expect(page.getByText(/continue shopping|weiter einkaufen/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('User can navigate to checkout', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    // Page loads without 404
    await expect(page).toHaveTitle(/HandyLand/i);
  });
});
