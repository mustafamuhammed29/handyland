-- ============================================================
-- HandyLand: Initial Schema Migration
-- Converted from 34 Mongoose Models → PostgreSQL Tables
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('user', 'seller', 'admin');
CREATE TYPE user_provider AS ENUM ('local', 'google', 'facebook');
CREATE TYPE user_language AS ENUM ('de', 'en', 'ar', 'tr', 'ru', 'fa');
CREATE TYPE order_status AS ENUM ('pending','processing','shipped','delivered','cancelled','return_requested','refunded');
CREATE TYPE payment_method AS ENUM ('cash','card','paypal','stripe','klarna','giropay','sepa_debit','sofort','bank_transfer','wallet');
CREATE TYPE payment_status AS ENUM ('pending','paid','failed','refunded');
CREATE TYPE transaction_status AS ENUM ('pending','completed','failed','refunded');
CREATE TYPE transaction_type AS ENUM ('deposit','purchase','refund','credit','debit');
CREATE TYPE repair_status AS ENUM ('pending','received','diagnosing','repairing','testing','ready','completed','cancelled');
CREATE TYPE repair_service_type AS ENUM ('Mail-in','In-Store','On-Site');
CREATE TYPE warranty_status AS ENUM ('Active','Expired','Claimed','Voided');
CREATE TYPE warranty_item_type AS ENUM ('Repair','Product','Accessory');
CREATE TYPE refund_reason AS ENUM ('widerrufsrecht','defective','wrong_item','not_as_described','other');
CREATE TYPE refund_status AS ENUM ('pending','under_review','approved','rejected','processed');
CREATE TYPE message_status AS ENUM ('unread','read','replied','closed');
CREATE TYPE notification_type AS ENUM ('info','success','warning','error','alert');
CREATE TYPE coupon_discount_type AS ENUM ('percentage','fixed');
CREATE TYPE valuation_status AS ENUM ('pending','accepted','rejected');
CREATE TYPE saved_valuation_status AS ENUM ('active','expired','sold','pending_shipment','received','paid');
CREATE TYPE stock_reason AS ENUM ('Manual Correction','Restock','Return','Sale','System sync');
CREATE TYPE stock_item_model AS ENUM ('Product','Accessory','RepairPart');
CREATE TYPE purchase_order_status AS ENUM ('Draft','Sent','Partial','Received','Cancelled');

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    is_verified BOOLEAN DEFAULT false,
    phone VARCHAR(20),
    provider user_provider DEFAULT 'local',
    google_id TEXT,
    facebook_id TEXT,
    avatar TEXT,
    two_factor_secret TEXT,
    two_factor_enabled BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    login_attempts INT DEFAULT 0,
    lock_until TIMESTAMPTZ,
    balance NUMERIC(10,2) DEFAULT 0.00 CHECK (balance >= 0),
    loyalty_points INT DEFAULT 0,
    membership_level INT DEFAULT 1,
    notif_order_updates BOOLEAN DEFAULT true,
    notif_repair_status BOOLEAN DEFAULT true,
    notif_promotions BOOLEAN DEFAULT false,
    notif_newsletter BOOLEAN DEFAULT false,
    preferred_language user_language DEFAULT 'de',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADDRESSES
-- ============================================================
CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    country TEXT DEFAULT 'Germany',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUPPLIERS
-- ============================================================
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    street TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT,
    rating INT DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    reliability_score NUMERIC DEFAULT 100,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id TEXT UNIQUE, -- original MongoDB string ID
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price > 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock INT DEFAULT 2,
    sold INT DEFAULT 0 CHECK (sold >= 0),
    is_active BOOLEAN DEFAULT true,
    barcode TEXT UNIQUE,
    description TEXT,
    features TEXT[] DEFAULT '{}',
    image TEXT,
    images TEXT[] DEFAULT '{}',
    category TEXT,
    sub_category TEXT,
    brand TEXT,
    model TEXT,
    supplier_name TEXT,
    supplier_contact TEXT,
    cost_price NUMERIC(10,2) DEFAULT 0,
    condition TEXT,
    seller TEXT,
    battery TEXT,
    processor TEXT,
    color TEXT,
    display TEXT,
    storage TEXT,
    specs JSONB DEFAULT '{}',
    rating NUMERIC(3,2) DEFAULT 0,
    num_reviews INT DEFAULT 0,
    is_margin_scheme BOOLEAN DEFAULT false,
    seo_meta_title TEXT,
    seo_meta_description TEXT,
    seo_keywords TEXT,
    seo_canonical_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product IMEIs (embedded array → separate table)
CREATE TABLE public.product_imeis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available','sold','reserved','returned')),
    cost_price NUMERIC(10,2),
    date_added TIMESTAMPTZ DEFAULT NOW(),
    order_id UUID -- populated after orders table created
);

