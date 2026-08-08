# ⚠️ Admin-Only CLI Maintenance Scripts

This directory contains standalone, high-privilege maintenance and diagnostic scripts.

## 🚨 Security Policy
1. **Never Import**: These scripts must **NEVER** be imported (`require()`) by any Express route or controller.
2. **CLI Only**: These scripts should only be executed manually by authorized developers or system administrators via local terminal (`node scripts/admin-only/<script>.js`).
3. **Bypasses RLS**: Many of these scripts use `supabaseAdmin` (the `service_role` key), which intentionally bypasses Row Level Security (RLS). Ensure the terminal environment has secure credentials.
