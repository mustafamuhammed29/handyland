/**
 * scrapeWirkaufens.js — German Market Buyback Price Scraper (wirkaufens.de)
 * 
 * Strategy:
 *  1. Read sitemap.xml to get all product URLs
 *  2. Filter only smartphone/handy products
 *  3. Fetch each page with axios + parse with cheerio
 *  4. Extract the Ankaufpreis (buyback price)
 *  5. Save as JSON and generate updated seedDevices data
 * 
 * Install: npm install axios cheerio
 * Run:     node scripts/scrapeWirkaufens.js
 * Output:  scripts/wirkaufens_prices.json
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'wirkaufens_prices.json');
const SITEMAP_URL = 'https://www.wirkaufens.de/sitemap.xml';
const DELAY_MS = 800; // polite delay between requests

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// Keywords to identify smartphones in product slugs
const PHONE_KEYWORDS = [
    'apple-iphone', 'samsung-galaxy-s', 'samsung-galaxy-z',
    'google-pixel', 'samsung-galaxy-a',
];

// Keywords to EXCLUDE (tablets, watches, etc.)
const EXCLUDE_KEYWORDS = [
    'macbook', 'ipad', 'watch', 'tab', 'tablet', 'garmin',
    'polar', 'monitor', 'lens', 'kamera', 'camera', 'sonos',
    'bose', 'jbl', 'xbox', 'playstation', 'nintendo', 'airpods',
];

function isSmartphone(url) {
    const slug = url.toLowerCase();
    const hasPhoneKeyword = PHONE_KEYWORDS.some(kw => slug.includes(kw));
    const hasExcludeKeyword = EXCLUDE_KEYWORDS.some(kw => slug.includes(kw));
    return hasPhoneKeyword && !hasExcludeKeyword;
}

async function fetchSitemapUrls() {
    console.log('📥 Fetching sitemap...');
    const res = await axios.get(SITEMAP_URL, { timeout: 15000 });
    const $ = cheerio.load(res.data, { xmlMode: true });
    const urls = [];
    $('loc').each((_, el) => urls.push($(el).text().trim()));
    console.log(`✅ Found ${urls.length} total URLs in sitemap`);
    return urls;
}

async function fetchPrice(url) {
    try {
        const res = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'de-DE,de;q=0.9',
                'Accept': 'text/html',
            }
        });

        const $ = cheerio.load(res.data);

        // Extract product name from page title/h1
        const name = $('h1').first().text().trim() ||
            $('title').text().replace('| Wirkaufens', '').trim();

        // Try multiple selectors for the price
        let price = null;
        const priceSelectors = [
            '[data-qa="product-price"]',
            '.product-price',
            '.price',
            '[class*="price"]',
            '[class*="Price"]',
            '.offer-price',
            '[class*="offer"]',
        ];

        for (const sel of priceSelectors) {
            const el = $(sel).first();
            if (el.length) {
                const text = el.text().trim();
                const match = text.match(/(\d+[,.]?\d*)\s*€|€\s*(\d+[,.]?\d*)/);
                if (match) {
                    price = parseFloat((match[1] || match[2]).replace(',', '.'));
                    break;
                }
            }
        }

        // Also try to extract from page source JSON-LD
        if (!price) {
            const jsonLd = $('script[type="application/ld+json"]').text();
            if (jsonLd) {
                try {
                    const data = JSON.parse(jsonLd);
                    if (data.offers?.price) price = parseFloat(data.offers.price);
                    else if (data.price) price = parseFloat(data.price);
                } catch { }
            }
        }

        // Try text search for price pattern anywhere in body
        if (!price) {
            const bodyText = $('body').text();
            // Look for patterns like "Ab 123 €" or "Wert: 123 €" or "123,00 €"
            const patterns = [
                /Ab\s+(\d{2,4})[,.]?\d*\s*€/i,
                /Wert[:\s]+(\d{2,4})[,.]?\d*\s*€/i,
                /(\d{2,4}),\d{2}\s*€/,
                /€\s*(\d{2,4})/,
                /(\d{2,4})\s*€/,
            ];
            for (const pattern of patterns) {
                const match = bodyText.match(pattern);
                if (match) {
                    const val = parseFloat(match[1]);
                    if (val >= 10 && val <= 2000) { // sanity check: price between 10€ and 2000€
                        price = val;
                        break;
                    }
                }
            }
        }

        return { name, price, url };
    } catch (err) {
        return { name: null, price: null, url, error: err.message.slice(0, 60) };
    }
}

function parseProductName(url) {
    // Extract model info from URL slug
    const slug = url.split('/produkte/')[1] || '';
    return slug
        .replace(/-/g, ' ')
        .replace(/\b(\d+)\s*gb\b/gi, '$1GB')
        .replace(/\b(\d+)\s*tb\b/gi, '$1TB')
        .trim();
}

function extractStorageGB(name) {
    const match = name.match(/(\d+)\s*GB/i);
    return match ? parseInt(match[1]) : 128;
}

async function scrape() {
    console.log('\n🚀 Wirkaufens.de Price Scraper Starting...\n');

    // Fetch sitemap
    const allUrls = await fetchSitemapUrls();

    // Filter only smartphones
    const phoneUrls = allUrls.filter(isSmartphone);
    console.log(`📱 Found ${phoneUrls.length} smartphone URLs to scrape\n`);
    console.log('Sample URLs:');
    phoneUrls.slice(0, 5).forEach(u => console.log(' ', u));
    console.log('...\n');

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < phoneUrls.length; i++) {
        const url = phoneUrls[i];
        const slugName = parseProductName(url);
        process.stdout.write(`[${i + 1}/${phoneUrls.length}] ${slugName.slice(0, 50).padEnd(50)} `);

        const result = await fetchPrice(url);

        if (result.price) {
            console.log(`✅ ${result.price}€`);
            successCount++;
        } else {
            console.log(`⚠️  no price found`);
            failCount++;
        }

        results.push({
            slug: parseProductName(url),
            url,
            name: result.name || slugName,
            price: result.price,
            storageGB: extractStorageGB(slugName),
            error: result.error,
        });

        // Polite delay
        if (i < phoneUrls.length - 1) {
            await delay(DELAY_MS);
        }
    }

    console.log(`\n\n📊 Results:`);
    console.log(`  ✅ Prices found: ${successCount}`);
    console.log(`  ⚠️  No price: ${failCount}`);
    console.log(`  📱 Total: ${results.length}`);

    // Save full results
    const output = {
        scrapedAt: new Date().toISOString(),
        source: 'wirkaufens.de',
        totalScraped: results.length,
        successCount,
        failCount,
        devices: results.filter(r => r.price).sort((a, b) => b.price - a.price),
        noPrice: results.filter(r => !r.price),
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`\n💾 Saved to: ${OUTPUT_FILE}`);

    // Print summary table
    console.log('\n\n📱 TOP DEVICES WITH PRICES:');
    console.log('='.repeat(70));
    output.devices.slice(0, 30).forEach(d => {
        console.log(`  ${d.name.slice(0, 45).padEnd(45)} | ${d.price}€`);
    });
    console.log('='.repeat(70));

    // Generate seed data suggestion
    const seedData = output.devices.map(d => ({
        name: d.name,
        basePrice: d.price,
        storage: d.storageGB,
        source: 'wirkaufens.de',
    }));

    const seedOutputFile = path.join(__dirname, 'wirkaufens_seed_data.json');
    fs.writeFileSync(seedOutputFile, JSON.stringify(seedData, null, 2));
    console.log(`\n🌱 Seed data saved to: ${seedOutputFile}`);
    console.log('\n✅ Done! You can now update seedDevices.js with real prices.');
}

scrape().catch(console.error);