-- ============================================================
-- ACCESSORIES
-- ============================================================
CREATE TABLE public.accessories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id TEXT UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    sub_category TEXT,
    price NUMERIC(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    min_stock INT DEFAULT 5,
    sold INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    barcode TEXT UNIQUE,
    brand TEXT,
    model TEXT,
    supplier_name TEXT,
    supplier_contact TEXT,
    cost_price NUMERIC(10,2) DEFAULT 0,
    image TEXT,
    description TEXT,
    tag TEXT,
    battery TEXT,
    processor TEXT,
    color TEXT,
    display TEXT,
    storage TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DEVICE BLUEPRINTS (Valuation system)
-- ============================================================
CREATE TABLE public.device_blueprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model TEXT NOT NULL,
    brand TEXT NOT NULL,
    base_price NUMERIC(10,2) NOT NULL,
    image TEXT,
    valid_storages TEXT[] DEFAULT '{"128GB","256GB"}',
    storage_prices JSONB DEFAULT '{}',
    screen_hervorragend NUMERIC DEFAULT 1.0,
    screen_sehr_gut NUMERIC DEFAULT 0.9,
    screen_gut NUMERIC DEFAULT 0.75,
    screen_beschadigt NUMERIC DEFAULT 0.5,
    body_hervorragend NUMERIC DEFAULT 1.0,
    body_sehr_gut NUMERIC DEFAULT 0.95,
    body_gut NUMERIC DEFAULT 0.85,
    body_beschadigt NUMERIC DEFAULT 0.6,
    functional_multiplier NUMERIC DEFAULT 1.0,
    non_functional_multiplier NUMERIC DEFAULT 0.4,
    category TEXT DEFAULT 'Smartphone',
    active BOOLEAN DEFAULT true,
    price_research_last_updated TIMESTAMPTZ,
    price_research_source TEXT DEFAULT 'eBay.de Completed Listings',
    price_research_market_avg NUMERIC,
    price_research_previous_base NUMERIC,
    price_research_ebay_count INT,
    price_research_conservative NUMERIC,
    price_research_balanced NUMERIC,
    price_research_aggressive NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COUPONS
-- ============================================================
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type coupon_discount_type DEFAULT 'percentage',
    discount_value NUMERIC NOT NULL,
    min_order_value NUMERIC DEFAULT 0,
    max_discount NUMERIC,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    usage_limit INT,
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupon usage tracking (usedBy array → separate table)
CREATE TABLE public.coupon_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    email TEXT,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROMOTIONS
-- ============================================================
CREATE TABLE public.promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    description TEXT,
    image TEXT,
    link TEXT,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SHIPPING METHODS
-- ============================================================
CREATE TABLE public.shipping_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    estimated_days INT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CART
-- ============================================================
CREATE TABLE public.carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    last_reminder_sent_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID,
    accessory_id UUID,
    product_type TEXT NOT NULL CHECK (product_type IN ('Product','Accessory')),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    added_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WISHLIST
-- ============================================================
CREATE TABLE public.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    accessory_id UUID REFERENCES public.accessories(id),
    product_type TEXT CHECK (product_type IN ('Product','Accessory')),
    added_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id),
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
    tax NUMERIC(10,2) DEFAULT 0,
    shipping_fee NUMERIC(10,2) DEFAULT 0,
    shipping_method TEXT DEFAULT 'Standard',
    discount_amount NUMERIC(10,2) DEFAULT 0,
    coupon_code TEXT,
    applied_points INT DEFAULT 0,
    points_earned INT DEFAULT 0,
    status order_status DEFAULT 'pending',
    payment_method payment_method DEFAULT 'cash',
    payment_status payment_status DEFAULT 'pending',
    payment_id TEXT,
    payment_receipt TEXT,
    shipping_full_name TEXT NOT NULL,
    shipping_email TEXT NOT NULL,
    shipping_phone TEXT NOT NULL,
    shipping_street TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_zip TEXT NOT NULL,
    shipping_country TEXT DEFAULT 'Germany',
    notes TEXT,
    tracking_number TEXT,
    invoice_generated BOOLEAN DEFAULT false,
    invoice_generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID,
    accessory_id UUID,
    product_type TEXT NOT NULL CHECK (product_type IN ('Product','Accessory')),
    name TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 1),
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    image TEXT
);

CREATE TABLE public.order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    order_id UUID REFERENCES public.orders(id),
    amount BIGINT NOT NULL, -- stored in cents
    currency TEXT DEFAULT 'eur' CHECK (currency IN ('eur','usd','gbp')),
    status transaction_status DEFAULT 'pending',
    type transaction_type DEFAULT 'purchase',
    payment_method TEXT NOT NULL,
    stripe_payment_id TEXT,
    stripe_customer_id TEXT,
    receipt_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REFUND REQUESTS
-- ============================================================
CREATE TABLE public.refund_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    order_id UUID NOT NULL REFERENCES public.orders(id),
    reason refund_reason NOT NULL,
    description TEXT,
    within_withdrawal_period BOOLEAN DEFAULT false,
    customer_confirmed_return BOOLEAN DEFAULT false,
    status refund_status DEFAULT 'pending',
    refund_amount NUMERIC(10,2) DEFAULT 0,
    admin_notes TEXT,
    stripe_refund_id TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.refund_request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    refund_request_id UUID NOT NULL REFERENCES public.refund_requests(id) ON DELETE CASCADE,
    product_id UUID,
    accessory_id UUID,
    product_type TEXT DEFAULT 'Product',
    name TEXT,
    quantity INT,
    price NUMERIC(10,2)
);

