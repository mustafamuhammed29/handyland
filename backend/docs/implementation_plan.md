# Backend Audit Remediation Plan

This document outlines the proposed fixes for the 16 security, logical, and code quality issues identified in the recent backend audit report.

## User Review Required

- **MongoDB Transactions**: Wrapping the `createOrder` flow in a session (`withTransaction`) requires the MongoDB deployment to be a replica set (which is standard for MongoDB Atlas in production, but might fail if you are running a standalone local mongod). I will implement it, but please confirm if your dev environment supports replica sets, otherwise it may throw errors locally. I can also implement a mock session fallback if needed.
- **Guest Order Access**: I plan to restrict `GET /api/orders/:id` for guest orders. If `order.user` is null, the client must either pass `?email=<contact_email>` or be an Admin, otherwise it will return 403.
- **x-app-type Header**: I will change the middleware to strictly prefer `accessToken` over `adminToken` if `x-app-type` is not specified, preventing accidental admin elevation for standard user requests.

## Proposed Changes

---

### Handyland Core Controllers

#### [MODIFY] orderController.js
- **Move `require()` imports**: Lift `User`, `Coupon`, `Product`, `Accessory`, `ShippingMethod` to the top level to avoid caching bypass and improve performance.
- **createOrder**:
  - Calculate `shippingFee` server-side by loading from `ShippingMethod` based on `req.body.shippingMethod` instead of blindly trusting `req.body.shippingFee`.
  - Re-validate `couponCode` and compute `appliedDiscount` server-side, ignoring `req.body.discountAmount`.
  - Validate that `req.body.appliedPoints` does not exceed `currentUser.loyaltyPoints` before continuing.
  - Implement MongoDB Session + Transaction wrapper for atomic order creation and stock decrement. 
- **getOrder**:
  - Add a security check: For guest orders (`order.user === null`), require `req.query.email === order.contactEmail` unless `req.user.role === 'admin'`.
- **cancelOrder & updateOrderStatus**:
  - Implement wallet refund logic: when a wallet-paid order is cancelled by user or admin, automatically increment the `User.balance` by `order.totalAmount` and create a `Transaction` of type `refund`.
- **processRefund**:
  - Add explicit validation for `req.body.status` to ensure it only accepts `'approved'` or `'rejected'`.
- **getInvoice**:
  - Wrap potentially vulnerable HTML template dynamic variables (`invoiceSettings.companyName`, `companyAddress`, `footerText`, etc.) with `escapeHtml()`.

---

### Authentication and Middleware

#### [MODIFY] middleware/auth.js
- In the `protect` and `optionalProtect` fallbacks (when no `x-app-type` is present), look for `req.cookies.accessToken` first, and only check `adminToken` if it doesn't exist, preventing users from casually receiving admin privileges if both cookies somehow got set.

#### [MODIFY] controllers/authController.js
- In the `refreshToken` handler, enforce **Refresh Token Rotation**: Instead of only generating a new access token, issue a new refresh token as well. Save it to DB, return it in the cookie, and delete the old one.

---

### Cart & Coupons

#### [MODIFY] controllers/cartController.js
- In `syncCart` and `updateCart`: Enforce an upper bound on quantity (e.g. `Math.min(quantity, 100)`) so the client cannot set quantities of 999,999.

#### [MODIFY] routes/couponRoutes.js
- Add `express-rate-limit` to the `/validate` endpoint to block brute-force attempts.
- Add `express-validator` rules to the `POST /` route to check for valid numbers across `discountValue`, `usageLimit`, and `minOrderValue`.

---

### Models & Security Configs

#### [MODIFY] models/Order.js
- Add regex format validation for `shippingAddress.email` since it is required but not validated.

#### [MODIFY] routes/orderRoutes.js
- Ensure route specificity by keeping `/:id/refund` and `/refund/:id` correctly ordered and ensuring both map securely with validation and auth.

#### [MODIFY] utils/imageUpload.js
- Although `fileFilter` currently checks extensions and mimetypes, I will enforce stricter MIME logic, particularly making sure the backend outright rejects any `.svg` or arbitrary MIME files more gracefully inline with the audit recommendation.

## Open Questions

1. **Transaction Support**: Does your local MongoDB environment run as a replica set? If not, `mongoose.startSession()` might fail. Should I include a check that falls back to non-transactional operations in dev mode if replica sets aren't enabled?
2. **Order Routes Pathing**: Currently `POST /api/orders/:id/refund` (user requests refund) and `PUT /api/orders/refund/:id` (admin processes). Should we keep these URLs or standardise to `/api/orders/:id/request-refund` and `/api/orders/:id/process-refund` to avoid Express routing ambiguity?

## Verification Plan

### Automated/Code Verification
- Static check: review that no `require()` is dynamically called in functions in order routes.
- Verify `req.body.shippingFee` and `discountAmount` are no longer parsed.
- Review invoice template for `.replace` and `escapeHtml` usage on settings. 

### Manual Verification
- You, the developer, should make a test order in the app applying a coupon and custom shipping and verify the generated total matches the server.
- Test that logging in without `x-app-type` correctly prioritizes the user access token.
