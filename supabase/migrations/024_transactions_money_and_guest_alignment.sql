-- =============================================================================
-- Migration 024: Transactions Money Representation & Guest Payment Alignment
-- =============================================================================
-- 1. Make transactions.user_id nullable to support guest checkouts.
-- 2. Add transactions.guest_email for tracking guest transactions.
-- 3. Enforce valid currency allowlist ('eur', 'usd', 'gbp').
-- 4. Enforce non-negative transaction amount (amount >= 0 in minor units / cents).
-- =============================================================================

-- 1. Allow nullable user_id for guest checkout payments
ALTER TABLE public.transactions ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add guest_email column if not exists
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- 3. Enforce currency allowlist check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'transactions_currency_check'
        AND conrelid = 'public.transactions'::regclass
    ) THEN
        ALTER TABLE public.transactions
        ADD CONSTRAINT transactions_currency_check
        CHECK (currency IN ('eur', 'usd', 'gbp'));
    END IF;
END $$;

-- 4. Enforce non-negative amount constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'transactions_amount_non_negative_check'
        AND conrelid = 'public.transactions'::regclass
    ) THEN
        ALTER TABLE public.transactions
        ADD CONSTRAINT transactions_amount_non_negative_check
        CHECK (amount >= 0);
    END IF;
END $$;

-- 5. Create index on guest_email for fast guest payment auditing
CREATE INDEX IF NOT EXISTS idx_transactions_guest_email
ON public.transactions(guest_email)
WHERE guest_email IS NOT NULL;
