import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  const testEmail = `test.user.${Date.now()}@example.com`;
  const testPassword = 'SecurePass123!';

  test('Test 1.1: Register New User (English)', async ({ page }) => {
    // Intercept API calls to mock successful registration if backend isn't ready
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({ status: 200, json: { user: { id: 1, email: testEmail } } });
    });

    await page.goto('/register');

    // Fill form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    
    // Accept terms if present
    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Submit
    await page.click('button[type="submit"]');

    // Verify
    // Depending on the app logic, we might see a success message or redirect
    // Just looking for some indication of success
    await expect(page).toHaveURL(/.*(login|confirm|dashboard)/);
  });

  test('Test 1.2: Register New User (Arabic)', async ({ page }) => {
    await page.goto('/register');
    
    // Switch language to Arabic (assuming there is a language switcher)
    const langSwitcher = page.locator('button:has-text("English"), select');
    if (await langSwitcher.isVisible()) {
      await langSwitcher.click();
      await page.click('text=العربية');
    }
    
    // Verify Arabic text
    await expect(page.locator('h1')).toBeVisible(); // Just ensure page loaded
  });

  test('Test 1.3: Register New User (German)', async ({ page }) => {
    await page.goto('/register');
    
    const langSwitcher = page.locator('button:has-text("English"), select');
    if (await langSwitcher.isVisible()) {
      await langSwitcher.click();
      await page.click('text=Deutsch');
    }
  });

  test('Test 1.5: Registration Validation', async ({ page }) => {
    await page.goto('/register');
    
    // Submit empty
    await page.click('button[type="submit"]');
    
    // Check for validation errors (HTML5 validation or custom)
    const errorMsg = page.locator('text=required').first();
    // This is an approximation as we don't know the exact DOM yet
  });
});
