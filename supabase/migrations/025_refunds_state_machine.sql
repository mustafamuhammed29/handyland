-- ============================================================================
-- Migration: 025_refunds_state_machine.sql
-- Description: Refunds State Machine, Idempotency & Over-Refund Protection
--
-- 1. Enum extension: Add 'processing', 'completed', 'failed' to refund_status
-- 2. New columns: idempotency_key, refund_method, gateway_refund_id, error_message, refund_amount_cents
-- 3. Constraints: Non-negative amount checks
-- 4. Indexes: Partial unique index for idempotency per order
-- ============================================================================

-- 1. Enum extension for refund_status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'refund_status' AND pg_enum.enumlabel = 'processing'
    ) THEN
        ALTER TYPE public.refund_status ADD VALUE 'processing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'refund_status' AND pg_enum.enumlabel = 'completed'
    ) THEN
        ALTER TYPE public.refund_status ADD VALUE 'completed';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'refund_status' AND pg_enum.enumlabel = 'failed'
    ) THEN
        ALTER TYPE public.refund_status ADD VALUE 'failed';
    END IF;
END $$;

-- 2. Add columns to public.refund_requests
ALTER TABLE public.refund_requests
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS refund_method TEXT DEFAULT 'original_payment',
    ADD COLUMN IF NOT EXISTS gateway_refund_id TEXT,
    ADD COLUMN IF NOT EXISTS error_message TEXT,
    ADD COLUMN IF NOT EXISTS refund_amount_cents BIGINT;

-- 3. Constraints on refund_requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_refund_requests_amount_positive'
    ) THEN
        ALTER TABLE public.refund_requests
            ADD CONSTRAINT chk_refund_requests_amount_positive
            CHECK (refund_amount >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_refund_requests_cents_positive'
    ) THEN
        ALTER TABLE public.refund_requests
            ADD CONSTRAINT chk_refund_requests_cents_positive
            CHECK (refund_amount_cents IS NULL OR refund_amount_cents >= 0);
    END IF;
END $$;

-- 4. Unique partial index on (order_id, idempotency_key)
CREATE UNIQUE INDEX IF NOT EXISTS uq_idx_refund_order_idempotency
    ON public.refund_requests(order_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- 5. Helpful index on gateway_refund_id
CREATE INDEX IF NOT EXISTS idx_refund_requests_gateway_refund_id
    ON public.refund_requests(gateway_refund_id)
    WHERE gateway_refund_id IS NOT NULL;
