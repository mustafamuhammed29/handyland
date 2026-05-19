# 🚀 HandyLand - Premium Service Marketplace

HandyLand is a modern, high-performance, and production-ready on-demand service marketplace. It connects customers with professional technicians for repairs, orders, and secure payments. 

This project is built using a **100% Supabase (PostgreSQL)** database backend, offering real-time features, secure Row Level Security (RLS) policies, high-performance indexing, and full TypeScript type-safety.

---

## 🏗️ Architecture Overview

HandyLand uses a robust three-tier architecture:
1. **Express Backend API** (`/backend`): High-performance server handling business logic, Stripe payments, email delivery, and sockets.
2. **Customer Portal** (`/front-end`): A vibrant and responsive React + Vite application for discovering services, booking repairs, and making payments.
3. **Admin Dashboard** (`/backend/admin`): A secure, role-based React + Vite + TypeScript application for managing orders, service tracking, and analytics.
4. **Database & Auth (Supabase)** (`/supabase`): PostgreSQL database, built-in Authentication, Row-Level Security (RLS), and secure object storage.

---

## ⚡ Prerequisites

Ensure you have the following installed on your local environment:
- **Node.js** (v18.x or v20.x recommended)
- **NPM** (v9.x or higher)
- **Supabase CLI** (Optional, for local migrations)
- **Stripe Account** (For testing payment workflows)

---

## 🔑 Supabase Database Setup

HandyLand is fully optimized for **Supabase (PostgreSQL)**. To set up the database, you can either use the remote Supabase console or run migrations locally.

### Option A: Using the Supabase Console (Remote Project)
1. Create a new project on the [Supabase Dashboard](https://supabase.com).
2. Retrieve your credentials from **Project Settings > API**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Keep secure, used by backend for administrative bypass)
3. Go to the **SQL Editor** in the Supabase console and run the migrations found in `/supabase/migrations/` in numerical order:
   - `001_initial_schema.sql` (Tables & schemas)
   - `002_rls_policies.sql` (Security policies)
   - `003_indexes_and_triggers.sql` (Performance & automated triggers)
   - `004_storage_buckets.sql` (Image/PDF object storage)
   - `005_inventory_optimization.sql`
   - `006_atomic_stock_and_coupon.sql`
   - `007_valuation_dynamic_settings.sql`

### Option B: Local Development via Supabase CLI
If you prefer running Supabase locally:
1. Initialize Supabase CLI:
   ```bash
   supabase init
   ```
2. Start the local Supabase stack (requires Docker):
   ```bash
   supabase start
   ```
3. Apply all migrations automatically:
   ```bash
   supabase db push
   ```

---

## 🏃‍♂️ Quick Start (Local Development)

Follow these steps to run all components of HandyLand concurrently in your local environment.

### 1. Configure Environment Variables
Create a `.env` file in the `/backend` folder. Copy variables from `/backend/.env.example` (or use the main project `.env.example` as a template).

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase (PostgreSQL) Integration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Internal Encryption Key
JWT_SECRET=your-strong-random-jwt-secret

# Stripe Keys (Test Mode)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend and Admin Client URLs
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:5173

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
FROM_EMAIL=noreply@handyland.com
FROM_NAME="HandyLand Support"
```

### 2. Start Backend Server
The backend Express app serves the main REST API.
```bash
cd backend
npm install
npm run dev
```
**Backend will run on:** `http://localhost:5000`

### 3. Start Admin Panel
The admin dashboard is housed inside the `/backend/admin` directory.
```bash
cd backend/admin
npm install
npm run dev
```
**Admin Panel will run on:** `http://localhost:5173` (or `http://localhost:5174`)

### 4. Start Customer Frontend
The customer portal serves the landing pages and checkout screens.
```bash
cd front-end
npm install
npm run dev
```
**Customer Frontend will run on:** `http://localhost:3000` (or `http://localhost:5173` depending on ports)

---

## 🛡️ Default Admin Credentials

Once the database is migrated and populated, default admin credentials are set as configured in your seed files or environment:
- **Admin Portal URL:** `http://localhost:5173/login` (or port where your admin starts)
- **Default Email:** `admin@handyland.com`
- **Default Password:** *Configure via backend/admin seed or use the default from setup*

---

## 📡 Core API Endpoints

The API is fully documented and grouped logically under `http://localhost:5000/api`.

