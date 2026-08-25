# HandyLand — API Documentation (Verified Route Catalog)

> **Audience**: AI Coding Agents & Backend Developers
> **Verification Basis**: Verified directly against Express routing definitions in `backend/server.js`, `backend/routes/index.js`, and all 37 route modules in `backend/routes/*.js`.
> **Base URL Mount**: All feature routes are mounted under `/api` in `[backend/routes/index.js:41-76]`, except root health checks mounted in `[backend/server.js:88-127]`.

---

## Global Server Endpoints (`[backend/server.js:88-127]`)

| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | `none` | Returns base status `{ status: 'ok' }`. | `[backend/server.js:88-90]` |
| `GET` | `/health` | `none` | Pings Supabase database connectivity; returns timestamp and uptime (in dev). | `[backend/server.js:92-103]` |
| `GET` | `/api/health` | `none` | Pings Supabase database connectivity for automated health check scripts. | `[backend/server.js:106-114]` |
| `GET` | `/api/status` | `protect`, `authorize('admin')` | Returns runtime server telemetry (uptime, memory usage, environment, DB state); does not return secrets. | `[backend/server.js:118-127]` |
| `GET` | `/api/maintenance-info` | `none` | Returns maintenance mode active status and public message. | `[backend/server.js:81]`, `[backend/middleware/maintenanceMiddleware.js:52-67]` |
| `POST` | `/api/upload` | `uploadLimiter`, `protect`, `uploadSingle('products', 'image')` | Uploads single image file to Cloudinary/storage and returns public asset URL. | `[backend/routes/index.js:35-38]` |

---

## Feature Route Modules (`[backend/routes/index.js:41-76]`)

### 1. Accessories (`[backend/routes/accessoriesRoutes.js:1-21]`, `[backend/controllers/accessoriesController.js:1-94]`)
*Mounted at `/api/accessories` via `[backend/routes/index.js:46]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/accessories` | `none` | Lists accessory items with category, compatibility, and price filters. | `[backend/routes/accessoriesRoutes.js:7]` |
| `GET` | `/api/accessories/admin/stats` | `protect`, `authorize('admin')` | Computes inventory metrics and low-stock counts for accessories. | `[backend/routes/accessoriesRoutes.js:10]` |
| `GET` | `/api/accessories/:id` | `none` | Retrieves single accessory item details by ID. | `[backend/routes/accessoriesRoutes.js:13]` |
| `POST` | `/api/accessories` | `protect`, `authorize('admin')` | Creates a new accessory inventory item. | `[backend/routes/accessoriesRoutes.js:16]` |
| `PUT` | `/api/accessories/:id` | `protect`, `authorize('admin')` | Updates accessory pricing, description, stock quantity, or metadata. | `[backend/routes/accessoriesRoutes.js:17]` |
| `DELETE` | `/api/accessories/:id` | `protect`, `authorize('admin')` | Deletes an accessory item from database inventory. | `[backend/routes/accessoriesRoutes.js:18]` |

---

### 2. Addresses (`[backend/routes/addressRoutes.js:1-23]`, `[backend/controllers/addressController.js:1-65]`)
*Mounted at `/api/addresses` via `[backend/routes/index.js:62]`. Router-level Middleware: `protect` `[backend/routes/addressRoutes.js:12]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/addresses` | `protect` | Lists all saved shipping and billing addresses for authenticated user. | `[backend/routes/addressRoutes.js:15]` |
| `POST` | `/api/addresses` | `protect` | Validates and stores a new shipping/billing address for authenticated user. | `[backend/routes/addressRoutes.js:16]` |
| `PUT` | `/api/addresses/:id` | `protect` | Updates an existing address belonging to authenticated user. | `[backend/routes/addressRoutes.js:19]` |
| `DELETE` | `/api/addresses/:id` | `protect` | Deletes a saved address belonging to authenticated user. | `[backend/routes/addressRoutes.js:20]` |

---

### 3. Audit Logs (`[backend/routes/auditRoutes.js:1-9]`, `[backend/controllers/auditController.js:1-16]`)
*Mounted at `/api/audit-logs` via `[backend/routes/index.js:60]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/audit-logs` | `protect`, `authorize('admin')` | Retrieves paginated administrative action audit trail records. | `[backend/routes/auditRoutes.js:6]` |

---

### 4. Authentication (`[backend/routes/authRoutes.js:1-196]`, `[backend/controllers/authController.js:1-354]`)
*Mounted at `/api/auth` via `[backend/routes/index.js:41]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/auth/csrf` | `none` | Returns active `XSRF-TOKEN` cookie value for companion validation. | `[backend/routes/authRoutes.js:72-75]` |
| `POST` | `/api/auth/register` | `registerLimiter`, `validate(registerRules)` | Registers a user account in Supabase auth and creates profile record. | `[backend/routes/authRoutes.js:101]` |
| `POST` | `/api/auth/login` | `loginLimiter`, `validate(loginRules)` | Authenticates credentials and sets access token/session cookies. | `[backend/routes/authRoutes.js:127]` |
| `POST` | `/api/auth/forgot-password` | `emailLimiter`, `validate` | Sends password reset email link with secure verification token. | `[backend/routes/authRoutes.js:128-130]` |
| `POST` | `/api/auth/reset-password/:token` | `none` | Resets user password using reset token provided in URL. | `[backend/routes/authRoutes.js:131]` |
| `PUT` | `/api/auth/reset-password` | `none` | Resets user password using token supplied in request body. | `[backend/routes/authRoutes.js:132]` |
| `GET` | `/api/auth/verify-email/:token` | `emailLimiter` | Confirms email verification token and marks user email as verified. | `[backend/routes/authRoutes.js:133]` |
| `POST` | `/api/auth/resend-verification` | `emailLimiter` | Resends verification token email to specified address. | `[backend/routes/authRoutes.js:134]` |
| `POST` | `/api/auth/admin/login` | `authLimiter` | Dedicated login endpoint verifying administrative roles. | `[backend/routes/authRoutes.js:143]` |
| `GET` | `/api/auth/admin/users` | `protect`, role check (`admin`/`administrator`) | Retrieves registered user profiles (id, name, email, role, etc.); excludes password hashes. | `[backend/routes/authRoutes.js:144-150]` |
| `GET` | `/api/auth/me` | `protect` | Retrieves current authenticated user profile, roles, and preferences. | `[backend/routes/authRoutes.js:153]` |
| `PUT` | `/api/auth/updateprofile` | `protect` | Updates current user name, phone number, and basic profile fields. | `[backend/routes/authRoutes.js:154]` |
| `PUT` | `/api/auth/changepassword` | `protect` | Verifies current password and updates to new password. | `[backend/routes/authRoutes.js:155]` |
| `POST` | `/api/auth/refresh` | `none` | Refreshes session tokens using Supabase refresh token from cookie/body. | `[backend/routes/authRoutes.js:156]` |
| `POST` | `/api/auth/logout` | `none` | Invalids session and clears authentication cookies. | `[backend/routes/authRoutes.js:157]` |
| `POST` | `/api/auth/phone/send-otp` | `otpLimiter`, `protect`, `validate` | Sends 6-digit SMS OTP verification code to user phone. | `[backend/routes/authRoutes.js:160-171]` |
| `POST` | `/api/auth/phone/verify-otp` | `protect`, `validate` | Validates 6-digit OTP code and records phone number as verified. | `[backend/routes/authRoutes.js:173-185]` |
| `POST` | `/api/auth/check-email` | `checkEmailLimiter` | Checks email availability during registration form typing. | `[backend/routes/authRoutes.js:193]` |

