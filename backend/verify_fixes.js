const mongoose = require('mongoose');
const Order = require('./models/Order');
const RepairTicket = require('./models/RepairTicket');
const Transaction = require('./models/Transaction');
require('dotenv').config({ quiet: true });

// Connect to DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland')
    .then(() => console.log('✅ Connected to DB'))
    .catch(err => console.error('❌ DB Error:', err));

async function runTests() {
    console.log('\n--- TESTING REPAIR TICKET (Nanoid & Guest) ---');
    try {
        const ticket = new RepairTicket({
            device: 'Test Phone',
            issue: 'Broken Screen',
            guestContact: { email: 'guest@example.com', name: 'Guest User' }
        });
        await ticket.validate(); // This triggers the pre-validate hook
        console.log(`✅ Ticket ID Generated: ${ticket.ticketId}`);
        console.log(`✅ Guest Contact Validated: ${ticket.guestContact.email}`);
    } catch (e) {
        console.error('❌ RepairTicket Test Failed:', e.message);
    }

    console.log('\n--- TESTING ORDER INTEGRITY ---');
    try {
        const order = new Order({
            user: new mongoose.Types.ObjectId(),
            items: [{
                product: new mongoose.Types.ObjectId(),
                productType: 'Product',
                name: 'Test Item',
                quantity: 2,
                price: 50 // Sum = 100
            }],
            totalAmount: 10, // INTENTIONALLY WRONG (Should be 100)
            shippingAddress: {
                fullName: 'Test', email: 't@t.com', phone: '+49123456789',
                street: 'Test', city: 'Test', zipCode: '12345', country: 'Germany'
            }
        });
        await order.validate();
        console.error('❌ Order Integrity Check FAILED (Wrong total was accepted)');
    } catch (e) {
        if (e.message.includes('Total amount mismatch')) {
            console.log('✅ Order Integrity Check PASSED (Caught wrong total)');
        } else {
            console.error('❌ Order Test Error:', e.message);
        }
    }

    console.log('\n--- TESTING TRANSACTION (Integer Amounts) ---');
    try {
        const tx = new Transaction({
            user: new mongoose.Types.ObjectId(),
            amount: 19.99, // Should be stored as 1999
            paymentMethod: 'card'
        });
        console.log(`✅ Input Amount: ${tx.amount} (Getter works?)`);
        console.log(`✅ Stored Amount (Raw): ${tx.toObject({ getters: false }).amount}`);

        // Manual verification of setter logic
        const rawTx = tx.toObject({ getters: false });
        if (rawTx.amount === 1999) {
            console.log('✅ Transaction Setter PASSED (Stored 1999)');
        } else {
            console.log(`❌ Transaction Setter FAILED (Stored ${rawTx.amount})`);
        }

    } catch (e) {
        console.error('❌ Transaction Test Failed:', e.message);
    }

    mongoose.connection.close();
}

runTests();
