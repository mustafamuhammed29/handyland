const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Capture console logs
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));

    // Capture failed network requests
    page.on('response', response => {
        if (!response.ok()) {
            console.log(`NETWORK ERROR: ${response.status()} ${response.url()}`);
        }
    });

    console.log('Navigating to login...');
    await page.goto('http://localhost:3000/login');

    console.log('Logging in...');
    await page.fill('input[type="email"]', 'admin@handyland.com');
    await page.fill('input[type="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');

    console.log('Waiting for successful login / dashboard redirect...');
    await page.waitForTimeout(3000);

    // Go back to home page to see Navbar
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);

    // Refresh
    console.log('Refreshing page...');
    await page.reload();
    await page.waitForTimeout(3000); // 3 seconds to let auth logic run

    console.log('Done script.');
    await browser.close();
})();
