const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ShippingMethod = require('./models/ShippingMethod');
const Page = require('./models/Page');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland', {})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

const seedData = async () => {
    try {
        console.log('Seeding Shipping Methods...');
        await ShippingMethod.deleteMany({});
        await ShippingMethod.create([
            {
                name: 'Standard Delivery',
                description: '3-5 Business Days',
                price: 5.99,
                duration: '3-5 Business Days',
                isActive: true,
                isExpress: false
            },
            {
                name: 'Express Delivery',
                description: '1-2 Business Days',
                price: 15.99,
                duration: '1-2 Business Days',
                isActive: true,
                isExpress: true
            }
        ]);
        console.log('Shipping Methods seeded.');

        console.log('Seeding Legal Pages...');
        // Upsert pages
        const pages = [
            {
                slug: 'agb',
                title: 'Terms & Conditions',
                content: '<h1>Terms and Conditions</h1><p>Welcome to HandyLand. By using our website, you agree to these terms...</p>'
            },
            {
                slug: 'datenschutz', // Keeping German slug for compatibility, or change to 'privacy' if desired. User asked for "Terms & Conditions" and "Privacy Policy" control.
                title: 'Privacy Policy',
                content: '<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>'
            },
            {
                slug: 'privacy', // English slug alias
                title: 'Privacy Policy',
                content: '<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>'
            }
        ];

        for (const p of pages) {
            await Page.findOneAndUpdate({ slug: p.slug }, p, { upsert: true, new: true });
        }
        console.log('Legal Pages seeded.');

        process.exit();
    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
};

seedData();
