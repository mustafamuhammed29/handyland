/**
 * ebayPriceService.js — eBay Finding API Integration
 *
 * 🇩🇪 Holt aktuelle Ankaufspreise für gebrauchte Smartphones vom deutschen eBay-Markt.
 *
 * API: eBay Finding API (kostenlos, kein OAuth nötig, nur App ID)
 * Dokumentation: https://developer.ebay.com/api-docs/static/finding-call-reference.html
 *
 * Methode: findCompletedItems → zeigt tatsächlich verkaufte Artikel (echte Marktpreise)
 * Kategorie: 15032 = "Handys & Smartphones" auf eBay.de (siteid=77)
 */

const https = require('https');

// eBay Germany site ID + category
const EBAY_SITE_ID = 77;           // Germany
const EBAY_CATEGORY_ID = '15032';  // Handys & Smartphones
const EBAY_API_BASE = 'svcs.ebay.com';

/**
 * Fetches completed (sold) eBay.de listings for a specific device.
 * Returns average price, min, max, and sample count from the last ~90 days.
 *
 * @param {string} modelName - e.g. "iPhone 15 Pro"
 * @param {string} storage   - e.g. "128GB"
 * @param {string} appId     - eBay App ID from environment
 * @returns {Promise<{ avg: number, min: number, max: number, count: number, samples: Array }>}
 */
async function fetchEbayPrices(modelName, storage = '', appId) {
    if (!appId || appId === 'YOUR_EBAY_APP_ID_HERE') {
        throw new Error('EBAY_APP_ID nicht konfiguriert. Bitte in .env eintragen.');
    }

    // Build search keyword (removed 'gebraucht' because we already use the Condition itemFilter)
    const keyword = storage
        ? `${modelName} ${storage}`
        : `${modelName}`;

    const params = new URLSearchParams({
        'OPERATION-NAME': 'findCompletedItems',
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': appId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': '',
        'keywords': keyword,
        'categoryId': EBAY_CATEGORY_ID,
        'siteid': EBAY_SITE_ID,

        // Filter: only sold items
        'itemFilter(0).name': 'SoldItemsOnly',
        'itemFilter(0).value': 'true',

        // Filter: Used condition only (3000 = Used, 2500 = Very Good, 2000 = Good)
        'itemFilter(1).name': 'Condition',
        'itemFilter(1).value(0)': '2000',  // Gut
        'itemFilter(1).value(1)': '2500',  // Sehr gut
        'itemFilter(1).value(2)': '3000',  // Normaler Gebrauch

        // Filter: EUR only (exclude shipping-only items)
        'itemFilter(2).name': 'Currency',
        'itemFilter(2).value': 'EUR',

        // Filter: min price €30 to exclude broken/parts-only
        'itemFilter(3).name': 'MinPrice',
        'itemFilter(3).value': '30',
        'itemFilter(3).paramName': 'Currency',
        'itemFilter(3).paramValue': 'EUR',

        'paginationInput.entriesPerPage': '50',
        'paginationInput.pageNumber': '1',

        // Sort by end time (most recent first)
        'sortOrder': 'EndTimeSoonest',

        // Only buy-it-now + auction (both)
        'outputSelector': 'SellerInfo',
    });

    const path = `/services/search/FindingService/v1?${params.toString()}`;

    return new Promise((resolve, reject) => {
        const options = {
            hostname: EBAY_API_BASE,
            path,
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const response = json?.findCompletedItemsResponse?.[0];

                    if (!response) {
                        console.error('\n[EBAY API RAW RESPONSE]:', data, '\n');
                        return reject(new Error('Invalid eBay API response'));
                    }

                    // Check for API errors
                    const ack = response.ack?.[0];
                    if (ack === 'Failure') {
                        const errMsg = response.errorMessage?.[0]?.error?.[0]?.message?.[0] || 'eBay API error';
                        return reject(new Error(errMsg));
                    }

                    const items = response.searchResult?.[0]?.item || [];
                    const totalItems = parseInt(response.searchResult?.[0]?.['@count'] || '0');

                    if (items.length === 0) {
                        return resolve({ avg: null, min: null, max: null, count: 0, samples: [], keyword });
                    }

                    // Extract prices (currentPrice = final sold price)
                    const prices = items
                        .map(item => {
                            const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] || '0');
                            return {
                                price,
                                title: item.title?.[0] || '',
                                condition: item.condition?.[0]?.conditionDisplayName?.[0] || '',
                                url: item.viewItemURL?.[0] || '',
                                soldDate: item.listingInfo?.[0]?.endTime?.[0] || '',
                            };
                        })
                        .filter(i => i.price > 30 && i.price < 3000); // sanity range

                    if (prices.length === 0) {
                        return resolve({ avg: null, min: null, max: null, count: 0, samples: [], keyword });
                    }

                    // Calculate statistics
                    const values = prices.map(p => p.price);
                    const sum = values.reduce((a, b) => a + b, 0);
                    const avg = Math.round(sum / values.length);
                    const min = Math.round(Math.min(...values));
                    const max = Math.round(Math.max(...values));

                    // Remove outliers: only keep within 1.5 standard deviations
                    const mean = sum / values.length;
                    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
                    const filtered = prices.filter(p => Math.abs(p.price - mean) <= 1.5 * stdDev);

                    const filteredValues = filtered.map(p => p.price);
                    const filteredAvg = filteredValues.length > 0
                        ? Math.round(filteredValues.reduce((a, b) => a + b, 0) / filteredValues.length)
                        : avg;

                    resolve({
                        avg: filteredAvg,
                        rawAvg: avg,
                        min,
                        max,
                        count: prices.length,
                        totalFound: totalItems,
                        samples: prices.slice(0, 5), // top 5 examples
                        keyword,
                        // Suggested buyback price (55-65% of used market avg)
                        suggestedBuyback: {
                            conservative: Math.round((filteredAvg * 0.52) / 5) * 5,  // 52% (safe margin)
                            balanced:     Math.round((filteredAvg * 0.58) / 5) * 5,  // 58% (competitive)
                            aggressive:   Math.round((filteredAvg * 0.65) / 5) * 5,  // 65% (market leader)
                        }
                    });
                } catch (err) {
                    reject(new Error(`eBay response parse error: ${err.message}`));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('eBay API timeout after 10s'));
        });
        req.end();
    });
}

/**
 * Research prices for multiple storage variants of one device.
 * Returns a complete price map.
 *
 * @param {string} modelName
 * @param {string[]} storages - e.g. ['128GB', '256GB', '512GB']
 * @param {string} appId
 */
async function researchDevicePrices(modelName, storages, appId) {
    const results = {};

    for (const storage of storages) {
        try {
            const data = await fetchEbayPrices(modelName, storage, appId);
            results[storage] = data;
            // Small delay to be polite to the API
            await new Promise(r => setTimeout(r, 300));
        } catch (err) {
            results[storage] = { error: err.message };
        }
    }

    return {
        model: modelName,
        storages: results,
        researchedAt: new Date().toISOString(),
        source: 'eBay.de Completed Listings (sold items)',
    };
}

module.exports = { fetchEbayPrices, researchDevicePrices };
