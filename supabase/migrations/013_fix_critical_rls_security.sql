-- ============================================================================
-- HandyLand Migration: 013_fix_critical_rls_security.sql
-- Description: Hardens Supabase RLS and RPC Security Posture
--
-- Vulnerabilities Remediated:
-- 1. Guest PII & Financial Data Exposure in public.saved_valuations (Blocker 1)
--    - Drops flawed policies that permitted public/anon SELECT where user_id IS NULL.
--    - Restricts SELECT on saved_valuations to authenticated owners (auth.uid() = user_id).
--    - Guest quote retrieval is securely mediated exclusively by the backend API
--      via quote reference code (GET /api/valuation/quote/:reference).
--
-- 2. Financial & Business Metric Exposure via public.get_inventory_stats() (Blocker 2)
--    - Restricts search_path to 'public, pg_temp'.
--    - Enforces internal authorization check (service_role only).
--    - Explicitly revokes EXECUTE from PUBLIC, anon, and authenticated roles.
--    - Grants EXECUTE exclusively to service_role.
--
-- 3. Direct Privilege Escalation & Balance Tampering in public.users (Blocker 3)
--    - Introduces BEFORE UPDATE SECURITY INVOKER trigger 'trg_protect_user_sensitive_fields'.
--    - Restricts non-service-role callers from modifying system, financial, status, and
--      privilege columns (role, balance, loyalty_points, membership_level,
--      is_verified, is_active, email, provider, 2FA, lockout fields, created_at).
--    - Preserves normal user profile updates (name, phone, preferred_language,
--      avatar, notification preferences).
--
-- Post-Deployment Test Requirements:
-- - Verify anon SELECT against saved_valuations returns 0 rows.
-- - Verify anon/authenticated RPC invocation of get_inventory_stats() is rejected.
-- - Verify authenticated user cannot execute direct PostgREST UPDATE on role/balance.
-- - Verify legitimate user profile updates (name, phone, language) succeed.
-- - Verify backend admin endpoints and service_role operations function normally.
--
-- Safe Rollback Note:
-- - If rollback is required, do NOT restore any 'user_id IS NULL' public SELECT clause.
-- - Rollback consists of dropping trigger 'trg_protect_user_sensitive_fields' and
--   function 'protect_user_sensitive_fields()', and restoring prior function definitions.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Fix saved_valuations RLS Policies (Blocker 1)
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Ensure RLS is active on public.saved_valuations
ALTER TABLE public.saved_valuations ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing vulnerable policies by exact name
DROP POLICY IF EXISTS "Users view own saved valuations" ON public.saved_valuations;
DROP POLICY IF EXISTS "Users create saved valuations" ON public.saved_valuations;
DROP POLICY IF EXISTS "Admins manage saved valuations" ON public.saved_valuations;

-- 3. Authenticated users can SELECT only their own saved valuations.
-- Note: Guest quote retrieval (user_id IS NULL) is handled securely via the backend
-- quote-reference route (GET /api/valuation/quote/:reference), not direct PostgREST.
CREATE POLICY "Users view own saved valuations"
  ON public.saved_valuations FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
  );


-- ────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Secure get_inventory_stats() RPC Function (Blocker 2)
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Replace function with authorization check and safe search_path
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

    -- 1. Aggregate inventory (Products, Accessories, Repair Parts)
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
        SELECT stock, sell_price AS price, COALESCE(min_stock, 2) AS min_stock FROM public.repair_parts
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

-- 2. Revoke public/client execution rights
REVOKE EXECUTE ON FUNCTION public.get_inventory_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_inventory_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_inventory_stats() FROM authenticated;

-- 3. Grant execution strictly to service_role
GRANT EXECUTE ON FUNCTION public.get_inventory_stats() TO service_role;


