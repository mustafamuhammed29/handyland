const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Accessory = require('./models/Accessory');

dotenv.config({ path: './.env' }); // Adjust if .env is elsewhere

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland';

const productsData = [
    {
        id: 'iphone-15-pro-max',
        name: 'Apple iPhone 15 Pro Max',
        price: 1199,
        stock: 50,
        category: 'smartphone',
        condition: 'new',
        seller: 'HandyLand',
        battery: '100%',
        processor: 'A17 Pro',
        color: 'Natural Titanium',
        display: '6.7" Super Retina XDR OLED',
        storage: '256GB',
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800&auto=format&fit=crop', // Realistic iPhone 15 Pro
        images: [
            'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800&auto=format&fit=crop'
        ],
        description: 'Titanium design. Next-generation Apple silicon. More magical than ever.'
    },
    {
        id: 'samsung-galaxy-s24-ultra',
        name: 'Samsung Galaxy S24 Ultra',
        price: 1299,
        stock: 45,
        category: 'smartphone',
        condition: 'new',
        seller: 'HandyLand',
        battery: '5000mAh',
        processor: 'Snapdragon 8 Gen 3',
        color: 'Titanium Black',
        display: '6.8" Dynamic AMOLED 2X',
        storage: '512GB',
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=800&auto=format&fit=crop', // Generic Samsung-ish phone placeholder
        images: [
            'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=800&auto=format&fit=crop'
        ],
        description: 'Welcome to the era of mobile AI. With Galaxy S24 Ultra in your hands.'
    },
    {
        id: 'google-pixel-8-pro',
        name: 'Google Pixel 8 Pro',
        price: 999,
        stock: 30,
        category: 'smartphone',
        condition: 'new',
        seller: 'HandyLand',
        battery: '5050mAh',
        processor: 'Google Tensor G3',
        color: 'Obsidian',
        display: '6.7" Super Actua OLED',
        storage: '128GB',
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800&auto=format&fit=crop', // Generic Android
        images: [
            'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800&auto=format&fit=crop'
        ],
        description: 'The pro phone engineered by Google. It is sleeker, with premium finishes.'
    },
    {
        id: 'iphone-14-refurbished',
        name: 'Apple iPhone 14 (Refurbished)',
        price: 699,
        stock: 15,
        category: 'smartphone',
        condition: 'refurbished',
        seller: 'HandyLand Renewed',
        battery: '88%',
        processor: 'A15 Bionic',
        color: 'Midnight',
        display: '6.1" Super Retina XDR OLED',
        storage: '128GB',
        image: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?q=80&w=800&auto=format&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1605236453806-6ff36851218e?q=80&w=800&auto=format&fit=crop'
        ],
        description: 'Professionally refurbished iPhone 14 in excellent condition. fully tested and fully functional.'
    },
    {
        id: 'iphone-13',
        name: 'Apple iPhone 13',
        price: 599,
        stock: 10,
        category: 'smartphone',
        condition: 'used',
        seller: 'HandyLand',
        battery: '85%',
        processor: 'A15 Bionic',
        color: 'Blue',
        display: '6.1" Super Retina XDR OLED',
        storage: '128GB',
        image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=800&auto=format&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=800&auto=format&fit=crop'
        ],
        description: 'Used iPhone 13 with some signs of wear but working perfectly.'
    }
];

const accessoriesData = [
    {
        id: 'airpods-pro-2',
        name: 'Apple AirPods Pro (2nd Gen)',
        category: 'audio',
        price: 249,
        stock: 100,
        image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=800&auto=format&fit=crop', // AirPods
        description: 'AirPods Pro feature up to 2x more Active Noise Cancellation, plus Adaptive Transparency.',
        tag: 'Best Seller'
    },
    {
        id: 'galaxy-buds-2-pro',
        name: 'Samsung Galaxy Buds2 Pro',
        category: 'audio',
        price: 199,
        stock: 80,
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop', // Earbuds
        description: 'Every note sounds like the real thing because sheer audio quality starts at the source.',
        tag: 'New'
    },
    {
        id: 'magsafe-charger',
        name: 'Apple MagSafe Charger',
        category: 'power',
        price: 39,
        stock: 150,
        image: 'https://images.unsplash.com/photo-1622445275576-7213237ce6df?q=80&w=800&auto=format&fit=crop', // Charger
        description: 'The MagSafe Charger makes wireless charging a snap.',
        tag: 'Essential'
    },
    {
        id: '20w-usb-c-adapter',
        name: '20W USB-C Power Adapter',
        category: 'power',
        price: 19,
        stock: 200,
        image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=800&auto=format&fit=crop', // Plug
        description: 'Offers fast, efficient charging at home, in the office, or on the go.',
        tag: 'Essential'
    },
    {
        id: 'iphone-15-silicone-case',
        name: 'iPhone 15 Pro Silicone Case with MagSafe',
        category: 'protection',
        price: 49,
        stock: 60,
        image: 'https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?q=80&w=800&auto=format&fit=crop', // Case
        description: 'Designed by Apple to complement iPhone 15 Pro, the Silicone Case with MagSafe.',
        tag: 'Popular'
    },
    {
        id: 'screen-protector-glass',
        name: 'Premium Tempered Glass Screen Protector',
        category: 'protection',
        price: 15,
        stock: 300,
        image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?q=80&w=800&auto=format&fit=crop', // Glass/Screen
        description: '9H hardness tempered glass offers maximum protection from scratches and bumps.',
        tag: 'Recommended'
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected for Seeding');

        // Delete existing data
        await Product.deleteMany();
        await Accessory.deleteMany();
        console.log('Existing Products and Accessories removed.');

        // Insert new data
        await Product.insertMany(productsData);
        await Accessory.insertMany(accessoriesData);
        console.log('Successfully seeded Products and Accessories with realistic images!');

        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDB();
