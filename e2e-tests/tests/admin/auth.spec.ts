import { test, expect } from '@playwright/test';

test.describe('Admin Authentication Flow', () => {
  test('Admin login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check for admin-specific login elements
    await expect(page).toHaveTitle(/Admin|HandyLand/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Admin login shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'admin_wrong@handyland.com');
    await page.fill('input[type="password"]', 'WrongPass123!');
    
    await page.click('button[type="submit"]');
    
    // Look for error message
    const errorAlert = page.locator('.text-red-500, .bg-red-500\\/10').first();
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
  });
});
