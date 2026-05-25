/**
 * Seed Script: Populates Supabase Cloud with rich mock data using existing users
 * Run with: node backend/scripts/supabaseSeeder.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: SUPABASE_URL or SUPABASE_SERVICE_KEY missing in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Device Blueprints for Valuation System
const MOCK_BLUEPRINTS = [
    {
        brand: 'Apple', model: 'iPhone 15 Pro',
        base_price: 350,
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60',
        valid_storages: ['128GB', '256GB', '512GB', '1TB'],
        storage_prices: { '128GB': 0, '256GB': 40, '512GB': 90, '1TB': 160 },
        screen_hervorragend: 1.0, screen_sehr_gut: 0.92, screen_gut: 0.78, screen_beschadigt: 0.50,
        body_hervorragend: 1.0, body_sehr_gut: 0.96, body_gut: 0.86, body_beschadigt: 0.62,
        functional_multiplier: 1.0, non_functional_multiplier: 0.35,
        category: 'Smartphone', active: true
    },
    {
        brand: 'Apple', model: 'iPhone 14 Pro',
        base_price: 260,
        image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60',
        valid_storages: ['128GB', '256GB', '512GB'],
        storage_prices: { '128GB': 0, '256GB': 30, '512GB': 70 },
        screen_hervorragend: 1.0, screen_sehr_gut: 0.90, screen_gut: 0.75, screen_beschadigt: 0.48,
        body_hervorragend: 1.0, body_sehr_gut: 0.95, body_gut: 0.84, body_beschadigt: 0.58,
        functional_multiplier: 1.0, non_functional_multiplier: 0.40,
        category: 'Smartphone', active: true
    },
    {
        brand: 'Samsung', model: 'Galaxy S24 Ultra',
        base_price: 380,
        image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60',
        valid_storages: ['256GB', '512GB', '1TB'],
        storage_prices: { '256GB': 0, '512GB': 60, '1TB': 120 },
        screen_hervorragend: 1.0, screen_sehr_gut: 0.92, screen_gut: 0.78, screen_beschadigt: 0.50,
        body_hervorragend: 1.0, body_sehr_gut: 0.96, body_gut: 0.86, body_beschadigt: 0.62,
        functional_multiplier: 1.0, non_functional_multiplier: 0.35,
        category: 'Smartphone', active: true
    },
    {
        brand: 'Google', model: 'Pixel 8 Pro',
        base_price: 280,
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60',
        valid_storages: ['128GB', '256GB', '512GB'],
        storage_prices: { '128GB': 0, '256GB': 35, '512GB': 80 },
        screen_hervorragend: 1.0, screen_sehr_gut: 0.91, screen_gut: 0.76, screen_beschadigt: 0.50,
        body_hervorragend: 1.0, body_sehr_gut: 0.95, body_gut: 0.85, body_beschadigt: 0.60,
        functional_multiplier: 1.0, non_functional_multiplier: 0.38,
        category: 'Smartphone', active: true
    }
];

// Mock Products catalog
const MOCK_PRODUCTS = [
    {
        name: 'iPhone 15 Pro Max - Midnight Black (Excellent)',
        price: 899.99,
        cost_price: 650.00,
        stock: 12,
        min_stock: 3,
        sold: 4,
        category: 'Smartphones',
        brand: 'Apple',
        model: 'iPhone 15 Pro Max',
        condition: 'sehr_gut',
        description: 'Refurbished Apple iPhone 15 Pro Max with 256GB storage. Superb condition, battery health above 88%. Fully tested.',
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60',
        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60'],
        specs: { storage: '256GB', color: 'Midnight Black', battery: '91%' }
    },
    {
        name: 'Samsung Galaxy S24 Ultra - Titanium Gray (Excellent)',
        price: 949.99,
        cost_price: 700.00,
        stock: 8,
        min_stock: 2,
        sold: 2,
        category: 'Smartphones',
        brand: 'Samsung',
        model: 'Galaxy S24 Ultra',
        condition: 'hervorragend',
        description: 'Refurbished Samsung Galaxy S24 Ultra, 512GB storage. Outstanding visual condition, includes original packaging.',
        image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60',
        specs: { storage: '512GB', color: 'Titanium Gray', battery: '95%' }
    },
    {
        name: 'Lenovo ThinkPad X1 Carbon Gen 10',
        price: 1249.99,
        cost_price: 950.00,
        stock: 5,
        min_stock: 1,
        sold: 1,
        category: 'Laptops',
        brand: 'Lenovo',
        model: 'ThinkPad X1 Carbon',
        condition: 'sehr_gut',
        description: 'Enterprise grade premium ultrabook. Intel Core i7, 16GB RAM, 512GB SSD. Perfect for professionals.',
        image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60',
        specs: { cpu: 'Intel i7', ram: '16GB', storage: '512GB SSD' }
    },
    {
        name: 'AirPods Pro 2nd Gen (Active Noise Cancelling)',
        price: 199.99,
        cost_price: 120.00,
        stock: 25,
        min_stock: 5,
        sold: 15,
        category: 'Accessories',
        brand: 'Apple',
        model: 'AirPods Pro 2',
        condition: 'hervorragend',
        description: 'Certified refurbished Apple AirPods Pro 2. Cleaned and sanitized, fully operational active noise cancellation.',
        image: 'https://images.unsplash.com/photo-1588449668365-d15e397f6787?w=500&auto=format&fit=crop&q=60',
        specs: { connection: 'Bluetooth', chip: 'Apple H2' }
    }
];

async function seed() {
    try {
        console.log('🚀 Starting Supabase Seeding...');

        // 1. Fetch Existing Users in public.users
        console.log('\n👥 Fetching Existing Users from public.users...');
        const { data: users, error: fetchUsersError } = await supabase.from('users').select('id, email');
        
        if (fetchUsersError) {
            console.error('❌ Failed to fetch users:', fetchUsersError.message);
            process.exit(1);
        }

        console.log(`   Found ${users.length} users in public.users.`);
        if (users.length === 0) {
            console.error('❌ Cannot proceed: No users in public.users. Please register/create a user first.');
            process.exit(1);
        }

        // Map users for seeding association
        const user1 = users.find(u => u.email.includes('mustafamohammad0545') || u.email.includes('jifesa')) || users[0];
        const user2 = users.find(u => u.email !== user1.email) || user1;

        console.log(`   Selected user 1 for orders/quotes: ${user1.email} (${user1.id})`);
        console.log(`   Selected user 2 for orders/quotes: ${user2.email} (${user2.id})`);

        // 2. Seed Device Blueprints
        console.log('\n📱 Seeding Device Blueprints...');
        // Clear existing
        await supabase.from('device_blueprints').delete().neq('brand', '');

        const { data: seededBps, error: bpErr } = await supabase
            .from('device_blueprints')
            .insert(MOCK_BLUEPRINTS)
            .select();

        if (bpErr) {
            console.error('   ❌ Failed to seed blueprints:', bpErr.message);
        } else {
            console.log(`   ✅ Seeded ${seededBps.length} device blueprints successfully!`);
        }

        // 3. Seed Saved Valuations (Quotes)
        console.log('\n📊 Seeding Saved Valuation Quotes...');
        await supabase.from('saved_valuations').delete().neq('device', '');

        const mockQuotes = [
            {
                user_id: user1.id,
                contact_name: 'John Doe',
                contact_email: user1.email,
                contact_phone: '+491761234567',
                device: 'Apple iPhone 15 Pro',
                specs: 'Storage: 256GB',
                condition: 'sehr_gut',
                quote_reference: 'HL-VAL-2026-A1X9',
                estimated_value: 390.00,
                status: 'pending_shipment',
                is_quote: true,
                payment_iban: 'DE89370400440532013000',
                payment_bank_name: 'Sparkasse Berlin',
                shipping_address: 'Musterstraße 42, 10115 Berlin'
            },
            {
                user_id: user2.id,
                contact_name: 'Jane Smith',
                contact_email: user2.email,
                contact_phone: '+491769876543',
                device: 'Samsung Galaxy S24 Ultra',
                specs: 'Storage: 512GB',
                condition: 'hervorragend',
                quote_reference: 'HL-VAL-2026-K9P3',
                estimated_value: 440.00,
                status: 'received',
                is_quote: true,
                payment_iban: 'DE55370400440999912000',
                payment_bank_name: 'Deutsche Bank',
                shipping_address: 'Hauptstraße 15, 20095 Hamburg'
            },
            {
                user_id: user1.id,
                contact_name: 'John Doe',
                contact_email: user1.email,
                contact_phone: '+491761234567',
                device: 'Google Pixel 8 Pro',
                specs: 'Storage: 128GB',
                condition: 'gut',
                quote_reference: 'HL-VAL-2026-F5D2',
                estimated_value: 212.80,
                status: 'paid',
                is_quote: true,
                payment_iban: 'DE89370400440532013000',
                payment_bank_name: 'Sparkasse Berlin',
                shipping_address: 'Musterstraße 42, 10115 Berlin'
            },
            {
                user_id: user2.id,
                contact_name: 'Jane Smith',
                contact_email: user2.email,
                contact_phone: '+491769876543',
                device: 'Apple iPhone 14 Pro',
                specs: 'Storage: 128GB',
                condition: 'beschadigt',
                quote_reference: 'HL-VAL-2026-Q8W1',
                estimated_value: 124.80,
                status: 'active',
                is_quote: true
            }
        ];

        const { data: seededQuotes, error: quotesErr } = await supabase
            .from('saved_valuations')
            .insert(mockQuotes)
            .select();

        if (quotesErr) {
            console.error('   ❌ Failed to seed quotes:', quotesErr.message);
        } else {
            console.log(`   ✅ Seeded ${seededQuotes.length} valuation quotes successfully!`);
        }

        // 4. Seed Products
        console.log('\n📦 Seeding Products...');
        // First delete any test products
        await supabase.from('products').delete().neq('name', '');

        const { data: seededProducts, error: prodErr } = await supabase
            .from('products')
            .insert(MOCK_PRODUCTS)
            .select();

        if (prodErr) {
            console.error('   ❌ Failed to seed products:', prodErr.message);
        } else {
            console.log(`   ✅ Seeded ${seededProducts.length} products successfully!`);
        }

        // 5. Seed Orders & Order Items
        console.log('\n🛒 Seeding Orders & Order Items...');
        await supabase.from('orders').delete().neq('order_number', '');

        const mockOrders = [
            {
                order_number: 'ORD-A1099238',
                user_id: user1.id,
                total_amount: 899.99,
                tax: 143.70,
                shipping_fee: 0.00,
                shipping_method: 'Standard DHL',
                status: 'delivered',
                payment_method: 'stripe',
                payment_status: 'paid',
                shipping_full_name: 'John Doe',
                shipping_email: user1.email,
                shipping_phone: '+491761234567',
                shipping_street: 'Musterstraße 42',
                shipping_city: 'Berlin',
                shipping_zip: '10115',
                shipping_country: 'Germany',
                created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days ago
            },
            {
                order_number: 'ORD-B2039488',
                user_id: user2.id,
                total_amount: 199.99,
                tax: 31.93,
                shipping_fee: 4.99,
                shipping_method: 'Standard DHL',
                status: 'processing',
                payment_method: 'paypal',
                payment_status: 'paid',
                shipping_full_name: 'Jane Smith',
                shipping_email: user2.email,
                shipping_phone: '+491769876543',
                shipping_street: 'Hauptstraße 15',
                shipping_city: 'Hamburg',
                shipping_zip: '20095',
                shipping_country: 'Germany',
                created_at: new Date().toISOString() // today
            }
        ];

        const { data: seededOrders, error: ordersErr } = await supabase
            .from('orders')
            .insert(mockOrders)
            .select();

        if (ordersErr) {
            console.error('   ❌ Failed to seed orders:', ordersErr.message);
        } else {
            console.log(`   ✅ Seeded ${seededOrders.length} orders successfully!`);

            // Seed Order Items
            const itemsToInsert = [];
            const iphoneProduct = seededProducts.find(p => p.name.includes('iPhone 15 Pro Max'));
            const airpodsProduct = seededProducts.find(p => p.name.includes('AirPods Pro 2'));

            if (seededOrders[0] && iphoneProduct) {
                itemsToInsert.push({
                    order_id: seededOrders[0].id,
                    product_id: iphoneProduct.id,
                    product_type: 'Product',
                    name: iphoneProduct.name,
                    quantity: 1,
                    price: iphoneProduct.price,
                    image: iphoneProduct.image
                });
            }

            if (seededOrders[1] && airpodsProduct) {
                itemsToInsert.push({
                    order_id: seededOrders[1].id,
                    product_id: airpodsProduct.id,
                    product_type: 'Product',
                    name: airpodsProduct.name,
                    quantity: 1,
                    price: airpodsProduct.price,
                    image: airpodsProduct.image
                });
            }

            if (itemsToInsert.length > 0) {
                const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
                if (itemsErr) {
                    console.error('   ❌ Failed to seed order items:', itemsErr.message);
                } else {
                    console.log(`   ✅ Seeded ${itemsToInsert.length} order items successfully!`);
                }
            }
        }

        console.log('\n🎉 Seeding Completed Successfully! Your Admin Console is now beautifully populated with rich statistics, products, blueprints, and valuation quotes.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed due to unexpected error:', err.message || err);
        process.exit(1);
    }
}

seed();
