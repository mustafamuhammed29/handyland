# Security Policy & Secret Management

## 1. Zero Secrets in Version Control Policy

Under no circumstances should API keys, database credentials, authentication tokens, passwords, or production data dumps be committed to this repository.

### Rules for Development & Maintenance
1. **Environment Variables**: All sensitive credentials must be supplied exclusively through environment variables or `.env` files (which must be ignored in `.git/info/exclude` or `.gitignore`).
2. **Maintenance Scripts**: Scripts in `backend/scripts/` must accept credentials through environment variables or CLI arguments. Scripts must fail closed with an informative error if required variables are not defined.
3. **No Real Customer Data**: Files like `tickets-dump.json` or database seed fixtures must only contain synthetic, generated test data with generic placeholders and demo IDs. Never commit unmasked customer names, emails, phone numbers, or notes.

---

## 2. Environment Variables Reference

When executing maintenance or setup tasks, supply the necessary configuration via environment variables:

| Variable | Description | Example / Required Format |
|---|---|---|
| `HEALTHCHECK_ADMIN_EMAIL` | Admin account for `healthCheck.js` | `admin@example.com` |
| `HEALTHCHECK_ADMIN_PASSWORD` | Admin password for `healthCheck.js` | Strong password string |
| `ADMIN_REPAIR_EMAIL` | Target email for `repair_admin.js` | `admin@example.com` |
| `ADMIN_REPAIR_PASSWORD` | New password for `repair_admin.js` | Strong password string |
| `NEW_ADMIN_EMAIL` | Email for `create-new-admin.js` | `admin_fresh@example.com` |
| `NEW_ADMIN_PASSWORD` | Password for `create-new-admin.js` | Strong password string |
| `TARGET_USER_ID` | UUID for `reset-admin-password.js` | `00000000-0000-0000-0000-000000000000` |
| `NEW_PASSWORD` | Password for `reset-admin-password.js` | Strong password string |
| `DEFAULT_ADMIN_PASSWORD` | Temp admin password for `fixCorruptedUsers.js` | Strong password string |
| `DEFAULT_USER_PASSWORD` | Temp user password for `fixCorruptedUsers.js` | Strong password string |

---

## 3. Web & Application Security Measures

### CORS (Cross-Origin Resource Sharing)
- Production uses strict `ALLOWED_ORIGINS` via environment variables. Wildcards (e.g., `*.vercel.app`) and LAN IPs are strictly forbidden.
- Development uses relaxed CORS specifically mapped to localhost and frontend dev URLs.
- Admin routes use strict credential-based CORS.

### Rate Limit & Brute Force Protection
- Global API limit: 500 requests / 15 minutes.
- Auth endpoints (login, register): 10 requests / 10 minutes.
- OTP verification: 5 requests / 15 minutes.
- Security headers (Helmet) are enabled universally.

### RLS (Row Level Security)
- Supabase enforces strict Row-Level Security on all tables.
- Standard users can only access their own `transactions`, `orders`, and `repair_tickets`.
- Admins bypass RLS via privileged service roles when using the `authorize('admin')` middleware.

### CSRF Protection
- Session cookies are strictly `HttpOnly`, `Secure`, and `SameSite=Lax` (or `Strict` for API routes).
- Critical mutations (e.g., wallet top-ups) require explicit backend verification via trusted provider webhooks (e.g., Stripe, PayPal).

---

## 4. Reporting Security Vulnerabilities

If you discover a security vulnerability within HandyLand, please report it privately to the security team. Do not disclose vulnerabilities publicly in issues or pull requests until a fix has been released.
