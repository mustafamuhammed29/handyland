-- ============================================================
-- HandyLand: Valuation Categories and Brands Tables
-- Fixes BUG-VAL-07 (Missing tables from migration)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.valuation_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.valuation_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
