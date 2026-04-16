#!/usr/bin/env node
/**
 * HandyLand Health Check Script
 * Validates all critical system components and writes status to a file.
 * Run via: node scripts/healthCheck.js
 * Can be called by cron or on startup to auto-enable maintenance mode.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const STATUS_FILE = path.join(__dirname, '../healthStatus.json');
const MAINTENANCE_FLAG = path.join(__dirname, '../MAINTENANCE_MODE');

const checks = [];
let allPassed = true;

function log(name, ok, detail = '') {
    const status = ok ? '✅' : '❌';
    console.log(`  ${status}  ${name}${detail ? ': ' + detail : ''}`);
    checks.push({ name, ok, detail });
    if (!ok) allPassed = false;
}

async function checkMongo() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/handyland', {
            serverSelectionTimeoutMS: 5000,
        });
        const admin = mongoose.connection.db.admin();
        const result = await admin.ping();
        log('MongoDB Connection', result.ok === 1, 'ping ok');
        await mongoose.disconnect();
    } catch (e) {
        log('MongoDB Connection', false, e.message);
    }
}

async function checkEnvVars() {
    const required = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const optional = ['STRIPE_SECRET_KEY', 'EMAIL_USER', 'EMAIL_PASS'];

    let ok = true;
    const missing = required.filter(v => !process.env[v]);
    if (missing.length > 0) {
        ok = false;
        log('Required ENV Variables', false, `Missing: ${missing.join(', ')}`);
    } else {
        log('Required ENV Variables', true, `${required.length} vars set`);
    }

    const missingOpt = optional.filter(v => !process.env[v]);
    if (missingOpt.length > 0) {
        log('Optional ENV Variables', true, `Advisory: missing ${missingOpt.join(', ')}`);
    } else {
        log('Optional ENV Variables', true, 'All set');
    }
}

async function checkDiskSpace() {
    try {
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        // Try write test
        const testFile = path.join(uploadsDir, '.healthcheck_write_test');
        fs.writeFileSync(testFile, 'ok');
        fs.unlinkSync(testFile);
        log('Disk Write Access (uploads/)', true);
    } catch (e) {
        log('Disk Write Access (uploads/)', false, e.message);
    }
}

async function checkBackendHttp() {
    return new Promise((resolve) => {
        const port = process.env.PORT || 5000;
        const options = {
            hostname: 'localhost',
            port,
            path: '/api/health',
            method: 'GET',
            timeout: 5000,
        };
        const req = http.request(options, (res) => {
            log('Backend HTTP /api/health', res.statusCode < 500, `HTTP ${res.statusCode}`);
            resolve();
        });
        req.on('error', (e) => {
            log('Backend HTTP /api/health', false, e.message);
            resolve();
        });
        req.on('timeout', () => {
            req.destroy();
            log('Backend HTTP /api/health', false, 'Timeout after 5s');
            resolve();
        });
        req.end();
    });
}

async function main() {
    console.log('\n🩺  HandyLand Health Check\n' + '─'.repeat(40));

    await checkEnvVars();
    await checkMongo();
    await checkDiskSpace();
    await checkBackendHttp();

    console.log('\n' + '─'.repeat(40));

    const result = {
        timestamp: new Date().toISOString(),
        healthy: allPassed,
        checks,
    };

    // Write status file (read by the server to determine maintenance mode)
    fs.writeFileSync(STATUS_FILE, JSON.stringify(result, null, 2));

    if (allPassed) {
        console.log('✅  All checks passed — site is HEALTHY\n');
        // Remove maintenance flag if it was set by a previous failed check
        if (fs.existsSync(MAINTENANCE_FLAG)) {
            fs.unlinkSync(MAINTENANCE_FLAG);
            console.log('ℹ️   Maintenance mode flag removed.\n');
        }
        process.exit(0);
    } else {
        console.log('❌  Some checks FAILED — enabling Maintenance Mode\n');
        // Write maintenance flag file
        fs.writeFileSync(MAINTENANCE_FLAG, new Date().toISOString());
        process.exit(1); // non-zero = CI/start scripts can pick this up
    }
}

main().catch((e) => {
    console.error('Health check script crashed:', e);
    process.exit(1);
});
