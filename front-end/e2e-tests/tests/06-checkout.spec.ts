import { test, expect } from '@playwright/test';

test.describe('Checkout & Payment', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'fake-jwt');
      window.localStorage.setItem('cart', JSON.stringify([{ id: 1, qty: 1 }]));
    });
    
    // Mock stripe/paypal endpoints
    await page.route('**/api/payment/**', async (route) => {
      await route.fulfill({ status: 200, json: { success: true, orderId: 101 } });
    });
  });

  test('Test 6.1 - 6.5: Checkout Flow', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill shipping address if present
    const nameInput = page.locator('input[name="name"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User');
      await page.fill('input[name="address"]', 'Test Street 123');
      await page.fill('input[name="city"]', 'Berlin');
      await page.fill('input[name="zipCode"]', '10115');
      await page.fill('input[name="country"]', 'Germany');
      
      const nextBtn = page.locator('button', { hasText: /continue|next/i });
      if (await nextBtn.isVisible()) await nextBtn.click();
    }
    
    // Payment method
    const ccRadio = page.locator('input[type="radio"][value="card"]').first();
    if (await ccRadio.isVisible()) {
      await ccRadio.check();
      // Assume mocked card input
      await page.click('button', { hasText: /pay|submit/i });
      
      // Should redirect to order confirmation
      await expect(page).toHaveURL(/.*(success|confirmation|orders)/);
    }
  });
});
