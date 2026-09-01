-- ============================================================================
-- Migration: 027_immutable_wallet_ledger_and_provider_identity.sql
-- Milestone: Milestone 2 Schema-Only (Revision 2H Full Plan)
-- Description: Add public.wallet_ledger_entries table and provider-neutral 
--              identity columns to public.transactions.
-- Safety Features: 
--   1. Dual-Guard Table Failure Model (DO ERRCODE 55000 + CREATE TABLE)
--   2. Transactions Table Existence Guard (DO ERRCODE 55002)
--   3. Individual Discrete ALTER TABLE Statements for Column Additions
--   4. Option A Inline Backfill Guard (DO ERRCODE 55001)
--   5. Option A Inline Preflight 2 Duplicates Guard (DO ERRCODE 55003)
--   6. Owner-Only RLS Policy with Explicit Naming Documentation
-- ============================================================================

-- ----------------------------------------------------------------------------
-- A. PRIMARY DO BLOCK GUARD FOR WALLET_LEDGER_ENTRIES EXISTENCE
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'wallet_ledger_entries'
    ) THEN
        RAISE EXCEPTION 'MIGRATION ABORTED: Table public.wallet_ledger_entries already exists. Clean schema migration cannot proceed.'
        USING ERRCODE = '55000';
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- B. TRANSACTIONS TABLE EXISTENCE GUARD (Must execute BEFORE any ALTER TABLE)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transactions'
    ) THEN
        RAISE EXCEPTION 'MIGRATION ABORTED: Table public.transactions does not exist. Prerequisites not met.'
        USING ERRCODE = '55002';
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- C. CREATE TABLE WITHOUT IF NOT EXISTS (Secondary Safeguard)
-- ----------------------------------------------------------------------------
CREATE TABLE public.wallet_ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    direction TEXT NOT NULL,
    amount_cents BIGINT NOT NULL,
    balance_before_cents BIGINT NOT NULL,
    balance_after_cents BIGINT NOT NULL,
    reason TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'eur',
    reference_type TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    provider_payment_id TEXT,
    idempotency_key TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Inline Table Constraints
    CONSTRAINT chk_ledger_direction CHECK (direction IN ('credit', 'debit')),
    CONSTRAINT chk_ledger_reason CHECK (reason IN ('topup', 'purchase', 'refund', 'adjustment')),
    CONSTRAINT chk_ledger_amount_positive CHECK (amount_cents > 0),
    CONSTRAINT chk_ledger_balance_before_non_negative CHECK (balance_before_cents >= 0),
    CONSTRAINT chk_ledger_balance_after_non_negative CHECK (balance_after_cents >= 0),
    CONSTRAINT chk_ledger_currency CHECK (currency IN ('eur')),
    CONSTRAINT chk_ledger_balance_math CHECK (
        (direction = 'credit' AND balance_after_cents = balance_before_cents + amount_cents) OR
        (direction = 'debit'  AND balance_after_cents = balance_before_cents - amount_cents)
    ),
    CONSTRAINT uq_wallet_ledger_idempotency_key UNIQUE (idempotency_key),
    CONSTRAINT chk_ledger_reference_type CHECK (reference_type IN ('transaction', 'order', 'refund', 'manual')),
    CONSTRAINT chk_ledger_provider_name CHECK (provider_name IN ('stripe', 'paypal', 'bank_transfer', 'manual', 'system', 'admin')),
    CONSTRAINT chk_ledger_external_provider_payment_id CHECK (
        (provider_name IN ('stripe', 'paypal', 'bank_transfer') AND provider_payment_id IS NOT NULL AND length(trim(provider_payment_id)) > 0)
        OR
        (provider_name IN ('manual', 'system', 'admin'))
    )
);

-- NOTE: No triggers (e.g., fn_prevent_wallet_ledger_mutation) are created in this migration.


-- ----------------------------------------------------------------------------
-- D. TRANSACTIONS PROVIDER-NEUTRAL ALIGNMENT & GUARDS
-- ----------------------------------------------------------------------------

-- 1. Separate Discrete ALTER TABLE Statements (NULLABLE, NO DEFAULT 'stripe')
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS provider_name TEXT;

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS provider_payment_id TEXT;

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- 2. Inline Backfill Guard (Option A): MUST execute BEFORE the UPDATE backfill
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.transactions
        WHERE stripe_payment_id IS NOT NULL
          AND payment_method IS NOT NULL
          AND LOWER(payment_method) NOT LIKE '%stripe%'
          AND LOWER(payment_method) NOT LIKE '%card%'
    ) THEN
        RAISE EXCEPTION 'MIGRATION ABORTED: Payment method anomaly detected for stripe_payment_id rows. Manual review required.'
        USING ERRCODE = '55001';
    END IF;
END $$;

