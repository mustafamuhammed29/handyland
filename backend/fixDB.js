const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/handyland').then(async () => {
    try {
        const db = mongoose.connection;
        const productsReq1 = await db.collection('products').updateMany({ name: /Pixel 8/ }, { $set: { category: 'Smartphones' } });
        const productsReq2 = await db.collection('products').updateMany({ name: /Pixel 7 Pro/ }, { $set: { category: 'Smartphones' } });
        const productsReq3 = await db.collection('products').updateMany({ name: /iPhone 11/ }, { $set: { category: 'Smartphones' } });

        const settingsReq = await db.collection('settings').updateOne({ key: 'liveStats' }, { $set: { 'value.marketExperience': 3 } });
        // or if it's dynamic
        await db.collection('settings').updateOne({ key: 'liveStats' }, { $set: { 'marketExperience': 3 } });

        console.log('Categories and settings updated in DB!');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
});
