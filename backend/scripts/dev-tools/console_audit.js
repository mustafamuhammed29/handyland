const puppeteer = require('puppeteer');

async function audit() {
    const urls = [
        'http://localhost:3000/',
        'http://localhost:3000/login',
        'http://localhost:3000/register',
        'http://localhost:3000/marketplace',
        'http://localhost:3000/accessories',
        'http://localhost:3000/repair',
        'http://localhost:3000/track-repair',
        'http://localhost:3000/valuation'
    ];

    console.log("🚀 Starting Frontend Console & Page Error Audit...");
    const browser = await puppeteer.launch({ headless: true });
    
    let totalErrors = 0;

    for (const url of urls) {
        console.log(`\nScanning: ${url}`);
        const page = await browser.newPage();
        
        // Listen for console messages
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error(`  [Console Error] ${msg.text()}`);
                totalErrors++;
            }
        });

        // Listen for uncaught exceptions
        page.on('pageerror', err => {
            console.error(`  [Page Uncaught Exception] ${err.toString()}`);
            totalErrors++;
        });

        try {
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
            console.log(`  Successfully loaded. No critical crashes detected.`);
        } catch (e) {
            console.error(`  [Failed to Load] ${e.message}`);
            totalErrors++;
        } finally {
            await page.close();
        }
    }

    await browser.close();
    console.log(`\n📊 Audit Finished. Total console/crashed errors: ${totalErrors}`);
}

audit();
