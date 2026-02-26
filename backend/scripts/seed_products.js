const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

mongoose.connect('mongodb://127.0.0.1:27017/handyland', {})
    .then(() => {
        console.log('MongoDB Connected');
        seed();
    })
    .catch(err => console.log(err));

const { v4: uuidv4 } = require('uuid');

const seed = async () => {
    try {
        await Product.deleteMany({});
        console.log('Cleared old Products');

        const products = [
            {
                id: uuidv4(),
                name: "iPhone 14 Pro Max",
                price: 1099,
                description: "Deep Purple, 256GB, Excellent Condition. Minor scratches on frame but screen is perfect. Battery health 92%.",
                category: "Smartphones",
                image: "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?q=80&w=600&auto=format&fit=crop",
                condition: "Used",
                seller: "HandyLand",
                stock: 1
            },
            {
                id: uuidv4(),
                name: "Samsung Galaxy S23 Ultra",
                price: 950,
                description: "Phantom Black, 512GB. Open box, never used. Includes original S-Pen and charging cable.",
                category: "Smartphones",
                image: "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?q=80&w=600&auto=format&fit=crop",
                condition: "Like New",
                seller: "HandyLand",
                stock: 2
            },
            {
                id: uuidv4(),
                name: "iPad Pro 12.9 M2",
                price: 899,
                description: "Space Grey, 128GB, WiFi. Includes Magic Keyboard and Apple Pencil 2.",
                category: "Tablets",
                image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600&auto=format&fit=crop",
                condition: "Good",
                seller: "HandyLand",
                stock: 1
            },
            {
                id: uuidv4(),
                name: "MacBook Air M2",
                price: 1150,
                description: "Midnight, 16GB RAM, 512GB SSD. Perfect for students and professionals. Lightweight and powerful.",
                category: "Laptops",
                image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=600&auto=format&fit=crop",
                condition: "Refurbished",
                seller: "HandyLand",
                stock: 5
            },
            {
                id: uuidv4(),
                name: "Sony WH-1000XM5",
                price: 299,
                description: "Black, Noise Cancelling Headphones. Best in class ANC. Comes with carrying case.",
                category: "Audio",
                image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=600&auto=format&fit=crop",
                condition: "New",
                seller: "HandyLand",
                stock: 10
            },
            {
                id: uuidv4(),
                name: "Apple Watch Ultra",
                price: 650,
                description: "Titanium Case with Orange Alpine Loop.  Rugged and capable. Battery health 98%.",
                category: "Wearables",
                image: "https://images.unsplash.com/photo-1664478546384-d57ffe74a7b1?q=80&w=600&auto=format&fit=crop",
                condition: "Used",
                seller: "HandyLand",
                stock: 3
            }
        ];

        await Product.insertMany(products);
        console.log(`Added ${products.length} Products`);
        process.exit();
    } catch (error) {
        console.error('Seeding Failed:', error);
        process.exit(1);
    }
};
