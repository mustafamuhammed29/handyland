-- ============================================================================
-- Migration: 018_repair_parts_warehouse_foundation.sql
-- Description: Warehouse Schema Foundation for Internal Repair-Parts Inventory
--
-- Architectural Foundations:
-- 1. Strict Domain Separation:
--    - Internal repair-parts inventory is completely isolated from:
--      * public.products & public.product_imeis (customer retail devices for sale)
--      * public.accessories (customer checkout accessories)
--      * Storefront catalog, search, SEO, and public customer APIs.
--    - The existing `public.repair_parts` table remains the canonical catalog for
--      repair parts; it is safely extended with metadata without breaking legacy fields.
--
-- 2. Physical Locations vs. Stock Balances vs. Immutable Ledger:
--    - `public.warehouse_locations`: Physical rack/shelf/bin addresses.
--    - `public.part_stock_locations`: Authoritative per-location balances
--      (quantity_on_hand, quantity_reserved, quantity_defective, quantity_inspection).
--      Available quantity is derived dynamically:
--      quantity_on_hand - quantity_reserved - quantity_defective - quantity_inspection.
--    - `public.part_stock_movements`: Dedicated append-only ledger for all repair part
--      quantity mutations (RECEIVE, ADJUSTMENT_IN, ADJUSTMENT_OUT, RESERVE, RELEASE,
--      CONSUME, RETURN_FROM_REPAIR, TRANSFER, DAMAGE, SUPPLIER_RETURN).
--
-- 3. Zero-Trust Access Control (RLS & Privileges):
--    - Row Level Security (RLS) is ENABLED on all new tables with default-deny.
--    - All privileges are revoked from PUBLIC, anon, and authenticated roles.
--    - Access is granted exclusively to `service_role` for trusted backend operations.
--    - No public RPC or client-accessible stored procedure is created in this phase.
--
-- 4. Audit & Immutability Enforcement:
--    - Movement records are strictly append-only; updates and deletions are blocked
--      by an explicit database trigger for all roles (including service_role).
--    - All foreign keys on movements use ON DELETE RESTRICT to preserve audit trails.
--
-- 5. Safe Rollback Guidance (Comments Only):
--    - Never drop live warehouse or repair tables in a production environment.
--    - First stop any backend features/workers interacting with warehouse tables.
--    - Reconcile and archive physical balances and audit movements.
--    - Only then use a separately reviewed cleanup migration if removal is necessary.
--    - Do NOT use DROP TABLE ... CASCADE as rollback guidance.
-- ============================================================================

-- ============================================================================
-- 1. EXTEND CANONICAL CATALOG: public.repair_parts
-- ============================================================================

ALTER TABLE public.repair_parts
    ADD COLUMN IF NOT EXISTS brand text NULL,
    ADD COLUMN IF NOT EXISTS device_family text NULL,
    ADD COLUMN IF NOT EXISTS part_type text NULL,
    ADD COLUMN IF NOT EXISTS quality text NULL,
    ADD COLUMN IF NOT EXISTS barcode text NULL,
    ADD COLUMN IF NOT EXISTS image_url text NULL,
    ADD COLUMN IF NOT EXISTS notes text NULL,
    ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Status Check Constraint (idempotent block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'repair_parts_status_check'
    ) THEN
        ALTER TABLE public.repair_parts
            ADD CONSTRAINT repair_parts_status_check
            CHECK (status IN ('active', 'discontinued'));
    END IF;
END $$;

-- Barcode Partial Unique Index (only unique when non-null and non-empty)
CREATE UNIQUE INDEX IF NOT EXISTS idx_repair_parts_barcode_unique
    ON public.repair_parts (barcode)
    WHERE barcode IS NOT NULL AND btrim(barcode) <> '';

-- Non-destructive query optimization indexes on repair_parts
CREATE INDEX IF NOT EXISTS idx_repair_parts_brand_family
    ON public.repair_parts (brand, device_family)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_repair_parts_part_type
    ON public.repair_parts (part_type)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_repair_parts_status
    ON public.repair_parts (status);

-- ============================================================================
-- 2. PHYSICAL LOCATIONS: public.warehouse_locations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.warehouse_locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    location_code text NOT NULL,
    zone text NOT NULL,
    rack text NULL,
    shelf text NULL,
    bin text NULL,
    description text NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- ── Integrity Constraints ───────────────────────────────────────────────
    CONSTRAINT warehouse_locations_location_code_unique
        UNIQUE (location_code),

    CONSTRAINT warehouse_locations_location_code_not_empty
        CHECK (btrim(location_code) <> ''),

    CONSTRAINT warehouse_locations_zone_not_empty
        CHECK (btrim(zone) <> '')
);

-- Indexes for active location and zone filtering
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_zone_active
    ON public.warehouse_locations (zone, is_active);

CREATE INDEX IF NOT EXISTS idx_warehouse_locations_active
    ON public.warehouse_locations (is_active)
    WHERE is_active = true;

