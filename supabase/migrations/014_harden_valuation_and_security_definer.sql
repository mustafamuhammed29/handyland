-- ============================================================================
-- Migration: 014_harden_valuation_and_security_definer.sql
-- Description: Harden Valuation Categories/Brands RLS & Lock is_admin() Search Path
--
-- Security Vulnerabilities Remediated:
-- 1. Insecure search_path on public.is_admin(): Added explicit fixed search_path
--    (public, pg_temp) to SECURITY DEFINER function to prevent schema-hijacking.
-- 2. Inactive Valuation Category Exposure: Enforced is_active = true restriction
--    on public/anon read access for public.valuation_categories.
-- 3. Inefficient inline subqueries in valuation RLS: Standardized admin policies
--    to utilize public.is_admin() with strict TO authenticated scoping.
--
-- Access Control Model:
-- - public.valuation_categories:
--     * SELECT: anon & authenticated (is_active = true only)
--     * ALL: authenticated admins only (via public.is_admin())
-- - public.valuation_brands:
--     * SELECT: anon & authenticated (catalog read; note: no is_active column exists)
--     * ALL: authenticated admins only (via public.is_admin())
-- - public.is_admin():
--     * SECURITY DEFINER STABLE with SET search_path = public, pg_temp
--
-- Test Requirements:
-- 1. Verify anon callers cannot view valuation_categories where is_active = false.
-- 2. Verify anon callers can view all valuation_brands rows.
-- 3. Verify non-admin authenticated users cannot insert/update/delete either table.
-- 4. Verify admin authenticated users can perform full CRUD on both tables.
-- 5. Verify public.is_admin() returns true for admins and false for anon/regular users.
--
-- Safe Rollback Guidance:
-- - Do NOT restore legacy public category read access using USING (true).
-- - If category policy adjustment is required, preserve active-only scoping:
--     CREATE POLICY "valuation_categories_select_active"
--       ON public.valuation_categories FOR SELECT
--       TO anon, authenticated
--       USING (is_active = true);
-- - Do NOT revert public.is_admin() to any definition lacking
--   SET search_path = public, pg_temp.
-- - If an operational regression occurs, preserve the hardened is_admin() and
--   active-only category read policy, then adjust only the specific administrative
--   policy needed after targeted investigation.
-- ============================================================================

-- ============================================================================
-- 1. FUNCTION HARDENING: public.is_admin()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================================
-- 2. ROW LEVEL SECURITY: public.valuation_categories
-- ============================================================================

ALTER TABLE public.valuation_categories ENABLE ROW LEVEL SECURITY;

-- Drop proven legacy policies from migration 007
DROP POLICY IF EXISTS "Allow public read access for valuation_categories" ON public.valuation_categories;
DROP POLICY IF EXISTS "Allow admin full access for valuation_categories" ON public.valuation_categories;

-- Self-drop to ensure idempotent manual re-runs
DROP POLICY IF EXISTS "valuation_categories_select_active" ON public.valuation_categories;
DROP POLICY IF EXISTS "valuation_categories_admin_all" ON public.valuation_categories;

-- Public storefront: read active device categories only
CREATE POLICY "valuation_categories_select_active"
  ON public.valuation_categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Administrative management: full CRUD for verified admins
CREATE POLICY "valuation_categories_admin_all"
  ON public.valuation_categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 3. ROW LEVEL SECURITY: public.valuation_brands
-- ============================================================================

ALTER TABLE public.valuation_brands ENABLE ROW LEVEL SECURITY;

-- Drop proven legacy policies from migration 007
DROP POLICY IF EXISTS "Allow public read access for valuation_brands" ON public.valuation_brands;
DROP POLICY IF EXISTS "Allow admin full access for valuation_brands" ON public.valuation_brands;

-- Self-drop to ensure idempotent manual re-runs
DROP POLICY IF EXISTS "valuation_brands_select_public" ON public.valuation_brands;
DROP POLICY IF EXISTS "valuation_brands_admin_all" ON public.valuation_brands;

-- Public storefront: read all brand logos for valuation trade-in catalog
-- Note: public.valuation_brands schema currently lacks an is_active column;
-- any future requirement for draft/archived brands requires a schema migration.
CREATE POLICY "valuation_brands_select_public"
  ON public.valuation_brands
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Administrative management: full CRUD for verified admins
CREATE POLICY "valuation_brands_admin_all"
  ON public.valuation_brands
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
