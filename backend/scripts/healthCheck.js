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

  // Get admin session token directly from Supabase
  const { data: session, error } = await supabase.auth.signInWithPassword({
    email: 'admin@handyland.de', password: 'Admin@HandyLand2024!'
  });
  
  if (error) {
    console.log('Admin login error:', error.message);
    // Try admin_new
    const { data: s2, error: e2 } = await supabase.auth.signInWithPassword({
      email: 'admin_new@handyland.com', password: 'Admin@HandyLand2024!'
    });
    if (e2) { console.log('admin_new also failed:', e2.message); return; }
    var token = s2.session.access_token;
    console.log('Logged in as admin_new\n');
  } else {
    var token = session.session.access_token;
    console.log('Logged in as admin@handyland.de\n');
  }

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
    ['GET', '/reviews', 'Reviews'],
    ['GET', '/repairs', 'My Repairs'],
    ['GET', '/repairs/admin/all', 'Admin Repairs'],
    ['GET', '/inventory', 'Inventory'],
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