---

### 5. Shopping Cart (`[backend/routes/cartRoutes.js:1-18]`, `[backend/controllers/cartController.js:1-148]`)
*Mounted at `/api/cart` via `[backend/routes/index.js:44]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/cart` | `protect` | Retrieves active cart items, quantities, prices, and totals for user. | `[backend/routes/cartRoutes.js:6]` |
| `POST` | `/api/cart` | `protect` | Adds product to cart or increments quantity of existing item. | `[backend/routes/cartRoutes.js:7]` |
| `POST` | `/api/cart/sync` | `protect` | Merges local guest cart items into authenticated user database cart. | `[backend/routes/cartRoutes.js:8]` |
| `PUT` | `/api/cart` | `protect` | Updates specific cart item quantity or selected product variant. | `[backend/routes/cartRoutes.js:9]` |
| `DELETE` | `/api/cart/:itemId` | `protect` | Removes a single line item from the shopping cart. | `[backend/routes/cartRoutes.js:10]` |
| `DELETE` | `/api/cart` | `protect` | Clears all items from the authenticated user shopping cart. | `[backend/routes/cartRoutes.js:11]` |
| `GET` | `/api/cart/all` | `protect`, `authorize('admin')` | Admin overview of all active shopping carts across users. | `[backend/routes/cartRoutes.js:12]` |
| `POST` | `/api/cart/admin/:cartId/remind` | `protect`, `authorize('admin')` | Manually triggers abandoned cart reminder email to cart owner. | `[backend/routes/cartRoutes.js:13]` |
| `DELETE` | `/api/cart/admin/:cartId/clear` | `protect`, `authorize('admin')` | Administrative purge of a specific shopping cart. | `[backend/routes/cartRoutes.js:15]` |

---

### 6. Discount Coupons (`[backend/routes/couponRoutes.js:1-39]`, `[backend/controllers/couponController.js:1-98]`)
*Mounted at `/api/coupons` via `[backend/routes/index.js:69]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/coupons` | `protect`, `authorize('admin')` | Lists all discount coupons with usage counts and rules. | `[backend/routes/couponRoutes.js:23]` |
| `POST` | `/api/coupons` | `protect`, `authorize('admin')`, `validate` | Creates a new discount coupon code (percentage or fixed amount). | `[backend/routes/couponRoutes.js:24]` |
| `GET` | `/api/coupons/latest-promo` | `none` | Retrieves latest active promo coupon for banner / popup modal display. | `[backend/routes/couponRoutes.js:27]` |
| `POST` | `/api/coupons/validate` | `validateCouponLimiter` | Validates coupon code eligibility against cart value and min spend. | `[backend/routes/couponRoutes.js:30]` |
| `PATCH` | `/api/coupons/:id/toggle` | `protect`, `authorize('admin')` | Toggles coupon active status between enabled and disabled. | `[backend/routes/couponRoutes.js:33]` |
| `DELETE` | `/api/coupons/:id` | `protect`, `authorize('admin')` | Deletes a discount coupon. | `[backend/routes/couponRoutes.js:36]` |

---

### 7. eBay Catalog Integration (`[backend/routes/ebayCatalogRoutes.js:1-13]`, `[backend/controllers/ebayCatalogController.js:1-155]`)
*Mounted at `/api/ebay-catalog` via `[backend/routes/index.js:76]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/ebay-catalog/search` | `protect` | Searches eBay catalog API for device models and specifications. | `[backend/routes/ebayCatalogRoutes.js:7]` |
| `POST` | `/api/ebay-catalog/import` | `protect` | Imports selected eBay device models into local database catalog. | `[backend/routes/ebayCatalogRoutes.js:10]` |

---

### 8. Email Management (`[backend/routes/emailRoutes.js:1-15]`, `[backend/controllers/emailController.js:1-34]`)
*Mounted at `/api/emails` via `[backend/routes/index.js:55]`. Router-level Middleware: `protect`, `authorize('admin')` `[backend/routes/emailRoutes.js:7-8]`*
*Note: Sub-routes are currently commented out in source code `[backend/routes/emailRoutes.js:10-12]`.*

---

### 9. Email Templates (`[backend/routes/emailTemplateRoutes.js:1-21]`, `[backend/controllers/emailTemplateController.js:1-91]`)
*Mounted at `/api/email-templates` via `[backend/routes/index.js:56]`. Router-level Middleware: `protect`, `authorize('admin')` `[backend/routes/emailTemplateRoutes.js:7-8]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/email-templates` | `protect`, `authorize('admin')` | Lists all editable email notification templates. | `[backend/routes/emailTemplateRoutes.js:11]` |
| `GET` | `/api/email-templates/:id` | `protect`, `authorize('admin')` | Retrieves HTML body and variables for a specific template. | `[backend/routes/emailTemplateRoutes.js:14]` |
| `PUT` | `/api/email-templates/:id` | `protect`, `authorize('admin')` | Updates subject line and HTML body of an email template. | `[backend/routes/emailTemplateRoutes.js:15]` |
| `POST` | `/api/email-templates/:id/test` | `protect`, `authorize('admin')` | Sends test render of email template to administrator email. | `[backend/routes/emailTemplateRoutes.js:18]` |

---

