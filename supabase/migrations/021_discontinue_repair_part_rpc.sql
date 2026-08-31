-- ============================================================================
-- Migration: 021_discontinue_repair_part_rpc.sql
-- Description: Private Atomic Stored Procedure for Safe Repair Part Discontinuation
--
-- Security & Concurrency Architecture:
-- 1. True ACID Concurrency & Serialization:
--    - Employs an exclusive row lock (`FOR UPDATE`) on the target `public.repair_parts` row.
--    - Concurrency Safety relative to Migration 019:
--      Migration 019 (`apply_part_stock_movement`) acquires a shared lock (`FOR SHARE`)
--      on target `public.repair_parts` row during all stock movements.
--      Because `FOR UPDATE` and `FOR SHARE` are mutually exclusive in PostgreSQL:
--        * If discontinuation commits first, `status` becomes `'discontinued'` and `is_active`
--          becomes `false`. Any concurrent movement acquiring `FOR SHARE` afterwards reads
--          `is_active = false OR status = 'discontinued'` and raises `PART_NOT_ACTIVE`.
--        * If movement commits first, balances in `part_stock_locations` are updated. Discontinuation
--          waiting for the lock then inspects the committed balances, observes non-zero stock,
--          and raises `WAREHOUSE_PART_HAS_STOCK`.
--
-- 2. Strict Zero-Trust Access Control (Service-Role Only):
--    - Execution is explicitly revoked from PUBLIC, anon, and authenticated.
--    - Execution is granted exclusively to `service_role`.
--    - Uses default PostgreSQL SECURITY INVOKER execution mode with a pinned `public` search_path.
--
-- Safe Rollback Guidance (Comments Only):
-- - Forward-only safe rollback: drop or replace the function via a future reviewed migration.
-- - Never use DROP TABLE or CASCADE commands on production databases.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.discontinue_repair_part(
    p_part_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_part RECORD;
    v_has_stock BOOLEAN;
BEGIN
    -- ── 1. Validate Part ID Parameter ───────────────────────────────────────
    IF p_part_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_PART_ID';
    END IF;

    -- ── 2. Atomically Lock Target Repair Part Row ───────────────────────────
    -- This exclusive row lock serializes with Migration 019 shared locks (FOR SHARE).
    SELECT id, name, sku, category, compatible_devices, brand, device_family,
           part_type, quality, barcode, image_url, status, is_active, min_stock
    INTO v_part
    FROM public.repair_parts
    WHERE id = p_part_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'WAREHOUSE_PART_NOT_FOUND';
    END IF;

    -- ── 3. Idempotent Check: Return if Already Discontinued ─────────────────
    IF v_part.status = 'discontinued' OR v_part.is_active = false THEN
        RETURN jsonb_build_object(
            'id', v_part.id,
            'name', v_part.name,
            'sku', v_part.sku,
            'category', v_part.category,
            'compatible_devices', v_part.compatible_devices,
            'brand', v_part.brand,
            'device_family', v_part.device_family,
            'part_type', v_part.part_type,
            'quality', v_part.quality,
            'barcode', v_part.barcode,
            'image_url', v_part.image_url,
            'status', 'discontinued',
            'is_active', false,
            'min_stock', v_part.min_stock,
            'already_discontinued', true
        );
    END IF;

    -- ── 4. Verify Zero Balances Across All Warehouse Locations ───────────────
    SELECT EXISTS (
        SELECT 1
        FROM public.part_stock_locations
        WHERE repair_part_id = p_part_id
          AND (
              quantity_on_hand > 0 OR
              quantity_reserved > 0 OR
              quantity_defective > 0 OR
              quantity_inspection > 0
          )
    ) INTO v_has_stock;

    IF v_has_stock THEN
        RAISE EXCEPTION 'WAREHOUSE_PART_HAS_STOCK';
    END IF;

    -- ── 5. Atomically Mutate Status to Discontinued ─────────────────────────
    UPDATE public.repair_parts
    SET status = 'discontinued',
        is_active = false,
        updated_at = NOW()
    WHERE id = p_part_id;

    -- ── 6. Return Sanitized Whitelist Payload ────────────────────────────────
    RETURN jsonb_build_object(
        'id', v_part.id,
        'name', v_part.name,
        'sku', v_part.sku,
        'category', v_part.category,
        'compatible_devices', v_part.compatible_devices,
        'brand', v_part.brand,
        'device_family', v_part.device_family,
        'part_type', v_part.part_type,
        'quality', v_part.quality,
        'barcode', v_part.barcode,
        'image_url', v_part.image_url,
        'status', 'discontinued',
        'is_active', false,
        'min_stock', v_part.min_stock,
        'already_discontinued', false
    );
END;
$$;

-- ── 7. Privileges: Service-Role Only Execution ──────────────────────────────
REVOKE ALL ON FUNCTION public.discontinue_repair_part(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.discontinue_repair_part(UUID) TO service_role;
