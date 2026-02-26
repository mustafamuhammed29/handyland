const mongoose = require('mongoose');
const cartController = require('./controllers/cartController');
require('./models/User');
require('./models/Product');
require('./models/Accessory');

async function testGetAllCarts() {
    await mongoose.connect('mongodb://127.0.0.1:27017/handyland');

    console.log("Connected to DB. Running getAllCarts...");
    const req = {};
    const res = {
        json: (data) => console.log(JSON.stringify(data, null, 2)),
        status: (code) => res
    };

    await cartController.getAllCarts(req, res);
    process.exit();
}
testGetAllCarts().catch(console.error);
