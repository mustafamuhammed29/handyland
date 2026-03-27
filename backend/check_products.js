const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const products = await Product.find({ name: /S24 Ultra/i }).select('name model storage color price');
    console.log("Found products:");
    console.log(JSON.stringify(products, null, 2));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
