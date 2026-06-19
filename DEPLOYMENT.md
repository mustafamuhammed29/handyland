# 🚀 HandyLand Deployment Guide

## Prerequisites

Before deploying, ensure you have:

- [ ] Node.js 16+ installed
- [ ] MongoDB Atlas account (or MongoDB server)
- [ ] Stripe account with live API keys
- [ ] SMTP email service (SendGrid/Mailgun/AWS SES)
- [ ] Domain name (optional but recommended)
- [ ] SSL certificate (Let's Encrypt or platform-provided)

---

## Part 1: Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Sign in with GitHub and click **"New Project"**
3. Select your organization and name your project `handyland-prod`
4. Generate a strong Database Password and save it.
5. Select a region closest to your users (e.g., Frankfurt)
6. Click **"Create new project"**

### Step 2: Get API Keys

1. Go to **Project Settings** → **API**
2. Copy the **Project URL** (This is your `SUPABASE_URL`)
3. Copy the **anon / public** key (This is your `SUPABASE_ANON_KEY` for frontend)
4. Copy the **service_role** key (This is your `SUPABASE_SERVICE_ROLE_KEY` for backend - Keep it secret!)

### Step 3: Run Migrations

Ensure all SQL migrations have been executed in the Supabase SQL Editor.
(Optional) If you have a migration CLI setup, run `supabase db push`.

## Part 2: Backend Deployment

### Option A: Deploy to Railway (Recommended - Easy)

#### Step 1: Prepare Repository

```bash
# Make sure everything is committed
git add .
git commit -m "Production ready"
git push origin main
```

#### Step 2: Deploy to Railway

1. Go to [Railway.app](https://railway.app/)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose `handyland` repository
6. Railway will auto-detect Node.js

#### Step 3: Configure Environment Variables

In Railway dashboard, go to **Variables** tab:

```text
NODE_ENV=production
PORT=5000

MONGO_URI=mongodb+srv://handyland_admin:PASSWORD@handyland-prod.xxxxx.mongodb.net/handyland

JWT_SECRET=your-super-secret-jwt-key-change-this
REFRESH_TOKEN_SECRET=another-super-secret-key

STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=YOUR_SENDGRID_API_KEY

FROM_EMAIL=noreply@handyland.com
FROM_NAME=HandyLand

FRONTEND_URL=https://your-frontend-url.vercel.app
ADMIN_URL=https://admin-your-domain.vercel.app
BACKEND_URL=https://your-backend.up.railway.app

ALLOWED_ORIGINS=https://your-frontend-url.vercel.app,https://admin-your-domain.vercel.app
```

#### Step 4: Configure Start Command

In **Settings** → **Deploy**:

- **Root Directory**: `backend`
- **Start Command**: `node server.js`

#### Step 5: Deploy

Click "Deploy" → Railway will build and deploy.  
Your backend URL: `https://your-project.up.railway.app`

### Option B: Deploy to Render

1. Go to [Render.com](https://render.com/)
2. Sign up / Sign in
3. **New** → **Web Service**
4. Connect GitHub repository
5. Configure:
   - **Name**: `handyland-backend`
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
6. Add environment variables (same as Railway)
7. Click "Create Web Service"

### Option C: Deploy to Heroku

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create handyland-backend

# Add MongoDB addon (or use Atlas)
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
# ... (set all env vars)

# Deploy
git push heroku main

# Open app
heroku open
```

## Part 3: Frontend Deployment

### Option A: Deploy to Vercel (Recommended)

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Deploy Frontend

```bash
cd front-end
vercel
```

Follow prompts:

- **Project name**: `handyland-frontend`
- **Framework**: React (auto-detected)
- **Build command**: `npm run build`
- **Output directory**: `dist` or `build`

#### Step 3: Configure Environment Variables

In Vercel dashboard:

```text
VITE_API_URL=https://your-backend.up.railway.app/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
```

#### Step 4: Set Custom Domain (Optional)

In Vercel dashboard → **Domains**

1. Add `handyland.com`
2. Configure DNS (Vercel will provide instructions)

### Option B: Deploy to Netlify

```bash
cd front-end
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

## Part 4: Admin Panel Deployment

Same process as frontend, but with different environment variables:

```bash
cd backend/admin
vercel
```

**Environment variables:**

```text
VITE_API_URL=https://your-backend.up.railway.app/api
```

Suggested subdomain: `admin.handyland.com`

## Part 5: Stripe Configuration

### Step 1: Get Live API Keys

1. Go to Stripe Dashboard
2. Switch to **Live Mode** (toggle in sidebar)
3. Go to **Developers** → **API Keys**
4. Copy:
   - Publishable key: `pk_live_...`
   - Secret key: `sk_live_...`

### Step 2: Configure Webhooks

1. In Stripe dashboard → **Developers** → **Webhooks**
2. Click "Add endpoint"
3. Endpoint URL: `https://your-backend.up.railway.app/api/payment/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Click "Add endpoint"
6. Copy Signing secret: `whsec_...`
7. Add to environment variables as `STRIPE_WEBHOOK_SECRET`

## Part 6: Email Service Setup (SendGrid)

### Step 1: Create SendGrid Account

1. Go to [SendGrid.com](https://sendgrid.com/)
2. Sign up for free account (100 emails/day free)
3. Verify email address

### Step 2: Create API Key

1. Go to **Settings** → **API Keys**
2. Click "Create API Key"
3. Name: `HandyLand Production`
4. Permissions: **Full Access**
5. Click "Create & View"
6. Copy API key (starts with `SG.`)

### Step 3: Verify Sender Identity

1. Go to **Settings** → **Sender Authentication**
2. Choose **Single Sender Verification** (easier)
3. Fill in details:
   - **From Name**: HandyLand
   - **From Email**: `noreply@handyland.com` (or your email)
4. Verify email

### Step 4: Configure in Environment

```text
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_api_key_here

FROM_EMAIL=noreply@handyland.com
FROM_NAME=HandyLand
```

## Part 7: DNS & Domain Configuration

If using custom domain:

**For Frontend (`handyland.com`):**

```text
Type: A
Name: @
Value: [Vercel/Netlify IP]

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**For Admin (`admin.handyland.com`):**

```text
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
```

**For Backend (`api.handyland.com`):**

```text
Type: CNAME
Name: api
Value: your-app.up.railway.app
```

## Part 8: SSL/HTTPS Configuration

- **Vercel/Netlify**: SSL is automatic and free. No configuration needed.
- **Railway**: SSL is automatic. Custom domains get Let's Encrypt certificates.

**Manual SSL (if self-hosting):**

```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d handyland.com -d www.handyland.com

# Configure in server.js
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/handyland.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/handyland.com/fullchain.pem')
};

https.createServer(options, app).listen(443);
```

## Part 9: Final Verification Checklist

**Pre-Launch Checklist:**

- [ ] **Database**
  - [ ] MongoDB Atlas cluster created
  - [ ] Admin user created in database
  - [ ] Connection string tested
  - [ ] Backup strategy configured

- [ ] **Backend**
  - [ ] Deployed and accessible
  - [ ] All environment variables set
  - [ ] `NODE_ENV=production`
  - [ ] CORS origins correct
  - [ ] Rate limiting active (strict)
  - [ ] Health check endpoint working

- [ ] **Frontend**
  - [ ] Deployed and accessible
  - [ ] `API_URL` pointing to backend
  - [ ] Stripe publishable key set (live)
  - [ ] All pages loading correctly

- [ ] **Admin Panel**
  - [ ] Deployed and accessible
  - [ ] `API_URL` pointing to backend
  - [ ] Admin login working
  - [ ] All CRUD operations working

- [ ] **Stripe**
  - [ ] Live mode enabled
  - [ ] Webhook configured
  - [ ] Test payment successful

- [ ] **Email**
  - [ ] SMTP configured
  - [ ] Sender verified
  - [ ] Test email sent successfully

- [ ] **Security**
  - [ ] HTTPS enabled on all domains
  - [ ] Cookies have Secure flag
  - [ ] Rate limiting tested
  - [ ] No sensitive data in logs
  - [ ] Error messages don't expose internals

- [ ] **Performance**
  - [ ] Database indexes created
  - [ ] Image optimization enabled
  - [ ] Gzip compression enabled
  - [ ] CDN configured (if needed)

## Part 10: Post-Deployment

### Monitor Your Application

- Set up monitoring (Sentry, LogRocket, etc.)
- Check logs regularly
- Monitor server resources
- Set up uptime monitoring (UptimeRobot, Pingdom)

### Common Issues

**Issue: CORS errors**

- Check `ALLOWED_ORIGINS` includes your frontend URLs
- Verify frontend is sending `credentials: true`

**Issue: Stripe webhook not working**

- Check webhook URL is correct
- Verify `STRIPE_WEBHOOK_SECRET` is set
- Check Stripe dashboard for webhook delivery logs

**Issue: Emails not sending**

- Verify SMTP credentials
- Check SendGrid dashboard for blocked sends
- Ensure sender email is verified

**Issue: Rate limiting too strict**

- Increase limits in `backend/middleware/rateLimiter.js` if legitimate users are blocked.
