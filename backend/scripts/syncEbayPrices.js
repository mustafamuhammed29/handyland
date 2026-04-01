require('dotenv').config();
const mongoose = require('mongoose');
const DeviceBlueprint = require('../models/DeviceBlueprint');
const { researchDevicePrices } = require('../services/ebayPriceService');

async function syncPrices() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to DB.');

        const appId = process.env.EBAY_APP_ID;
        if (!appId || appId === 'YOUR_EBAY_APP_ID_HERE') {
            console.error('❌ EBAY_APP_ID is missing from .env');
            process.exit(1);
        }

        const devices = await DeviceBlueprint.find({ active: true }).sort({ brand: 1, model: 1 });
        console.log(`📱 Found ${devices.length} active devices to sync.\n`);

        let successCount = 0;
        let failCount = 0;

        for (const device of devices) {
            console.log(`🔎 Researching: ${device.brand} ${device.model}...`);
            const storages = device.validStorages || ['128GB'];
            
            try {
                const data = await researchDevicePrices(device.model, storages, appId);
                
                // Find the base storage (usually the first one, or minimum)
                const baseStorage = storages[0];
                const baseData = data.storages[baseStorage];

                if (baseData && baseData.avg) {
                    const oldPrice = device.basePrice;
                    
                    // We can set the basePrice to a percentage of the market average, e.g., 60%
                    const marketAvg = baseData.avg;
                    const suggestedBuyback = Math.round((marketAvg * 0.60) / 5) * 5; 

                    // Update device
                    device.priceResearch = {
                        lastUpdated: new Date(),
                        source: 'eBay.de Completed Listings (Auto Sync)',
                        marketAvg: marketAvg,
                        previousBasePrice: oldPrice,
                        ebayCount: baseData.count,
                        suggestedBuyback: {
                            conservative: Math.round((marketAvg * 0.52) / 5) * 5,
                            balanced: Math.round((marketAvg * 0.58) / 5) * 5,
                            aggressive: Math.round((marketAvg * 0.65) / 5) * 5,
                        }
                    };

                    device.basePrice = suggestedBuyback; // Apply balanced pricing automatically

                    // Calculate storage price differences based on eBay data if available
                    for (let i = 1; i < storages.length; i++) {
                        const sData = data.storages[storages[i]];
                        if (sData && sData.avg) {
                            const diff = sData.avg - marketAvg;
                            if (diff > 0) {
                                device.storagePrices.set(storages[i], Math.round((diff * 0.60) / 5) * 5);
                            }
                        }
                    }

                    await device.save();
                    console.log(`   ✅ Success! Market Avg: ${marketAvg}€ | Our Offer: ${suggestedBuyback}€ \n`);
                    successCount++;
                } else {
                    console.log(`   ⚠️ Insufficient data on eBay. Skipping.\n`);
                    failCount++;
                }
            } catch (err) {
                console.log(`   ❌ Error for ${device.model}: ${err.message}\n`);
                failCount++;
            }

            // Sleep for 2 seconds to avoid rate-limiting from eBay
            await new Promise(r => setTimeout(r, 2000));
        }

        console.log(`\n🎉 Sync Complete!`);
        console.log(`📈 Successful updates: ${successCount}`);
        console.log(`📉 Failed / No data: ${failCount}`);
        process.exit(0);

    } catch (err) {
        console.error('Fatal Error:', err);
        process.exit(1);
    }
}

syncPrices();
