# 🚀 HandyLand Deployment & Production Operations Guide

This guide provides complete, step-by-step instructions for deploying and operating the **HandyLand** platform across both **Local Development** and **Production Cloud Environments** (Supabase + Vercel / Render / Railway).

---

## 📋 System Prerequisites

Before starting deployment, ensure you have:

- **Node.js**: `v18.x` or `v20.x` LTS installed
- **NPM**: `v9.x` or higher
- **Supabase Account**: Remote PostgreSQL database console or local Docker setup
- **SendGrid Account**: For transactional emails and security alerts (`SENDGRID_API_KEY`)
- **Stripe Account**: Live/Test API keys & Webhook signing secret (`STRIPE_WEBHOOK_SECRET`)
- **Domain Name & SSL**: Managed via Vercel, Netlify, or custom DNS provider

---

## 🔑 Environment Configuration Matrix

The application relies on the following unified environment variables across all services:

| Variable Name | Environment | Description | Example / Format |
|---|---|---|---|
| `PORT` | Backend | Express HTTP Port | `5000` |
| `NODE_ENV` | All | Environment mode | `production` / `development` |
| `SUPABASE_URL` | All | Supabase project URL | `https://xyz.supabase.co` |
| `SUPABASE_ANON_KEY` | All | Supabase public anon key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Supabase administrative bypass key | `eyJhbGciOi...` *(Secret)* |
| `JWT_SECRET` | Backend | Encryption secret for session tokens | `random_64char_string` |
| `SENDGRID_API_KEY` | Backend | SendGrid API key for emails | `SG.xxxxxxxx...` |
| `FROM_EMAIL` | Backend | Official sender email address | `noreply@handyland.de` |
| `FROM_NAME` | Backend | Official sender name | `HandyLand Support` |
| `STRIPE_PUBLISHABLE_KEY` | Frontend / Admin | Public Stripe API key | `pk_test_...` / `pk_live_...` |
| `STRIPE_SECRET_KEY` | Backend | Private Stripe API key | `sk_test_...` / `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Backend | Signature key for webhook verification | `whsec_...` |
| `FRONTEND_URL` | Backend | Customer portal public URL | `https://handyland.de` |
| `ADMIN_URL` | Backend | Admin dashboard public URL | `https://admin.handyland.de` |

---

## 🗄️ Part 1: Supabase Database Setup

HandyLand uses a **100% Supabase (PostgreSQL)** database backend.

### Step 1: Create Supabase Project
1. Log in to [Supabase Console](https://supabase.com).
2. Click **New Project** and name it `handyland-production`.
3. Set a strong Database Password and select your closest hosting region (e.g. `eu-central-1` Frankfurt).

### Step 2: Retrieve Credentials
Navigate to **Project Settings → API**:
- **Project URL**: Use for `SUPABASE_URL`
- **anon / public**: Use for `SUPABASE_ANON_KEY`
- **service_role**: Use for `SUPABASE_SERVICE_ROLE_KEY` (Backend only, never expose to clients)

### Step 3: Run Database Migrations
Execute the SQL files located in `/supabase/migrations/` in numerical sequence inside the **Supabase SQL Editor**:

1. `001_initial_schema.sql` (Tables, enums, & relations)
2. `002_rls_policies.sql` (Row-Level Security & access control)
3. `003_indexes_and_triggers.sql` (Performance indexes & automated triggers)
4. `004_storage_buckets.sql` (Object storage for receipts & invoices)
5. `005_inventory_optimization.sql` (Stock & catalog rules)
6. `006_atomic_stock_and_coupon.sql` (Atomic transaction RPCs)
7. `007_valuation_dynamic_settings.sql` (Device valuation algorithms)

---

## 💻 Part 2: Local Development Workflow

To run HandyLand locally for testing and development:

### 1. Configure Backend Environment
Copy `/backend/.env.example` to `/backend/.env` and update values:
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=dev_secret_key_123
SENDGRID_API_KEY=SG.your_sendgrid_key
FROM_EMAIL=noreply@handyland.de
FROM_NAME="HandyLand Local"
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:5173
```

### 2. Launch Concurrent Terminals

**Terminal 1: Express Backend API**
```bash
cd backend
npm install
npm run dev
# Running on http://localhost:5000
```

**Terminal 2: Customer Frontend**
```bash
cd front-end
npm install
npm run dev
# Running on http://localhost:3000
```

**Terminal 3: Admin Dashboard**
```bash
cd backend/admin
npm install
npm run dev
# Running on http://localhost:5173
```

---

## ☁️ Part 3: Production Cloud Deployment

### A. Backend API Deployment (Render / Railway)

#### Deploying to Render
1. Create a **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository `handyland`.
3. Set build and start commands:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add Environment Variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SENDGRID_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NODE_ENV=production`).

#### Deploying to Railway
1. Create a **New Project** on [Railway](https://railway.app).
2. Select **Deploy from GitHub Repo** → `handyland`.
3. Set root directory to `/backend` and command to `node server.js`.
4. Configure variables in the Railway Variables panel.

---

### B. Customer Frontend Deployment (Vercel)

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Select **Root Directory**: `front-end`.
3. **Framework Preset**: Vite / React.
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. Set Environment Variables:
   ```text
   VITE_API_URL=https://your-backend-api.onrender.com/api
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

---

### C. Admin Dashboard Deployment (Vercel)

1. Create a second project on Vercel connected to the same repository.
2. Select **Root Directory**: `backend/admin`.
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. Set Environment Variables:
   ```text
   VITE_API_URL=https://your-backend-api.onrender.com/api
   ```
6. Set custom subdomain (e.g. `admin.handyland.de`).

---

## 📧 Part 4: SendGrid Email Service Setup

1. Sign up at [SendGrid.com](https://sendgrid.com).
2. Go to **Settings → API Keys** and click **Create API Key**.
3. Grant **Full Access** or **Mail Send** permissions.
4. Copy the API key starting with `SG.` into `SENDGRID_API_KEY`.
5. Go to **Settings → Sender Authentication** and authenticate your domain (`handyland.de`).

---

## 💳 Part 5: Stripe Webhook Configuration

1. In Stripe Dashboard, switch to **Live Mode**.
2. Navigate to **Developers → Webhooks** and click **Add Endpoint**.
3. **Endpoint URL**: `https://your-backend-api.onrender.com/api/payment/webhook`
4. **Select Events**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy **Signing Secret** (`whsec_...`) into `STRIPE_WEBHOOK_SECRET` in backend environment variables.

---

## 🧪 Part 6: Post-Deployment Verification Checklist

Run the automated master test lab against the server:

```bash
cd backend
node tests/master_site_test_lab.js
```

Verify that all 5 pillars achieve **100% PASS**:
- [x] **Registration & Auth Auto-Healing**
- [x] **Support Messaging & WhatsApp Thread Continuity**
- [x] **Order Lifecycle & Invoicing**
- [x] **Password Reset & Security Links**
- [x] **Notifications & Real-Time Socket Events**

---

## 🛡️ Support & Troubleshooting

- **CORS Errors**: Verify `FRONTEND_URL` and `ADMIN_URL` are included in backend CORS allowed origins.
- **Socket Disconnects**: Ensure websocket transport is enabled on cloud provider proxies.
- **Webhook Failure**: Verify raw body parser is enabled for `/api/payment/webhook` route.