### 10. Inventory Management (`[backend/routes/inventoryRoutes.js:1-16]`, `[backend/controllers/inventoryController.js:1-104]`)
*Mounted at `/api/inventory` via `[backend/routes/index.js:48]`. Router-level Middleware: `protect`, `authorize('admin')` `[backend/routes/inventoryRoutes.js:6-7]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/inventory/stats` | `protect`, `authorize('admin')` | Computes inventory metrics, stock valuation, and restock alerts. | `[backend/routes/inventoryRoutes.js:9]` |
| `GET` | `/api/inventory/items` | `protect`, `authorize('admin')` | Lists all products, repair parts, and accessories with stock levels. | `[backend/routes/inventoryRoutes.js:10]` |
| `GET` | `/api/inventory/sales` | `protect`, `authorize('admin')` | Retrieves recent sales activity affecting inventory. | `[backend/routes/inventoryRoutes.js:11]` |
| `GET` | `/api/inventory/history` | `protect`, `authorize('admin')` | Retrieves historical audit log of stock adjustments. | `[backend/routes/inventoryRoutes.js:12]` |
| `PUT` | `/api/inventory/:type/:id/stock` | `protect`, `authorize('admin')` | Manually updates inventory stock quantity for an item. | `[backend/routes/inventoryRoutes.js:13]` |

---

### 11. Loaner Devices (`[backend/routes/loanerRoutes.js:1-25]`, `[backend/controllers/loanerController.js:1-109]`)
*Mounted at `/api/loaners` via `[backend/routes/index.js:70]`. Router-level Middleware: `protect`, `authorize('admin')` `[backend/routes/loanerRoutes.js:7-8]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/loaners` | `protect`, `authorize('admin')` | Lists all courtesy loaner devices in the fleet. | `[backend/routes/loanerRoutes.js:11]` |
| `POST` | `/api/loaners` | `protect`, `authorize('admin')` | Registers a new loaner device (IMEI, model, serial number). | `[backend/routes/loanerRoutes.js:12]` |
| `GET` | `/api/loaners/stats` | `protect`, `authorize('admin')` | Returns loaner fleet utilization and availability statistics. | `[backend/routes/loanerRoutes.js:15]` |
| `PUT` | `/api/loaners/:id` | `protect`, `authorize('admin')` | Updates loaner device condition and details. | `[backend/routes/loanerRoutes.js:18]` |
| `DELETE` | `/api/loaners/:id` | `protect`, `authorize('admin')` | Deletes a loaner device record. | `[backend/routes/loanerRoutes.js:19]` |
| `POST` | `/api/loaners/:id/lend` | `protect`, `authorize('admin')` | Assigns loaner device to a repair customer. | `[backend/routes/loanerRoutes.js:21]` |
| `POST` | `/api/loaners/:id/return` | `protect`, `authorize('admin')` | Records loaner return and logs device condition inspection. | `[backend/routes/loanerRoutes.js:22]` |

---

### 12. Support Messaging (`[backend/routes/messageRoutes.js:1-20]`, `[backend/controllers/messageController.js:1-177]`)
*Mounted at `/api/messages` via `[backend/routes/index.js:66]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/messages` | `optionalProtect` | Submits customer contact or support message (guest or authenticated). | `[backend/routes/messageRoutes.js:9]` |
| `POST` | `/api/messages/admin/send` | `protect`, `authorize('admin', 'staff')` | Sends administrative support message to specific user thread. | `[backend/routes/messageRoutes.js:10]` |
| `POST` | `/api/messages/admin/bulk` | `protect`, `authorize('admin')` | Broadcasts message to multiple customer threads. | `[backend/routes/messageRoutes.js:11]` |
| `GET` | `/api/messages/my-messages` | `protect` | Retrieves support messages and replies for authenticated user. | `[backend/routes/messageRoutes.js:13]` |
| `GET` | `/api/messages` | `protect`, `authorize('admin', 'staff')` | Lists all support inquiries and customer conversation threads. | `[backend/routes/messageRoutes.js:14]` |
| `PUT` | `/api/messages/:id` | `protect`, `authorize('admin', 'staff')` | Updates message status (open, in-progress, resolved). | `[backend/routes/messageRoutes.js:15]` |
| `POST` | `/api/messages/:id/reply` | `protect` | Appends customer reply to an existing support message. | `[backend/routes/messageRoutes.js:16]` |
| `DELETE` | `/api/messages/:id` | `protect`, `authorize('admin')` | Deletes a message thread. | `[backend/routes/messageRoutes.js:17]` |

---

