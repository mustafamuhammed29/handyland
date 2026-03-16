const mongoose = require('mongoose');

async function testMultiple() {
    await mongoose.connect('mongodb://127.0.0.1:27017/handyland');

    const Cart = require('./models/Cart');
    const Product = require('./models/Product');
    const User = require('./models/User');

    const user = await User.findOne();
    console.log("Using User:", user._id);

    // Get Two Products
    const products = await Product.find().limit(2);
    if (products.length < 2) {
        console.log("Need at least 2 products to test!");
        process.exit(1);
    }

    const p1 = products[0]._id;
    const p2 = products[1]._id;
    console.log("Product 1:", p1, "Product 2:", p2);

    let cart = await Cart.findOne({ user: user._id });
    if (!cart) cart = new Cart({ user: user._id });

    // Clear existing items for clean test
    cart.items = [];

    // Simulate first add
    cart.items.push({
        product: p1,
        productType: 'Product',
        quantity: 1
    });

    // Simulate second add (different product)
    cart.items.push({
        product: p2,
        productType: 'Product',
        quantity: 2
    });

    try {
        await cart.save();
        console.log("Saved cart successfully!");

        const savedCart = await Cart.findOne({ user: user._id }).lean();
        console.log("Items saved in DB:", savedCart.items.length);
        console.log(JSON.stringify(savedCart.items, null, 2));
    } catch (err) {
        console.error("Save Error:", err.message);
    }

    process.exit(0);
}

testMultiple().catch(console.error);
