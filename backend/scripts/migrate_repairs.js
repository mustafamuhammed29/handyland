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

const RepairTicket = mongoose.model('RepairTicket', new mongoose.Schema({}, { strict: false }), 'repairtickets');

async function run() {
    await mongoose.connect(MONGO_URI);
    
    // Valid Users
    const { data: users } = await supabase.from('users').select('id');
    const validUserIds = new Set(users?.map(u => u.id) || []);

    console.log('\n--- Migrating Repair Tickets ---');
    const tickets = await RepairTicket.find({}).lean();
    console.log(`Found ${tickets.length} tickets in MongoDB.`);

    const ticketRows = [];
    const messageRows = [];

    for (const t of tickets) {
        const tId = convertObjectIdToUUID(t._id);
        const uId = convertObjectIdToUUID(t.user);

        ticketRows.push({
            id: tId,
            ticket_id: t.ticketId || `REP-${t._id.toString().substring(18, 24).toUpperCase()}`,
            user_id: validUserIds.has(uId) ? uId : null,
            device: t.device || 'Unknown Device',
            issue: t.issue || 'No issue description',
            status: t.status || 'pending',
            estimated_cost: t.estimatedCost || 0,
            appointment_date: t.appointmentDate || null,
            service_type: t.serviceType || 'In-Store',
            notes: t.notes || null,
            created_at: t.createdAt || new Date(),
            updated_at: t.updatedAt || new Date()
        });

        if (t.messages && Array.isArray(t.messages)) {
            for (const msg of t.messages) {
                messageRows.push({
                    id: convertObjectIdToUUID(msg._id) || convertObjectIdToUUID(new mongoose.Types.ObjectId()),
                    ticket_id: tId,
                    role: msg.role === 'customer' ? 'customer' : 'admin',
                    text: msg.text || '',
                    created_at: msg.timestamp || new Date()
                });
            }
        }
    }

    // Upsert tickets
    const { error: tErr } = await supabase.from('repair_tickets').upsert(ticketRows);
    if (tErr) console.error('Tickets Error:', tErr.message);
    else console.log(`Migrated ${ticketRows.length} Tickets.`);

    // Upsert messages
    if (messageRows.length > 0) {
        const { error: mErr } = await supabase.from('repair_ticket_messages').upsert(messageRows);
        if (mErr) console.error('Ticket Messages Error:', mErr.message);
        else console.log(`Migrated ${messageRows.length} Ticket Messages.`);
    }

    console.log('\n--- Final Migration Complete! ---');
    process.exit(0);
}

run();