### 13. Notifications (`[backend/routes/notificationRoutes.js:1-14]`, `[backend/controllers/notificationController.js:1-49]`)
*Mounted at `/api/notifications` via `[backend/routes/index.js:47]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | `protect` | Lists in-app notifications for authenticated user. | `[backend/routes/notificationRoutes.js:6]` |
| `PUT` | `/api/notifications/read-all` | `protect` | Marks all notifications as read for authenticated user. | `[backend/routes/notificationRoutes.js:8]` |
| `PUT` | `/api/notifications/:id/read` | `protect` | Marks a specific notification as read. | `[backend/routes/notificationRoutes.js:9]` |
| `DELETE` | `/api/notifications` | `protect` | Bulk deletes notifications for authenticated user. | `[backend/routes/notificationRoutes.js:10]` |
| `DELETE` | `/api/notifications/:id` | `protect` | Deletes a single notification. | `[backend/routes/notificationRoutes.js:11]` |

---

### 14. Orders & Invoices (`[backend/routes/orderRoutes.js:1-53]`, `[backend/controllers/orderController.js:1-271]`)
*Mounted at `/api/orders` via `[backend/routes/index.js:53]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/orders/admin/all` | `protect`, `authorize('admin')` | Lists all store orders across all users with status filters. | `[backend/routes/orderRoutes.js:30]` |
| `GET` | `/api/orders/admin/stats` | `protect`, `authorize('admin')` | Aggregates order revenue, volume, and fulfillment metrics. | `[backend/routes/orderRoutes.js:31]` |
| `GET` | `/api/orders/admin/timeline` | `protect`, `authorize('admin')` | Returns chronological timeline of order status transitions. | `[backend/routes/orderRoutes.js:32]` |
| `PUT` | `/api/orders/admin/:id/status` | `protect`, `authorize('admin')` | Updates order fulfillment status (processing, shipped, delivered, cancelled). | `[backend/routes/orderRoutes.js:33]` |
| `POST` | `/api/orders/admin/:id/generate-invoice` | `protect`, `authorize('admin')` | Generates PDF invoice document for order. | `[backend/routes/orderRoutes.js:34]` |
| `DELETE` | `/api/orders/admin/:id` | `protect`, `authorize('admin')` | Deletes an order record from database. | `[backend/routes/orderRoutes.js:35]` |
| `GET` | `/api/orders` | `protect` | Lists orders placed by authenticated user. | `[backend/routes/orderRoutes.js:39]` |
| `GET` | `/api/orders/my` | `protect` | Alias for user order history. | `[backend/routes/orderRoutes.js:40]` |
| `GET` | `/api/orders/:id` | `optionalProtect` | Retrieves order details by ID (verifies ownership or guest token). | `[backend/routes/orderRoutes.js:41]` |
| `GET` | `/api/orders/:id/invoice` | `optionalProtect` | Downloads generated PDF invoice for order. | `[backend/routes/orderRoutes.js:42]` |
| `POST` | `/api/orders` | `optionalProtect`, `validate(createOrderRules)` | Creates new order, calculates totals, and initiates checkout. | `[backend/routes/orderRoutes.js:44]` |
| `POST` | `/api/orders/:id/receipt` | `optionalProtect`, `uploadSingle(...)` | Uploads proof-of-payment receipt image for bank transfer orders. | `[backend/routes/orderRoutes.js:45]` |
| `PUT` | `/api/orders/:id/cancel` | `protect` | Cancels an unfulfilled order placed by authenticated user. | `[backend/routes/orderRoutes.js:50]` |

---

### 15. Dynamic CMS Pages (`[backend/routes/pageRoutes.js:1-13]`, `[backend/controllers/pageController.js:1-86]`)
*Mounted at `/api/pages` via `[backend/routes/index.js:68]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/pages/:slug` | `none` | Retrieves published CMS page content by slug (e.g. `impressum`, `agb`). | `[backend/routes/pageRoutes.js:6]` |
| `GET` | `/api/pages` | `protect`, `authorize('admin')` | Lists all CMS pages and their publication status. | `[backend/routes/pageRoutes.js:7]` |
| `POST` | `/api/pages` | `protect`, `authorize('admin')` | Creates or upserts a CMS page. | `[backend/routes/pageRoutes.js:8]` |
| `PUT` | `/api/pages/:id` | `protect`, `authorize('admin')` | Updates CMS page title, content, SEO meta tags, or slug. | `[backend/routes/pageRoutes.js:9]` |
| `DELETE` | `/api/pages/:id` | `protect`, `authorize('admin')` | Deletes a CMS page. | `[backend/routes/pageRoutes.js:10]` |

---

### 16. Payments (`[backend/routes/paymentRoutes.js:1-21]`, `[backend/controllers/paymentController.js:1-94]`)
*Mounted at `/api/payment` via `[backend/routes/index.js:49]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/payment/create-payment-intent` | `paymentLimiter`, `protect` | Creates Stripe PaymentIntent and returns `clientSecret`. | `[backend/routes/paymentRoutes.js:13]` |
| `POST` | `/api/payment/webhook` | `rawBodyParser` | Verifies Stripe webhook cryptographic signature and processes payment events. | `[backend/routes/paymentRoutes.js:14]` |
| `POST` | `/api/payment/paypal/create-order` | `paymentLimiter`, `protect` | Calls PayPal REST API to create a payment order. | `[backend/routes/paymentRoutes.js:17]` |
| `POST` | `/api/payment/paypal/capture-order` | `paymentLimiter`, `protect` | Captures authorized PayPal order and updates order status to paid. | `[backend/routes/paymentRoutes.js:18]` |

---

### 17. Price Research (`[backend/routes/priceResearchRoutes.js:1-31]`, `[backend/controllers/priceResearchController.js:1-84]`)
*Mounted at `/api/price-research` via `[backend/routes/index.js:72]`. Router-level Middleware: `protect`, `authorize('admin')` `[backend/routes/priceResearchRoutes.js:13]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/price-research/ebay` | `protect`, `authorize('admin')` | Queries eBay completed listings for market price research. | `[backend/routes/priceResearchRoutes.js:16]` |
| `GET` | `/api/price-research/ebay-specs` | `protect`, `authorize('admin')` | Extracts technical specifications from eBay listings. | `[backend/routes/priceResearchRoutes.js:19]` |
| `POST` | `/api/price-research/ebay/device/:blueprintId` | `protect`, `authorize('admin')` | Initiates automated price research across storage variants for blueprint. | `[backend/routes/priceResearchRoutes.js:22]` |
| `POST` | `/api/price-research/apply/:blueprintId` | `protect`, `authorize('admin')` | Applies calculated market pricing to trade-in valuation blueprint. | `[backend/routes/priceResearchRoutes.js:25]` |
| `GET` | `/api/price-research/status` | `protect`, `authorize('admin')` | Returns progress status of price research background tasks. | `[backend/routes/priceResearchRoutes.js:28]` |

---

### 18. Products (`[backend/routes/productRoutes.js:1-55]`, `[backend/controllers/productController.js:1-180]`)
*Mounted at `/api/products` via `[backend/routes/index.js:50]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | `none` | Lists catalog products with pagination, search, brand, and category filters. | `[backend/routes/productRoutes.js:29]` |
| `GET` | `/api/products/categories` | `none` | Returns list of distinct product categories. | `[backend/routes/productRoutes.js:30]` |
| `GET` | `/api/products/featured` | `none` | Returns curated featured products for home page. | `[backend/routes/productRoutes.js:31]` |
| `POST` | `/api/products/validate-stock` | `none` | Validates availability of stock quantities prior to checkout. | `[backend/routes/productRoutes.js:32]` |
| `GET` | `/api/products/admin/stats` | `protect`, `authorize('admin')` | Returns product inventory valuation and sales stats. | `[backend/routes/productRoutes.js:34]` |
| `GET` | `/api/products/:id` | `none` | Retrieves single product details, specs, and image gallery. | `[backend/routes/productRoutes.js:35]` |
| `POST` | `/api/products` | `protect`, `authorize('admin')` | Creates a new product catalog entry. | `[backend/routes/productRoutes.js:36]` |
| `PUT` | `/api/products/:id` | `protect`, `authorize('admin')` | Updates product specifications, pricing, stock, or images. | `[backend/routes/productRoutes.js:37]` |
| `DELETE` | `/api/products/:id` | `protect`, `authorize('admin')` | Deletes product from catalog. | `[backend/routes/productRoutes.js:38]` |
| `GET` | `/api/products/:id/reviews` | `none` | Retrieves customer reviews and ratings for product. | `[backend/routes/productRoutes.js:41]` |
| `GET` | `/api/products/:id/related` | `none` | Returns recommended related products based on category/brand. | `[backend/routes/productRoutes.js:44]` |
| `GET` | `/api/products/:id/questions` | `none` | Retrieves published Q&A items for product. | `[backend/routes/productRoutes.js:47]` |

---

