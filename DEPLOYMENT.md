# HandyLand Deployment Guide

This document provides instructions for deploying the HandyLand application (Backend, Frontend, and Admin Panel).

## Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)
- Stripe Account (for payments)
- Cloudinary Account (for image uploads)
- SMTP Server (for emails)

## 1. Backend Setup
1. Navigate to `backend/`
2. Install dependencies: `npm install`
3. Create a `.env` file (see `.env.example`)
4. Start production server: `npm start`

## 2. Admin Panel Setup
1. Navigate to `backend/admin/`
2. Install dependencies: `npm install`
3. Configure `VITE_API_URL` in `.env`
4. Build: `npm run build`
5. Serve the `dist/` folder using a web server (Nginx/Apache) or Vercel/Netlify.

## 3. Frontend Setup
1. Navigate to `front-end/`
2. Install dependencies: `npm install`
3. Configure `VITE_API_URL` in `.env`
4. Build: `npm run build`
5. Serve the `dist/` or `out/` folder.

## Environment Variables (.env)
### Backend
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for Access Tokens |
| `REFRESH_TOKEN_SECRET` | Secret for Refresh Tokens |
| `STRIPE_SECRET_KEY` | Stripe Secret API Key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret (for hardening) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Name |
| `SMTP_HOST` | Email server host |
| `FRONTEND_URL` | URL of the frontend (for CORS & links) |

## Monitoring
- Backend logs are handled by Winston (stored in `logs/` directory).
- Use `pm2` for process management in production.

## Testing
Run `npm test` in the `backend/` directory to verify core functionality.
