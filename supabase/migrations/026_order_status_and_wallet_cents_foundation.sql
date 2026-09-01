-- ============================================================================
-- Migration: 026_order_status_and_wallet_cents_foundation.sql
-- Description: Milestone 1 Foundation - Add partially_refunded to order_status
--              and wallet_balance_cents to public.users.
--
-- Architectural Documentation & Invariants:
-- 1. `public.users.balance` remains a legacy EUR-decimal (NUMERIC(10,2)) compatibility field.
-- 2. `public.users.wallet_balance_cents` is the future canonical cached wallet balance in integer EUR cents (BIGINT).
-- 3. In this milestone (Milestone 1), no application code or controller may write `wallet_balance_cents`.
-- 4. A later trusted PostgreSQL RPC-only milestone will be the sole writer of `wallet_balance_cents` and its paired immutable `wallet_ledger_entries` audit rows.
-- 5. No trigger is created in this milestone; `balance` and `wallet_balance_cents` remain decoupled until trusted RPCs are deployed.
-- ============================================================================

-- 1. Safely add 'partially_refunded' to public.order_status enum if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'order_status' AND pg_enum.enumlabel = 'partially_refunded'
    ) THEN
        ALTER TYPE public.order_status ADD VALUE 'partially_refunded';
    END IF;
END $$;

-- 2. Add wallet_balance_cents column to public.users if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'wallet_balance_cents'
    ) THEN
        ALTER TABLE public.users
        ADD COLUMN wallet_balance_cents BIGINT NOT NULL DEFAULT 0;
    END IF;
END $$;

-- 3. Enforce non-negative constraint on wallet_balance_cents
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_users_wallet_balance_cents_non_negative'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
        ADD CONSTRAINT chk_users_wallet_balance_cents_non_negative
        CHECK (wallet_balance_cents >= 0);
    END IF;
END $$;

-- 4. Backfill wallet_balance_cents from legacy balance for existing rows
UPDATE public.users
SET wallet_balance_cents = ROUND(COALESCE(balance, 0) * 100)::BIGINT
WHERE wallet_balance_cents = 0 AND balance > 0;
