const mongoose = require('mongoose');

async function testCart() {
    await mongoose.connect('mongodb://127.0.0.1:27017/handyland');

    const Cart = require('./models/Cart');
    const Product = require('./models/Product');
    const User = require('./models/User');

    const user = await User.findOne();
    console.log("Using User:", user._id);

    const product = await Product.findOne();
    if (!product) {
        console.log("No product found!");
        process.exit(1);
    }
    console.log("Using Product:", product._id);

    let cart = await Cart.findOne({ user: user._id });
    if (!cart) cart = new Cart({ user: user._id });

    cart.items.push({
        product: product._id,
        productType: 'Product',
        quantity: 1
    });

    try {
        await cart.save();
        console.log("Saved cart successfully!");
        const savedCart = await Cart.findOne({ user: user._id });
        console.log("Saved items length:", savedCart.items.length);
    } catch (err) {
        console.error("Save Error:", err.message);
    }

    process.exit(0);
}

testCart().catch(console.error);
