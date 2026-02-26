const axios = require('axios');
const mongoose = require('mongoose');

async function testCart() {
    const resLogin = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@handyland.com',
        password: 'admin'
    });

    const token = resLogin.data.data.token;
    console.log("Logged in. Token:", token.substring(0, 10));

    const fakeId = new mongoose.Types.ObjectId().toString();
    console.log("Fake Product ID:", fakeId);

    const resSync = await axios.post('http://localhost:5000/api/cart/sync', {
        localItems: [{
            id: fakeId,
            quantity: 2,
            category: 'device'
        }]
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });

    console.log("Sync Response:", JSON.stringify(resSync.data, null, 2));

    const resGet = await axios.get('http://localhost:5000/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Get Cart Response:", JSON.stringify(resGet.data, null, 2));
}

testCart().catch(err => {
    console.error(err.response ? JSON.stringify(err.response.data) : err.message);
});