-- 3. Target Backfill Rule for existing Stripe transactions
-- Explicit Assumption: All rows with stripe_payment_id IS NOT NULL are assumed to be Stripe transactions.
UPDATE public.transactions
SET 
    provider_name = 'stripe',
    provider_payment_id = stripe_payment_id
WHERE stripe_payment_id IS NOT NULL AND provider_name IS NULL;

-- 4. Provider Name Constraint Guard on transactions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_transactions_provider_name'
          AND conrelid = 'public.transactions'::regclass
    ) THEN
        ALTER TABLE public.transactions
        ADD CONSTRAINT chk_transactions_provider_name
        CHECK (provider_name IN ('stripe', 'paypal', 'bank_transfer', 'manual', 'system', 'admin'));
    END IF;
END $$;

-- 5. Option A Inline Preflight 2 Duplicates Guard: MUST execute BEFORE CREATE UNIQUE INDEX
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.transactions
        WHERE provider_payment_id IS NOT NULL
        GROUP BY provider_name, provider_payment_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'MIGRATION ABORTED: Duplicate (provider_name, provider_payment_id) rows detected. Manual deduplication required.'
        USING ERRCODE = '55003';
    END IF;
END $$;

-- 6. Named Partial Unique Index for External Provider Payment Identity
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_provider_payment
ON public.transactions (provider_name, provider_payment_id)
WHERE provider_payment_id IS NOT NULL;


-- ----------------------------------------------------------------------------
-- E. RLS AND GRANTS MODEL
-- ----------------------------------------------------------------------------
ALTER TABLE public.wallet_ledger_entries ENABLE ROW LEVEL SECURITY;

-- Owner Read Policy Only (Users view own ledger entries)
DROP POLICY IF EXISTS "Users view own wallet ledger entries" ON public.wallet_ledger_entries;
CREATE POLICY "Users view own wallet ledger entries"
ON public.wallet_ledger_entries FOR SELECT
USING (auth.uid() = user_id);

-- NOTE: No write policies exist (default-deny blocks client INSERT/UPDATE/DELETE).
-- NOTE: In Supabase, auth.uid() is built-in. In local plain PostgreSQL tests, auth.uid() must be stubbed or simulated via SET LOCAL.
-- NOTE: UPDATE privilege on public.users is NOT revoked from service_role in Migration 027.
-- NOTE: No RPC EXECUTE grants are issued because no RPC is created in this migration.


-- ----------------------------------------------------------------------------
-- F. EDGE CASE DOCUMENTATION & ARCHITECTURAL COMMENTS
-- ----------------------------------------------------------------------------
-- 1. Dual Failure Model:
--    Primary guard is the DO block checking table existence (ERRCODE 55000).
--    Secondary safeguard is CREATE TABLE without IF NOT EXISTS which fails if table exists.
-- 2. Transactions Table Existence Guard:
--    DO block (ERRCODE 55002) aborts before ALTER TABLE if transactions table is missing.
-- 3. Inline Backfill Guard:
--    DO block (ERRCODE 55001) aborts execution BEFORE UPDATE if preflight 3 anomalies exist.
-- 4. Preflight 2 Duplicates Guard:
--    DO block (ERRCODE 55003) aborts execution BEFORE CREATE UNIQUE INDEX if duplicate references exist.
-- 5. ADD COLUMN IF NOT EXISTS Behavior:
--    If provider_name exists without chk_transactions_provider_name, ADD COLUMN IF NOT EXISTS skips,
--    and the DO block adds the constraint.
--    If provider_name exists with a different/incompatible constraint, the DO block fails when adding chk_transactions_provider_name.
-- 6. CREATE UNIQUE INDEX IF NOT EXISTS Limitations:
--    IF NOT EXISTS does not prevent failure if existing data violates uniqueness.
--    Preflight 2 and the inline DO block guard ensure duplicates abort safely before index creation.
-- 7. RLS Policy Naming Behavior:
--    DROP POLICY IF EXISTS only removes policies with the exact name.
--    If a policy exists with a different name, it will not be removed.
-- 8. Environment Difference:
--    auth.uid() is built-in inside Supabase, but requires stubbing/SET LOCAL in plain local PostgreSQL tests.
-- 9. Financial Boundaries:
--    Balance mutations and ledger inserts are strictly deferred to a later trusted RPC-only migration.
--    P0 payment routes remain disabled with HTTP 503.
COMMENT ON TABLE public.wallet_ledger_entries IS 'Milestone 2 Schema-Only (Revision 2H): Append-only audit ledger structure. Balance updates deferred. P0 payment routes remain disabled.';
COMMENT ON COLUMN public.wallet_ledger_entries.idempotency_key IS 'Global server-generated unique key enforced via uq_wallet_ledger_idempotency_key.';
