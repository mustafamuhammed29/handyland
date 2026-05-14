import { test, expect } from '@playwright/test';

test.describe('Frontend Authentication Flow', () => {
  test('User can navigate to login and see form', async ({ page }) => {
    await page.goto('/login');
    
    // Check login page elements
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Login shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill form
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'WrongPass123!');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for error to appear (red alert or any error text)
    const errorAlert = page.locator('[class*="bg-red"]').first();
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
  });

  test('User can navigate to register page', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Register page should have a heading with "Konto erstellen" 
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    
    // Check for name input (using placeholder text)
    await expect(page.getByPlaceholder(/Mustermann/i)).toBeVisible({ timeout: 10000 });
    
    // Check for email input
    await expect(page.getByPlaceholder(/handyland/i)).toBeVisible();
    
    // Submit button should exist
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Register page has password strength indicator', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Type a password to trigger the strength indicator
    const passwordInput = page.getByPlaceholder('••••••••').first();
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await passwordInput.fill('Test');
    
    // Strength indicator should appear with "Schwach" label
    await expect(page.getByText(/Schwach|Ausreichend|Gut|Stark/)).toBeVisible({ timeout: 5000 });
  });
  
  test('Forgot password page renders', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');
    
    // Should have an email input
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    
    // Should have a submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
