-- ============================================================================
-- Migration: 023_schema_drift_alignment.sql
-- Description: Schema Drift Alignment & Single Source of Truth for Warehouse Stock
--
-- Remediations:
-- 1. Enums: Add 'staff' to user_role and 'withdrawal' to transaction_type.
-- 2. Tables: Add missing public.repair_devices and public.repair_cases tables.
-- 3. Columns: Add missing fields in messages, message_replies, addresses,
--    accessories, and audit_logs.
-- 4. Inventory Single Source of Truth: Update public.get_inventory_stats()
--    to aggregate repair parts stock balances dynamically from
--    public.part_stock_locations instead of un-synchronized legacy repair_parts.stock.
-- ============================================================================

-- ============================================================================
-- 1. ENUM EXTENSIONS
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'user_role' AND e.enumlabel = 'staff'
    ) THEN
        ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'staff';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'transaction_type' AND e.enumlabel = 'withdrawal'
    ) THEN
        ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'withdrawal';
    END IF;
END $$;

-- ============================================================================
-- 2. MISSING TABLES: public.repair_devices & public.repair_cases
-- ============================================================================

-- 2.1. public.repair_devices (Used by repairController.js)
CREATE TABLE IF NOT EXISTS public.repair_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id TEXT UNIQUE,
    brand TEXT NOT NULL DEFAULT 'Unknown',
    model TEXT NOT NULL,
    image TEXT DEFAULT '',
    services JSONB DEFAULT '[]'::jsonb,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repair_devices_brand_model ON public.repair_devices(brand, model);
CREATE INDEX IF NOT EXISTS idx_repair_devices_is_visible ON public.repair_devices(is_visible);

ALTER TABLE public.repair_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read visible repair devices" ON public.repair_devices;
CREATE POLICY "Public read visible repair devices"
    ON public.repair_devices FOR SELECT
    USING (is_visible = true OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins manage repair devices" ON public.repair_devices;
CREATE POLICY "Admins manage repair devices"
    ON public.repair_devices FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 2.2. public.repair_cases (Used by repairArchiveController.js)
CREATE TABLE IF NOT EXISTS public.repair_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT,
    time TEXT,
    label_before TEXT DEFAULT '',
    label_after TEXT DEFAULT '',
    img_before TEXT DEFAULT '',
    img_after TEXT DEFAULT '',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repair_cases_category ON public.repair_cases(category);

ALTER TABLE public.repair_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read repair cases" ON public.repair_cases;
CREATE POLICY "Public read repair cases"
    ON public.repair_cases FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins manage repair cases" ON public.repair_cases;
CREATE POLICY "Admins manage repair cases"
    ON public.repair_cases FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ============================================================================
-- 3. MISSING COLUMNS ALIGNMENT
-- ============================================================================

-- 3.1. public.messages
ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.users(id),
    ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';

CREATE INDEX IF NOT EXISTS idx_messages_assigned_to ON public.messages(assigned_to);

-- 3.2. public.message_replies
ALTER TABLE public.message_replies
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id),
    ADD COLUMN IF NOT EXISTS is_internal_note BOOLEAN DEFAULT false;

-- 3.3. public.addresses
ALTER TABLE public.addresses
    ADD COLUMN IF NOT EXISTS state TEXT;

-- 3.4. public.accessories
ALTER TABLE public.accessories
    ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS num_reviews INT DEFAULT 0;

-- 3.5. public.audit_logs
ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.users(id),
    ADD COLUMN IF NOT EXISTS admin_email TEXT,
    ADD COLUMN IF NOT EXISTS payload JSONB;

-- ============================================================================
-- 4. INVENTORY SINGLE SOURCE OF TRUTH: public.get_inventory_stats()
-- ============================================================================

-- Replaces legacy direct repair_parts.stock aggregation with dynamic
-- aggregation over active location balances in part_stock_locations.
CREATE OR REPLACE FUNCTION public.get_inventory_stats()
RETURNS json AS $$
DECLARE
    result json;
    v_total_stock NUMERIC;
    v_total_value NUMERIC;
    v_low_stock_count INT;
    v_out_of_stock_count INT;
    v_total_items_sold INT;
    v_total_revenue NUMERIC;
BEGIN
    -- Authorization guard: only backend service_role can execute
    IF NOT (auth.role() = 'service_role') THEN
        RAISE EXCEPTION 'Access denied: service_role authorization required.'
            USING ERRCODE = '42501';
    END IF;

    -- 1. Aggregate inventory:
    --    - Products: direct stock column
    --    - Accessories: direct stock column
    --    - Repair Parts: aggregated active balance from part_stock_locations (source of truth)
    SELECT 
        COALESCE(SUM(stock), 0),
        COALESCE(SUM(stock * price), 0),
        COALESCE(COUNT(*) FILTER (WHERE stock <= min_stock AND stock > 0), 0),
        COALESCE(COUNT(*) FILTER (WHERE stock = 0), 0)
    INTO 
        v_total_stock,
        v_total_value,
        v_low_stock_count,
        v_out_of_stock_count
    FROM (
        SELECT stock, price, COALESCE(min_stock, 2) AS min_stock FROM public.products
        UNION ALL
        SELECT stock, price, COALESCE(min_stock, 5) AS min_stock FROM public.accessories
        UNION ALL
        SELECT 
            COALESCE(loc_stock.total_on_hand, 0) AS stock,
            rp.sell_price AS price,
            COALESCE(rp.min_stock, 2) AS min_stock
        FROM public.repair_parts rp
        LEFT JOIN (
            SELECT 
                psl.repair_part_id,
                SUM(psl.quantity_on_hand) AS total_on_hand
            FROM public.part_stock_locations psl
            INNER JOIN public.warehouse_locations wl ON wl.id = psl.warehouse_location_id
            WHERE wl.is_active = true
            GROUP BY psl.repair_part_id
        ) loc_stock ON loc_stock.repair_part_id = rp.id
        WHERE rp.status <> 'discontinued' AND rp.is_active = true
    ) combined;

    -- 2. Aggregate sales stats (Delivered Orders)
    SELECT 
        COALESCE(COUNT(*), 0),
        COALESCE(SUM(total_amount), 0)
    INTO 
        v_total_items_sold,
        v_total_revenue
    FROM public.orders
    WHERE status = 'delivered';

    -- 3. Return combined stats as a JSON object
    SELECT json_build_object(
        'totalStock', v_total_stock,
        'totalValue', v_total_value,
        'lowStockCount', v_low_stock_count,
        'outOfStockCount', v_out_of_stock_count,
        'totalItemsSold', v_total_items_sold,
        'totalRevenue', v_total_revenue
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_inventory_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_inventory_stats() TO service_role;
