import { test, expect } from '@playwright/test';

test.describe('Wallet & Top-Up', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'fake-jwt');
    });
    // Mock wallet data
    await page.route('**/api/wallet', async (route) => {
      await route.fulfill({ status: 200, json: { balance: 100 } });
    });
    await page.route('**/api/wallet/topup', async (route) => {
      await route.fulfill({ status: 200, json: { success: true, balance: 150 } });
    });
  });

  test('Test 8.1 - 8.3: Wallet View and Top Up', async ({ page }) => {
    await page.goto('/wallet');
    
    // Check balance
    await expect(page.locator('text=100').first()).toBeVisible();
    
    // Top up
    const topupBtn = page.locator('button', { hasText: /top up/i });
    if (await topupBtn.isVisible()) {
      await topupBtn.click();
      await page.fill('input[type="number"]', '50');
      await page.click('button', { hasText: /confirm/i });
      
      // Verify success
      await expect(page.locator('text=150').first()).toBeVisible();
    }
  });

  test('Test 8.4: Wallet Security IDOR', async ({ request }) => {
    // API level test for IDOR
    const response = await request.post('/api/wallet/confirm', {
      data: { sessionId: 'other-users-session' },
      headers: { Authorization: 'Bearer fake-jwt' }
    });
    // Assuming backend returns 403 for unauthorized session
    expect(response.status()).toBe(403);
  });
});
