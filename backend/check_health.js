const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('.env file found.');
    dotenv.config();
} else {
    console.error('.env file NOT found at:', envPath);
}

console.log('--- Environment Check ---');
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('REFRESH_TOKEN_SECRET exists:', !!process.env.REFRESH_TOKEN_SECRET);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('FRONTEND_URL exists:', !!process.env.FRONTEND_URL);

if (!process.env.JWT_SECRET) console.error('CRITICAL: JWT_SECRET is missing!');
if (!process.env.REFRESH_TOKEN_SECRET) console.error('CRITICAL: REFRESH_TOKEN_SECRET is missing!');

try {
    const crypto = require('crypto');
    console.log('Crypto module loaded successfully.');
    const testHash = crypto.createHash('sha256').update('test').digest('hex');
    console.log('Test hash generation successful:', testHash);
} catch (e) {
    console.error('Crypto module check failed:', e);
}
