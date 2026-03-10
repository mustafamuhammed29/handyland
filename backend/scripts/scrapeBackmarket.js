/**
 * scrapeBackmarket.js — BackMarket DE Buyback Price Scraper
 * Uses Puppeteer to navigate the buyback funnel and extract real prices.
 * 
 * Install: npm install puppeteer
 * Run:     node scripts/scrapeBackmarket.js
 * 
 * Output:  scripts/backmarket_prices.json
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.backmarket.de/de-de/buyback-funnel/device/smartphone/smartphone';
const OUTPUT_FILE = path.join(__dirname, 'backmarket_prices.json');

// Models we care about — covers top 80% of device trade-ins
const TARGET_BRANDS = ['Apple', 'Samsung', 'Google'];

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function scrape() {
    console.log('🚀 Starting BackMarket scraper...');

    const browser = await puppeteer.launch({
        headless: false, // visible so we can handle any CAPTCHA
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
        ],
        defaultViewport: { width: 1280, height: 800 },
    });

    const page = await browser.newPage();

    // Spoof user agent to avoid bot detection
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    // Intercept API responses to capture price data
    const capturedPrices = {};
    page.on('response', async (response) => {
        const url = response.url();
        // Look for buyback-related JSON endpoints
        if (url.includes('buyback') && url.includes('price')) {
            try {
                const json = await response.json();
                console.log('📡 Captured API response:', url.slice(0, 80));
                if (json.data?.price || json.price || json.estimatedValue) {
                    capturedPrices[url] = json;
                }
            } catch { }
        }
    });

    try {
        console.log('🌐 Opening BackMarket...');
        await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(3000);

        // Accept cookies if dialog appears
        try {
            const cookieBtn = await page.$('[data-qa="cookie-accept-all"], button[aria-label*="Accept"], button[aria-label*="Akzeptieren"]');
            if (cookieBtn) { await cookieBtn.click(); await delay(1000); }
        } catch { }

        // Get page content to find device list
        const pageContent = await page.content();

        // Extract JSON data from Next.js __NEXT_DATA__ or window state
        const nextData = await page.evaluate(() => {
            const el = document.getElementById('__NEXT_DATA__');
            if (el) return JSON.parse(el.textContent);
            return null;
        });

        let devices = [];

        if (nextData) {
            console.log('✅ Found __NEXT_DATA__');
            // Navigate into the data structure to find devices
            const props = nextData?.props?.pageProps;
            const deviceList = props?.devices || props?.products || props?.models || [];
            devices = deviceList;
            console.log(`Found ${deviceList.length} devices in page data`);
        }

        // Also try to extract from rendered HTML
        const renderedDevices = await page.evaluate(() => {
            const items = [];
            // Look for price elements
            document.querySelectorAll('[class*="product"], [class*="device"], [data-qa*="product"]').forEach(el => {
                const name = el.querySelector('[class*="title"], h2, h3, [class*="name"]')?.textContent?.trim();
                const price = el.querySelector('[class*="price"], [class*="value"]')?.textContent?.trim();
                if (name && price) items.push({ name, price });
            });
            return items;
        });

        console.log(`Found ${renderedDevices.length} rendered devices`);

        // Save raw data
        const output = {
            scrapedAt: new Date().toISOString(),
            url: BASE_URL,
            nextData: nextData ? 'found' : 'not found',
            renderedDevices,
            capturedApiResponses: Object.keys(capturedPrices).length,
            capturedPrices,
            rawNextData: nextData,
        };

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
        console.log(`\n💾 Saved to: ${OUTPUT_FILE}`);
        console.log(`\n📊 Summary:`);
        console.log(`  - Rendered devices: ${renderedDevices.length}`);
        console.log(`  - API responses captured: ${Object.keys(capturedPrices).length}`);

        if (renderedDevices.length > 0) {
            console.log('\n📱 Sample devices found:');
            renderedDevices.slice(0, 10).forEach(d => console.log(`  ${d.name}: ${d.price}`));
        }

    } catch (error) {
        console.error('❌ Scraping error:', error.message);
    }

    console.log('\n⏸️  Browser will close in 10 seconds...');
    await delay(10000);
    await browser.close();
    console.log('✅ Done!');
}

scrape();
