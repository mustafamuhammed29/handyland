-- ============================================================================
-- Migration: 022_device_models_management.sql
-- Description: First-Class Device Models Management for Repair Parts Warehouse
--
-- Architectural Objectives:
-- 1. First-Class Device Models:
--    - Adds `public.device_models` to manage phone/device models independently
--      from repair parts (enables models with 0 parts, active lifecycle, sorting).
--    - Adds `public.repair_part_compatible_models` join table to support
--      multi-model compatible parts with exact integrity constraints.
--
-- 2. Zero-Trust Access Control (RLS & Service-Role Only):
--    - RLS enabled with default deny on both new tables.
--    - Direct access revoked from PUBLIC, anon, and authenticated.
--    - Granted exclusively to `service_role`.
--
-- 3. Immutability & Audit Safety:
--    - Foreign keys on relationships use ON DELETE RESTRICT to guarantee
--      that no device model operation can delete repair parts, balances, or ledger history.
--    - Soft deactivation (`is_active = false`) preserves complete historical visibility.
--
-- 4. Idempotent Data Backfill:
--    - Safely populates device models from existing `repair_parts` metadata without
--      altering existing column data or stock ledger records.
--
-- 5. Atomic Lifecycle RPCs:
--    - `public.deactivate_device_model(UUID)`
--    - `public.reactivate_device_model(UUID)`
--    - `public.discontinue_device_model_parts(UUID)`
-- ============================================================================

-- ============================================================================
-- 1. DEVICE MODELS TABLE: public.device_models
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.device_models (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand text NOT NULL,
    model_name text NOT NULL,
    device_family text NOT NULL,
    normalized_key text NOT NULL,
    release_year integer NULL,
    sort_weight integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- ── Integrity Constraints ───────────────────────────────────────────────
    CONSTRAINT device_models_brand_not_empty
        CHECK (btrim(brand) <> ''),

    CONSTRAINT device_models_model_name_not_empty
        CHECK (btrim(model_name) <> ''),

    CONSTRAINT device_models_device_family_not_empty
        CHECK (btrim(device_family) <> ''),

    CONSTRAINT device_models_release_year_valid
        CHECK (release_year IS NULL OR (release_year >= 2000 AND release_year <= 2100)),

    CONSTRAINT device_models_normalized_key_unique
        UNIQUE (normalized_key),

    CONSTRAINT device_models_normalized_key_not_empty
        CHECK (btrim(normalized_key) <> '')
);

-- Query optimization indexes for brand filtering and sorting
CREATE INDEX IF NOT EXISTS idx_device_models_brand_active
    ON public.device_models (brand, is_active);

CREATE INDEX IF NOT EXISTS idx_device_models_sorting
    ON public.device_models (is_active, sort_weight DESC, release_year DESC, model_name ASC);

-- Auto-update updated_at trigger for device_models
DROP TRIGGER IF EXISTS trg_device_models_updated_at ON public.device_models;
CREATE TRIGGER trg_device_models_updated_at
    BEFORE UPDATE ON public.device_models
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 2. PART COMPATIBLE MODELS JOIN TABLE: public.repair_part_compatible_models
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.repair_part_compatible_models (
    repair_part_id uuid NOT NULL REFERENCES public.repair_parts(id) ON DELETE RESTRICT,
    device_model_id uuid NOT NULL REFERENCES public.device_models(id) ON DELETE RESTRICT,
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT repair_part_compatible_models_pkey
        PRIMARY KEY (repair_part_id, device_model_id)
);

-- At most one primary model relationship per repair part
CREATE UNIQUE INDEX IF NOT EXISTS idx_repair_part_compatible_models_primary
    ON public.repair_part_compatible_models (repair_part_id)
    WHERE is_primary = true;

-- Foreign key lookup indexes
CREATE INDEX IF NOT EXISTS idx_repair_part_compatible_models_device_model_id
    ON public.repair_part_compatible_models (device_model_id);

CREATE INDEX IF NOT EXISTS idx_repair_part_compatible_models_repair_part_id
    ON public.repair_part_compatible_models (repair_part_id);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) & ACCESS CONTROL
-- ============================================================================

ALTER TABLE public.device_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_part_compatible_models ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.device_models FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.device_models TO service_role;

REVOKE ALL ON TABLE public.repair_part_compatible_models FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.repair_part_compatible_models TO service_role;

-- ============================================================================
-- 4. ATOMIC LIFECYCLE STORED PROCEDURES (RPCs)
-- ============================================================================

