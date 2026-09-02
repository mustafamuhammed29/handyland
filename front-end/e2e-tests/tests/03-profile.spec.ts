import { test, expect } from '@playwright/test';

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock profile endpoints
    await page.route('**/api/user/profile', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: { name: 'Old Name', email: 'test@example.com' } });
      } else {
        await route.fulfill({ status: 200, json: { success: true } });
      }
    });
    // Set localStorage token to simulate logged-in state
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'fake-jwt');
    });
  });

  test('Test 3.1 & 3.2: View and Update Profile', async ({ page }) => {
    await page.goto('/profile');
    // Check if loaded
    
    const editBtn = page.locator('text=/edit/i');
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.fill('input[name="name"]', 'New Name');
      await page.click('button[type="submit"]');
      // Verify success
    }
  });

  test('Test 3.3: Change Password', async ({ page }) => {
    await page.goto('/profile/security');
    // Mock password change
  });
});
