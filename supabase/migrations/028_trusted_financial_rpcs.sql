-- ============================================================================
-- Migration: 028_trusted_financial_rpcs.sql
-- Milestone: Milestone 3 (Revision 3B): Trusted Financial RPCs
-- Description: Privileged financial stored procedures for immutable ledger
--              processing, atomic top-ups, and administrative adjustments.
-- Security Model:
--   - All procedures are SECURITY DEFINER with search_path = public, pg_temp.
--   - Direct client access (anon, authenticated) is strictly REVOKED.
--   - EXECUTE permissions are GRANTED exclusively to service_role.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. LOW-LEVEL FINANCIAL PRIMITIVE: process_wallet_ledger_entry
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_wallet_ledger_entry(
    p_user_id UUID,
    p_direction TEXT,
    p_amount_cents BIGINT,
    p_reason TEXT,
    p_reference_type TEXT,
    p_reference_id TEXT,
    p_provider_name TEXT,
    p_provider_payment_id TEXT,
    p_idempotency_key TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS TABLE (
    entry_id UUID,
    user_id UUID,
    direction TEXT,
    amount_cents BIGINT,
    balance_before_cents BIGINT,
    balance_after_cents BIGINT,
    reason TEXT,
    reference_type TEXT,
    reference_id TEXT,
    provider_name TEXT,
    provider_payment_id TEXT,
    idempotency_key TEXT,
    is_idempotent BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_balance_before BIGINT;
    v_balance_after BIGINT;
    v_legacy_balance NUMERIC(10,2);
    v_existing_entry RECORD;
    v_new_entry_id UUID;
    v_created_at TIMESTAMPTZ;
BEGIN
    -- 1. Strict Input Validation
    IF p_amount_cents IS NULL OR p_amount_cents <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive' USING ERRCODE = '22003';
    END IF;

    IF p_direction NOT IN ('credit', 'debit') THEN
        RAISE EXCEPTION 'Invalid direction: %', p_direction USING ERRCODE = '22023';
    END IF;

    -- Closed-loop wallet enforcement: unconditionally reject withdrawal
    IF p_reason = 'withdrawal' OR p_reason NOT IN ('topup', 'purchase', 'refund', 'adjustment') THEN
        RAISE EXCEPTION 'Invalid or unsupported ledger reason: %', p_reason USING ERRCODE = '22023';
    END IF;

    IF p_reference_type NOT IN ('transaction', 'order', 'refund', 'manual') THEN
        RAISE EXCEPTION 'Invalid reference type: %', p_reference_type USING ERRCODE = '22023';
    END IF;

    IF p_provider_name NOT IN ('stripe', 'paypal', 'bank_transfer', 'manual', 'system', 'admin') THEN
        RAISE EXCEPTION 'Invalid provider name: %', p_provider_name USING ERRCODE = '22023';
    END IF;

    -- External provider requires non-empty provider_payment_id
    IF p_provider_name IN ('stripe', 'paypal', 'bank_transfer') THEN
        IF p_provider_payment_id IS NULL OR length(trim(p_provider_payment_id)) = 0 THEN
            RAISE EXCEPTION 'External provider % requires a non-empty provider_payment_id', p_provider_name USING ERRCODE = '22023';
        END IF;
    END IF;

    IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) = 0 THEN
        RAISE EXCEPTION 'Idempotency key is required' USING ERRCODE = '22023';
    END IF;

    -- 2. Idempotency Check
    SELECT 
        e.id, e.user_id, e.direction, e.amount_cents, e.balance_before_cents, 
        e.balance_after_cents, e.reason, e.reference_type, e.reference_id, 
        e.provider_name, e.provider_payment_id, e.idempotency_key, true, e.created_at
    INTO v_existing_entry
    FROM public.wallet_ledger_entries e
    WHERE e.idempotency_key = p_idempotency_key;

    IF FOUND THEN
        RETURN QUERY SELECT 
            v_existing_entry.id, v_existing_entry.user_id, v_existing_entry.direction, 
            v_existing_entry.amount_cents, v_existing_entry.balance_before_cents, 
            v_existing_entry.balance_after_cents, v_existing_entry.reason, 
            v_existing_entry.reference_type, v_existing_entry.reference_id, 
            v_existing_entry.provider_name, v_existing_entry.provider_payment_id, 
            v_existing_entry.idempotency_key, true, v_existing_entry.created_at;
        RETURN;
    END IF;

    -- 3. Pessimistic Row Locking FOR UPDATE
    SELECT u.wallet_balance_cents
    INTO v_balance_before
    FROM public.users u
    WHERE u.id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', p_user_id USING ERRCODE = 'P0002';
    END IF;

    v_balance_before := COALESCE(v_balance_before, 0);

    -- 4. Balance Arithmetic & Overdraft Protection
    IF p_direction = 'credit' THEN
        v_balance_after := v_balance_before + p_amount_cents;
    ELSIF p_direction = 'debit' THEN
        IF v_balance_before < p_amount_cents THEN
            RAISE EXCEPTION 'Insufficient wallet balance' USING ERRCODE = 'P0001';
        END IF;
        v_balance_after := v_balance_before - p_amount_cents;
    END IF;

    -- 5. Atomic Immutable Ledger Insertion
    INSERT INTO public.wallet_ledger_entries (
        user_id,
        direction,
        amount_cents,
        balance_before_cents,
        balance_after_cents,
        reason,
        currency,
        reference_type,
        reference_id,
        provider_name,
        provider_payment_id,
        idempotency_key,
        description
    ) VALUES (
        p_user_id,
        p_direction,
        p_amount_cents,
        v_balance_before,
        v_balance_after,
        p_reason,
        'eur',
        p_reference_type,
        p_reference_id,
        p_provider_name,
        p_provider_payment_id,
        p_idempotency_key,
        p_description
    )
    RETURNING id, public.wallet_ledger_entries.created_at INTO v_new_entry_id, v_created_at;

    -- 6. Dual-Balance Synchronization
    -- users.wallet_balance_cents is primary integer truth; users.balance is legacy display mirror.
    v_legacy_balance := ROUND(v_balance_after::NUMERIC / 100.0, 2);
    UPDATE public.users
    SET 
        wallet_balance_cents = v_balance_after,
        balance = v_legacy_balance
    WHERE id = p_user_id;

    -- 7. Return New Ledger Record
    RETURN QUERY SELECT 
        v_new_entry_id,
        p_user_id,
        p_direction,
        p_amount_cents,
        v_balance_before,
        v_balance_after,
        p_reason,
        p_reference_type,
        p_reference_id,
        p_provider_name,
        p_provider_payment_id,
        p_idempotency_key,
        false,
        v_created_at;
END;
$$;


-- ----------------------------------------------------------------------------
-- 2. HIGH-LEVEL ATOMIC TOP-UP: top_up_wallet_atomic
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.top_up_wallet_atomic(
    p_user_id UUID,
    p_amount_cents BIGINT,
    p_provider_name TEXT,
    p_provider_payment_id TEXT,
    p_idempotency_key TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    transaction_id UUID,
    entry_id UUID,
    user_id UUID,
    amount_cents BIGINT,
    balance_before_cents BIGINT,
    balance_after_cents BIGINT,
    is_idempotent BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tx_id UUID;
    v_tx_status TEXT;
    v_ledger_rec RECORD;
BEGIN
    -- 1. External Provider Validation
    IF p_provider_name NOT IN ('stripe', 'paypal', 'bank_transfer') THEN
        RAISE EXCEPTION 'Unsupported external top-up provider: %', p_provider_name USING ERRCODE = '22023';
    END IF;

    IF p_provider_payment_id IS NULL OR length(trim(p_provider_payment_id)) = 0 THEN
        RAISE EXCEPTION 'Provider payment reference ID is required' USING ERRCODE = '22023';
    END IF;

    -- 2. Explicit Transaction Check
    SELECT id, status INTO v_tx_id, v_tx_status
    FROM public.transactions
    WHERE provider_name = p_provider_name AND provider_payment_id = p_provider_payment_id;

    IF FOUND AND v_tx_status = 'completed' THEN
        -- Recover previous ledger entry via idempotency key
        SELECT * INTO v_ledger_rec 
        FROM public.process_wallet_ledger_entry(
            p_user_id             => p_user_id,
            p_direction           => 'credit',
            p_amount_cents        => p_amount_cents,
            p_reason              => 'topup',
            p_reference_type      => 'transaction',
            p_reference_id        => v_tx_id::TEXT,
            p_provider_name       => p_provider_name,
            p_provider_payment_id => p_provider_payment_id,
            p_idempotency_key     => p_idempotency_key,
            p_description         => COALESCE(p_metadata->>'description', 'Wallet top-up via ' || p_provider_name)
        );

        RETURN QUERY SELECT 
            v_tx_id, v_ledger_rec.entry_id, v_ledger_rec.user_id, 
            v_ledger_rec.amount_cents, v_ledger_rec.balance_before_cents, 
            v_ledger_rec.balance_after_cents, true, v_ledger_rec.created_at;
        RETURN;
    END IF;

    -- 3. Upsert / Transition Transaction Record
    IF v_tx_id IS NULL THEN
        INSERT INTO public.transactions (
            id,
            user_id,
            amount,
            type,
            status,
            provider_name,
            provider_payment_id,
            idempotency_key,
            payment_method
        ) VALUES (
            gen_random_uuid(),
            p_user_id,
            p_amount_cents,
            'deposit',
            'completed',
            p_provider_name,
            p_provider_payment_id,
            p_idempotency_key,
            p_provider_name
        )
        RETURNING id INTO v_tx_id;
    ELSE
        UPDATE public.transactions
        SET status = 'completed', idempotency_key = p_idempotency_key
        WHERE id = v_tx_id;
    END IF;

    -- 4. Execute Financial Mutation
    SELECT * INTO v_ledger_rec 
    FROM public.process_wallet_ledger_entry(
        p_user_id             => p_user_id,
        p_direction           => 'credit',
        p_amount_cents        => p_amount_cents,
        p_reason              => 'topup',
        p_reference_type      => 'transaction',
        p_reference_id        => v_tx_id::TEXT,
        p_provider_name       => p_provider_name,
        p_provider_payment_id => p_provider_payment_id,
        p_idempotency_key     => p_idempotency_key,
        p_description         => COALESCE(p_metadata->>'description', 'Wallet top-up via ' || p_provider_name)
    );

    RETURN QUERY SELECT 
        v_tx_id, v_ledger_rec.entry_id, v_ledger_rec.user_id, 
        v_ledger_rec.amount_cents, v_ledger_rec.balance_before_cents, 
        v_ledger_rec.balance_after_cents, v_ledger_rec.is_idempotent, v_ledger_rec.created_at;
END;
$$;


-- ----------------------------------------------------------------------------
-- 3. ADMINISTRATIVE ADJUSTMENT: admin_adjust_wallet_ledger_entry
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet_ledger_entry(
    p_admin_user_id UUID,
    p_target_user_id UUID,
    p_direction TEXT,
    p_amount_cents BIGINT,
    p_reason_description TEXT,
    p_idempotency_key TEXT
)
RETURNS TABLE (
    entry_id UUID,
    user_id UUID,
    admin_id UUID,
    direction TEXT,
    amount_cents BIGINT,
    balance_before_cents BIGINT,
    balance_after_cents BIGINT,
    is_idempotent BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_ledger_rec RECORD;
BEGIN
    -- 1. Admin Role Verification
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_admin_user_id AND role = 'admin'
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Access denied: caller is not an administrator' USING ERRCODE = '42501';
    END IF;

    IF p_reason_description IS NULL OR length(trim(p_reason_description)) < 5 THEN
        RAISE EXCEPTION 'Detailed adjustment justification is required' USING ERRCODE = '22023';
    END IF;

    -- 2. Execute Ledger Adjustment with Admin ID in reference_id
    SELECT * INTO v_ledger_rec 
    FROM public.process_wallet_ledger_entry(
        p_user_id             => p_target_user_id,
        p_direction           => p_direction,
        p_amount_cents        => p_amount_cents,
        p_reason              => 'adjustment',
        p_reference_type      => 'manual',
        p_reference_id        => p_admin_user_id::TEXT,
        p_provider_name       => 'admin',
        p_provider_payment_id => NULL,
        p_idempotency_key     => p_idempotency_key,
        p_description         => p_reason_description
    );

    -- 3. Structured Audit Log Insertion
    IF NOT v_ledger_rec.is_idempotent THEN
        INSERT INTO public.audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            details,
            created_at
        ) VALUES (
            p_admin_user_id,
            'WALLET_ADJUSTMENT',
            'wallet_ledger_entries',
            v_ledger_rec.entry_id::TEXT,
            jsonb_build_object(
                'target_user_id', p_target_user_id,
                'admin_user_id', p_admin_user_id,
                'direction', p_direction,
                'amount_cents', p_amount_cents,
                'justification', p_reason_description,
                'idempotency_key', p_idempotency_key
            ),
            NOW()
        );
    END IF;

    RETURN QUERY SELECT 
        v_ledger_rec.entry_id,
        p_target_user_id,
        p_admin_user_id,
        v_ledger_rec.direction,
        v_ledger_rec.amount_cents,
        v_ledger_rec.balance_before_cents,
        v_ledger_rec.balance_after_cents,
        v_ledger_rec.is_idempotent,
        v_ledger_rec.created_at;
END;
$$;


-- ----------------------------------------------------------------------------
-- 4. SECURITY GRANTS AND REVOKES
-- ----------------------------------------------------------------------------

-- Revoke all direct client execution permissions
REVOKE ALL ON FUNCTION public.process_wallet_ledger_entry(UUID, TEXT, BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.top_up_wallet_atomic(UUID, BIGINT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_adjust_wallet_ledger_entry(UUID, UUID, TEXT, BIGINT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- Grant execution permissions exclusively to service_role
GRANT EXECUTE ON FUNCTION public.process_wallet_ledger_entry(UUID, TEXT, BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.top_up_wallet_atomic(UUID, BIGINT, TEXT, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet_ledger_entry(UUID, UUID, TEXT, BIGINT, TEXT, TEXT) TO service_role;

-- Documentation Comments
COMMENT ON FUNCTION public.process_wallet_ledger_entry IS 'Milestone 3: Low-level atomic ledger mutation and dual-balance updater. Strict FOR UPDATE locking. Closed to direct client access.';
COMMENT ON FUNCTION public.top_up_wallet_atomic IS 'Milestone 3: Atomic payment provider reconciliation and wallet balance top-up.';
COMMENT ON FUNCTION public.admin_adjust_wallet_ledger_entry IS 'Milestone 3: Privileged administrator manual balance adjustment with mandatory audit logging.';