### 19. Promotions (`[backend/routes/promotionsRoutes.js:1-18]`, `[backend/controllers/promotionsController.js:1-56]`)
*Mounted at `/api/promotions` via `[backend/routes/index.js:61]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/promotions/active` | `none` | Returns currently active promotional campaigns and discount banners. | `[backend/routes/promotionsRoutes.js:11]` |
| `GET` | `/api/promotions` | `none` | Lists all promotional campaigns. | `[backend/routes/promotionsRoutes.js:12]` |
| `POST` | `/api/promotions` | `protect`, `authorize('admin')` | Creates a new marketing promotion banner/campaign. | `[backend/routes/promotionsRoutes.js:13]` |
| `PUT` | `/api/promotions/:id` | `protect`, `authorize('admin')` | Updates promotional campaign details and schedule. | `[backend/routes/promotionsRoutes.js:14]` |
| `DELETE` | `/api/promotions/:id` | `protect`, `authorize('admin')` | Deletes a promotion record. | `[backend/routes/promotionsRoutes.js:15]` |

---

### 20. Purchase Orders (`[backend/routes/purchaseOrderRoutes.js:1-25]`, `[backend/controllers/purchaseOrderController.js:1-56]`)
*Mounted at `/api/purchase-orders` via `[backend/routes/index.js:74]`. Router-level Middleware: `protect`, `authorize('admin')` `[backend/routes/purchaseOrderRoutes.js:8-9]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/purchase-orders` | `protect`, `authorize('admin')` | Lists all supplier purchase orders. | `[backend/routes/purchaseOrderRoutes.js:13]` |
| `POST` | `/api/purchase-orders` | `protect`, `authorize('admin')` | Creates a new purchase order for supplier restock. | `[backend/routes/purchaseOrderRoutes.js:14]` |
| `GET` | `/api/purchase-orders/:id` | `protect`, `authorize('admin')` | Retrieves purchase order line items and receipt status. | `[backend/routes/purchaseOrderRoutes.js:18]` |
| `PUT` | `/api/purchase-orders/:id/status` | `protect`, `authorize('admin')` | Updates PO status (ordered, received, partial, cancelled). | `[backend/routes/purchaseOrderRoutes.js:22]` |

---

### 21. Refunds & Returns (`[backend/routes/refundRoutes.js:1-26]`, `[backend/controllers/refundController.js:1-103]`)
*Mounted at `/api/refunds` via `[backend/routes/index.js:75]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/refunds` | `protect` | Submits a return/refund request for an order. | `[backend/routes/refundRoutes.js:13]` |
| `GET` | `/api/refunds/my` | `protect` | Retrieves refund request history for authenticated user. | `[backend/routes/refundRoutes.js:14]` |
| `DELETE` | `/api/refunds/:id` | `protect` | Cancels a pending user refund request. | `[backend/routes/refundRoutes.js:15]` |
| `GET` | `/api/refunds` | `protect`, `authorize('admin', 'staff')` | Lists all submitted refund requests for administrative review. | `[backend/routes/refundRoutes.js:18]` |
| `GET` | `/api/refunds/:id` | `protect`, `authorize('admin', 'staff')` | Retrieves full refund request details and items. | `[backend/routes/refundRoutes.js:19]` |
| `PUT` | `/api/refunds/:id/status` | `protect`, `authorize('admin', 'staff')` | Updates refund decision (approved, rejected, refunded). | `[backend/routes/refundRoutes.js:22]` |

---

### 22. Repair Archive Showcase (`[backend/routes/repairArchiveRoutes.js:1-26]`, `[backend/controllers/repairArchiveController.js:1-70]`)
*Mounted at `/api/repair-archive` via `[backend/routes/index.js:58]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/repair-archive` | `none` | Lists public repair showcase gallery entries. | `[backend/routes/repairArchiveRoutes.js:8]` |
| `POST` | `/api/repair-archive` | `protect`, `uploadFields(...)` | Creates repair case with before/after photos. | `[backend/routes/repairArchiveRoutes.js:11-15]` |
| `PUT` | `/api/repair-archive/:id` | `protect`, `uploadFields(...)` | Updates repair showcase case details and images. | `[backend/routes/repairArchiveRoutes.js:17-21]` |
| `DELETE` | `/api/repair-archive/:id` | `protect` | Deletes a repair showcase case. | `[backend/routes/repairArchiveRoutes.js:23]` |

---

### 23. Repair Parts (`[backend/routes/repairPartRoutes.js:1-21]`, `[backend/controllers/repairPartController.js:1-68]`)
*Mounted at `/api/repair-parts` via `[backend/routes/index.js:51]`. Router-level Middleware: `protect`, `authorize('admin')` `[backend/routes/repairPartRoutes.js:7-8]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/repair-parts` | `protect`, `authorize('admin')` | Lists all repair parts in inventory. | `[backend/routes/repairPartRoutes.js:12]` |
| `POST` | `/api/repair-parts` | `protect`, `authorize('admin')` | Adds a new repair part record. | `[backend/routes/repairPartRoutes.js:13]` |
| `PUT` | `/api/repair-parts/:id` | `protect`, `authorize('admin')` | Updates part cost, retail price, compatibility, or stock. | `[backend/routes/repairPartRoutes.js:17]` |
| `DELETE` | `/api/repair-parts/:id` | `protect`, `authorize('admin')` | Deletes a repair part record. | `[backend/routes/repairPartRoutes.js:18]` |

---

