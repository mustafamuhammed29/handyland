const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect('mongodb://127.0.0.1:27017/handyland').then(async () => {
    const db = mongoose.connection;
    
    // Step 1: Normalize existing brand values (fix capitalization)
    const brandMap = {
        'apple': 'Apple',
        'samsung': 'Samsung',
        'google': 'Google',
        'xiaomi': 'Xiaomi',
        'sony': 'Sony',
        'microsoft': 'Microsoft',
    };
    for (const [from, to] of Object.entries(brandMap)) {
        await db.collection('products').updateMany(
            { brand: { $regex: new RegExp(`^${from}$`, 'i') } },
            { $set: { brand: to } }
        );
    }
    console.log('Step 1: Brand capitalization normalized!');
    
    // Step 2: Auto-detect brand from product name for products missing brand field
    const nameKeywords = [
        { keyword: 'iphone', brand: 'Apple' },
        { keyword: 'ipad', brand: 'Apple' },
        { keyword: 'macbook', brand: 'Apple' },
        { keyword: 'airpods', brand: 'Apple' },
        { keyword: 'apple watch', brand: 'Apple' },
        { keyword: 'galaxy', brand: 'Samsung' },
        { keyword: 'samsung', brand: 'Samsung' },
        { keyword: 'pixel', brand: 'Google' },
        { keyword: 'google', brand: 'Google' },
        { keyword: 'xperia', brand: 'Sony' },
        { keyword: 'sony', brand: 'Sony' },
        { keyword: 'xiaomi', brand: 'Xiaomi' },
        { keyword: 'redmi', brand: 'Xiaomi' },
        { keyword: 'poco', brand: 'Xiaomi' },
        { keyword: 'surface', brand: 'Microsoft' },
        { keyword: 'microsoft', brand: 'Microsoft' },
    ];
    
    let updated = 0;
    for (const { keyword, brand } of nameKeywords) {
        const result = await db.collection('products').updateMany(
            { 
                $and: [
                    { $or: [
                        { brand: { $exists: false } },
                        { brand: null },
                        { brand: '' }
                    ]},
                    { $or: [
                        { name: { $regex: keyword, $options: 'i' } },
                        { model: { $regex: keyword, $options: 'i' } }
                    ]}
                ]
            },
            { $set: { brand: brand } }
        );
        if (result.modifiedCount > 0) {
            console.log(`  Set brand=${brand} for ${result.modifiedCount} product(s) matching "${keyword}"`);
            updated += result.modifiedCount;
        }
    }
    console.log(`Step 2: Auto-detected brand for ${updated} products!`);
    
    // Step 3: Report products still without brand
    const noBrand = await db.collection('products').countDocuments({
        $or: [
            { brand: { $exists: false } },
            { brand: null },
            { brand: '' }
        ]
    });
    
    if (noBrand > 0) {
        console.log(`WARNING: ${noBrand} product(s) still have no brand field. Please update manually.`);
        const products = await db.collection('products').find({
            $or: [
                { brand: { $exists: false } },
                { brand: null },
                { brand: '' }
            ]
        }, { projection: { name: 1, model: 1, _id: 1 }}).toArray();
        products.forEach(p => console.log(`  - ${p.name || p.model || p._id}`));
    } else {
        console.log('All products have brand field set!');
    }
    
    console.log('\nBrand fix complete!');
    process.exit(0);
}).catch(console.error);