### 🔐 Authentication & Profile
- `POST /auth/register` - Create new user account
- `POST /auth/login` - User login
- `POST /auth/admin/login` - Secure Admin login (requires 2FA where enabled)
- `GET /auth/me` - Get logged-in user profile (Protected)
- `PUT /auth/updateprofile` - Edit profile info (Protected)
- `PUT /auth/changepassword` - Change password securely (Protected)
- `POST /auth/forgotpassword` - Request password reset link
- `PUT /auth/resetpassword/:token` - Reset password with token
- `POST /auth/verify/:token` - Verify email address

### 📦 Repair & Booking Management
- `POST /repairs` - Submit a new repair ticket (User)
- `GET /repairs` - Fetch user's repair history (User)
- `GET /repairs/:id` - View specific repair ticket (Protected)
- `PUT /repairs/:id/status` - Update ticket status (Admin / Tech)

### 🛒 Orders & Checkout
- `POST /orders` - Create a service order (User)
- `GET /orders` - View list of user orders (User)
- `GET /orders/:id` - Fetch single order details (User)
- `PUT /orders/:id/cancel` - Cancel a pending order (User)
- `GET /orders/admin/all` - Get all orders across platform (Admin)
- `PUT /orders/admin/:id/status` - Update order dispatch/repair status (Admin)
- `GET /orders/admin/stats` - Fetch platform sales and orders analytics (Admin)

### 💳 Stripe Payment Gateway
- `POST /payment/create-checkout-session` - Initialize Stripe checkout (User)
- `POST /payment/success` - Verify payment success and complete order (User)
- `GET /payment/:sessionId` - Retrieve checkout session details (User)
- `POST /payment/webhook` - Secure Stripe Webhook listener (Public)
- `POST /payment/refund` - Process order refunds (Admin)

---

## 🧪 Testing the System

### Manual Verification
1. Open the Admin Panel at `http://localhost:5173/login`.
2. Login with valid administrator credentials.
3. Verify that you can browse the Dashboard analytics, check Repair tickets, review Orders, and adjust platform Settings.

### Automated Test Suite
HandyLand uses a robust automated test suite to ensure API stability.
```bash
cd backend
npm run test
```

To run end-to-end integration and user interface tests:
```bash
# E2E flow tests
npm run test:e2e

# Admin UI tests
npm run test:admin-ui
```

---

## 🚀 Production Deployment Guide

HandyLand is designed to be easily deployed to high-availability platforms like **Render** (for the Express backend) and **Vercel** (for the frontend and admin React applications).

### 🖥️ Express Backend on Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository.
3. Configure the following service settings:
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
4. Add all production environment variables from `.env.example` under the service's **Environment** tab.

### 🌐 Frontend and Admin Panel on Vercel
Since both the Frontend and the Admin Panel are client-only React apps built using Vite, they can be deployed for free on [Vercel](https://vercel.com).

#### Deploying the Customer Frontend:
1. Import your project into Vercel.
2. Set the **Root Directory** to `front-end`.
3. Select **Vite** as the Framework Preset.
4. Configure environment variables (e.g., `VITE_API_URL` pointing to your backend URL on Render).
5. Deploy!

#### Deploying the Admin Panel:
1. Import the same project again to create a separate Vercel deployment.
2. Set the **Root Directory** to `backend/admin`.
3. Select **Vite** as the Framework Preset.
4. Set the **Build Command** to: `npm install && npm run build`
5. Configure environment variables (e.g., `VITE_API_URL` pointing to your Render backend).
6. Deploy!

---

## 🛠️ Troubleshooting

### Server Fails to Start
- Verify that your Node version is compatible (v18+).
- Check that your port `5000` is free:
  ```bash
  netstat -ano | findstr :5000
  ```
- Ensure your `.env` file exists and has correct Supabase connection variables.

### Database Connection Issues
- Verify that your Supabase project is active and not paused.
- Double check that your `SUPABASE_URL` begins with `https://` and does not contain extra trailing slashes.
- Ensure the `SUPABASE_SERVICE_ROLE_KEY` (service role) is correct in the backend configuration, as the backend uses it to bypass RLS policies where administrative control is required.

---

## 📞 Support & Feedback
For issues, bug reports, or feedback:
- View express server logs on your backend terminal.
- Inspect the browser Developer Console for frontend errors.
- Ensure all environment variables are correctly synchronized between your local setup and production platforms.

---

## 📝 License
© 2026 HandyLand. All rights reserved. Registered Trademark.