### 24. Repair Services & Tickets (`[backend/routes/repairRoutes.js:1-36]`, `[backend/controllers/repairController.js:1-123]`, `[backend/controllers/repairTicketController.js:1-160]`)
*Mounted at `/api/repairs` via `[backend/routes/index.js:52]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/repairs` | `none` | Returns catalog of repairable devices and associated repair services. | `[backend/routes/repairRoutes.js:8]` |
| `GET` | `/api/repairs/catalog` | `none` | Alias for repair device catalog. | `[backend/routes/repairRoutes.js:9]` |
| `POST` | `/api/repairs/estimate` | `none` | Calculates estimated repair cost based on selected model and defects. | `[backend/routes/repairRoutes.js:10]` |
| `GET` | `/api/repairs/track-guest/:ticketId` | `none` | Looks up repair status for guest users via tracking code. | `[backend/routes/repairRoutes.js:11]` |
| `POST` | `/api/repairs/tickets` | `optionalProtect` | Books and submits a new repair service ticket. | `[backend/routes/repairRoutes.js:14]` |
| `GET` | `/api/repairs/my-repairs` | `protect` | Retrieves repair tickets created by authenticated user. | `[backend/routes/repairRoutes.js:15]` |
| `GET` | `/api/repairs/tickets/my-tickets` | `protect` | Alias for user repair tickets. | `[backend/routes/repairRoutes.js:16]` |
| `GET` | `/api/repairs/tickets/admin/stats` | `protect`, `authorize('admin')` | Aggregates repair ticket metrics and repair volume by status. | `[backend/routes/repairRoutes.js:19]` |
| `PUT` | `/api/repairs/tickets/:id/status` | `protect`, `authorize('admin')` | Updates ticket progress (received, inspecting, repairing, ready). | `[backend/routes/repairRoutes.js:20]` |
| `DELETE` | `/api/repairs/tickets/:id` | `protect`, `authorize('admin')` | Deletes a repair ticket. | `[backend/routes/repairRoutes.js:21]` |
| `GET` | `/api/repairs/tickets/:id` | `optionalProtect` | Retrieves repair ticket details. | `[backend/routes/repairRoutes.js:24]` |
| `GET` | `/api/repairs/admin/stats` | `protect`, `authorize('admin')` | Returns repair catalog statistics. | `[backend/routes/repairRoutes.js:27]` |
| `GET` | `/api/repairs/admin/all` | `protect`, `authorize('admin')` | Admin list of all repair tickets. | `[backend/routes/repairRoutes.js:28]` |
| `POST` | `/api/repairs/devices/bulk` | `protect`, `authorize('admin')` | Bulk creates repair catalog device models. | `[backend/routes/repairRoutes.js:29]` |
| `POST` | `/api/repairs/devices` | `protect`, `authorize('admin')` | Creates a single repair catalog device model. | `[backend/routes/repairRoutes.js:30]` |
| `PUT` | `/api/repairs/devices/:id` | `protect`, `authorize('admin')` | Updates repair catalog device attributes. | `[backend/routes/repairRoutes.js:31]` |
| `DELETE` | `/api/repairs/devices/:id` | `protect`, `authorize('admin')` | Deletes a repair catalog device model. | `[backend/routes/repairRoutes.js:32]` |
| `PUT` | `/api/repairs/devices/:id/services` | `protect`, `authorize('admin')` | Configures prices for individual repair services on a device. | `[backend/routes/repairRoutes.js:33]` |

---

### 25. Reviews (`[backend/routes/reviewRoutes.js:1-14]`, `[backend/controllers/reviewController.js:1-70]`)
*Mounted at `/api/reviews` via `[backend/routes/index.js:43]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/reviews` | `protect` | Submits verified customer review and star rating. | `[backend/routes/reviewRoutes.js:7]` |
| `GET` | `/api/reviews/product/:itemId` | `none` | Lists approved customer reviews for a specific item. | `[backend/routes/reviewRoutes.js:8]` |
| `GET` | `/api/reviews/admin` | `protect`, `authorize('admin')` | Admin list of all reviews across products and repairs. | `[backend/routes/reviewRoutes.js:10]` |
| `DELETE` | `/api/reviews/:id` | `protect`, `authorize('admin')` | Deletes a customer review. | `[backend/routes/reviewRoutes.js:11]` |

---

### 26. System Settings (`[backend/routes/settingsRoutes.js:1-25]`, `[backend/controllers/settingsController.js:1-189]`)
*Mounted at `/api/settings` via `[backend/routes/index.js:45]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/settings` | `cacheMiddleware(86400)` | Retrieves public store settings (business hours, contact info, branding). | `[backend/routes/settingsRoutes.js:8]` |
| `GET` | `/api/settings/payment-config` | `none` | Retrieves public payment configuration (publishable Stripe key, PayPal client ID); secret keys are stripped. | `[backend/routes/settingsRoutes.js:9]` |
| `PUT` | `/api/settings` | `protect`, `authorize('admin')` | Updates general system configuration settings. | `[backend/routes/settingsRoutes.js:10]` |
| `GET` | `/api/settings/smtp` | `protect`, `authorize('admin')` | Retrieves SMTP email server settings. | `[backend/routes/settingsRoutes.js:13]` |
| `PUT` | `/api/settings/smtp` | `protect`, `authorize('admin')` | Updates SMTP server credentials and port configuration. | `[backend/routes/settingsRoutes.js:14]` |
| `POST` | `/api/settings/smtp/test` | `protect`, `authorize('admin')` | Tests SMTP connection by sending a diagnostic test email. | `[backend/routes/settingsRoutes.js:15]` |
| `GET` | `/api/settings/social-auth` | `protect`, `authorize('admin')` | Retrieves OAuth social login configuration. | `[backend/routes/settingsRoutes.js:18]` |
| `PUT` | `/api/settings/social-auth` | `protect`, `authorize('admin')` | Updates OAuth client IDs and secret settings. | `[backend/routes/settingsRoutes.js:19]` |
| `POST` | `/api/settings/invoice/test` | `protect`, `authorize('admin')` | Generates a sample test invoice PDF. | `[backend/routes/settingsRoutes.js:22]` |

---

### 27. Shipping Methods (`[backend/routes/shippingRoutes.js:1-13]`, `[backend/controllers/shippingController.js:1-62]`)
*Mounted at `/api/shipping-methods` via `[backend/routes/index.js:67]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/shipping-methods` | `none` | Lists active shipping methods and rates available to customers. | `[backend/routes/shippingRoutes.js:6]` |
| `GET` | `/api/shipping-methods/admin/all` | `protect`, `authorize('admin')` | Lists all shipping options including inactive methods. | `[backend/routes/shippingRoutes.js:7]` |
| `POST` | `/api/shipping-methods` | `protect`, `authorize('admin')` | Creates a new shipping carrier or method. | `[backend/routes/shippingRoutes.js:8]` |
| `PUT` | `/api/shipping-methods/:id` | `protect`, `authorize('admin')` | Updates shipping method price, title, or conditions. | `[backend/routes/shippingRoutes.js:9]` |
| `DELETE` | `/api/shipping-methods/:id` | `protect`, `authorize('admin')` | Deletes a shipping method. | `[backend/routes/shippingRoutes.js:10]` |

---

### 28. Dashboard Analytics & Statistics (`[backend/routes/statsRoutes.js:1-11]`, `[backend/controllers/statsController.js:1-42]`)
*Mounted at `/api/stats` via `[backend/routes/index.js:57]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/stats` | `protect`, `authorize('admin')` | Returns admin dashboard KPIs (sales volume, active repairs, new users). | `[backend/routes/statsRoutes.js:7]` |
| `GET` | `/api/stats/user` | `protect` | Returns personal activity statistics for authenticated user. | `[backend/routes/statsRoutes.js:8]` |

---