-- Auto-update updated_at trigger for warehouse_locations
DROP TRIGGER IF EXISTS trg_warehouse_locations_updated_at ON public.warehouse_locations;
CREATE TRIGGER trg_warehouse_locations_updated_at
    BEFORE UPDATE ON public.warehouse_locations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 3. PER-LOCATION STOCK BALANCES: public.part_stock_locations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.part_stock_locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    repair_part_id uuid NOT NULL REFERENCES public.repair_parts(id) ON DELETE RESTRICT,
    warehouse_location_id uuid NOT NULL REFERENCES public.warehouse_locations(id) ON DELETE RESTRICT,
    quantity_on_hand integer NOT NULL DEFAULT 0,
    quantity_reserved integer NOT NULL DEFAULT 0,
    quantity_defective integer NOT NULL DEFAULT 0,
    quantity_inspection integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- ── Integrity Constraints ───────────────────────────────────────────────
    -- 1. Exactly one balance record per part and location combination
    CONSTRAINT part_stock_locations_part_location_unique
        UNIQUE (repair_part_id, warehouse_location_id),

    -- 2. Individual non-negative constraints for all physical buckets
    CONSTRAINT part_stock_locations_quantities_non_negative
        CHECK (
            quantity_on_hand >= 0 AND
            quantity_reserved >= 0 AND
            quantity_defective >= 0 AND
            quantity_inspection >= 0
        ),

    -- 3. Physical Partition Rule:
    --    - `quantity_on_hand` is the total physical quantity at this location.
    --    - `quantity_reserved`, `quantity_defective`, and `quantity_inspection`
    --      are mutually accounted non-overlapping portions of that physical total.
    --    - `quantity_defective` and `quantity_inspection` are tracked portions of
    --      the physical quantity still held at that location.
    --    - A final DAMAGE or SUPPLIER_RETURN movement will later decrease
    --      `quantity_on_hand` through a reviewed backend-only atomic movement operation.
    --    - This foundation migration intentionally creates no balance mutation function.
    --    - Available quantity is derived dynamically and never stored:
    --      quantity_on_hand - quantity_reserved - quantity_defective - quantity_inspection.
    CONSTRAINT part_stock_locations_partition_lte_on_hand
        CHECK (
            quantity_reserved + quantity_defective + quantity_inspection <= quantity_on_hand
        )
);

-- Indexes for balance and threshold lookups
CREATE INDEX IF NOT EXISTS idx_part_stock_locations_part
    ON public.part_stock_locations (repair_part_id);

CREATE INDEX IF NOT EXISTS idx_part_stock_locations_location
    ON public.part_stock_locations (warehouse_location_id);

CREATE INDEX IF NOT EXISTS idx_part_stock_locations_on_hand
    ON public.part_stock_locations (repair_part_id, quantity_on_hand);

