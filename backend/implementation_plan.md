# HandyLand Admin Console Full Remediation Plan

This plan addresses all 14 issues identified in the comprehensive review of the Admin Console. The fixes range from UI localization and component bug fixes to database data sanitization.

## User Review Required

Please review the planned database changes, specifically whether it is acceptable to run automated scripts to clean up the existing seed data (like deleting test messages, removing duplicate tickets, fixing names and dates, and generating mock data for charts).

## Proposed Changes

### Phase 1: Localization & Frontend Fixes (Critical & Low Priorities)

1. **i18n / German Localization Issue**
   - Translate hardcoded German strings to English in the following Admin panel components:
     - `LoanerManager.tsx` ("Leihgeräte Manager" -> "Loaner Phones", etc.)
     - `RefundManager.tsx` ("Rückerstattungen" -> "Refunds", etc.)
     - `WarrantyManager.tsx` ("Garantie Tracker" -> "Warranty Tracker", etc.)
     - `ValuationManager.tsx` ("Angebote" -> "Offers", etc.)
     - `PriceResearchManager.tsx` ("eBay Preisrecherche" -> "eBay Price Research", etc.)
     - `ValuationSettings.tsx` ("Ankauf-Konfiguration" -> "Valuation Settings", etc.)
     - `ShippingManager.tsx`
   - *Approach:* We will write a smart string replacement script targeting these specific files to quickly swap the German vocabulary for English.

2. **`/dashboard` 404 Route**
   - **File:** `App.tsx`
   - Add `<Route path="/dashboard" element={<Navigate to="/" replace />} />` to correctly redirect the missing route.

3. **Coupons Code Display Bug**
   - **File:** `CouponManager.tsx`
   - Fix the rendering bug where the coupon code is cut off (currently displaying only the first letter "S" in a circle instead of the full text).

### Phase 2: Database Data Remediation (Critical & Medium Priorities)

We will execute a robust Node.js script (`backend/scripts/fix_db_comprehensive.js`) to sanitize and correct the data in Supabase:

1. **Repairs Catalog**
   - Table: `repair_devices` & `repair_services`
   - Remove duplicate "Screen Repair" entries.
   - Update `model` from "15" to "iPhone 15".
   - Update `image` to a valid iPhone image URL.
   - Fix visibility flags and mismatching counters.

2. **Inventory & Sales Classification**
   - Table: `products`
   - Update category for "Samsung Galaxy S23", "Google Pixel 8 Pro", "iPhone 14 Pro" to `Device` instead of `Accessory`.
   - Seed missing `barcode` fields with mock data to resolve "No Barcode" warnings.
   - Increase `stock` levels to > 10 to clear the 48 critical/low stock alerts.

3. **Payment Methods**
   - Table: `settings` or `payment_methods` (depending on schema)
   - Enable `Stripe` and `PayPal` configurations to match the existing orders that used them.

4. **Repair Tickets Data**
   - Table: `repair_tickets`
   - Fix missing `ticket_id` by generating one.
   - Set valid `created_at` timestamps to fix the "—" date rendering.
   - Delete the "111111111" test chat messages.
   - Attach mock customer data instead of "Unknown".

5. **Global Compare Manager Duplicates**
   - Remove duplicate rows for the same products.

6. **Active Carts Dates**
   - Table: `carts`
   - Set valid `updated_at` timestamps so they render correctly instead of "—".

7. **Inbox Test Data Cleanup**
   - Table: `messages`
   - Delete all messages where email is `test2@example.com`, `test@test.com`, or `guest@test.com`.

8. **Accessories EAN Parsing**
   - Table: `accessories`
   - Run a regex replace on the `name` column to remove trailing 13-digit EANs (e.g., "1778013742728").

9. **Shipping Methods Typo**
   - Table: `shipping_methods`
   - Rename "Expressو" to "Express".

10. **Products Condition Tags**
    - Table: `products`
    - Replace German condition tags: `sehr_gut` -> `Very Good`, `hervorragend` -> `Excellent`.

11. **Dashboard Chart Seed Data**
    - Insert 3 new `repair_tickets` with statuses: `pending`, `in_progress`, and `completed` to ensure the chart renders a full legend instead of just `cancelled`.

## Verification Plan

### Automated / Script Verification
- Run the `fix_db_comprehensive.js` script and verify log outputs for successful rows updated/deleted.

### Manual Verification
- Start the frontend and backend servers.
- Navigate to each mentioned page (`/loaners`, `/refunds`, `/warranties`, `/valuation`, `/price-research`, `/valuation-settings`, `/shipping`). Confirm English text.
- Navigate to `/dashboard` directly and confirm it redirects.
- Check Inventory table to verify barcodes and updated stock categories.
- Check Repairs Catalog for fixed image, "iPhone 15" label, and 3 distinct services.
- Verify Inbox, Active Carts, and Repair Tickets for missing dummy data and valid dates.