### 29. Suppliers (`[backend/routes/supplierRoutes.js:1-23]`, `[backend/controllers/supplierController.js:1-75]`)
*Mounted at `/api/suppliers` via `[backend/routes/index.js:73]`. Router-level Middleware: `protect`, `authorize('admin')` `[backend/routes/supplierRoutes.js:8-9]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/suppliers` | `protect`, `authorize('admin')` | Lists all parts and device suppliers. | `[backend/routes/supplierRoutes.js:13]` |
| `POST` | `/api/suppliers` | `protect`, `authorize('admin')` | Registers a new supplier contact and payment terms. | `[backend/routes/supplierRoutes.js:14]` |
| `GET` | `/api/suppliers/:id` | `protect`, `authorize('admin')` | Retrieves supplier details and order history. | `[backend/routes/supplierRoutes.js:18]` |
| `PUT` | `/api/suppliers/:id` | `protect`, `authorize('admin')` | Updates supplier contact details or address. | `[backend/routes/supplierRoutes.js:19]` |
| `DELETE` | `/api/suppliers/:id` | `protect`, `authorize('admin')` | Deletes a supplier record. | `[backend/routes/supplierRoutes.js:20]` |

---

### 30. Transactions & Wallet (`[backend/routes/transactionRoutes.js:1-28]`, `[backend/controllers/transactionController.js:1-81]`)
*Mounted at `/api/transactions` via `[backend/routes/index.js:63]`. Router-level Middleware: `protect` `[backend/routes/transactionRoutes.js:11]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/transactions` | `protect` | Lists wallet and payment transactions for authenticated user. | `[backend/routes/transactionRoutes.js:14]` |
| `POST` | `/api/transactions/bank-transfer` | `protect` | Initiates pending bank transfer wallet top-up. | `[backend/routes/transactionRoutes.js:20]` |
| `GET` | `/api/transactions/admin` | `protect`, `authorize('admin')` | Lists all financial transactions across all users. | `[backend/routes/transactionRoutes.js:24]` |
| `PUT` | `/api/transactions/admin/:id/status` | `protect`, `authorize('admin')` | Approves or rejects a manual bank transfer transaction. | `[backend/routes/transactionRoutes.js:25]` |

---

### 31. Multi-Language Translations (`[backend/routes/translationRoutes.js:1-38]`, `[backend/controllers/translationController.js:1-142]`)
*Mounted at `/api/translations` via `[backend/routes/index.js:64]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/translations/locales/:lang` | `cacheMiddleware(3600)` | Retrieves JSON dictionary bundle for specified language code. | `[backend/routes/translationRoutes.js:18]` |
| `POST` | `/api/translations/missing/:lang/:namespace` | `none` | Records missing translation keys reported by the frontend UI. | `[backend/routes/translationRoutes.js:21]` |
| `POST` | `/api/translations/auto-translate` | `protect`, `authorize('admin')` | Automatically translates untranslated keys using translation service. | `[backend/routes/translationRoutes.js:27]` |
| `GET` | `/api/translations` | `protect`, `authorize('admin')` | Lists all translation key-value pairs stored in database. | `[backend/routes/translationRoutes.js:30]` |
| `POST` | `/api/translations` | `protect`, `authorize('admin')` | Creates a new translation string. | `[backend/routes/translationRoutes.js:31]` |
| `PUT` | `/api/translations/:id` | `protect`, `authorize('admin')` | Updates translation text for a key. | `[backend/routes/translationRoutes.js:34]` |
| `DELETE` | `/api/translations/:id` | `protect`, `authorize('admin')` | Deletes a translation key. | `[backend/routes/translationRoutes.js:35]` |

---

### 32. Two-Factor Authentication (`[backend/routes/twoFactorRoutes.js:1-17]`, `[backend/controllers/twoFactorController.js:1-33]`)
*Mounted at `/api/2fa` via `[backend/routes/index.js:42]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/2fa/setup` | `protect` | Generates TOTP secret and data URL QR code for authenticator app. | `[backend/routes/twoFactorRoutes.js:12]` |
| `POST` | `/api/2fa/verify` | `protect` | Validates 6-digit TOTP code and enables 2FA on user account. | `[backend/routes/twoFactorRoutes.js:13]` |
| `POST` | `/api/2fa/disable` | `protect` | Disables 2FA on user account after verifying security token. | `[backend/routes/twoFactorRoutes.js:14]` |

---

### 33. User Management (`[backend/routes/userRoutes.js:1-27]`, `[backend/controllers/userController.js:1-145]`)
*Mounted at `/api/users` via `[backend/routes/index.js:54]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/users/notifications` | `protect` | Retrieves notification channel preferences for authenticated user. | `[backend/routes/userRoutes.js:9]` |
| `PUT` | `/api/users/notifications` | `protect` | Updates notification channel preferences (email/SMS/order alerts). | `[backend/routes/userRoutes.js:10]` |
| `GET` | `/api/users/admin/all` | `protect`, `authorize('admin', 'staff')` | Lists all registered user accounts with pagination and search. | `[backend/routes/userRoutes.js:17]` |
| `GET` | `/api/users/admin/stats` | `protect`, `authorize('admin')` | Returns user registration growth and retention metrics. | `[backend/routes/userRoutes.js:18]` |
| `GET` | `/api/users/admin/:id` | `protect`, `authorize('admin')` | Retrieves user profile, role, address, and order history. | `[backend/routes/userRoutes.js:19]` |
| `PUT` | `/api/users/admin/:id/status` | `protect`, `authorize('admin')` | Enables or bans a user account. | `[backend/routes/userRoutes.js:20]` |
| `PUT` | `/api/users/admin/:id/unlock` | `protect`, `authorize('admin')` | Unlocks user account locked after failed password attempts. | `[backend/routes/userRoutes.js:21]` |
| `PUT` | `/api/users/admin/:id/role` | `protect`, `authorize('admin')` | Modifies user security role (`user`, `staff`, `admin`). | `[backend/routes/userRoutes.js:22]` |
| `DELETE` | `/api/users/admin/:id` | `protect`, `authorize('admin')` | Deletes user account from database. | `[backend/routes/userRoutes.js:23]` |
| `POST` | `/api/users/admin/:id/wallet` | `protect`, `authorize('admin')` | Adjusts user internal wallet balance (credit or debit). | `[backend/routes/userRoutes.js:24]` |

---

