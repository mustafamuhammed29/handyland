const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
const logFile = './repairs_test.log';
const fs = require('fs');

let authToken = null;
let testUserEmail = null;

const log = (...args) => {
    const message = args.join(' ');
    console.log(message);
    fs.appendFileSync(logFile, message + '\n');
};

async function setup() {
    log('🔧 Setting up test environment...');

    testUserEmail = `test_repair_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;

    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland');

    // Create test user and get token
    try {
        log(`   Registering user: ${testUserEmail}`);
        await axios.post(`${BASE_URL}/auth/register`, {
            name: 'Test User',
            email: testUserEmail,
            // Password must be > 12 chars
            password: 'TestPassword123!@#',
            phone: '+14155552671'
        });
        log('   Registration request sent');
    } catch (e) {
        log(`   Registration warning: ${e.message}`);
        if (e.response) log(`   Response: ${JSON.stringify(e.response.data)}`);
    }

    // Verify user manually
    const User = require('./models/User');
    // Wait a bit for DB propagation if needed (testing environment quirk?)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Debug log
    const count = await User.countDocuments({ email: testUserEmail });
    log(`   DB User Count for ${testUserEmail}: ${count}`);

    const user = await User.findOne({ email: testUserEmail });
    if (user) {
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();
        log('   User manually verified in DB');
    } else {
        throw new Error('User registration failed, user not found in DB');
    }

    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: testUserEmail,
        password: 'TestPassword123!@#'
    });
    log(`   Login Response Status: ${loginRes.status}`);
    log(`   Login Response Data: ${JSON.stringify(loginRes.data)}`);

    authToken = loginRes.data.token;
    if (!authToken && loginRes.headers['set-cookie']) {
        const cookies = loginRes.headers['set-cookie'];
        const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='));
        if (accessTokenCookie) {
            authToken = accessTokenCookie.split(';')[0].split('=')[1];
            log('   ℹ️  Token extracted from cookie');
        }
    }
    log(`   Token received: ${authToken ? authToken.substring(0, 20) + '...' : 'null'}`);
    log('✅ Setup complete\n');
}

async function testCreateTicket() {
    log('🧪 Test 1: Create Repair Ticket (User)');

    try {
        const response = await axios.post(`${BASE_URL}/repairs/tickets`, {
            device: 'iPhone 13 Pro',
            issue: 'Screen is cracked and not responding to touch',
            description: 'Dropped from 2m height', // Note: Model has 'notes', not 'description'. Controller maps?
            notes: 'Dropped from 2m height'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.status === 201) {
            const ticket = response.data.ticket;
            if (ticket.ticketId && ticket.ticketId.startsWith('REP-')) {
                log(`✅ Created ticket: ${ticket.ticketId}`);
            } else {
                throw new Error(`Invalid ticketId format: ${ticket.ticketId}`);
            }
        } else {
            throw new Error(`Unexpected status: ${response.status}`);
        }
    } catch (e) {
        throw new Error(`Create Ticket Failed: ${e.message}`);
    }
}

async function testGuestTicket() {
    log('\n🧪 Test 2: Create Repair Ticket (Guest)');

    try {
        const response = await axios.post(`${BASE_URL}/repairs/tickets`, {
            device: 'Samsung Galaxy S21',
            issue: 'Battery draining fast',
            guestContact: {
                name: 'Jane Doe',
                email: 'jane@example.com',
                phone: '+491234567890'
            }
        });

        if (response.status === 201) {
            const ticket = response.data.ticket;
            if (ticket.guestContact && ticket.guestContact.email === 'jane@example.com') {
                log(`✅ Created guest ticket: ${ticket.ticketId}`);
            } else {
                throw new Error('Guest contact missing or incorrect');
            }
            if (ticket.user) {
                throw new Error('Guest ticket should not have user ID');
            }
        }
    } catch (e) {
        throw new Error(`Guest Ticket Failed: ${e.message}`);
    }
}

async function testConcurrentCreation() {
    log('\n🧪 Test 3: Concurrent Ticket Creation');

    const promises = Array(5).fill().map((_, i) =>
        axios.post(`${BASE_URL}/repairs/tickets`, {
            device: `Device ${i}`,
            issue: 'Test issue',
            notes: `Concurrent test ${i}`
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        })
    );

    try {
        const results = await Promise.all(promises);
        const ids = results.map(r => r.data.ticket.ticketId);
        const uniqueIds = [...new Set(ids)];

        if (ids.length === uniqueIds.length) {
            log(`✅ Created 5 concurrent tickets, all unique:`);
            // ids.forEach(id => log(`   - ${id}`));
        } else {
            throw new Error('Duplicate ticket IDs detected');
        }
    } catch (e) {
        throw new Error(`Concurrent Test Failed: ${e.message}`);
    }
}

async function testGetMyTickets() {
    log('\n🧪 Test 4: Get My Tickets');

    try {
        const response = await axios.get(`${BASE_URL}/repairs/my-repairs`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.status === 200 && Array.isArray(response.data)) {
            if (response.data.length >= 6) { // 1 from Test 1 + 5 from Test 3
                log(`✅ Retrieved ${response.data.length} tickets`);
            } else {
                throw new Error(`Expected at least 6 tickets, got ${response.data.length}`);
            }
        }
    } catch (e) {
        throw new Error(`Get My Tickets Failed: ${e.message}`);
    }
}

async function testValidation() {
    log('\n🧪 Test 5: Validation');

    // Missing device
    try {
        await axios.post(`${BASE_URL}/repairs/tickets`, {
            issue: 'Some issue'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        throw new Error('Missing device should have failed');
    } catch (error) {
        if (error.response && error.response.status === 400) {
            log('   ✅ Missing device validation passed');
        } else {
            throw new Error(`Missing device unexpected error: ${error.message}`);
        }
    }

    // Guest without contact
    try {
        await axios.post(`${BASE_URL}/repairs/tickets`, {
            device: 'Phone',
            issue: 'Issue'
        });
        throw new Error('Guest without contact should have failed');
    } catch (error) {
        if (error.response && (error.response.status === 400 || error.response.status === 401)) { // 401 if auth middleware blocks, 400 if validation
            log('   ✅ Guest without contact validation passed');
        } else {
            throw new Error(`Guest validation unexpected error: ${error.message}`);
        }
    }
}

async function runTests() {
    // Clear log file
    if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

    log('🚀 Starting Repair Tickets Tests\n');

    try {
        await setup();
        await testCreateTicket();
        await testGuestTicket();
        await testConcurrentCreation();
        await testGetMyTickets();
        await testValidation();

        log('\n✅ ALL TESTS PASSED! 🎉');
    } catch (error) {
        log('\n❌ TEST FAILED:', error.message);
        if (error.response) {
            log('Response:', JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        await mongoose.disconnect();
    }
}

runTests();
