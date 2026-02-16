const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ShippingMethod = require('./models/ShippingMethod');

dotenv.config();

const checkShippingMethods = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const count = await ShippingMethod.countDocuments();
        console.log(`Total Shipping Methods: ${count}`);

        if (count > 0) {
            const methods = await ShippingMethod.find({});
            console.log('Methods:', methods);
        } else {
            console.log('No shipping methods found.');
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkShippingMethods();