### 34. Trade-In Valuation & Blueprints (`[backend/routes/valuationRoutes.js:1-56]`, `[backend/controllers/valuationController.js:1-364]`)
*Mounted at `/api/valuation` via `[backend/routes/index.js:59]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/valuation` | `none` | Valuation API connectivity check (`{ success: true }`). | `[backend/routes/valuationRoutes.js:10]` |
| `GET` | `/api/valuation/devices` | `none` | Lists all device blueprints and base valuation matrices. | `[backend/routes/valuationRoutes.js:12]` |
| `POST` | `/api/valuation/devices/reseed` | `protect`, `authorize('admin')` | Reseeds trade-in device blueprints from initial dataset. | `[backend/routes/valuationRoutes.js:14]` |
| `POST` | `/api/valuation/devices` | `protect`, `authorize('admin')` | Creates a new valuation blueprint for a device model. | `[backend/routes/valuationRoutes.js:15]` |
| `PUT` | `/api/valuation/devices/:id` | `protect`, `authorize('admin')` | Updates device valuation criteria, deductibles, or base prices. | `[backend/routes/valuationRoutes.js:16]` |
| `DELETE` | `/api/valuation/devices/:id` | `protect`, `authorize('admin')` | Deletes a device valuation blueprint. | `[backend/routes/valuationRoutes.js:17]` |
| `DELETE` | `/api/valuation/devices` | `protect`, `authorize('admin')` | Bulk deletes device valuation blueprints. | `[backend/routes/valuationRoutes.js:19]` |
| `POST` | `/api/valuation/calculate` | `valuationLimiter` | Calculates estimated trade-in payout based on device condition checklist. | `[backend/routes/valuationRoutes.js:26]` |
| `POST` | `/api/valuation/saved` | `valuationLimiter` | Saves customer trade-in quote and issues unique tracking reference code. | `[backend/routes/valuationRoutes.js:27]` |
| `GET` | `/api/valuation/quote/:reference` | `none` | Looks up valuation quote details by public reference code. | `[backend/routes/valuationRoutes.js:28]` |
| `PUT` | `/api/valuation/quote/:reference/confirm` | `none` | Confirms trade-in submission and generates shipping label details. | `[backend/routes/valuationRoutes.js:29]` |
| `GET` | `/api/valuation/my-valuations` | `protect` | Retrieves saved trade-in quotes for authenticated user. | `[backend/routes/valuationRoutes.js:30]` |
| `GET` | `/api/valuation/saved` | `protect` | Alias for user saved valuation quotes. | `[backend/routes/valuationRoutes.js:31]` |
| `GET` | `/api/valuation/admin/quotes` | `protect`, `authorize('admin')` | Lists all customer trade-in submissions for administrative review. | `[backend/routes/valuationRoutes.js:36]` |
| `PUT` | `/api/valuation/admin/quotes/:id/status` | `protect`, `authorize('admin')` | Updates trade-in status (device received, inspected, payout approved). | `[backend/routes/valuationRoutes.js:37]` |
| `POST` | `/api/valuation/admin/quotes/:id/complete-purchase` | `protect`, `authorize('admin')` | Finalizes trade-in purchase and generates refurbished product inventory item. | `[backend/routes/valuationRoutes.js:38]` |
| `DELETE` | `/api/valuation/admin/quotes/:id` | `protect`, `authorize('admin')` | Deletes a trade-in valuation quote. | `[backend/routes/valuationRoutes.js:39]` |
| `DELETE` | `/api/valuation/admin/quotes` | `protect`, `authorize('admin')` | Bulk deletes trade-in valuation quotes. | `[backend/routes/valuationRoutes.js:40]` |
| `GET` | `/api/valuation/categories` | `none` | Lists device categories supported in trade-in. | `[backend/routes/valuationRoutes.js:45]` |
| `POST` | `/api/valuation/categories` | `protect`, `authorize('admin')` | Adds a new trade-in device category. | `[backend/routes/valuationRoutes.js:46]` |
| `PUT` | `/api/valuation/categories/:id` | `protect`, `authorize('admin')` | Updates a trade-in device category. | `[backend/routes/valuationRoutes.js:47]` |
| `DELETE` | `/api/valuation/categories/:id` | `protect`, `authorize('admin')` | Deletes a trade-in device category. | `[backend/routes/valuationRoutes.js:48]` |
| `GET` | `/api/valuation/brands` | `none` | Lists device brands supported in trade-in. | `[backend/routes/valuationRoutes.js:50]` |
| `POST` | `/api/valuation/brands` | `protect`, `authorize('admin')` | Adds a new trade-in device brand. | `[backend/routes/valuationRoutes.js:51]` |
| `PUT` | `/api/valuation/brands/:id` | `protect`, `authorize('admin')` | Updates a trade-in device brand. | `[backend/routes/valuationRoutes.js:52]` |
| `DELETE` | `/api/valuation/brands/:id` | `protect`, `authorize('admin')` | Deletes a trade-in device brand. | `[backend/routes/valuationRoutes.js:53]` |

---

### 35. Warranties (`[backend/routes/warrantyRoutes.js:1-21]`, `[backend/controllers/warrantyController.js:1-91]`)
*Mounted at `/api/warranties` via `[backend/routes/index.js:71]`. Router-level Middleware: `protect`, `authorize('admin')` `[backend/routes/warrantyRoutes.js:7-8]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/warranties` | `protect`, `authorize('admin')` | Lists all device warranty registrations and claims. | `[backend/routes/warrantyRoutes.js:13]` |
| `POST` | `/api/warranties` | `protect`, `authorize('admin')` | Registers a new product warranty certificate. | `[backend/routes/warrantyRoutes.js:14]` |
| `PUT` | `/api/warranties/:id` | `protect`, `authorize('admin')` | Updates warranty term, status, or claim details. | `[backend/routes/warrantyRoutes.js:17]` |
| `DELETE` | `/api/warranties/:id` | `protect`, `authorize('admin')` | Deletes a warranty record. | `[backend/routes/warrantyRoutes.js:18]` |

---

### 36. Wishlist (`[backend/routes/wishlistRoutes.js:1-12]`, `[backend/controllers/wishlistController.js:1-45]`)
*Mounted at `/api/wishlist` via `[backend/routes/index.js:65]`. Router-level Middleware: `protect` `[backend/routes/wishlistRoutes.js:4]`*
| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) | Source Citation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/wishlist` | `protect` | Retrieves saved wishlist items for authenticated user. | `[backend/routes/wishlistRoutes.js:6]` |
| `POST` | `/api/wishlist` | `protect` | Adds a product to user wishlist. | `[backend/routes/wishlistRoutes.js:7]` |
| `DELETE` | `/api/wishlist/:itemId` | `protect` | Removes a product from user wishlist. | `[backend/routes/wishlistRoutes.js:8]` |
| `DELETE` | `/api/wishlist` | `protect` | Clears all items from user wishlist. | `[backend/routes/wishlistRoutes.js:9]` |
