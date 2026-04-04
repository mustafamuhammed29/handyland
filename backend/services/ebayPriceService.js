/**
 * ebayPriceService.js — eBay Browse API Integration (RESTful + OAuth 2.0)
 *
 * 🇩🇪 Holt aktuelle "Sofort Kaufen"-Preise für gebrauchte Smartphones vom deutschen eBay-Markt.
 *
 * API: eBay Browse API (OAuth 2.0 Client Credentials Grant)
 * Methode: /buy/browse/v1/item_summary/search
 * Kategorie: 15032 = "Handys & Smartphones" auf eBay.de
 */

const https = require('https');

const EBAY_CATEGORY_ID = '15032';
const EBAY_MARKETPLACE = 'EBAY_DE';

// Token caching to avoid hitting rate limits for auth
let cachedToken = null;
let tokenExpiryTime = 0;

/**
 * Fetches an OAuth 2.0 Application Token using Client Credentials.
 */
function getOAuthToken(appId, clientSecret) {
    return new Promise((resolve, reject) => {
        if (!appId || !clientSecret) {
            return reject(new Error('EBAY_APP_ID oder EBAY_CLIENT_SECRET fehlt in der Konfiguration (.env)'));
        }

        if (cachedToken && Date.now() < tokenExpiryTime) {
            return resolve(cachedToken);
        }

        const authString = Buffer.from(`${appId}:${clientSecret}`).toString('base64');
        const data = new URLSearchParams({
            grant_type: 'client_credentials',
            scope: 'https://api.ebay.com/oauth/api_scope'
        }).toString();

        const options = {
            hostname: 'api.ebay.com',
            path: '/identity/v1/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${authString}`
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const json = JSON.parse(body);
                        cachedToken = json.access_token;
                        // Expires in 7200s (2 hrs). Cache for 1.8 hrs to be safe
                        tokenExpiryTime = Date.now() + (json.expires_in * 1000) - (10 * 60 * 1000);
                        resolve(cachedToken);
                    } catch (err) {
                        reject(new Error('Fehler beim Parsen der eBay Auth-Antwort'));
                    }
                } else {
                    reject(new Error(`eBay OAuth Error: ${res.statusCode} - ${body}`));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

/**
 * Fetches active "Buy It Now" used items from eBay.de using REST API.
 */
async function fetchEbayPrices(modelName, storage = '', appId) {
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    
    // 1. Authenticate
    const token = await getOAuthToken(appId, clientSecret);

    // 2. Build Query
    const keyword = storage ? `${modelName} ${storage}` : `${modelName}`;
    const encodedKeyword = encodeURIComponent(keyword);
    
    // filter=buyingOptions:{FIXED_PRICE},conditionIds:{3000|2000|2500}
    const filter = encodeURIComponent('buyingOptions:{FIXED_PRICE},conditionIds:{3000|2000|2500}');
    
    const searchPath = `/buy/browse/v1/item_summary/search?q=${encodedKeyword}&category_ids=${EBAY_CATEGORY_ID}&filter=${filter}&limit=50&sort=-price`;

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.ebay.com',
            path: searchPath,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-EBAY-C-MARKETPLACE-ID': EBAY_MARKETPLACE,
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    
                    if (res.statusCode !== 200) {
                        const errMsg = json.errors?.[0]?.message || `HTTP ${res.statusCode}`;
                        return reject(new Error(`eBay Browse API Error: ${errMsg}`));
                    }

                    const items = json.itemSummaries || [];
                    const totalItems = json.total || 0;

                    if (items.length === 0) {
                        return resolve({ avg: null, min: null, max: null, count: 0, samples: [], keyword });
                    }

                    // Extract valid prices (sanity check 30 - 3000 -> typically avoids accessories masquerading as phones)
                    const prices = items
                        .map(item => {
                            return {
                                price: parseFloat(item.price?.value || 0),
                                title: item.title,
                                condition: item.condition,
                                url: item.itemWebUrl,
                                soldDate: 'Active Listing'
                            };
                        })
                        .filter(i => i.price > 30 && i.price < 3000);

                    if (prices.length === 0) {
                        return resolve({ avg: null, min: null, max: null, count: 0, samples: [], keyword });
                    }

                    // Calculate basic stats
                    const values = prices.map(p => p.price);
                    const sum = values.reduce((a, b) => a + b, 0);
                    const rawAvg = Math.round(sum / values.length);
                    const min = Math.round(Math.min(...values));
                    const max = Math.round(Math.max(...values));

                    // Remove extreme outliers (keep items within 1.5 standard deviations from the mean)
                    const mean = sum / values.length;
                    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
                    const filtered = prices.filter(p => Math.abs(p.price - mean) <= 1.5 * stdDev);

                    const filteredValues = filtered.map(p => p.price);
                    const filteredAvg = filteredValues.length > 0 
                        ? Math.round(filteredValues.reduce((a, b) => a + b, 0) / filteredValues.length)
                        : rawAvg;

                    resolve({
                        avg: filteredAvg,
                        rawAvg: rawAvg,
                        min,
                        max,
                        count: prices.length,
                        totalFound: totalItems,
                        samples: prices.slice(0, 5), // showcase top 5
                        keyword,
                        // Suggested buyback price calculation logic based on current market value
                        suggestedBuyback: {
                            conservative: Math.round((filteredAvg * 0.52) / 5) * 5, 
                            balanced:     Math.round((filteredAvg * 0.58) / 5) * 5, 
                            aggressive:   Math.round((filteredAvg * 0.65) / 5) * 5, 
                        }
                    });

                } catch (err) {
                    reject(new Error(`eBay JSON parse error: ${err.message}\nRaw: ${body.substring(0,200)}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

/**
 * Research prices for multiple storage variants of one device.
 */
async function researchDevicePrices(modelName, storages, appId) {
    const results = {};

    for (const storage of storages) {
        try {
            const data = await fetchEbayPrices(modelName, storage, appId);
            results[storage] = data;
            // Respect API rate limits
            await new Promise(r => setTimeout(r, 400));
        } catch (err) {
            results[storage] = { error: err.message };
        }
    }

    return {
        model: modelName,
        storages: results,
        researchedAt: new Date().toISOString(),
        source: 'eBay.de Live Active Listings (Browse API)',
    };
}

module.exports = { fetchEbayPrices, researchDevicePrices };
