/**
 * Fix-Promotions Migration Script
 * Updates old promotions that are missing discountType, discountValue, startDate, endDate
 * Run once: node scripts/fixPromotions.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Promotion = require('../models/Promotion');

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const promotions = await Promotion.find({});
    console.log(`Found ${promotions.length} promotions`);

    let updated = 0;
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const promo of promotions) {
        const patch = {};

        if (!promo.discountType) patch.discountType = 'percentage';
        if (promo.discountValue == null) patch.discountValue = 10;
        if (!promo.startDate)  patch.startDate  = now;
        if (!promo.endDate)    patch.endDate    = thirtyDaysLater;

        if (Object.keys(patch).length > 0) {
            await Promotion.findByIdAndUpdate(promo._id, patch);
            console.log(`  ✏️  Fixed: "${promo.title}" →`, patch);
            updated++;
        }
    }

    console.log(`\n✅ Done: ${updated} promotions updated.`);
    await mongoose.disconnect();
};

run().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
