const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// IMPORTANT: We need the original MONGO_URI to read the data!
// We assume it is running locally if not in .env.
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_KEY missing in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Utility: Convert 24-char MongoDB ObjectId to 36-char valid UUID
// Pad with zeros to make it exactly 32 hex chars, then add dashes.
// Example: 5f9b3b3b9b3b3b9b3b3b9b3b -> 00000000-0000-0000-0000-5f9b3b3b9b3b
function convertObjectIdToUUID(objectIdStr) {
    if (!objectIdStr) return null;
    const str = objectIdStr.toString();
    if (str.length !== 24) {
        // If it's already a UUID, return it
        if (str.length === 36 && str.includes('-')) return str;
        console.warn(`Warning: ID ${str} is not a valid 24-char ObjectId. Returning as is.`);
        return str;
    }
    const padded = '00000000' + str; // 8 + 24 = 32 chars
    return `${padded.slice(0, 8)}-${padded.slice(8, 12)}-${padded.slice(12, 16)}-${padded.slice(16, 20)}-${padded.slice(20, 32)}`;
}

// Utility: Chunk array for batch processing
function chunkArray(array, size) {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

// MongoDB Models mapped dynamically (so we don't need all full schema files)
const UserSchema = new mongoose.Schema({}, { strict: false });
const ProductSchema = new mongoose.Schema({}, { strict: false });
const OrderSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', UserSchema, 'users');
const Product = mongoose.model('Product', ProductSchema, 'products');
const Order = mongoose.model('Order', OrderSchema, 'orders');

async function migrateUsers() {
    console.log('\n--- Migrating Users ---');
    const users = await User.find({}).lean();
    console.log(`Found ${users.length} users in MongoDB.`);

    const formattedUsers = users.map(u => ({
        id: convertObjectIdToUUID(u._id),
        name: u.name || 'Unknown',
        email: u.email,
        encrypted_password: u.password || null, // Will be imported to auth.users
        role: u.role || 'user',
        is_verified: u.isVerified || false,
        is_active: u.isActive !== false,
        phone: u.phone || null,
        loyalty_points: u.loyaltyPoints || 0,
        membership_level: u.membershipLevel || 1,
        preferred_language: u.preferredLanguage || 'de',
        created_at: u.createdAt || new Date(),
        updated_at: u.updatedAt || new Date()
    }));

    const chunks = chunkArray(formattedUsers, 50);
    let successCount = 0;

    for (const chunk of chunks) {
        // We use the custom RPC function to insert into auth.users safely
        const { error } = await supabase.rpc('import_legacy_users', { user_data: chunk });
        
        if (error) {
            console.error('Error importing user batch:', error);
        } else {
            successCount += chunk.length;
            process.stdout.write(`\rImported ${successCount}/${users.length} users...`);
        }
    }
    console.log(`\nSuccessfully migrated ${successCount} users.`);
}

async function migrateProducts() {
    console.log('\n--- Migrating Products ---');
    const products = await Product.find({}).lean();
    console.log(`Found ${products.length} products in MongoDB.`);

    const formattedProducts = products.map(p => ({
        id: convertObjectIdToUUID(p._id),
        name: p.name,
        price: p.price,
        stock: p.stock || 0,
        min_stock: p.minStock || 2,
        sold: p.sold || 0,
        is_active: p.isActive !== false,
        barcode: p.barcode || null,
        description: p.description || null,
        features: p.features || [],
        image: p.image || null,
        images: p.images || [],
        category: p.category || null,
        sub_category: p.subCategory || null,
        brand: p.brand || null,
        model: p.model || null,
        cost_price: p.costPrice || 0,
        condition: p.condition || 'new',
        seller: convertObjectIdToUUID(p.seller) || null,
        specs: p.specs || {},
        rating: p.rating || 0,
        num_reviews: p.numReviews || 0,
        is_margin_scheme: p.isMarginScheme || false,
        created_at: p.createdAt || new Date(),
        updated_at: p.updatedAt || new Date()
    }));

    const chunks = chunkArray(formattedProducts, 100);
    let successCount = 0;

    for (const chunk of chunks) {
        const { error } = await supabase.from('products').upsert(chunk, { onConflict: 'id' });
        if (error) {
            console.error('Error importing product batch:', error.message || error);
        } else {
            successCount += chunk.length;
            process.stdout.write(`\rImported ${successCount}/${products.length} products...`);
        }
    }
    console.log(`\nSuccessfully migrated ${successCount} products.`);
}

async function migrateOrders() {
    console.log('\n--- Migrating Orders ---');
    const orders = await Order.find({}).lean();
    console.log(`Found ${orders.length} orders in MongoDB.`);
    
    // Fetch valid user IDs to prevent FK constraint violations
    const { data: users } = await supabase.from('users').select('id');
    const validUserIds = new Set(users?.map(u => u.id) || []);

    let orderSuccessCount = 0;
    let orderItemCount = 0;

    for (const o of orders) {
        const orderId = convertObjectIdToUUID(o._id);
        let userId = convertObjectIdToUUID(o.user);
        if (userId && !validUserIds.has(userId)) {
            console.warn(`User ${userId} for order ${o._id} not found. Setting to null.`);
            userId = null;
        }

        // Map order record
        const orderData = {
            id: orderId,
            order_number: `ORD-${o._id.toString().substring(16, 24).toUpperCase()}`,
            user_id: userId,
            total_amount: o.totalPrice || 0,
            tax: o.taxPrice || 0,
            shipping_fee: o.shippingPrice || 0,
            shipping_method: 'Standard',
            discount_amount: 0,
            coupon_code: null,
            status: o.status || 'pending',
            payment_method: o.paymentMethod === 'credit_card' ? 'card' : (o.paymentMethod || 'card'),
            payment_status: o.isPaid ? 'paid' : 'pending',
            shipping_full_name: o.shippingAddress?.fullName || 'Unknown',
            shipping_email: o.guestEmail || 'unknown@example.com',
            shipping_phone: o.shippingAddress?.phone || 'Unknown',
            shipping_street: o.shippingAddress?.address || o.shippingAddress?.street || 'Unknown',
            shipping_city: o.shippingAddress?.city || 'Unknown',
            shipping_zip: o.shippingAddress?.postalCode || o.shippingAddress?.zip || '00000',
            shipping_country: o.shippingAddress?.country || 'Germany',
            notes: o.notes || null,
            tracking_number: o.trackingNumber || null,
            created_at: o.createdAt || new Date(),
            updated_at: o.updatedAt || new Date()
        };

        const { error: orderError } = await supabase.from('orders').upsert(orderData, { onConflict: 'id' });
        
        if (orderError) {
            console.error(`Error importing order ${orderId}:`, orderError.message || orderError);
            continue;
        }

        orderSuccessCount++;

        // Map order items
        if (o.items && o.items.length > 0) {
            const items = o.items.map(item => ({
                id: convertObjectIdToUUID(new mongoose.Types.ObjectId()), // Generate new UUID for junction table
                order_id: orderId,
                product_id: convertObjectIdToUUID(item.product),
                product_type: 'Product',
                name: item.name,
                quantity: item.quantity || item.qty || 1,
                price: item.price || 0,
                image: item.image || null
            }));

            const { error: itemsError } = await supabase.from('order_items').upsert(items, { onConflict: 'id' });
            if (itemsError) {
                console.error(`Error importing order items for order ${orderId}:`, itemsError.message || itemsError);
            } else {
                orderItemCount += items.length;
            }
        }
    }
    
    console.log(`\nSuccessfully migrated ${orderSuccessCount} orders and ${orderItemCount} order items.`);
}

async function migrateTranslations() {
    console.log('\n--- Migrating Translations ---');
    const Translation = mongoose.model('TranslationMigrate',
        new mongoose.Schema({}, { strict: false }), 'translations');
    const docs = await Translation.find({}).lean();
    console.log(`Found ${docs.length} translation keys in MongoDB.`);

    if (docs.length === 0) { console.log('Nothing to migrate.'); return; }

    const LANGUAGES = ['de', 'en', 'ar', 'tr', 'ru', 'fa'];
    const rows = [];

    for (const doc of docs) {
        const key = doc.key;
        const namespace = doc.namespace || 'translation';
        const values = doc.values || {};

        for (const lang of LANGUAGES) {
            const value = values[lang];
            if (value && value !== key) { // Skip polluted values
                rows.push({ key, namespace, language: lang, value });
            }
        }
    }

    const chunks = chunkArray(rows, 200);
    let successCount = 0;
    for (const chunk of chunks) {
        const { error } = await supabase.from('translations')
            .upsert(chunk, { onConflict: 'key,language,namespace', ignoreDuplicates: true });
        if (error) console.error('Error batch translating:', error.message);
        else { successCount += chunk.length; process.stdout.write(`\rImported ${successCount}/${rows.length} translation rows...`); }
    }
    console.log(`\nSuccessfully migrated ${successCount} translation rows from ${docs.length} keys.`);
}

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB successfully.');

        // Execute migrations
        await migrateUsers();
        await migrateProducts();
        await migrateOrders();
        await migrateTranslations();

        console.log('\n--- Migration Complete! ---');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

run();
