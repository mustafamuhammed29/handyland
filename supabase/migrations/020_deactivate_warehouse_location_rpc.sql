-- ============================================================================
-- Migration: 020_deactivate_warehouse_location_rpc.sql
-- Description: Private Atomic Stored Procedure for Safe Location Deactivation
--
-- Security & Concurrency Architecture:
-- 1. True ACID Concurrency & Serialization:
--    - Employs an exclusive row lock (`FOR UPDATE`) on the target `public.warehouse_locations` row.
--    - Concurrency Safety relative to Migration 019:
--      Migration 019 (`apply_part_stock_movement`) acquires a shared lock (`FOR SHARE`)
--      on source and destination `warehouse_locations` rows during all stock movements.
--      Because `FOR UPDATE` and `FOR SHARE` are mutually exclusive in PostgreSQL:
--        * If deactivation commits first, `is_active` becomes `false`. Any concurrent movement
--          acquiring `FOR SHARE` afterwards reads `is_active = false` and raises `*_LOCATION_NOT_ACTIVE`.
--        * If movement commits first, balances in `part_stock_locations` are updated. Deactivation
--          waiting for the lock then inspects the committed balances, observes non-zero stock,
--          and raises `WAREHOUSE_LOCATION_NOT_EMPTY`.
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

CREATE OR REPLACE FUNCTION public.deactivate_warehouse_location(
    p_location_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_loc RECORD;
    v_has_non_zero_stock BOOLEAN;
BEGIN
    -- ── 1. Validate Location ID Parameter ───────────────────────────────────
    IF p_location_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_LOCATION_ID';
    END IF;

    -- ── 2. Atomically Lock Target Location Row ──────────────────────────────
    -- This exclusive row lock serializes with Migration 019 shared locks (FOR SHARE).
    SELECT id, location_code, zone, rack, shelf, bin, description, is_active
    INTO v_loc
    FROM public.warehouse_locations
    WHERE id = p_location_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'WAREHOUSE_LOCATION_NOT_FOUND';
    END IF;

    -- ── 3. Idempotent Check: Return if Already Inactive ─────────────────────
    IF v_loc.is_active = false THEN
        RETURN jsonb_build_object(
            'id', v_loc.id,
            'location_code', v_loc.location_code,
            'zone', v_loc.zone,
            'rack', v_loc.rack,
            'shelf', v_loc.shelf,
            'bin', v_loc.bin,
            'description', v_loc.description,
            'is_active', false,
            'already_inactive', true
        );
    END IF;

    -- ── 4. Verify Zero Balances Across All Buckets ──────────────────────────
    SELECT EXISTS (
        SELECT 1
        FROM public.part_stock_locations
        WHERE warehouse_location_id = p_location_id
          AND (
              quantity_on_hand > 0 OR
              quantity_reserved > 0 OR
              quantity_defective > 0 OR
              quantity_inspection > 0
          )
    ) INTO v_has_non_zero_stock;

    IF v_has_non_zero_stock THEN
        RAISE EXCEPTION 'WAREHOUSE_LOCATION_NOT_EMPTY';
    END IF;

    -- ── 5. Mutate Location Status to Inactive ────────────────────────────────
    UPDATE public.warehouse_locations
    SET is_active = false,
        updated_at = NOW()
    WHERE id = p_location_id;

    -- ── 6. Return Sanitized Whitelist Payload ────────────────────────────────
    RETURN jsonb_build_object(
        'id', v_loc.id,
        'location_code', v_loc.location_code,
        'zone', v_loc.zone,
        'rack', v_loc.rack,
        'shelf', v_loc.shelf,
        'bin', v_loc.bin,
        'description', v_loc.description,
        'is_active', false,
        'already_inactive', false
    );
END;
$$;

-- ── 7. Privileges: Service-Role Only Execution ──────────────────────────────
REVOKE ALL ON FUNCTION public.deactivate_warehouse_location(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_warehouse_location(UUID) TO service_role;
