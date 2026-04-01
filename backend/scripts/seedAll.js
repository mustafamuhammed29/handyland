/**
 * seedAll.js — Comprehensive HandyLand Data Seeder
 * Usage: node scripts/seedAll.js
 * Drops existing data and inserts fresh test data for ALL sections.
 */

'use strict';
require('dotenv').config();
const mongoose = require('mongoose');

// ── Models ────────────────────────────────────────────────────────────────────
const User          = require('../models/User');
const Product       = require('../models/Product');
const Accessory     = require('../models/Accessory');
const Order         = require('../models/Order');
const Coupon        = require('../models/Coupon');
const Review        = require('../models/Review');
const RepairTicket  = require('../models/RepairTicket');
const RepairPart    = require('../models/RepairPart');
const ShippingMethod = require('../models/ShippingMethod');
const Supplier      = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const DeviceBlueprint = require('../models/DeviceBlueprint');
const LoanerPhone   = require('../models/LoanerPhone');
const Promotion     = require('../models/Promotion');
const Warranty      = require('../models/Warranty');
const StockHistory  = require('../models/StockHistory');
const Transaction   = require('../models/Transaction');

// ── Connect ───────────────────────────────────────────────────────────────────
async function connectDB() {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const future = (days) => new Date(Date.now() + days * 86400000);
const past = (days) => new Date(Date.now() - days * 86400000);

// ══════════════════════════════════════════════════════════════════════════════
// SEED FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

// ── 1. USERS ─────────────────────────────────────────────────────────────────
async function seedUsers() {
    await User.deleteMany({});
    console.log('🗑️  Cleared Users');

    const users = [
        // Admin
        {
            name: 'Admin HandyLand',
            email: 'admin@handyland.de',
            password: 'Admin@12345',
            role: 'admin',
            isVerified: true,
            isActive: true,
            phone: '+4915123456789',
            loyaltyPoints: 5000,
            membershipLevel: 4,
            preferredLanguage: 'de'
        },
        // Regular customers
        {
            name: 'Max Mustermann',
            email: 'max@test.de',
            password: 'Test@12345',
            role: 'user',
            isVerified: true,
            isActive: true,
            phone: '+4915223456780',
            loyaltyPoints: 850,
            membershipLevel: 2,
            preferredLanguage: 'de'
        },
        {
            name: 'Anna Schmidt',
            email: 'anna@test.de',
            password: 'Test@12345',
            role: 'user',
            isVerified: true,
            isActive: true,
            phone: '+4915323456781',
            loyaltyPoints: 2300,
            membershipLevel: 3,
            preferredLanguage: 'de'
        },
        {
            name: 'Ahmed Hassan',
            email: 'ahmed@test.de',
            password: 'Test@12345',
            role: 'user',
            isVerified: true,
            isActive: true,
            phone: '+4915423456782',
            loyaltyPoints: 120,
            membershipLevel: 1,
            preferredLanguage: 'ar'
        },
        {
            name: 'Elena Petrov',
            email: 'elena@test.de',
            password: 'Test@12345',
            role: 'user',
            isVerified: true,
            isActive: true,
            phone: '+4915523456783',
            loyaltyPoints: 6100,
            membershipLevel: 4,
            preferredLanguage: 'ru'
        },
        {
            name: 'Mehmet Yilmaz',
            email: 'mehmet@test.de',
            password: 'Test@12345',
            role: 'user',
            isVerified: false,
            isActive: true,
            phone: '+4915623456784',
            loyaltyPoints: 0,
            membershipLevel: 1,
            preferredLanguage: 'tr'
        },
        {
            name: 'Lisa Wagner',
            email: 'lisa@test.de',
            password: 'Test@12345',
            role: 'user',
            isVerified: true,
            isActive: false, // Deactivated account for testing
            phone: '+4915723456785',
            loyaltyPoints: 50,
            membershipLevel: 1,
            preferredLanguage: 'de'
        },
    ];

    const created = await User.create(users);
    console.log(`✅ Created ${created.length} Users`);
    return created;
}

// ── 2. PRODUCTS ───────────────────────────────────────────────────────────────
async function seedProducts() {
    await Product.deleteMany({});
    console.log('🗑️  Cleared Products');

    const products = [
        // Apple iPhones
        { id: 'iphone-15-pro-256-black', name: 'iPhone 15 Pro 256GB Schwarz', price: 849, stock: 12, costPrice: 650, brand: 'Apple', model: 'iPhone 15 Pro', category: 'smartphones', condition: 'Wie neu', color: 'Schwarz', storage: '256GB', battery: '92%', display: '6.1 Zoll Super Retina XDR', processor: 'A17 Pro', description: 'iPhone 15 Pro in einwandfreiem Zustand. Original-Verpackung inklusive. Akku bei 92%.', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400'], sold: 34, rating: 4.8, numReviews: 12 },
        { id: 'iphone-15-128-blue', name: 'iPhone 15 128GB Blau', price: 649, stock: 8, costPrice: 490, brand: 'Apple', model: 'iPhone 15', category: 'smartphones', condition: 'Gut', color: 'Blau', storage: '128GB', battery: '88%', display: '6.1 Zoll Super Retina XDR', processor: 'A16 Bionic', description: 'iPhone 15 in gutem Zustand. Kleine Kratzer auf der Rückseite.', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', images: [], sold: 21, rating: 4.5, numReviews: 8 },
        { id: 'iphone-14-256-black', name: 'iPhone 14 256GB Schwarz', price: 549, stock: 15, costPrice: 390, brand: 'Apple', model: 'iPhone 14', category: 'smartphones', condition: 'Sehr gut', color: 'Schwarz', storage: '256GB', battery: '91%', display: '6.1 Zoll Super Retina XDR', processor: 'A15 Bionic', description: 'iPhone 14 in sehr gutem Zustand. Kein Kratzer. Akku bei 91%.', image: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400', images: [], sold: 45, rating: 4.7, numReviews: 18 },
        { id: 'iphone-13-128-white', name: 'iPhone 13 128GB Weiß', price: 429, stock: 20, costPrice: 300, brand: 'Apple', model: 'iPhone 13', category: 'smartphones', condition: 'Gut', color: 'Weiß', storage: '128GB', battery: '86%', display: '6.1 Zoll Super Retina XDR', processor: 'A15 Bionic', description: 'iPhone 13 in gutem Zustand. Normale Gebrauchsspuren.', image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=400', images: [], sold: 67, rating: 4.6, numReviews: 22 },
        { id: 'iphone-12-128-red', name: 'iPhone 12 128GB Rot', price: 299, stock: 5, costPrice: 200, brand: 'Apple', model: 'iPhone 12', category: 'smartphones', condition: 'Akzeptabel', color: 'Rot', storage: '128GB', battery: '79%', display: '6.1 Zoll Super Retina XDR', processor: 'A14 Bionic', description: 'iPhone 12 mit sichtbaren Gebrauchsspuren. Akku bei 79%, Ersatz empfohlen.', image: 'https://images.unsplash.com/photo-1603891128711-11b4b03bb138?w=400', images: [], sold: 89, rating: 4.1, numReviews: 31 },
        { id: 'iphone-se3-64-midnight', name: 'iPhone SE (3. Gen) 64GB Midnight', price: 249, stock: 3, costPrice: 170, brand: 'Apple', model: 'iPhone SE', category: 'smartphones', condition: 'Wie neu', color: 'Midnight', storage: '64GB', battery: '95%', display: '4.7 Zoll Retina HD', processor: 'A15 Bionic', description: 'iPhone SE 3. Generation fast neu. Immer mit Hülle getragen.', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', images: [], sold: 15, rating: 4.4, numReviews: 6 },
        // Samsung Galaxy
        { id: 'samsung-s24-ultra-256-titan', name: 'Samsung Galaxy S24 Ultra 256GB Titanium', price: 899, stock: 7, costPrice: 710, brand: 'Samsung', model: 'Galaxy S24 Ultra', category: 'smartphones', condition: 'Wie neu', color: 'Titanium', storage: '256GB', battery: '94%', display: '6.8 Zoll QHD+ Dynamic AMOLED', processor: 'Snapdragon 8 Gen 3', description: 'S24 Ultra nahezu neuwertig. Mit S Pen. Alle Zubehörteile dabei.', image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', images: [], sold: 22, rating: 4.9, numReviews: 9 },
        { id: 'samsung-s24-128-black', name: 'Samsung Galaxy S24 128GB Schwarz', price: 599, stock: 11, costPrice: 450, brand: 'Samsung', model: 'Galaxy S24', category: 'smartphones', condition: 'Sehr gut', color: 'Schwarz', storage: '128GB', battery: '90%', display: '6.2 Zoll FHD+ Dynamic AMOLED', processor: 'Exynos 2400', description: 'Galaxy S24 in sehr gutem Zustand. Komplett funktionsfähig.', image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', images: [], sold: 38, rating: 4.6, numReviews: 14 },
        { id: 'samsung-a54-128-blue', name: 'Samsung Galaxy A54 128GB Blau', price: 279, stock: 18, costPrice: 190, brand: 'Samsung', model: 'Galaxy A54', category: 'smartphones', condition: 'Gut', color: 'Blau', storage: '128GB', battery: '85%', display: '6.4 Zoll FHD+ Super AMOLED', processor: 'Exynos 1380', description: 'Galaxy A54 in gutem Zustand. Ideales Mittelklasse-Smartphone.', image: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400', images: [], sold: 52, rating: 4.3, numReviews: 19 },
        // Xiaomi
        { id: 'xiaomi-14-256-black', name: 'Xiaomi 14 256GB Schwarz', price: 649, stock: 9, costPrice: 500, brand: 'Xiaomi', model: 'Xiaomi 14', category: 'smartphones', condition: 'Wie neu', color: 'Schwarz', storage: '256GB', battery: '96%', display: '6.36 Zoll AMOLED 120Hz', processor: 'Snapdragon 8 Gen 3', description: 'Xiaomi 14 wie neu. Mit Leica-Optik. Sehr schnell.', image: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=400', images: [], sold: 17, rating: 4.7, numReviews: 7 },
        { id: 'xiaomi-redmi-note13-pro-256', name: 'Redmi Note 13 Pro 256GB Grün', price: 229, stock: 25, costPrice: 155, brand: 'Xiaomi', model: 'Redmi Note 13 Pro', category: 'smartphones', condition: 'Sehr gut', color: 'Grün', storage: '256GB', battery: '88%', display: '6.67 Zoll AMOLED 120Hz', processor: 'Snapdragon 7s Gen 2', description: 'Redmi Note 13 Pro mit 200MP Kamera. Sehr gutes Preis-Leistungs-Verhältnis.', image: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400', images: [], sold: 71, rating: 4.5, numReviews: 28 },
        // Google
        { id: 'pixel-8-pro-256-black', name: 'Google Pixel 8 Pro 256GB Schwarz', price: 699, stock: 4, costPrice: 540, brand: 'Google', model: 'Pixel 8 Pro', category: 'smartphones', condition: 'Wie neu', color: 'Schwarz', storage: '256GB', battery: '97%', display: '6.7 Zoll LTPO OLED', processor: 'Google Tensor G3', description: 'Pixel 8 Pro fast neu. Mit originalem Netzteil und Kabel.', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400', images: [], sold: 11, rating: 4.8, numReviews: 5 },
        // Low stock items for testing
        { id: 'iphone-14-pro-256-gold', name: 'iPhone 14 Pro 256GB Gold', price: 749, stock: 1, costPrice: 570, brand: 'Apple', model: 'iPhone 14 Pro', category: 'smartphones', condition: 'Sehr gut', color: 'Gold', storage: '256GB', battery: '89%', display: '6.1 Zoll Super Retina XDR', processor: 'A16 Bionic', description: 'iPhone 14 Pro in sehr gutem Zustand. Letztes Exemplar!', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', images: [], sold: 33, rating: 4.7, numReviews: 11 },
        // Out of stock
        { id: 'samsung-s23-128-white', name: 'Samsung Galaxy S23 128GB Weiß', price: 449, stock: 0, costPrice: 320, brand: 'Samsung', model: 'Galaxy S23', category: 'smartphones', condition: 'Gut', color: 'Weiß', storage: '128GB', battery: '83%', display: '6.1 Zoll FHD+ Dynamic AMOLED', processor: 'Snapdragon 8 Gen 2', description: 'Aktuell nicht vorrätig.', image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', images: [], sold: 92, rating: 4.4, numReviews: 35, isActive: false },
    ];

    const created = await Product.create(products);
    console.log(`✅ Created ${created.length} Products`);
    return created;
}

// ── 3. ACCESSORIES ────────────────────────────────────────────────────────────
async function seedAccessories() {
    await Accessory.deleteMany({});
    console.log('🗑️  Cleared Accessories');

    const accessories = [
        { id: 'acc-airpods-pro2', name: 'Apple AirPods Pro (2. Gen)', category: 'audio', brand: 'Apple', price: 199, stock: 20, costPrice: 140, description: 'AirPods Pro mit aktiver Geräuschunterdrückung und MagSafe Case.', image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400', sold: 45 },
        { id: 'acc-samsung-buds2', name: 'Samsung Galaxy Buds2 Pro', category: 'audio', brand: 'Samsung', price: 149, stock: 15, costPrice: 100, description: 'Premium Earbuds mit ANC und 360 Audio.', image: 'https://images.unsplash.com/photo-1606741965509-717b6b1a9faa?w=400', sold: 32 },
        { id: 'acc-anker-charger-65w', name: 'Anker 65W GaN Ladegerät', category: 'power', brand: 'Anker', price: 39, stock: 50, costPrice: 22, description: 'Kompaktes 65W GaN Schnellladegerät mit 2x USB-C und 1x USB-A.', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400', sold: 120 },
        { id: 'acc-magsafe-charger', name: 'Apple MagSafe Ladegerät 15W', category: 'power', brand: 'Apple', price: 35, stock: 30, costPrice: 20, description: 'Originales Apple MagSafe Ladegerät für iPhone 12 und neuer.', image: 'https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=400', sold: 89 },
        { id: 'acc-powerbank-20000', name: 'Anker PowerCore 20000mAh', category: 'power', brand: 'Anker', price: 49, stock: 25, costPrice: 28, description: '20000mAh Powerbank mit USB-C PD und Quick Charge 3.0.', image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400', sold: 67 },
        { id: 'acc-case-iphone15-clear', name: 'Silikon Case iPhone 15 Pro Klar', category: 'protection', brand: 'Spigen', price: 19, stock: 40, costPrice: 8, description: 'Ultra-dünne Schutzhülle für iPhone 15 Pro. Militärstandard Fallschutz.', image: 'https://images.unsplash.com/photo-1601593343143-6c5c1ff14b9b?w=400', sold: 210 },
        { id: 'acc-screen-protector-s24', name: 'Panzerglas Galaxy S24 Ultra', category: 'protection', brand: 'Spigen', price: 14, stock: 60, costPrice: 5, description: '9H gehärtetes Glas mit Fingerabdrucksensor-Kompatibilität.', image: 'https://images.unsplash.com/photo-1601592426704-1f59651ceec7?w=400', sold: 155 },
        { id: 'acc-applewatch-9', name: 'Apple Watch Series 9 41mm', category: 'wearables', brand: 'Apple', price: 349, stock: 8, costPrice: 270, description: 'Apple Watch Series 9 mit Sportarmband. GPS Modell.', image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400', sold: 28 },
        { id: 'acc-cable-usbc-2m', name: 'USB-C Kabel 2m (100W)', category: 'power', brand: 'Anker', price: 12, stock: 80, costPrice: 4, description: '100W USB-C Kabel, 2 Meter lang, Nylon-umflochten.', image: 'https://images.unsplash.com/photo-1601940936872-0a0c25a7c2ab?w=400', sold: 340 },
        { id: 'acc-wireless-charger-15w', name: 'Qi2 Wireless Charger 15W', category: 'power', brand: 'Belkin', price: 25, stock: 35, costPrice: 14, description: 'Qi2 kompatibler kabelloser Lader mit 15W Ausgangsleistung.', image: 'https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=400', sold: 78 },
    ];

    const created = await Accessory.create(accessories);
    console.log(`✅ Created ${created.length} Accessories`);
    return created;
}

// ── 4. SHIPPING METHODS ───────────────────────────────────────────────────────
async function seedShippingMethods() {
    await ShippingMethod.deleteMany({});
    const methods = [
        { name: 'Standard Versand', description: 'DHL Paket — 3-5 Werktage', price: 5.99, duration: '3-5 Werktage', isActive: true, isExpress: false },
        { name: 'Express Versand', description: 'DHL Express — 1-2 Werktage', price: 12.99, duration: '1-2 Werktage', isActive: true, isExpress: true },
        { name: 'Kostenloser Versand', description: 'Kostenlos ab €100 — 3-5 Werktage', price: 0, duration: '3-5 Werktage', isActive: true, isExpress: false },
        { name: 'Abholung im Laden', description: 'Kostenlose Abholung in unserem Geschäft', price: 0, duration: 'Sofort verfügbar', isActive: true, isExpress: false },
    ];
    const created = await ShippingMethod.create(methods);
    console.log(`✅ Created ${created.length} Shipping Methods`);
    return created;
}

// ── 5. COUPONS ────────────────────────────────────────────────────────────────
async function seedCoupons() {
    await Coupon.deleteMany({});
    const coupons = [
        { code: 'WELCOME10', discountType: 'percentage', discountValue: 10, minOrderValue: 50, maxDiscount: 30, validUntil: future(90), usageLimit: 100, isActive: true },
        { code: 'SAVE20', discountType: 'percentage', discountValue: 20, minOrderValue: 100, maxDiscount: 50, validUntil: future(30), usageLimit: 50, isActive: true },
        { code: 'FLAT15', discountType: 'fixed', discountValue: 15, minOrderValue: 80, validUntil: future(60), usageLimit: null, isActive: true },
        { code: 'FLASH50', discountType: 'percentage', discountValue: 50, minOrderValue: 200, maxDiscount: 100, validUntil: future(7), usageLimit: 10, isActive: true },
        { code: 'EXPIRED', discountType: 'percentage', discountValue: 15, minOrderValue: 0, validUntil: past(5), usageLimit: null, isActive: false }, // Expired — for testing
        { code: 'MAXED', discountType: 'fixed', discountValue: 10, minOrderValue: 0, validUntil: future(30), usageLimit: 1, usedCount: 1, isActive: true }, // Fully used — for testing
    ];
    const created = await Coupon.create(coupons);
    console.log(`✅ Created ${created.length} Coupons`);
}

// ── 6. ORDERS ─────────────────────────────────────────────────────────────────
async function seedOrders(users, products) {
    await Order.deleteMany({});
    console.log('🗑️  Cleared Orders');

    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    const paymentMethods = ['cash', 'card', 'paypal', 'bank_transfer'];

    const shippingAddresses = [
        { fullName: 'Max Mustermann', email: 'max@test.de', phone: '+4915223456780', street: 'Musterstraße 1', city: 'Berlin', zipCode: '10115', country: 'Germany' },
        { fullName: 'Anna Schmidt', email: 'anna@test.de', phone: '+4915323456781', street: 'Hauptstraße 42', city: 'München', zipCode: '80331', country: 'Germany' },
        { fullName: 'Ahmed Hassan', email: 'ahmed@test.de', phone: '+4915423456782', street: 'Berliner Str. 12', city: 'Hamburg', zipCode: '20095', country: 'Germany' },
    ];

    const customers = users.filter(u => u.role === 'user' && u.isVerified);
    const activeProducts = products.filter(p => p.stock > 0);

    const orders = [];
    for (let i = 0; i < 20; i++) {
        const user = pick(customers);
        const product = pick(activeProducts);
        const quantity = rand(1, 3);
        const itemTotal = product.price * quantity;
        const tax = itemTotal * 0.19;
        const shippingFee = itemTotal > 100 ? 0 : 5.99;
        const totalAmount = itemTotal + tax + shippingFee;
        const status = pick(statuses);
        const createdAt = past(rand(1, 120));

        orders.push({
            orderNumber: `HL-${createdAt.getFullYear()}${String(createdAt.getMonth()+1).padStart(2,'0')}${String(createdAt.getDate()).padStart(2,'0')}-${String(i+1).padStart(4,'0')}`,
            user: user._id,
            items: [{ product: product._id, productType: 'Product', name: product.name, quantity, price: product.price, image: product.image }],
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            tax: parseFloat(tax.toFixed(2)),
            shippingFee,
            discountAmount: 0,
            status,
            paymentMethod: pick(paymentMethods),
            paymentStatus: status === 'delivered' || status === 'shipped' ? 'paid' : status === 'cancelled' ? 'failed' : status === 'refunded' ? 'refunded' : 'pending',
            shippingAddress: pick(shippingAddresses),
            trackingNumber: ['shipped', 'delivered'].includes(status) ? `DHL${rand(100000000, 999999999)}` : undefined,
            createdAt,
        });
    }

    const created = await Order.create(orders);
    console.log(`✅ Created ${created.length} Orders`);
    return created;
}

// ── 7. REVIEWS ────────────────────────────────────────────────────────────────
async function seedReviews(users, products) {
    await Review.deleteMany({});
    const reviewTexts = [
        'Super Gerät, genau wie beschrieben!', 'Sehr schnelle Lieferung, Top-Qualität!',
        'Gutes Preis-Leistungs-Verhältnis, bin sehr zufrieden.', 'Leichte Gebrauchsspuren, aber alles funktioniert einwandfrei.',
        'Würde jederzeit wieder kaufen!', 'Akku hält gut durch, Gerät läuft flüssig.',
        'Etwas teurer als erwartet, aber gute Qualität.', 'Toller Service, schnelle Antworten bei Fragen.',
    ];
    const customers = users.filter(u => u.role === 'user' && u.isVerified);
    const reviews = [];
    for (const product of products.slice(0, 8)) {
        const numReviews = rand(2, 5);
        for (let i = 0; i < numReviews; i++) {
            reviews.push({
                user: pick(customers)._id,
                product: product._id,
                rating: rand(3, 5),
                comment: pick(reviewTexts),
                createdAt: past(rand(1, 90))
            });
        }
    }
    const created = await Review.create(reviews);
    console.log(`✅ Created ${created.length} Reviews`);
}

// ── 8. REPAIR TICKETS ─────────────────────────────────────────────────────────
async function seedRepairTickets(users) {
    await RepairTicket.deleteMany({});
    const customers = users.filter(u => u.role === 'user' && u.isVerified);
    const statuses = ['pending', 'received', 'diagnosing', 'repairing', 'testing', 'ready', 'completed', 'cancelled'];
    const devices = ['iPhone 13 Pro', 'Samsung Galaxy S22', 'iPhone 12', 'Xiaomi 13', 'Google Pixel 7', 'iPad Air'];
    const issues = ['Display gebrochen', 'Akku defekt', 'Gerät startet nicht', 'Kamera unscharf', 'Mikrofon defekt', 'Wasserschaden', 'Ladebuchse kaputt'];
    const serviceTypes = ['Mail-in', 'In-Store', 'On-Site'];

    const tickets = customers.flatMap((user, idx) => [
        {
            user: user._id,
            device: pick(devices),
            issue: pick(issues),
            status: pick(statuses),
            estimatedCost: rand(30, 250),
            serviceType: pick(serviceTypes),
            appointmentDate: idx % 2 === 0 ? future(rand(1, 14)) : undefined,
            notes: 'Bitte schnell reparieren, ich brauche das Gerät dringend.',
            messages: [{ role: 'customer', text: 'Wann kann ich mit einer Reparatur rechnen?', timestamp: Date.now() }],
            timeline: [{ status: 'received', note: 'Gerät empfangen', timestamp: past(rand(1, 10)) }],
            ticketId: `REP-${String(25 + idx).padStart(2,'0')}-${Math.random().toString(16).slice(2,8).toUpperCase()}`,
        }
    ]);

    // Guest ticket
    tickets.push({
        guestContact: { name: 'Jonas Becker', email: 'jonas@guest.de', phone: '+4916623456789' },
        device: 'iPhone 11',
        issue: 'Display gebrochen',
        status: 'repairing',
        estimatedCost: 89,
        serviceType: 'In-Store',
        messages: [{ role: 'admin', text: 'Wir haben das Ersatzteil bestellt, Dauer ca. 3 Tage.', timestamp: Date.now() }],
        timeline: [{ status: 'received', note: 'Gerät empfangen', timestamp: past(3) }],
        ticketId: 'REP-99-GUEST01',
    });

    const created = await RepairTicket.create(tickets);
    console.log(`✅ Created ${created.length} Repair Tickets`);
}

// ── 9. REPAIR PARTS ───────────────────────────────────────────────────────────
async function seedRepairParts() {
    await RepairPart.deleteMany({});
    const parts = [
        { id: 'rp-iphone15-display', name: 'Display iPhone 15 Pro OLED', brand: 'Apple', model: 'iPhone 15 Pro', category: 'Display', price: 129, stock: 8, costPrice: 80, minStock: 2, supplierName: 'TechParts GmbH', description: 'Original-Qualität OLED Display für iPhone 15 Pro' },
        { id: 'rp-iphone14-display', name: 'Display iPhone 14 OLED', brand: 'Apple', model: 'iPhone 14', category: 'Display', price: 99, stock: 12, costPrice: 60, minStock: 3, supplierName: 'TechParts GmbH', description: 'Original-Qualität OLED Display für iPhone 14' },
        { id: 'rp-iphone13-akku', name: 'Akku iPhone 13 3227mAh', brand: 'Apple', model: 'iPhone 13', category: 'Akku', price: 39, stock: 20, costPrice: 18, minStock: 5, supplierName: 'BatteryWorld', description: 'Original-Qualität Akku für iPhone 13' },
        { id: 'rp-samsung-s24-display', name: 'Display Samsung Galaxy S24 AMOLED', brand: 'Samsung', model: 'Galaxy S24', category: 'Display', price: 109, stock: 6, costPrice: 70, minStock: 2, supplierName: 'TechParts GmbH', description: 'Original-Qualität AMOLED Display für S24' },
        { id: 'rp-iphone-ladebuchse', name: 'Lightning Port iPhone 11/12', brand: 'Apple', model: 'iPhone 11/12', category: 'Ladebuchse', price: 25, stock: 30, costPrice: 10, minStock: 5, supplierName: 'SpareHub', description: 'Kompatible Lightning Ladebuchse' },
        { id: 'rp-samsung-akku-s23', name: 'Akku Samsung Galaxy S23 3900mAh', brand: 'Samsung', model: 'Galaxy S23', category: 'Akku', price: 35, stock: 1, costPrice: 16, minStock: 3, supplierName: 'BatteryWorld', description: 'Ersatz-Akku für Galaxy S23' }, // Low stock for testing
    ];
    const created = await RepairPart.create(parts);
    console.log(`✅ Created ${created.length} Repair Parts`);
}

// ── 10. SUPPLIERS ─────────────────────────────────────────────────────────────
async function seedSuppliers() {
    await Supplier.deleteMany({});
    const suppliers = [
        { name: 'TechParts GmbH', contactPerson: 'Klaus Weber', email: 'k.weber@techparts.de', phone: '+4930123456789', address: { street: 'Industriestraße 45', city: 'Berlin', zipCode: '10317', country: 'Germany' }, rating: 5, reliabilityScore: 98, isActive: true },
        { name: 'BatteryWorld', contactPerson: 'Sarah Miller', email: 'sarah@batteryworld.com', phone: '+4989234567890', address: { street: 'Maximilianstr. 12', city: 'München', zipCode: '80333', country: 'Germany' }, rating: 4, reliabilityScore: 92, isActive: true },
        { name: 'SpareHub', contactPerson: 'Thomas König', email: 'koenig@sparehub.de', phone: '+4940345678901', address: { street: 'Hamburger Allee 7', city: 'Hamburg', zipCode: '20354', country: 'Germany' }, rating: 4, reliabilityScore: 88, isActive: true },
        { name: 'PhoneParts Express', contactPerson: 'Maria Bauer', email: 'bauer@phonepartsexpress.de', phone: '+4921156789012', address: { street: 'Rheinstraße 89', city: 'Düsseldorf', zipCode: '40213', country: 'Germany' }, rating: 3, reliabilityScore: 75, isActive: false },
    ];
    const created = await Supplier.create(suppliers);
    console.log(`✅ Created ${created.length} Suppliers`);
    return created;
}

// ── 11. PURCHASE ORDERS ───────────────────────────────────────────────────────
async function seedPurchaseOrders(suppliers) {
    await PurchaseOrder.deleteMany({});
    const activeSuppliers = suppliers.filter(s => s.isActive);
    const statuses = ['Draft', 'Sent', 'Received', 'Cancelled'];
    const pos = [
        { supplier: activeSuppliers[0]._id, status: 'Received', items: [{ productName: 'Display iPhone 15 Pro', quantity: 10, unitPrice: 80 }], notes: 'Dringend benötigt', expectedDeliveryDate: past(20) },
        { supplier: activeSuppliers[1]._id, status: 'Sent', items: [{ productName: 'Akku iPhone 13', quantity: 20, unitPrice: 18 }, { productName: 'Akku Samsung S23', quantity: 10, unitPrice: 16 }], notes: '', expectedDeliveryDate: future(10) },
        { supplier: activeSuppliers[2]._id, status: 'Draft', items: [{ productName: 'Lightning Port iPhone 11', quantity: 30, unitPrice: 10 }], notes: 'Normaler Nachschub' },
        { supplier: activeSuppliers[0]._id, status: 'Cancelled', items: [{ productName: 'Display Samsung S24', quantity: 5, unitPrice: 70 }], notes: 'Lieferant nicht verfügbar' },
    ];
    const created = await PurchaseOrder.create(pos);
    console.log(`✅ Created ${created.length} Purchase Orders`);
}

// ── 12. DEVICE BLUEPRINTS (Valuation) ─────────────────────────────────────────
async function seedDeviceBlueprints() {
    await DeviceBlueprint.deleteMany({});
    const blueprints = [
        { brand: 'Apple', model: 'iPhone 15 Pro', basePrice: 600, conditions: { 'Wie neu': 600, 'Sehr gut': 500, 'Gut': 380, 'Akzeptabel': 250 }, releaseYear: 2023, series: 'iPhone 15' },
        { brand: 'Apple', model: 'iPhone 15', basePrice: 480, conditions: { 'Wie neu': 480, 'Sehr gut': 390, 'Gut': 280, 'Akzeptabel': 180 }, releaseYear: 2023, series: 'iPhone 15' },
        { brand: 'Apple', model: 'iPhone 14 Pro', basePrice: 500, conditions: { 'Wie neu': 500, 'Sehr gut': 400, 'Gut': 300, 'Akzeptabel': 190 }, releaseYear: 2022, series: 'iPhone 14' },
        { brand: 'Apple', model: 'iPhone 14', basePrice: 350, conditions: { 'Wie neu': 350, 'Sehr gut': 280, 'Gut': 200, 'Akzeptabel': 120 }, releaseYear: 2022, series: 'iPhone 14' },
        { brand: 'Apple', model: 'iPhone 13', basePrice: 280, conditions: { 'Wie neu': 280, 'Sehr gut': 220, 'Gut': 160, 'Akzeptabel': 90 }, releaseYear: 2021, series: 'iPhone 13' },
        { brand: 'Apple', model: 'iPhone 12', basePrice: 180, conditions: { 'Wie neu': 180, 'Sehr gut': 140, 'Gut': 100, 'Akzeptabel': 60 }, releaseYear: 2020, series: 'iPhone 12' },
        { brand: 'Samsung', model: 'Galaxy S24 Ultra', basePrice: 650, conditions: { 'Wie neu': 650, 'Sehr gut': 530, 'Gut': 400, 'Akzeptabel': 260 }, releaseYear: 2024, series: 'Galaxy S24' },
        { brand: 'Samsung', model: 'Galaxy S24', basePrice: 420, conditions: { 'Wie neu': 420, 'Sehr gut': 340, 'Gut': 250, 'Akzeptabel': 160 }, releaseYear: 2024, series: 'Galaxy S24' },
        { brand: 'Samsung', model: 'Galaxy S23', basePrice: 320, conditions: { 'Wie neu': 320, 'Sehr gut': 260, 'Gut': 190, 'Akzeptabel': 120 }, releaseYear: 2023, series: 'Galaxy S23' },
        { brand: 'Xiaomi', model: 'Xiaomi 14', basePrice: 400, conditions: { 'Wie neu': 400, 'Sehr gut': 320, 'Gut': 240, 'Akzeptabel': 150 }, releaseYear: 2024, series: 'Xiaomi 14' },
        { brand: 'Google', model: 'Pixel 8 Pro', basePrice: 480, conditions: { 'Wie neu': 480, 'Sehr gut': 390, 'Gut': 290, 'Akzeptabel': 180 }, releaseYear: 2023, series: 'Pixel 8' },
    ];
    const created = await DeviceBlueprint.create(blueprints);
    console.log(`✅ Created ${created.length} Device Blueprints`);
}

// ── 13. LOANER PHONES ─────────────────────────────────────────────────────────
async function seedLoanerPhones() {
    await LoanerPhone.deleteMany({});
    const phones = [
        { brand: 'Apple', model: 'iPhone 11', status: 'Available', imei: '351234567890001', notes: 'Für Kunden während der Reparatur' },
        { brand: 'Samsung', model: 'Galaxy A33', status: 'Available', imei: '351234567890002', notes: 'Zweitgerät' },
        { brand: 'Apple', model: 'iPhone XR', status: 'Lent', imei: '351234567890003', currentCustomer: { name: 'Jonas Becker', phone: '+4916623456789', email: 'jonas@guest.de' }, lentDate: past(3), dueDate: future(7), notes: 'Ausgeliehen an Ticket REP-99-GUEST01' },
        { brand: 'Xiaomi', model: 'Redmi 9', status: 'Maintenance', imei: '351234567890004', notes: 'Display-Reinigung' },
    ];
    const created = await LoanerPhone.create(phones);
    console.log(`✅ Created ${created.length} Loaner Phones`);
}

// ── 14. PROMOTIONS ────────────────────────────────────────────────────────────
async function seedPromotions() {
    await Promotion.deleteMany({});
    const promos = [
        { title: 'Frühlingsangebote', description: '10% auf alle Samsung Geräte', discount: 10, isActive: true, startsAt: past(5), endsAt: future(25) },
        { title: 'Blitzangebot', description: '20% auf ausgewählte iPhones heute!', discount: 20, isActive: true, startsAt: new Date(), endsAt: future(1) },
        { title: 'Abgelaufene Aktion', description: 'Frühjahrsputz Aktion', discount: 15, isActive: false, startsAt: past(30), endsAt: past(10) },
    ];
    const created = await Promotion.create(promos);
    console.log(`✅ Created ${created.length} Promotions`);
}

// ── 15. WARRANTIES ────────────────────────────────────────────────────────────
async function seedWarranties(users, products, orders) {
    await Warranty.deleteMany({});
    const completedOrders = orders.filter(o => o.status === 'delivered');
    if (completedOrders.length === 0) { console.log('⚠️  No delivered orders for warranties'); return; }

    const customers = users.filter(u => u.role === 'user' && u.isVerified);
    const warranties = completedOrders.slice(0, 5).map((order, i) => {
        const customer = customers[i % customers.length];
        const startDate = order.createdAt || past(rand(10, 60));
        const durationDays = i % 2 === 0 ? 365 : 180;
        return {
            customerName: customer.name,
            customerPhone: customer.phone || '+491500000000',
            customerEmail: customer.email,
            itemType: 'Product',
            itemName: order.items[0]?.name || 'Smartphone',
            imeiOrSerial: `SN-${rand(100000, 999999)}`,
            startDate,
            durationDays,
            endDate: new Date(startDate.getTime() + durationDays * 86400000),
            status: 'Active',
            notes: 'Händlergarantie',
        };
    });

    const created = await Warranty.create(warranties);
    console.log(`✅ Created ${created.length} Warranties`);
}

// ── 16. TRANSACTIONS ──────────────────────────────────────────────────────────
async function seedTransactions(users, orders) {
    await Transaction.deleteMany({});
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    const paymentMethodMap = { 'cash': 'card_present', 'card': 'card', 'paypal': 'paypal', 'bank_transfer': 'bank_transfer' };
    const transactions = paidOrders.map(order => ({
        user: order.user,
        order: order._id,
        amount: order.totalAmount,
        status: 'completed',
        type: 'purchase',
        paymentMethod: paymentMethodMap[order.paymentMethod] || 'card',
        description: `Zahlung für Bestellung #${order.orderNumber}`,
        stripePaymentId: order.paymentMethod === 'card' ? `pi_test_${rand(100000, 999999)}` : undefined,
        createdAt: order.createdAt,
    }));

    if (transactions.length === 0) { console.log('⚠️  No paid orders for transactions'); return; }
    const created = await Transaction.create(transactions);
    console.log(`✅ Created ${created.length} Transactions`);
}

// ── 17. STOCK HISTORY ─────────────────────────────────────────────────────────
async function seedStockHistory(products, users) {
    await StockHistory.deleteMany({});
    const adminUser = users.find(u => u.role === 'admin');
    const entries = products.slice(0, 5).map(p => {
        const previousStock = Math.max(0, p.stock - rand(5, 20));
        const newStock = p.stock;
        return {
            itemId: p._id,
            itemModel: 'Product',
            itemName: p.name,
            user: adminUser._id,
            userName: adminUser.name,
            previousStock,
            newStock,
            changeAmount: newStock - previousStock,
            reason: 'Restock',
            notes: 'Wareneingang vom Lieferanten',
        };
    });
    const created = await StockHistory.create(entries);
    console.log(`✅ Created ${created.length} Stock History Entries`);
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
async function main() {
    console.log('\n🌱 HandyLand Comprehensive Seeder');
    console.log('═'.repeat(50));

    await connectDB();

    try {
        const users     = await seedUsers();
        const products  = await seedProducts();
        const accessories= await seedAccessories();
        await seedShippingMethods();
        await seedCoupons();
        const orders    = await seedOrders(users, products);
        await seedReviews(users, products);
        await seedRepairTickets(users);
        await seedRepairParts();
        const suppliers = await seedSuppliers();
        await seedPurchaseOrders(suppliers);
        await seedDeviceBlueprints();
        await seedLoanerPhones();
        await seedPromotions();
        await seedWarranties(users, products, orders);
        await seedTransactions(users, orders);
        await seedStockHistory(products, users);

        console.log('\n' + '═'.repeat(50));
        console.log('✅ ALL DATA SEEDED SUCCESSFULLY!\n');
        console.log('📋 Test Accounts:');
        console.log('   Admin:   admin@handyland.de   | Admin@12345');
        console.log('   User 1:  max@test.de          | Test@12345');
        console.log('   User 2:  anna@test.de         | Test@12345');
        console.log('   User 3:  ahmed@test.de        | Test@12345 (Arabic UI)');
        console.log('   User 4:  elena@test.de        | Test@12345 (Platinum)');
        console.log('   User 5:  mehmet@test.de       | Test@12345 (Unverified)');
        console.log('   Blocked: lisa@test.de         | Test@12345 (Deactivated)');
        console.log('\n🎟️  Test Coupons:');
        console.log('   WELCOME10 — 10% Rabatt ab €50');
        console.log('   SAVE20    — 20% Rabatt ab €100 (max €50)');
        console.log('   FLAT15    — €15 Rabatt ab €80');
        console.log('   FLASH50   — 50% Rabatt ab €200 (max €100, 10 uses)');
        console.log('   EXPIRED   — Abgelaufen (für Fehlertest)');
        console.log('   MAXED     — Verbraucht (für Fehlertest)\n');

    } catch (err) {
        console.error('\n❌ Seeding failed at step:', err.message);
        if (err.errors) console.error('Validation errors:', JSON.stringify(err.errors, null, 2));
        console.error('Full error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB Disconnected');
        process.exit(0);
    }
}

main();
