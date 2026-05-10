const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function convertObjectIdToUUID(objectIdStr) {
    if (!objectIdStr) return null;
    const str = objectIdStr.toString();
    if (str.length !== 24) return (str.length === 36 && str.includes('-')) ? str : null;
    const padded = '00000000' + str;
    return `${padded.slice(0, 8)}-${padded.slice(8, 12)}-${padded.slice(12, 16)}-${padded.slice(16, 20)}-${padded.slice(20, 32)}`;
}

const Accessory = mongoose.model('Accessory', new mongoose.Schema({}, { strict: false }), 'accessories');
const Message = mongoose.model('Message', new mongoose.Schema({}, { strict: false }), 'messages');
const Valuation = mongoose.model('Valuation', new mongoose.Schema({}, { strict: false }), 'valuations');
const RepairArchive = mongoose.model('RepairArchive', new mongoose.Schema({}, { strict: false }), 'deviceblueprints');

async function run() {
    await mongoose.connect(MONGO_URI);
    
    // Valid Users
    const { data: users } = await supabase.from('users').select('id');
    const validUserIds = new Set(users?.map(u => u.id) || []);
    const fallbackUserId = users?.[0]?.id || null;

    console.log('\n--- Finalizing Migration ---');

    // 1. Accessories (Already done, but for safety)
    const accDocs = await Accessory.find({}).lean();
    const accRows = accDocs.map(d => ({
        id: convertObjectIdToUUID(d._id),
        name: d.name,
        price: d.price || 0,
        stock: d.stock || 0,
        brand: d.brand || null,
        category: d.category || 'General',
        image: d.image || null,
        description: d.description || null,
        is_active: d.isActive !== false
    }));
    await supabase.from('accessories').upsert(accRows);
    console.log(`Migrated ${accRows.length} Accessories.`);

    // 2. Messages
    const msgDocs = await Message.find({}).lean();
    const msgRows = msgDocs.map(d => ({
        id: convertObjectIdToUUID(d._id),
        user_id: validUserIds.has(convertObjectIdToUUID(d.user)) ? convertObjectIdToUUID(d.user) : null,
        name: d.name || d.senderName || 'Guest',
        email: d.email || d.senderEmail || 'guest@example.com',
        message: d.message || d.content || d.text || 'Empty message',
        status: 'read',
        created_at: d.createdAt || new Date()
    }));
    const { error: msgErr } = await supabase.from('messages').upsert(msgRows);
    if (msgErr) console.error('Messages Error:', msgErr.message);
    else console.log(`Migrated ${msgRows.length} Messages.`);

    // 3. Valuations
    const valDocs = await Valuation.find({}).lean();
    const valRows = valDocs.map(d => {
        let uId = convertObjectIdToUUID(d.user || d.userId);
        if (!validUserIds.has(uId)) uId = fallbackUserId; // Valuations need a user_id (NOT NULL)
        if (!uId) return null;
        return {
            id: convertObjectIdToUUID(d._id),
            user_id: uId,
            device_name: d.device || d.model || 'Unknown',
            brand: d.brand || 'Unknown',
            storage: d.storage || 'Unknown',
            condition: d.condition || 'Used',
            estimated_value: d.estimatedPrice || d.value || 0,
            status: d.status || 'pending',
            created_at: d.createdAt || new Date()
        };
    }).filter(Boolean);
    const { error: valErr } = await supabase.from('valuations').upsert(valRows);
    if (valErr) console.error('Valuations Error:', valErr.message);
    else console.log(`Migrated ${valRows.length} Valuations.`);

    console.log('\n--- Done! ---');
    process.exit(0);
}

run();
