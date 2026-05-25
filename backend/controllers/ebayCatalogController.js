const https = require('https');
const { supabaseAdmin } = require('../config/supabase');

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
 * Endpoint to search eBay for models
 */
exports.searchEbayCatalog = async (req, res) => {
    try {
        const { q, categoryId } = req.query;
        if (!q) return res.status(400).json({ success: false, message: 'Query is required' });

        const appId = process.env.EBAY_APP_ID;
        const clientSecret = process.env.EBAY_CLIENT_SECRET;

        const token = await getOAuthToken(appId, clientSecret);
        const encodedKeyword = encodeURIComponent(q);

        const categoryParam = categoryId === 'all' ? '' : `&category_ids=${categoryId || '9355'}`;
        const searchPath = `/buy/browse/v1/item_summary/search?q=${encodedKeyword}${categoryParam}&fieldgroups=ASPECT_REFINEMENTS&limit=100`;

        const options = {
            hostname: 'api.ebay.com',
            path: searchPath,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE',
                'Accept': 'application/json'
            }
        };

        const result = await new Promise((resolve, reject) => {
            const request = https.request(options, (response) => {
                let body = '';
                response.on('data', chunk => { body += chunk; });
                response.on('end', () => {
                    try {
                        resolve({ status: response.statusCode, data: JSON.parse(body) });
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            request.on('error', reject);
            request.end();
        });

        if (result.status !== 200) {
            return res.status(500).json({ success: false, message: 'eBay API Error', details: result.data });
        }

        const data = result.data;
        let models = [];

        // Extract the "Modell" aspect distributions
        if (data.refinement && data.refinement.aspectDistributions) {
            const modelAspect = data.refinement.aspectDistributions.find(a => a.localizedAspectName === 'Modell');
            if (modelAspect && modelAspect.aspectValueDistributions) {
                models = modelAspect.aspectValueDistributions.map(m => m.localizedAspectValue);
            }
        }

        // Clean and format models
        const results = [];
        models.forEach(modelName => {
            // Remove "Apple " or "Samsung " from the beginning if present for cleaner names, though eBay is usually clean
            // e.g. "Apple iPhone 15 Pro Max" -> "iPhone 15 Pro Max"
            // Wait, keeping Brand in name is sometimes preferred, let's keep it as is, or separate them.
            let brand = 'Unknown';
            let cleanModel = modelName;

            if (modelName.toLowerCase().startsWith('apple ')) {
                brand = 'Apple';
                cleanModel = modelName.substring(6).trim();
            } else if (modelName.toLowerCase().startsWith('samsung ')) {
                brand = 'Samsung';
                cleanModel = modelName.substring(8).trim();
            } else if (modelName.toLowerCase().startsWith('google ')) {
                brand = 'Google';
                cleanModel = modelName.substring(7).trim();
            } else if (modelName.toLowerCase().startsWith('xiaomi ')) {
                brand = 'Xiaomi';
                cleanModel = modelName.substring(7).trim();
            } else if (modelName.toLowerCase().startsWith('huawei ')) {
                brand = 'Huawei';
                cleanModel = modelName.substring(7).trim();
            } else if (modelName.toLowerCase().includes('iphone')) {
                brand = 'Apple';
            } else if (modelName.toLowerCase().includes('galaxy')) {
                brand = 'Samsung';
            } else if (modelName.toLowerCase().includes('pixel')) {
                brand = 'Google';
            } else {
                // Auto-extract brand from the first word
                const parts = cleanModel.split(' ');
                if (parts.length > 1) {
                    brand = parts[0]; // e.g., "Microsoft", "OPPO", "Ulefone", "Sony"
                    cleanModel = parts.slice(1).join(' ');
                }
            }

            // Skip generic ones
            if (cleanModel.toLowerCase() === 'keine angabe' || cleanModel.toLowerCase() === 'sonstige' || cleanModel.length < 3) return;

            results.push({
                id: 'ebay_' + Math.random().toString(36).substring(7),
                brand: brand,
                model: cleanModel,
                basePrice: 0, // Base price is unknown from just the name, will be set via eBay research later
                validStorages: ['128GB', '256GB', '512GB'], // Default common storages
                source: 'eBay Catalog'
            });
        });

        // Filter by the search query just in case eBay returned broader models
        const filteredResults = results.filter(r => 
            r.model.toLowerCase().includes(q.toLowerCase()) || 
            r.brand.toLowerCase().includes(q.toLowerCase())
        );
        
        const finalResults = filteredResults.length > 0 ? filteredResults : results;

        // Check if devices are already imported
        const modelsToCheck = finalResults.map(r => r.model);

        const { data: existingDevices } = await supabaseAdmin
            .from('device_blueprints')
            .select('model')
            .in('model', modelsToCheck);

        const existingModels = existingDevices ? existingDevices.map(d => d.model) : [];

        const dataWithStatus = finalResults.map(r => {
            return {
                ...r,
                isImported: existingModels.includes(r.model)
            };
        });

        res.status(200).json({ success: true, data: dataWithStatus });
    } catch (error) {
        console.error("eBay Catalog Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Import selected devices
 */
exports.importFromEbay = async (req, res) => {
    try {
        const { devices } = req.body;
        if (!devices || !Array.isArray(devices)) {
            return res.status(400).json({ success: false, message: 'Geräte erforderlich' });
        }
        const appId = process.env.EBAY_APP_ID;
        const clientSecret = process.env.EBAY_CLIENT_SECRET;
        const token = await getOAuthToken(appId, clientSecret);

        const importPromises = devices.map(async (device) => {
            
            // Try to fetch an image from eBay for this specific model
            let fetchedImageUrl = '';
            try {
                const imgSearchUrl = `/buy/browse/v1/item_summary/search?q=${encodeURIComponent(device.model)}&limit=1`;
                const imgResult = await new Promise((resolve) => {
                    const req2 = https.request({
                        hostname: 'api.ebay.com',
                        path: imgSearchUrl,
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE',
                            'Accept': 'application/json'
                        }
                    }, (res2) => {
                        let b = '';
                        res2.on('data', c => { b += c; });
                        res2.on('end', () => {
                            try { resolve({ status: res2.statusCode, data: JSON.parse(b) }); } 
                            catch (e) { resolve({ status: 500, data: {} }); }
                        });
                    });
                    req2.on('error', () => resolve({ status: 500, data: {} }));
                    req2.setTimeout(3000, () => {
                        req2.destroy();
                        resolve({ status: 504, data: {} });
                    });
                    req2.end();
                });
                
                if (imgResult.status === 200 && imgResult.data.itemSummaries && imgResult.data.itemSummaries.length > 0) {
                    const firstItem = imgResult.data.itemSummaries[0];
                    if (firstItem.image && firstItem.image.imageUrl) {
                        fetchedImageUrl = firstItem.image.imageUrl;
                    }
                }
            } catch (err) {
                console.error("Error fetching image for", device.model, err);
            }

            const insertData = {
                brand: device.brand,
                model: device.model,
                image: fetchedImageUrl,
                screen_hervorragend: 1.0,
                screen_sehr_gut: 0.9,
                screen_gut: 0.75,
                screen_beschadigt: 0.5,
                body_hervorragend: 1.0,
                body_sehr_gut: 0.95,
                body_gut: 0.85,
                body_beschadigt: 0.6,
                body_beschadigt: 0.6,
                functional_multiplier: 1.0,
                non_functional_multiplier: 0.4,
                base_price: 100, // Placeholder
                valid_storages: device.validStorages || ['128GB', '256GB', '512GB'],
                category: device.category || 'Smartphone'
            };

            const { data: existing, error: checkError } = await supabaseAdmin
                .from('device_blueprints')
                .select('id')
                .eq('model', device.model)
                .single();

            if (!existing) {
                // Ensure the brand exists in valuation_brands so it shows up in the frontend
                const { data: brandExists } = await supabaseAdmin
                    .from('valuation_brands')
                    .select('id')
                    .ilike('name', device.brand)
                    .single();
                
                if (!brandExists) {
                    await supabaseAdmin.from('valuation_brands').insert({
                        name: device.brand,
                        is_popular: false,
                        logo_url: '' // Admin can edit this later in settings
                    });
                }

                const { error: insertError } = await supabaseAdmin
                    .from('device_blueprints')
                    .insert(insertData);
                
                if (!insertError) {
                    return 1;
                } else {
                    console.error("Insert error:", insertError);
                }
            }
            return 0;
        });

        const results = await Promise.all(importPromises);
        const importedCount = results.reduce((acc, val) => acc + val, 0);

        res.status(200).json({ success: true, count: importedCount });
    } catch (error) {
        console.error("eBay Import Error:", error);
        res.status(500).json({ success: false, message: 'Import fehlgeschlagen' });
    }
};
