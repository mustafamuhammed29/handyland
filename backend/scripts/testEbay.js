const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '../.env');

// Check if .env is found
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
} else {
    console.error(`ERROR: .env not found at ${envPath}`);
    process.exit(1);
}

const { fetchEbayPrices } = require('../services/ebayPriceService');

async function test() {
    const appId = process.env.EBAY_APP_ID;
    console.log('AppID Loaded:', appId ? 'YES' : 'NO');
    
    if (!appId) {
        console.error('EBAY_APP_ID missing in .env');
        process.exit(1);
    }

    try {
        console.log('🔍 Researching iPhone 16 Pro Max 256GB...');
        const data = await fetchEbayPrices('iPhone 16 Pro Max', '256GB', appId);
        console.log('\n--- EBAY MARKET VALUE RESULTS ---\n');
        console.log('Average Sold Price:', data.avg, '€');
        console.log('Total Items Found:', data.totalFound);
        console.log('Valid Sales Count:', data.count);
        console.log('Price Range:', `Min ${data.min}€ - Max ${data.max}€`);
        console.log('\nSuggested Buyback Prices:');
        console.log('- Sicher (52%):', data.suggestedBuyback.conservative, '€');
        console.log('- Optimal (58%):', data.suggestedBuyback.balanced, '€');
        console.log('- Aggressiv (65%):', data.suggestedBuyback.aggressive, '€');
        
        console.log('\nSample eBay Listings (Proof):');
        data.samples.forEach(s => {
            console.log(`- ${s.price}€ | Condition: ${s.condition}`);
            // console.log(`  ${s.title}`);
        });

    } catch(err) {
        console.error('Error:', err);
    }
}
test();