-- ── A. deactivate_device_model ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.deactivate_device_model(
    p_model_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_model RECORD;
BEGIN
    IF p_model_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_MODEL_ID';
    END IF;

    SELECT id, brand, model_name, device_family, normalized_key, release_year, sort_weight, is_active
    INTO v_model
    FROM public.device_models
    WHERE id = p_model_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'WAREHOUSE_MODEL_NOT_FOUND';
    END IF;

    IF v_model.is_active = false THEN
        RETURN jsonb_build_object(
            'id', v_model.id,
            'brand', v_model.brand,
            'modelName', v_model.model_name,
            'deviceFamily', v_model.device_family,
            'isActive', false,
            'alreadyDeactivated', true
        );
    END IF;

    UPDATE public.device_models
    SET is_active = false,
        updated_at = NOW()
    WHERE id = p_model_id;

    RETURN jsonb_build_object(
        'id', v_model.id,
        'brand', v_model.brand,
        'modelName', v_model.model_name,
        'deviceFamily', v_model.device_family,
        'isActive', false,
        'alreadyDeactivated', false
    );
END;
$$;

REVOKE ALL ON FUNCTION public.deactivate_device_model(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_device_model(UUID) TO service_role;

-- ── B. reactivate_device_model ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reactivate_device_model(
    p_model_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_model RECORD;
BEGIN
    IF p_model_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_MODEL_ID';
    END IF;

    SELECT id, brand, model_name, device_family, normalized_key, release_year, sort_weight, is_active
    INTO v_model
    FROM public.device_models
    WHERE id = p_model_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'WAREHOUSE_MODEL_NOT_FOUND';
    END IF;

    IF v_model.is_active = true THEN
        RETURN jsonb_build_object(
            'id', v_model.id,
            'brand', v_model.brand,
            'modelName', v_model.model_name,
            'deviceFamily', v_model.device_family,
            'isActive', true,
            'alreadyActive', true
        );
    END IF;

    UPDATE public.device_models
    SET is_active = true,
        updated_at = NOW()
    WHERE id = p_model_id;

    RETURN jsonb_build_object(
        'id', v_model.id,
        'brand', v_model.brand,
        'modelName', v_model.model_name,
        'deviceFamily', v_model.device_family,
        'isActive', true,
        'alreadyActive', false
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reactivate_device_model(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_device_model(UUID) TO service_role;

-- ── C. discontinue_device_model_parts ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.discontinue_device_model_parts(
    p_model_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_model RECORD;
    v_has_stock BOOLEAN;
    v_total_linked_count INTEGER := 0;
    v_shared_active_count INTEGER := 0;
    v_eligible_part_ids UUID[];
    v_discontinued_count INTEGER := 0;
BEGIN
    IF p_model_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_MODEL_ID';
    END IF;

    -- 1. Lock target model
    SELECT id, brand, model_name, device_family, is_active
    INTO v_model
    FROM public.device_models
    WHERE id = p_model_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'WAREHOUSE_MODEL_NOT_FOUND';
    END IF;

    -- 2. Count total linked parts
    SELECT COUNT(DISTINCT rp.id)
    INTO v_total_linked_count
    FROM public.repair_parts rp
    INNER JOIN public.repair_part_compatible_models cm ON cm.repair_part_id = rp.id
    WHERE cm.device_model_id = p_model_id;

    IF v_total_linked_count = 0 THEN
        RETURN jsonb_build_object(
            'modelId', v_model.id,
            'modelName', v_model.model_name,
            'totalLinkedParts', 0,
            'sharedActivePartsCount', 0,
            'eligiblePartsCount', 0,
            'discontinuedCount', 0,
            'message', 'No parts linked to this model'
        );
    END IF;

    -- 3. Count shared-active parts (linked to target model AND at least one other active model)
    SELECT COUNT(DISTINCT rp.id)
    INTO v_shared_active_count
    FROM public.repair_parts rp
    INNER JOIN public.repair_part_compatible_models cm ON cm.repair_part_id = rp.id
    WHERE cm.device_model_id = p_model_id
      AND EXISTS (
          SELECT 1
          FROM public.repair_part_compatible_models other_cm
          INNER JOIN public.device_models other_dm ON other_dm.id = other_cm.device_model_id
          WHERE other_cm.repair_part_id = rp.id
            AND other_cm.device_model_id <> p_model_id
            AND other_dm.is_active = true
      );

    -- 4. Identify only exclusive/non-shared active eligible repair parts and lock them in deterministic order
    -- Concurrency approach: Lock candidate rows in deterministic ID order inside a subquery
    -- to prevent race conditions/deadlocks while avoiding PostgreSQL error 42803 ('FOR UPDATE is not allowed with aggregate functions').
    SELECT COALESCE(array_agg(locked.id), '{}')
    INTO v_eligible_part_ids
    FROM (
        SELECT rp.id
        FROM public.repair_parts rp
        INNER JOIN public.repair_part_compatible_models cm ON cm.repair_part_id = rp.id
        WHERE cm.device_model_id = p_model_id
          AND (rp.status <> 'discontinued' OR rp.is_active = true)
          AND NOT EXISTS (
              SELECT 1
              FROM public.repair_part_compatible_models other_cm
              INNER JOIN public.device_models other_dm ON other_dm.id = other_cm.device_model_id
              WHERE other_cm.repair_part_id = rp.id
                AND other_cm.device_model_id <> p_model_id
                AND other_dm.is_active = true
          )
        ORDER BY rp.id
        FOR UPDATE OF rp
    ) locked;

    -- If no eligible parts to discontinue (e.g. all are shared-active or already discontinued)
    IF array_length(v_eligible_part_ids, 1) IS NULL OR array_length(v_eligible_part_ids, 1) = 0 THEN
        RETURN jsonb_build_object(
            'modelId', v_model.id,
            'modelName', v_model.model_name,
            'totalLinkedParts', v_total_linked_count,
            'sharedActivePartsCount', v_shared_active_count,
            'eligiblePartsCount', 0,
            'discontinuedCount', 0,
            'message', 'No exclusive active parts available for discontinuation'
        );
    END IF;

    -- 5. Verify zero stock balances across all locations for eligible parts only
    SELECT EXISTS (
        SELECT 1
        FROM public.part_stock_locations
        WHERE repair_part_id = ANY(v_eligible_part_ids)
          AND (
              quantity_on_hand > 0 OR
              quantity_reserved > 0 OR
              quantity_defective > 0 OR
              quantity_inspection > 0
          )
    ) INTO v_has_stock;

    IF v_has_stock THEN
        RAISE EXCEPTION 'WAREHOUSE_MODEL_HAS_ACTIVE_STOCK';
    END IF;

    -- 6. Safely mark eligible linked parts discontinued
    UPDATE public.repair_parts
    SET status = 'discontinued',
        is_active = false,
        updated_at = NOW()
    WHERE id = ANY(v_eligible_part_ids);

    GET DIAGNOSTICS v_discontinued_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'modelId', v_model.id,
        'modelName', v_model.model_name,
        'totalLinkedParts', v_total_linked_count,
        'sharedActivePartsCount', v_shared_active_count,
        'eligiblePartsCount', array_length(v_eligible_part_ids, 1),
        'discontinuedCount', v_discontinued_count,
        'success', true
    );
END;
$$;

REVOKE ALL ON FUNCTION public.discontinue_device_model_parts(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.discontinue_device_model_parts(UUID) TO service_role;

-- ============================================================================
-- 5. IDEMPOTENT DATA BACKFILL
-- ============================================================================

DO $$
DECLARE
    r RECORD;
    v_brand TEXT;
    v_family TEXT;
    v_model_name TEXT;
    v_norm_key TEXT;
    v_model_id UUID;
    v_part_id UUID;
    v_is_first BOOLEAN;
BEGIN
    -- 1. Populate device_models from existing repair_parts
    FOR r IN
        SELECT DISTINCT
            COALESCE(NULLIF(btrim(p.brand), ''), 'Apple') AS brand,
            COALESCE(NULLIF(btrim(p.device_family), ''), NULLIF(btrim(d.device_name), ''), 'Sonstige') AS device_family,
            btrim(d.device_name) AS model_name
        FROM public.repair_parts p,
        LATERAL unnest(p.compatible_devices) AS d(device_name)
        WHERE btrim(d.device_name) <> ''
    LOOP
        v_brand := r.brand;
        v_family := r.device_family;
        v_model_name := r.model_name;
        v_norm_key := lower(v_brand) || ':' || lower(v_model_name);

        INSERT INTO public.device_models (
            brand,
            model_name,
            device_family,
            normalized_key,
            is_active
        )
        VALUES (
            v_brand,
            v_model_name,
            v_family,
            v_norm_key,
            true
        )
        ON CONFLICT (normalized_key) DO NOTHING;
    END LOOP;

    -- 2. Populate repair_part_compatible_models relationships
    FOR r IN
        SELECT
            p.id AS part_id,
            p.brand AS part_brand,
            p.compatible_devices
        FROM public.repair_parts p
        WHERE p.compatible_devices IS NOT NULL AND array_length(p.compatible_devices, 1) > 0
    LOOP
        v_part_id := r.part_id;
        v_is_first := true;

        FOR v_model_name IN
            SELECT btrim(d)
            FROM unnest(r.compatible_devices) AS d
            WHERE btrim(d) <> ''
        LOOP
            v_norm_key := lower(COALESCE(NULLIF(btrim(r.part_brand), ''), 'Apple')) || ':' || lower(v_model_name);

            SELECT id INTO v_model_id
            FROM public.device_models
            WHERE normalized_key = v_norm_key;

            IF v_model_id IS NOT NULL THEN
                INSERT INTO public.repair_part_compatible_models (
                    repair_part_id,
                    device_model_id,
                    is_primary
                )
                VALUES (
                    v_part_id,
                    v_model_id,
                    v_is_first
                )
                ON CONFLICT (repair_part_id, device_model_id) DO NOTHING;

                v_is_first := false;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- ── Preflight / Postflight Verification Queries (Informational Comments) ─────
-- PREFLIGHT:
--   SELECT COUNT(DISTINCT lower(COALESCE(brand, 'Apple')) || ':' || lower(d))
--   FROM public.repair_parts, LATERAL unnest(compatible_devices) d;
-- POSTFLIGHT:
--   SELECT COUNT(*) FROM public.device_models;
--   SELECT COUNT(*) FROM public.repair_part_compatible_models;
--   SELECT dm.brand, dm.model_name, COUNT(cm.repair_part_id) AS parts_count
--   FROM public.device_models dm
--   LEFT JOIN public.repair_part_compatible_models cm ON cm.device_model_id = dm.id
--   GROUP BY dm.id, dm.brand, dm.model_name
--   ORDER BY dm.brand, dm.model_name;
