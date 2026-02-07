# 🚀 HandyLand - Quick Start Guide

## Prerequisites
- Node.js installed
- MongoDB installed and running
- Stripe account (for payments)

## 🏃‍♂️ Quick Start (Development)

### 1. Start MongoDB
```bash
# Open a terminal and run:
mongod
```

### 2. Start Backend Server
```bash
cd backend
npm install
node server.js
```

**Backend will run on:** `http://localhost:5000`

### 3. Start Admin Panel
```bash
cd backend/admin
npm install
npm run dev
```

**Admin Panel will run on:** `http://localhost:5174` (or 5173)

### 4. Start Frontend (Optional)
```bash
cd front-end
npm install
npm run dev
```

**Frontend will run on:** `http://localhost:3000`

---

## 🔐 Default Credentials

### Admin Access:
- **URL:** http://localhost:5174/login
- **Email:** admin@handyland.com
- **Password:** admin123

---

## 🧪 Testing the System

### Manual Testing:
1. **Admin Panel:** Go to http://localhost:5174/login
2. **Login with admin credentials**
3. **Navigate through:** Dashboard, Products, Orders, Settings

### Automated Testing:
```bash
cd backend
powershell -ExecutionPolicy Bypass -File test-api.ps1
```

---

## 📡 API Endpoints

### Base URL: `http://localhost:5000/api`

### Authentication (9 endpoints)
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/admin/login` - Admin login
- `GET /auth/me` - Get current user (Protected)
- `PUT /auth/updateprofile` - Update profile (Protected)
- `PUT /auth/changepassword` - Change password (Protected)
- `POST /auth/forgotpassword` - Request password reset
- `PUT /auth/resetpassword/:token` - Reset password
- `POST /auth/verify/:token` - Verify email

### Orders (7 endpoints)
- `POST /orders` - Create order (User)
- `GET /orders` - Get my orders (User)
- `GET /orders/:id` - Get single order (User)
- `PUT /orders/:id/cancel` - Cancel order (User)
- `GET /orders/admin/all` - Get all orders (Admin)
- `PUT /orders/admin/:id/status` - Update order status (Admin)
- `GET /orders/admin/stats` - Get statistics (Admin)

### Payment (5 endpoints)
- `POST /payment/create-checkout-session` - Create Stripe checkout (User)
- `POST /payment/success` - Handle payment success (User)
- `GET /payment/:sessionId` - Get payment details (User)
- `POST /payment/webhook` - Stripe webhook (Public)
- `POST /payment/refund` - Process refund (Admin)

---

## 🔧 Environment Variables

Create `.env` file in `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://127.0.0.1:27017/handyland

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Stripe (Test Keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# URLs
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:5174

# Email (Optional - for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@handyland.com
FROM_NAME=HandyLand
```

---

## 📦 Project Structure

```
handyland/
├── backend/
│   ├── controllers/      # Business logic
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & error handling
│   ├── utils/           # Email service, etc.
│   ├── admin/           # Admin Panel (React)
│   ├── server.js        # Main server file
│   └── .env             # Environment variables
├── front-end/           # Customer-facing website
└── README.md
```

---

## 🎯 Key Features

✅ **User Authentication** - JWT with bcrypt  
✅ **Admin Panel** - Protected with role-based access  
✅ **Orders Management** - Full CRUD with status tracking  
✅ **Payment Integration** - Stripe with webhooks  
✅ **Email Notifications** - Beautiful HTML templates  
✅ **Security** - Helmet, rate limiting, CORS  
✅ **Error Handling** - Comprehensive middleware  
✅ **Logging** - Morgan for request tracking  

---

## 🐛 Troubleshooting

### Backend won't start:
```bash
# Check if MongoDB is running
mongod

# Check if port 5000 is available
netstat -ano | findstr :5000

# Reinstall dependencies
cd backend
rm -rf node_modules
npm install
```

### Admin Panel won't connect:
1. **Check backend is running** on port 5000
2. **Check CORS settings** in `server.js`
3. **Clear browser cache** and reload

### Database connection error:
1. **Ensure MongoDB is running:** `mongod`
2. **Check MONGO_URI** in `.env` file
3. **Verify database name:** `handyland`

---

## 🚀 Production Deployment

### Before deploying:
1. Change `JWT_SECRET` to strong random value
2. Replace Stripe test keys with **live keys**
3. Set `NODE_ENV=production`
4. Configure **production MongoDB** URI
5. Set up **real SMTP** service (not Ethereal)
6. Enable **HTTPS**
7. Review **CORS origins**
8. Set up **monitoring** (e.g., Sentry)

---

## 📞 Support

For issues or questions:
- Check logs in backend console
- Review error messages in browser console
- Verify all environment variables are set
- Ensure all services (MongoDB, Backend, Frontend) are running

---

## 📝 License

© 2026 HandyLand. All rights reserved.
