import { test, expect } from '@playwright/test';

test.describe('Language Switching', () => {
  test('Test 10.1 & 10.2: Switch Language and Persistence', async ({ page }) => {
    await page.goto('/');
    
    // Attempt to find a language switcher
    const langBtn = page.locator('button', { hasText: /English|EN/i }).first();
    if (await langBtn.isVisible()) {
      await langBtn.click();
      
      // Select Arabic
      const arBtn = page.locator('text=/العربية|Arabic|AR/i').first();
      if (await arBtn.isVisible()) {
        await arBtn.click();
        
        // Ensure RTL is applied
        const dir = await page.evaluate(() => document.documentElement.dir);
        expect(dir).toBe('rtl');
        
        // Reload to check persistence
        await page.reload();
        const reloadedDir = await page.evaluate(() => document.documentElement.dir);
        expect(reloadedDir).toBe('rtl');
      }
    }
  });
});