-- Auto-update updated_at trigger for part_stock_locations
DROP TRIGGER IF EXISTS trg_part_stock_locations_updated_at ON public.part_stock_locations;
CREATE TRIGGER trg_part_stock_locations_updated_at
    BEFORE UPDATE ON public.part_stock_locations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 4. IMMUTABLE MOVEMENT LEDGER: public.part_stock_movements
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.part_stock_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    repair_part_id uuid NOT NULL REFERENCES public.repair_parts(id) ON DELETE RESTRICT,
    movement_type text NOT NULL,
    quantity integer NOT NULL,
    source_location_id uuid NULL REFERENCES public.warehouse_locations(id) ON DELETE RESTRICT,
    destination_location_id uuid NULL REFERENCES public.warehouse_locations(id) ON DELETE RESTRICT,
    repair_ticket_id uuid NULL REFERENCES public.repair_tickets(id) ON DELETE RESTRICT,
    purchase_order_id uuid NULL REFERENCES public.purchase_orders(id) ON DELETE RESTRICT,
    performed_by uuid NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    reason text NULL,
    notes text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),

    -- ── Integrity Constraints ───────────────────────────────────────────────
    CONSTRAINT part_stock_movements_quantity_strictly_positive
        CHECK (quantity > 0),

    CONSTRAINT part_stock_movements_movement_type_valid
        CHECK (movement_type IN (
            'RECEIVE',
            'ADJUSTMENT_IN',
            'ADJUSTMENT_OUT',
            'RESERVE',
            'RELEASE',
            'CONSUME',
            'RETURN_FROM_REPAIR',
            'TRANSFER',
            'DAMAGE',
            'SUPPLIER_RETURN'
        )),

    -- ── Source / Destination Rules per Movement Type ────────────────────────
    -- Semantic Rules:
    -- - TRANSFER is the only movement type for an internal move between physical
    --   warehouse locations, including moves into dedicated inspection, returns,
    --   quarantine, or defective-holding locations.
    -- - DAMAGE represents final write-off/removal from stock and therefore has a
    --   source location only and no destination.
    -- - SUPPLIER_RETURN represents physical removal/return to a supplier and
    --   therefore has a source location only and no destination.
    -- - This migration intentionally does not add special movement types such as
    --   MOVE_TO_INSPECTION or MOVE_TO_RETURNS; those states are represented through
    --   warehouse locations plus the per-location balance buckets.
    CONSTRAINT part_stock_movements_location_integrity_check
        CHECK (
            CASE
                -- RECEIVE: requires destination, no source
                WHEN movement_type = 'RECEIVE' THEN
                    source_location_id IS NULL AND destination_location_id IS NOT NULL

                -- ADJUSTMENT_IN: requires destination, no source
                WHEN movement_type = 'ADJUSTMENT_IN' THEN
                    source_location_id IS NULL AND destination_location_id IS NOT NULL

                -- ADJUSTMENT_OUT: requires source, no destination
                WHEN movement_type = 'ADJUSTMENT_OUT' THEN
                    source_location_id IS NOT NULL AND destination_location_id IS NULL

                -- RESERVE: requires source, no destination
                WHEN movement_type = 'RESERVE' THEN
                    source_location_id IS NOT NULL AND destination_location_id IS NULL

                -- RELEASE: requires destination, no source
                WHEN movement_type = 'RELEASE' THEN
                    source_location_id IS NULL AND destination_location_id IS NOT NULL

                -- CONSUME: requires source, no destination
                WHEN movement_type = 'CONSUME' THEN
                    source_location_id IS NOT NULL AND destination_location_id IS NULL

                -- RETURN_FROM_REPAIR: requires destination, no source
                WHEN movement_type = 'RETURN_FROM_REPAIR' THEN
                    source_location_id IS NULL AND destination_location_id IS NOT NULL

                -- TRANSFER: requires both source and destination, and they must differ
                WHEN movement_type = 'TRANSFER' THEN
                    source_location_id IS NOT NULL AND destination_location_id IS NOT NULL AND source_location_id <> destination_location_id

                -- DAMAGE: requires source, no destination
                WHEN movement_type = 'DAMAGE' THEN
                    source_location_id IS NOT NULL AND destination_location_id IS NULL

                -- SUPPLIER_RETURN: requires source, no destination
                WHEN movement_type = 'SUPPLIER_RETURN' THEN
                    source_location_id IS NOT NULL AND destination_location_id IS NULL

                ELSE FALSE
            END
        ),

    -- ── Repair Ticket Context Rule per Movement Type ─────────────────────────
    CONSTRAINT part_stock_movements_repair_ticket_context_check
        CHECK (
            CASE
                -- Repair-specific lifecycle movements require an explicit repair_ticket_id
                WHEN movement_type IN ('RESERVE', 'RELEASE', 'CONSUME', 'RETURN_FROM_REPAIR') THEN
                    repair_ticket_id IS NOT NULL

                -- General inventory operations must not have a repair_ticket_id attached
                WHEN movement_type IN ('RECEIVE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'TRANSFER', 'DAMAGE', 'SUPPLIER_RETURN') THEN
                    repair_ticket_id IS NULL

                ELSE FALSE
            END
        )
);

-- Indexes for movement history, audit tracking, and relation lookups
CREATE INDEX IF NOT EXISTS idx_part_stock_movements_part_created
    ON public.part_stock_movements (repair_part_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_part_stock_movements_source_created
    ON public.part_stock_movements (source_location_id, created_at DESC)
    WHERE source_location_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_part_stock_movements_dest_created
    ON public.part_stock_movements (destination_location_id, created_at DESC)
    WHERE destination_location_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_part_stock_movements_type_created
    ON public.part_stock_movements (movement_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_part_stock_movements_repair_ticket
    ON public.part_stock_movements (repair_ticket_id)
    WHERE repair_ticket_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_part_stock_movements_po
    ON public.part_stock_movements (purchase_order_id)
    WHERE purchase_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_part_stock_movements_performer
    ON public.part_stock_movements (performed_by)
    WHERE performed_by IS NOT NULL;

-- ── Immutability Guard Trigger Function & Trigger ───────────────────────────
CREATE FUNCTION public.prevent_part_stock_movement_update_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    RAISE EXCEPTION 'part_stock_movements records are immutable and cannot be updated or deleted. Corrections must be recorded as new counter-movements.';
END;
$$;

DROP TRIGGER IF EXISTS trg_part_stock_movements_prevent_mutation ON public.part_stock_movements;
CREATE TRIGGER trg_part_stock_movements_prevent_mutation
    BEFORE UPDATE OR DELETE ON public.part_stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_part_stock_movement_update_delete();

-- ============================================================================
-- 5. ROW LEVEL SECURITY & PERMISSIONS
-- ============================================================================

-- Enable Row Level Security on all newly created tables (default deny)
ALTER TABLE public.warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_stock_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_stock_movements ENABLE ROW LEVEL SECURITY;

-- Explicitly revoke all permissions from public, anon, and authenticated roles
REVOKE ALL ON TABLE public.warehouse_locations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.part_stock_locations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.part_stock_movements FROM PUBLIC, anon, authenticated;

-- Grant table management exclusively to service_role for backend operations
GRANT ALL ON TABLE public.warehouse_locations TO service_role;
GRANT ALL ON TABLE public.part_stock_locations TO service_role;
GRANT ALL ON TABLE public.part_stock_movements TO service_role;