-- ────────────────────────────────────────────────────────────────────────────
-- SECTION 3: Enforce Column-Level Protection on public.users (Blocker 3)
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Create or replace column protection trigger function (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.protect_user_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow modifications performed through backend service_role
    IF (auth.role() = 'service_role') THEN
        RETURN NEW;
    END IF;

    -- Block unauthorized primary key / ID tampering
    IF (NEW.id IS DISTINCT FROM OLD.id) THEN
        RAISE EXCEPTION 'Unauthorized: Modification of user ID is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    -- Block unauthorized privilege escalation
    IF (NEW.role IS DISTINCT FROM OLD.role) THEN
        RAISE EXCEPTION 'Unauthorized: Direct modification of user role is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    -- Block unauthorized wallet balance and credit tampering
    IF (NEW.balance IS DISTINCT FROM OLD.balance) THEN
        RAISE EXCEPTION 'Unauthorized: Direct modification of account balance is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    -- Block unauthorized loyalty points tampering
    IF (NEW.loyalty_points IS DISTINCT FROM OLD.loyalty_points) THEN
        RAISE EXCEPTION 'Unauthorized: Direct modification of loyalty points is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    -- Block unauthorized VIP / membership tier tampering
    IF (NEW.membership_level IS DISTINCT FROM OLD.membership_level) THEN
        RAISE EXCEPTION 'Unauthorized: Direct modification of membership level is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    -- Block unauthorized email verification bypass
    IF (NEW.is_verified IS DISTINCT FROM OLD.is_verified) THEN
        RAISE EXCEPTION 'Unauthorized: Direct modification of verification status is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    -- Block unauthorized account deactivation / activation override
    IF (NEW.is_active IS DISTINCT FROM OLD.is_active) THEN
        RAISE EXCEPTION 'Unauthorized: Direct modification of account active status is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    -- Block direct email modifications (must be processed through Supabase Auth email change lifecycle)
    IF (NEW.email IS DISTINCT FROM OLD.email) THEN
        RAISE EXCEPTION 'Unauthorized: Direct modification of email is prohibited. Use auth lifecycle.'
            USING ERRCODE = '42501';
    END IF;

    -- Block OAuth provider and social ID tampering
    IF (NEW.provider IS DISTINCT FROM OLD.provider) THEN
        RAISE EXCEPTION 'Unauthorized: Direct modification of auth provider is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    IF (NEW.google_id IS DISTINCT FROM OLD.google_id) THEN
        RAISE EXCEPTION 'Unauthorized: Direct modification of google_id is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    IF (NEW.facebook_id IS DISTINCT FROM OLD.facebook_id) THEN
        RAISE EXCEPTION 'Unauthorized: Direct modification of facebook_id is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    -- Block 2FA configuration tampering
    IF (NEW.two_factor_secret IS DISTINCT FROM OLD.two_factor_secret) THEN
        RAISE EXCEPTION 'Unauthorized: Direct modification of two_factor_secret is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    IF (NEW.two_factor_enabled IS DISTINCT FROM OLD.two_factor_enabled) THEN
        RAISE EXCEPTION 'Unauthorized: Direct modification of two_factor_enabled is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    -- Block brute-force lockout counter tampering
    IF (NEW.login_attempts IS DISTINCT FROM OLD.login_attempts) THEN
        RAISE EXCEPTION 'Unauthorized: Direct modification of login_attempts is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    IF (NEW.lock_until IS DISTINCT FROM OLD.lock_until) THEN
        RAISE EXCEPTION 'Unauthorized: Direct modification of lock_until is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    -- Block creation timestamp modification
    IF (NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
        RAISE EXCEPTION 'Unauthorized: Direct modification of created_at timestamp is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    -- Permitted fields for user self-update:
    -- name, phone, preferred_language, avatar,
    -- notif_order_updates, notif_repair_status, notif_promotions, notif_newsletter,
    -- updated_at (handled automatically by trg_users_updated_at)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp;

-- 2. Attach trigger to public.users table (BEFORE UPDATE)
DROP TRIGGER IF EXISTS trg_protect_user_sensitive_fields ON public.users;
CREATE TRIGGER trg_protect_user_sensitive_fields
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_sensitive_fields();
