const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/handyland').then(async () => {
    const db = mongoose.connection;
    const brandMap = {
        'apple': 'Apple',
        'samsung': 'Samsung',
        'google': 'Google',
        'xiaomi': 'Xiaomi',
        'sony': 'Sony'
    };
    for (const [from, to] of Object.entries(brandMap)) {
        await db.collection('products').updateMany(
            { brand: { $regex: new RegExp(`^${from}$`, 'i') } },
            { $set: { brand: to } }
        );
    }
    console.log('Brands normalized!');
    process.exit(0);
}).catch(console.error);
