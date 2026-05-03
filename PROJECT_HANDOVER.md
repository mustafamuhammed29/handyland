# HandyLand Project Handover Document

> **Note to the Project Owner:** Keep this document safe. If you ever need to hire a new developer or agency to continue working on this project, give them this file. It contains the technical "map" they need to understand and modify the code immediately.

---

## 1. Project Overview

**HandyLand** is a comprehensive eCommerce and Service management platform designed primarily for the German market. It handles device sales, repair booking, valuation (selling devices), and a fully-featured administrative backend.

**Core Technology Stack (MERN):**
*   **Database:** MongoDB (via Mongoose)
*   **Backend:** Node.js, Express.js
*   **Frontend (User-facing):** React.js (TypeScript), Tailwind CSS
*   **Admin Panel:** React.js (TypeScript), Tailwind CSS

---

## 2. Architecture & Directory Structure

The project is structured as a Monorepo containing both the backend and multiple frontends.

```text
handyland/
│
├── backend/                  # The Node.js/Express API Server
│   ├── admin/                # The Admin Panel React Application
│   ├── config/               # DB connection, etc.
│   ├── controllers/          # API route logic
│   ├── middlewares/          # Auth, File upload (Multer), Security
│   ├── models/               # Mongoose schemas (Settings, Order, User, etc.)
│   ├── routes/               # Express API endpoints
│   ├── templates/            # Email HTML templates
│   └── server.js             # Entry point for backend
│
└── front-end/                # The User-Facing React Application
    ├── public/               # Static assets
    ├── src/
    │   ├── components/       # Reusable UI components (CookieConsent, etc.)
    │   ├── context/          # React Context (SettingsContext, AuthContext, etc.)
    │   ├── pages/            # Main views (Home, Marketplace, Repair, etc.)
    │   └── App.tsx           # Router and app wrapper
```

---

## 3. Key Libraries & Technologies

If you are a developer taking over this project, you should be familiar with:

### Frontend Ecosystem
*   **Styling:** Tailwind CSS (configured dynamically via `index.css` and Context).
*   **Animations:** `framer-motion` (used extensively for premium glassmorphism UI).
*   **Icons:** `lucide-react`.
*   **Routing:** `react-router-dom`.
*   **Localization:** Built-in dynamic translation contexts / i18n logic (German focus).

### Admin Panel Ecosystem
*   **Forms:** `react-hook-form` (used in Settings Manager and CRUD operations).
*   **State/Data Fetching:** `react-query` (optimized data fetching and caching).
*   **Real-time:** `socket.io-client` (for live customer support messaging).

### Backend Ecosystem
*   **Real-time:** `socket.io` (WebSockets for chat).
*   **File Uploads:** `multer` (saving to `/uploads` folder statically).
*   **Authentication:** `jsonwebtoken` (JWT) and `bcryptjs`.
*   **Emailing:** `nodemailer`.

---

## 4. State Management & Settings

The project relies heavily on a centralized **Global Settings Architecture**.
Instead of hardcoding text or features, the Admin Panel updates a `Settings` document in MongoDB.

*   **Backend Model:** `backend/models/Settings.js`
*   **Admin Manager:** `backend/admin/src/pages/SettingsManager.tsx` (Handles all UI tabs for editing settings).
*   **Frontend Consumer:** `front-end/src/context/SettingsContext.tsx` (Fetches settings on load and distributes them via Context. Also caches in `localStorage` for instant loading).

*When adding a new configurable feature (e.g., a new banner), ALWAYS add it to the Settings schema first, then expose it in the Admin Panel, and finally consume it in the frontend.*

---

## 5. Local Setup & Running the Project

### Prerequisites
*   Node.js (v18+ recommended)
*   MongoDB (Local instance or MongoDB Atlas URI)

### Environment Variables (`.env`)
You must create a `.env` file in the `backend` directory. Required variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/handyland
JWT_SECRET=your_super_secret_jwt_key
# Email SMTP Config
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
# Stripe Config
STRIPE_SECRET_KEY=sk_test_...
```

### Running the Services

Open three separate terminals.

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm run dev # Runs nodemon on port 5000
```

**Terminal 2 (Frontend):**
```bash
cd front-end
npm install
npm run start # React scripts on port 3000
```

**Terminal 3 (Admin Panel):**
```bash
cd backend/admin
npm install
npm run start # React scripts on port 3001
```

---

## 6. Deployment Strategy

*   **Database:** Use MongoDB Atlas for production.
*   **Backend:** Can be deployed to Heroku, Render, DigitalOcean App Platform, or a traditional VPS (Ubuntu/Nginx/PM2).
*   **Frontends:** Build the React apps (`npm run build`). The static files can be served by the Node.js backend directly (using `express.static`), or deployed separately to Vercel/Netlify for better edge caching and performance.

---

## 7. Troubleshooting Notes
*   **Cookie Consent:** Stored locally in `handyland_cookie_consent`. Clear localStorage to test banner visibility.
*   **CSS Warnings in IDE:** Tailwind `@apply` rules in `index.css` may trigger warnings in VS Code. A `.vscode/settings.json` has been added to silence these.
*   **Sockets:** Ensure CORS is properly configured in `backend/server.js` if the backend and frontend are hosted on different domains in production.
