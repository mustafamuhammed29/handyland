-- ============================================================================
-- Migration: 019_apply_part_stock_movement_rpc.sql
-- Description: Private Atomic Stored Procedure for Warehouse Stock Movements
--
-- Security & Operational Architecture:
-- 1. True ACID Transactionality:
--    - Encapsulates physical balance verification, row locking, balance mutation,
--      and immutable ledger record insertion within a single database transaction.
--    - Employs deterministic row-locking (LEAST / GREATEST UUID order) to prevent
--      deadlocks during concurrent bi-directional TRANSFER operations.
--
-- 2. Strict Domain & Type Constraints:
--    - Phase 1B restricts movement types exclusively to:
--      RECEIVE, ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER, DAMAGE, SUPPLIER_RETURN.
--    - Enforces availability check (`available = on_hand - reserved - defective - inspection`)
--      before any quantity decrement.
--    - Validates active status for repair parts and warehouse locations under lock.
--
-- 3. Zero-Trust Access Control (Service-Role Only):
--    - Function execution is explicitly revoked from PUBLIC, anon, and authenticated.
--    - Execution is granted exclusively to `service_role`.
--    - Uses default PostgreSQL SECURITY INVOKER execution mode with a pinned,
--      safe search_path (`public`) without privilege escalation.
--
-- Safe Rollback Guidance (Comments Only):
-- - Do not drop this function in a live production system while movements are active.
-- - First stop all backend warehouse endpoints calling this RPC.
-- - Use a separately reviewed forward migration to drop or replace the function if needed.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.apply_part_stock_movement(
    p_repair_part_id UUID,
    p_movement_type TEXT,
    p_quantity INT,
    p_source_location_id UUID DEFAULT NULL,
    p_destination_location_id UUID DEFAULT NULL,
    p_performed_by UUID DEFAULT NULL,
    p_reason TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_part_active BOOLEAN;
    v_part_status TEXT;
    v_source_active BOOLEAN;
    v_dest_active BOOLEAN;

    -- Source balance variables
    v_src_on_hand INT;
    v_src_reserved INT;
    v_src_defective INT;
    v_src_inspection INT;
    v_src_available INT;
    v_src_final_available INT := NULL;

    -- Destination balance variables
    v_dst_on_hand INT;
    v_dst_reserved INT;
    v_dst_defective INT;
    v_dst_inspection INT;
    v_dst_final_available INT := NULL;

    -- Movement record return variables
    v_movement_id UUID;
    v_created_at TIMESTAMPTZ;
BEGIN
    -- ── 1. Validate Movement Type (Phase 1B supported types) ─────────────────
    IF p_movement_type NOT IN (
        'RECEIVE',
        'ADJUSTMENT_IN',
        'ADJUSTMENT_OUT',
        'TRANSFER',
        'DAMAGE',
        'SUPPLIER_RETURN'
    ) THEN
        RAISE EXCEPTION 'UNSUPPORTED_MOVEMENT_TYPE';
    END IF;

    -- ── 2. Validate Quantity ────────────────────────────────────────────────
    IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 100000 THEN
        RAISE EXCEPTION 'INVALID_QUANTITY';
    END IF;

    -- ── 3. Validate Source and Destination Locations per Movement Type ───────
    IF p_movement_type IN ('RECEIVE', 'ADJUSTMENT_IN') THEN
        IF p_destination_location_id IS NULL OR p_source_location_id IS NOT NULL THEN
            RAISE EXCEPTION 'INVALID_LOCATION_COMBINATION';
        END IF;
    ELSIF p_movement_type IN ('ADJUSTMENT_OUT', 'DAMAGE', 'SUPPLIER_RETURN') THEN
        IF p_source_location_id IS NULL OR p_destination_location_id IS NOT NULL THEN
            RAISE EXCEPTION 'INVALID_LOCATION_COMBINATION';
        END IF;
    ELSIF p_movement_type = 'TRANSFER' THEN
        IF p_source_location_id IS NULL
           OR p_destination_location_id IS NULL
           OR p_source_location_id = p_destination_location_id THEN
            RAISE EXCEPTION 'INVALID_LOCATION_COMBINATION';
        END IF;
    END IF;

    -- ── 4. Validate Reason Requirements ─────────────────────────────────────
    IF p_movement_type IN ('ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'DAMAGE', 'SUPPLIER_RETURN') THEN
        IF p_reason IS NULL OR btrim(p_reason) = '' THEN
            RAISE EXCEPTION 'REASON_REQUIRED';
        END IF;
    END IF;

    -- ── 5. Validate Canonical Repair Part (Active & Non-Discontinued) ────────
    SELECT is_active, status
    INTO v_part_active, v_part_status
    FROM public.repair_parts
    WHERE id = p_repair_part_id
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'PART_NOT_FOUND';
    END IF;

    IF v_part_active = false OR v_part_status = 'discontinued' THEN
        RAISE EXCEPTION 'PART_NOT_ACTIVE';
    END IF;

    -- ── 6. Validate Warehouse Locations ─────────────────────────────────────
    IF p_source_location_id IS NOT NULL THEN
        SELECT is_active
        INTO v_source_active
        FROM public.warehouse_locations
        WHERE id = p_source_location_id
        FOR SHARE;

        IF NOT FOUND OR v_source_active = false THEN
            RAISE EXCEPTION 'SOURCE_LOCATION_NOT_ACTIVE';
        END IF;
    END IF;

    IF p_destination_location_id IS NOT NULL THEN
        SELECT is_active
        INTO v_dest_active
        FROM public.warehouse_locations
        WHERE id = p_destination_location_id
        FOR SHARE;

        IF NOT FOUND OR v_dest_active = false THEN
            RAISE EXCEPTION 'DESTINATION_LOCATION_NOT_ACTIVE';
        END IF;
    END IF;

    -- ── 7. Atomically Lock Balances & Apply Mutations ────────────────────────

    -- Case A: TRANSFER (both source and destination involved)
    IF p_movement_type = 'TRANSFER' THEN
        -- Ensure destination balance row exists atomically
        INSERT INTO public.part_stock_locations (
            repair_part_id, warehouse_location_id, quantity_on_hand, quantity_reserved, quantity_defective, quantity_inspection
        ) VALUES (
            p_repair_part_id, p_destination_location_id, 0, 0, 0, 0
        ) ON CONFLICT (repair_part_id, warehouse_location_id) DO NOTHING;

        -- Lock rows in deterministic UUID order to eliminate deadlock hazard
        IF p_source_location_id < p_destination_location_id THEN
            SELECT quantity_on_hand, quantity_reserved, quantity_defective, quantity_inspection
            INTO v_src_on_hand, v_src_reserved, v_src_defective, v_src_inspection
            FROM public.part_stock_locations
            WHERE repair_part_id = p_repair_part_id AND warehouse_location_id = p_source_location_id
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'SOURCE_BALANCE_NOT_FOUND';
            END IF;

            SELECT quantity_on_hand, quantity_reserved, quantity_defective, quantity_inspection
            INTO v_dst_on_hand, v_dst_reserved, v_dst_defective, v_dst_inspection
            FROM public.part_stock_locations
            WHERE repair_part_id = p_repair_part_id AND warehouse_location_id = p_destination_location_id
            FOR UPDATE;
        ELSE
            SELECT quantity_on_hand, quantity_reserved, quantity_defective, quantity_inspection
            INTO v_dst_on_hand, v_dst_reserved, v_dst_defective, v_dst_inspection
            FROM public.part_stock_locations
            WHERE repair_part_id = p_repair_part_id AND warehouse_location_id = p_destination_location_id
            FOR UPDATE;

            SELECT quantity_on_hand, quantity_reserved, quantity_defective, quantity_inspection
            INTO v_src_on_hand, v_src_reserved, v_src_defective, v_src_inspection
            FROM public.part_stock_locations
            WHERE repair_part_id = p_repair_part_id AND warehouse_location_id = p_source_location_id
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'SOURCE_BALANCE_NOT_FOUND';
            END IF;
        END IF;

        -- Verify available stock at source
        v_src_available := v_src_on_hand - v_src_reserved - v_src_defective - v_src_inspection;
        IF v_src_available < p_quantity THEN
            RAISE EXCEPTION 'INSUFFICIENT_AVAILABLE_STOCK';
        END IF;

        -- Mutate balances
        UPDATE public.part_stock_locations
        SET quantity_on_hand = quantity_on_hand - p_quantity
        WHERE repair_part_id = p_repair_part_id AND warehouse_location_id = p_source_location_id;

        UPDATE public.part_stock_locations
        SET quantity_on_hand = quantity_on_hand + p_quantity
        WHERE repair_part_id = p_repair_part_id AND warehouse_location_id = p_destination_location_id;

        v_src_final_available := v_src_available - p_quantity;
        v_dst_final_available := (v_dst_on_hand + p_quantity) - v_dst_reserved - v_dst_defective - v_dst_inspection;

    -- Case B: Inward Operations (RECEIVE, ADJUSTMENT_IN)
    ELSIF p_movement_type IN ('RECEIVE', 'ADJUSTMENT_IN') THEN
        -- Ensure destination balance row exists atomically
        INSERT INTO public.part_stock_locations (
            repair_part_id, warehouse_location_id, quantity_on_hand, quantity_reserved, quantity_defective, quantity_inspection
        ) VALUES (
            p_repair_part_id, p_destination_location_id, 0, 0, 0, 0
        ) ON CONFLICT (repair_part_id, warehouse_location_id) DO NOTHING;

        SELECT quantity_on_hand, quantity_reserved, quantity_defective, quantity_inspection
        INTO v_dst_on_hand, v_dst_reserved, v_dst_defective, v_dst_inspection
        FROM public.part_stock_locations
        WHERE repair_part_id = p_repair_part_id AND warehouse_location_id = p_destination_location_id
        FOR UPDATE;

        UPDATE public.part_stock_locations
        SET quantity_on_hand = quantity_on_hand + p_quantity
        WHERE repair_part_id = p_repair_part_id AND warehouse_location_id = p_destination_location_id;

        v_dst_final_available := (v_dst_on_hand + p_quantity) - v_dst_reserved - v_dst_defective - v_dst_inspection;

    -- Case C: Outward Operations (ADJUSTMENT_OUT, DAMAGE, SUPPLIER_RETURN)
    ELSIF p_movement_type IN ('ADJUSTMENT_OUT', 'DAMAGE', 'SUPPLIER_RETURN') THEN
        SELECT quantity_on_hand, quantity_reserved, quantity_defective, quantity_inspection
        INTO v_src_on_hand, v_src_reserved, v_src_defective, v_src_inspection
        FROM public.part_stock_locations
        WHERE repair_part_id = p_repair_part_id AND warehouse_location_id = p_source_location_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'SOURCE_BALANCE_NOT_FOUND';
        END IF;

        v_src_available := v_src_on_hand - v_src_reserved - v_src_defective - v_src_inspection;
        IF v_src_available < p_quantity THEN
            RAISE EXCEPTION 'INSUFFICIENT_AVAILABLE_STOCK';
        END IF;

        UPDATE public.part_stock_locations
        SET quantity_on_hand = quantity_on_hand - p_quantity
        WHERE repair_part_id = p_repair_part_id AND warehouse_location_id = p_source_location_id;

        v_src_final_available := v_src_available - p_quantity;
    END IF;

    -- ── 8. Insert Exactly One Append-Only Movement Ledger Record ─────────────
    INSERT INTO public.part_stock_movements (
        repair_part_id,
        movement_type,
        quantity,
        source_location_id,
        destination_location_id,
        repair_ticket_id,
        purchase_order_id,
        performed_by,
        reason,
        notes
    ) VALUES (
        p_repair_part_id,
        p_movement_type,
        p_quantity,
        p_source_location_id,
        p_destination_location_id,
        NULL, -- Phase 1B does not link repair tickets
        NULL, -- Phase 1B does not link purchase orders
        p_performed_by,
        p_reason,
        p_notes
    ) RETURNING id, created_at INTO v_movement_id, v_created_at;

    -- ── 9. Return Sanitized Result Payload ───────────────────────────────────
    RETURN jsonb_build_object(
        'movementId', v_movement_id,
        'repairPartId', p_repair_part_id,
        'movementType', p_movement_type,
        'quantity', p_quantity,
        'sourceLocationId', p_source_location_id,
        'destinationLocationId', p_destination_location_id,
        'sourceAvailableQuantity', v_src_final_available,
        'destinationAvailableQuantity', v_dst_final_available,
        'createdAt', v_created_at
    );
END;
$$;

-- ── 10. Security & Access Grants ────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.apply_part_stock_movement(UUID, TEXT, INT, UUID, UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_part_stock_movement(UUID, TEXT, INT, UUID, UUID, UUID, TEXT, TEXT) TO service_role;
