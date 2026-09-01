/**
 * Full API Health Check — uses Supabase directly to bypass CSRF
 */
const { createClient } = require('@supabase/supabase-js');
const http = require('http');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BASE = 'http://127.0.0.1:5000/api';

async function request(method, path, body = null, token = '') {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Cookie'] = `accessToken=${token}; adminToken=${token}`;
    }
    const opts = { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers, timeout: 5000 };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', (e) => resolve({ status: 0, data: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, data: 'TIMEOUT' }); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('=== HANDYLAND POST-MIGRATION API HEALTH CHECK ===\n');

  const adminEmail = process.env.HEALTHCHECK_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const adminPassword = process.env.HEALTHCHECK_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('❌ Missing health check credentials.');
    console.error('   Please provide HEALTHCHECK_ADMIN_EMAIL and HEALTHCHECK_ADMIN_PASSWORD via environment variables.');
    process.exit(1);
  }

  // Get admin session token directly from Supabase
  const { data: session, error } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword
  });
  
  if (error) {
    console.error('Admin login error:', error.message);
    process.exit(1);
  }

  const token = session.session.access_token;
  console.log(`Logged in as ${adminEmail}\n`);

  const endpoints = [
    ['GET', '/settings', 'Settings'],
    ['GET', '/maintenance-info', 'Maintenance Info'],
    ['GET', '/auth/me', 'Auth Me'],
    ['GET', '/stats', 'Dashboard Stats'],
    ['GET', '/users/admin/all', 'Admin Users List'],
    ['GET', '/users/admin/stats', 'Admin Users Stats'],
    ['GET', '/products', 'Products List'],
    ['GET', '/orders', 'My Orders'],
    ['GET', '/orders/admin/all', 'Admin Orders'],
    ['GET', '/messages', 'Messages'],
    ['GET', '/notifications', 'Notifications'],
    ['GET', '/cart', 'Cart'],
    ['GET', '/wishlist', 'Wishlist'],
    ['GET', '/reviews/admin', 'Reviews'],
    ['GET', '/repairs', 'My Repairs'],
    ['GET', '/repairs/admin/all', 'Admin Repairs'],
    ['GET', '/inventory/items', 'Inventory'],
    ['GET', '/transactions', 'Transactions'],
    ['GET', '/translations/locales/de', 'Translations DE'],
    ['GET', '/email-templates', 'Email Templates'],
    ['GET', '/addresses', 'Addresses'],
    ['GET', '/coupons', 'Coupons'],
    ['GET', '/coupons/latest-promo', 'Latest Promo'],
    ['GET', '/shipping-methods', 'Shipping Methods'],
    ['GET', '/pages', 'Pages'],
    ['GET', '/accessories', 'Accessories'],
    ['GET', '/promotions', 'Promotions'],
    ['GET', '/loaners', 'Loaners'],
    ['GET', '/warranties', 'Warranties'],
    ['GET', '/suppliers', 'Suppliers'],
    ['GET', '/purchase-orders', 'Purchase Orders'],
    ['GET', '/audit-logs', 'Audit Logs'],
    ['GET', '/repair-parts', 'Repair Parts'],
    ['GET', '/repair-archive', 'Repair Archive'],
    ['GET', '/refunds', 'Refunds'],
  ];

  let passed = 0, failed = 0, errors = [];

  for (const [method, path, name] of endpoints) {
    const r = await request(method, path, null, token);
    const ok = r.status >= 200 && r.status < 400;
    if (ok) {
      passed++;
    } else {
      failed++;
      let errMsg = '';
      try { errMsg = JSON.parse(r.data).message || r.data.substring(0, 100); } catch { errMsg = (r.data || '').substring(0, 100); }
      errors.push({ name, path, status: r.status, error: errMsg });
    }
  }

  console.log(`Passed: ${passed}/${endpoints.length}`);
  console.log(`Failed: ${failed}/${endpoints.length}\n`);
  
  if (errors.length > 0) {
    console.log('FAILED ENDPOINTS:');
    errors.forEach(e => console.log(`  ❌ [${e.status}] ${e.name} (${e.path}): ${e.error}`));
  } else {
    console.log('🎉 ALL ENDPOINTS WORKING!');
  }
}

run().catch(e => console.error('Script error:', e));
