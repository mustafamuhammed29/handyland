const mongoose = require('mongoose');
const fs = require('fs');

async function checkRawCarts() {
    await mongoose.connect('mongodb://127.0.0.1:27017/handyland');
    const Cart = require('./models/Cart');
    const carts = await Cart.find().lean();
    fs.writeFileSync('/tmp/raw_carts_check.json', JSON.stringify(carts, null, 2));
    console.log("Raw carts exported to /tmp/raw_carts_check.json");
    process.exit();
}
checkRawCarts().catch(console.error);
