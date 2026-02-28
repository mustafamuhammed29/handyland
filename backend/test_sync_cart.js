const mongoose = require('mongoose');
const { syncCart } = require('./controllers/cartController');
const Product = require('./models/Product');
const Cart = require('./models/Cart');

async function testSync() {
    await mongoose.connect('mongodb://127.0.0.1:27017/handyland');

    // Simulate express req, res
    const req = {
        user: { id: '698cf2d7e12d1a857e67e067' },
        body: { localItems: [] } // simulate refresh with empty or preserved local mapping
    };

    const res = {
        json: (data) => {
            console.log("RESPONSE DATA:");
            console.log(JSON.stringify(data, null, 2));
        },
        status: (code) => ({
            json: (data) => console.log(`STATUS ${code}:`, data)
        })
    };

    console.log("Testing syncCart...");
    await syncCart(req, res);
    process.exit();
}

testSync().catch(console.error);
