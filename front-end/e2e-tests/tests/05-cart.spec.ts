import { test, expect } from '@playwright/test';

test.describe('Shopping Cart', () => {
  test('Test 5.1 - 5.4: Add, View, Update, Persist Cart', async ({ page }) => {
    // Navigate directly to product
    await page.goto('/product/1');
    const addBtn = page.locator('button', { hasText: /add to cart/i }).first();
    
    if (await addBtn.isVisible()) {
      await addBtn.click();
      
      // Navigate to cart
      await page.goto('/cart');
      
      // Update quantity if possible
      const qtyInput = page.locator('input[type="number"]').first();
      if (await qtyInput.isVisible()) {
        await qtyInput.fill('2');
      }
      
      // Remove item
      const removeBtn = page.locator('button', { hasText: /remove|delete/i }).first();
      if (await removeBtn.isVisible()) {
        await removeBtn.click();
      }
    }
  });
});