-- ============================================================
-- REPAIR TICKETS
-- ============================================================
CREATE TABLE public.repair_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id TEXT UNIQUE,
    user_id UUID REFERENCES public.users(id),
    device TEXT NOT NULL,
    issue TEXT NOT NULL,
    status repair_status DEFAULT 'pending',
    estimated_cost NUMERIC(10,2),
    appointment_date TIMESTAMPTZ,
    service_type repair_service_type DEFAULT 'In-Store',
    notes TEXT,
    technician_notes TEXT,
    guest_name TEXT,
    guest_email TEXT,
    guest_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.repair_ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.repair_tickets(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('customer','admin')),
    text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.repair_ticket_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.repair_tickets(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REPAIR PARTS
-- ============================================================
CREATE TABLE public.repair_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category TEXT,
    compatible_devices TEXT[] DEFAULT '{}',
    stock INT DEFAULT 0 CHECK (stock >= 0),
    min_stock INT DEFAULT 2,
    cost_price NUMERIC(10,2) DEFAULT 0,
    sell_price NUMERIC(10,2) DEFAULT 0,
    supplier_id UUID REFERENCES public.suppliers(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOANER PHONES
-- ============================================================
CREATE TABLE public.loaner_phones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    imei TEXT UNIQUE,
    status TEXT DEFAULT 'available' CHECK (status IN ('available','loaned','maintenance')),
    loaned_to UUID REFERENCES public.users(id),
    loaned_at TIMESTAMPTZ,
    expected_return TIMESTAMPTZ,
    repair_ticket_id UUID REFERENCES public.repair_tickets(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WARRANTIES
-- ============================================================
CREATE TABLE public.warranties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warranty_code TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT DEFAULT '',
    item_type warranty_item_type NOT NULL,
    item_name TEXT NOT NULL,
    imei_or_serial TEXT DEFAULT '',
    supplier_name TEXT DEFAULT '',
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_days INT NOT NULL DEFAULT 90,
    end_date TIMESTAMPTZ NOT NULL,
    status warranty_status DEFAULT 'Active',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    product_id UUID REFERENCES public.products(id),
    accessory_id UUID REFERENCES public.accessories(id),
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MESSAGES (Contact / Support)
-- ============================================================
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    status message_status DEFAULT 'unread',
    is_archived BOOLEAN DEFAULT false,
    initiated_by_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.message_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VALUATIONS
-- ============================================================
CREATE TABLE public.valuations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    device_name TEXT NOT NULL,
    brand TEXT,
    storage TEXT,
    battery_health TEXT,
    condition TEXT NOT NULL,
    estimated_value NUMERIC(10,2) NOT NULL,
    include_accessories BOOLEAN DEFAULT false,
    status valuation_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SAVED VALUATIONS (Quotes)
-- ============================================================
CREATE TABLE public.saved_valuations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    device TEXT NOT NULL,
    specs TEXT NOT NULL,
    condition TEXT NOT NULL,
    quote_reference TEXT UNIQUE,
    estimated_value NUMERIC(10,2) NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
    status saved_valuation_status DEFAULT 'active',
    is_quote BOOLEAN DEFAULT false,
    payment_iban TEXT,
    payment_bank_name TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_postal_code TEXT,
    device_imei TEXT,
    device_serial TEXT,
    digital_signature TEXT,
    purchase_agreement_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STOCK HISTORY
-- ============================================================
CREATE TABLE public.stock_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL,
    item_model stock_item_model NOT NULL,
    item_name TEXT NOT NULL,
    barcode TEXT,
    user_id UUID NOT NULL REFERENCES public.users(id),
    user_name TEXT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    change_amount INT NOT NULL,
    reason stock_reason NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PURCHASE ORDERS
-- ============================================================
CREATE TABLE public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number TEXT UNIQUE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    total_amount NUMERIC(10,2) DEFAULT 0,
    status purchase_order_status DEFAULT 'Draft',
    expected_delivery_date TIMESTAMPTZ,
    actual_delivery_date TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_name TEXT,
    sku TEXT,
    quantity INT NOT NULL CHECK (quantity >= 1),
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2)
);

-- ============================================================
-- PAGES (CMS)
-- ============================================================
CREATE TABLE public.pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT,
    content TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSLATIONS
-- ============================================================
CREATE TABLE public.translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL,
    language TEXT NOT NULL,
    value TEXT,
    namespace TEXT DEFAULT 'common',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(key, language, namespace)
);

-- ============================================================
-- EMAIL TEMPLATES
-- ============================================================
CREATE TABLE public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT,
    body_text TEXT,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    group TEXT DEFAULT 'general',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    resource TEXT,
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- QUESTIONS (FAQ)
-- ============================================================
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT,
    category TEXT,
    is_published BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FK: product_imeis order_id (add after orders table)
-- ============================================================
ALTER TABLE public.product_imeis
    ADD CONSTRAINT fk_imei_order
    FOREIGN KEY (order_id) REFERENCES public.orders(id);
