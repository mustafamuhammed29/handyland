/**
 * scrapeBackmarket2.js — BackMarket DE Buyback Price Scraper v2
 * Intercepts XHR/Fetch API calls to get real price data.
 * 
 * Run: node scripts/scrapeBackmarket2.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'backmarket_prices.json');
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// iPhone models to query
const IPHONE_MODELS = [
    'iphone-16-pro-max', 'iphone-16-pro', 'iphone-16-plus', 'iphone-16',
    'iphone-15-pro-max', 'iphone-15-pro', 'iphone-15-plus', 'iphone-15',
    'iphone-14-pro-max', 'iphone-14-pro', 'iphone-14-plus', 'iphone-14',
    'iphone-13-pro-max', 'iphone-13-pro', 'iphone-13', 'iphone-13-mini',
    'iphone-12-pro-max', 'iphone-12-pro', 'iphone-12', 'iphone-12-mini',
    'iphone-11-pro-max', 'iphone-11-pro', 'iphone-11',
];

async function scrapeModel(page, modelSlug, allResponses) {
    const url = `https://www.backmarket.de/de-de/buyback-funnel/device/smartphone/${modelSlug}`;
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await delay(2000);

        // Try to get __NEXT_DATA__
        const data = await page.evaluate(() => {
            const el = document.getElementById('__NEXT_DATA__');
            if (!el) return null;
            try { return JSON.parse(el.textContent); } catch { return null; }
        });

        // Also get all text containing prices from page
        const priceText = await page.evaluate(() => {
            const selectors = [
                '[data-qa="buyback-price"]',
                '[class*="price"]',
                '[class*="Price"]',
                '[class*="offer"]',
                '[class*="value"]',
            ];
            const results = [];
            for (const sel of selectors) {
                document.querySelectorAll(sel).forEach(el => {
                    const text = el.textContent?.trim();
                    if (text && (text.includes('€') || text.match(/\d+/))) {
                        results.push({ selector: sel, text });
                    }
                });
            }
            return results;
        });

        if (data || priceText.length > 0) {
            console.log(`✅ ${modelSlug}: ${priceText.length} price elements found`);
            allResponses[modelSlug] = { nextData: data, priceElements: priceText };
        } else {
            console.log(`⚠️  ${modelSlug}: no data`);
        }
    } catch (e) {
        console.log(`❌ ${modelSlug}: ${e.message.slice(0, 60)}`);
    }
}

async function scrape() {
    console.log('🚀 BackMarket Scraper v2 starting...\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--window-size=1280,800',
        ],
        defaultViewport: { width: 1280, height: 800 },
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // Capture all API/XHR/fetch responses
    const apiData = {};
    page.on('response', async (response) => {
        const url = response.url();
        const ct = response.headers()['content-type'] || '';
        if (!ct.includes('json')) return;
        if (!url.includes('backmarket')) return;
        try {
            const json = await response.json();
            const hasPrice = JSON.stringify(json).includes('price') || JSON.stringify(json).includes('€');
            if (hasPrice) {
                apiData[url.slice(0, 120)] = json;
                console.log('📡 API data captured:', url.slice(0, 80));
            }
        } catch { }
    });

    // First visit landing page & accept cookies
    console.log('Opening BackMarket landing page...');
    await page.goto('https://www.backmarket.de/de-de/buyback-funnel/device/smartphone/smartphone?brand=Apple', {
        waitUntil: 'networkidle2', timeout: 30000
    });
    await delay(3000);

    // Accept cookies
    try {
        await page.click('[data-qa="cookie-accept-all"], [aria-label*="Accept"], [aria-label*="Akzeptieren"], button.cookie-accept');
        await delay(1000);
    } catch { }

    // Get all JSON data embedded in the page
    const landingData = await page.evaluate(() => {
        const el = document.getElementById('__NEXT_DATA__');
        if (!el) return null;
        try { return JSON.parse(el.textContent); } catch { return null; }
    });

    const allResults = {
        scrapedAt: new Date().toISOString(),
        landingPageData: landingData,
        apiResponses: apiData,
        modelPages: {}
    };

    // Save landing page data first
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allResults, null, 2));
    console.log('\n💾 Landing page data saved');

    if (landingData) {
        const json = JSON.stringify(landingData);
        console.log(`✅ __NEXT_DATA__ found! Size: ${(json.length / 1024).toFixed(1)}KB`);
        // Print any price-like keys found
        const prices = [];
        const walk = (obj, path = '') => {
            if (!obj || typeof obj !== 'object') return;
            for (const [k, v] of Object.entries(obj)) {
                const fullPath = `${path}.${k}`;
                if ((k.toLowerCase().includes('price') || k.toLowerCase().includes('value')) && typeof v === 'number') {
                    prices.push(`${fullPath}: ${v}`);
                }
                if (typeof v === 'object') walk(v, fullPath);
            }
        };
        walk(landingData);
        console.log('\n💰 Price fields found in page data:');
        prices.slice(0, 20).forEach(p => console.log('  ', p));
    }

    // Scrape a few key model pages  
    console.log('\n\nScraping individual model pages...');
    for (const model of IPHONE_MODELS.slice(0, 8)) {
        await scrapeModel(page, model, allResults.modelPages);
        await delay(1500);
    }

    // Save final results
    allResults.apiResponses = apiData;
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allResults, null, 2));
    console.log(`\n\n💾 Full results saved to: ${OUTPUT_FILE}`);
    console.log(`📊 API responses: ${Object.keys(apiData).length}`);
    console.log(`📱 Model pages: ${Object.keys(allResults.modelPages).length}`);

    await delay(5000);
    await browser.close();
}

scrape().catch(console.error);
