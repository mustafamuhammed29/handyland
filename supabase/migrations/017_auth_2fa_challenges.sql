-- ============================================================================
-- Migration: 017_auth_2fa_challenges.sql
-- Description: Database-Backed Encrypted Temporary 2FA Challenge Store
--
-- Security & Operational Architecture:
-- 1. Ephemeral Encrypted Credential Holding:
--    - Holds temporary Supabase authentication sessions server-side during the
--      2FA verification window (between password validation and TOTP code check).
--    - Session tokens inside `encrypted_session_payload` are encrypted with
--      server-side AES-256-GCM before database insertion.
--    - CRITICAL: `encrypted_session_payload`, `encryption_iv`, and `encryption_tag`
--      MUST NEVER be logged, leaked, returned to frontend/admin clients, or exposed in API JSON.
--
-- 2. Zero-Trust Access Control (Client Isolation):
--    - Row Level Security (RLS) is ENABLED on public.auth_2fa_challenges.
--    - ALL table privileges are revoked from PUBLIC, anon, and authenticated roles.
--    - Zero RLS policies are created for anon or authenticated users (fail-closed default-deny).
--    - Access is strictly reserved for trusted backend service-role operations via
--      backend API endpoints using Supabase service-role credentials.
--    - No public RPC or client-accessible stored procedure is created.
--
-- 3. Idempotent & Crash-Resilient Worker Lifecycle:
--    - Supports atomic row locking / claiming via (processing_id, processing_until).
--    - Tracks revocation error codes and retry counts for asynchronous cleanup workers.
--    - Mutually exclusive terminal states (consumed_at vs revoked_at).
--
-- Safe Rollback Guidance (Comments Only):
-- - Never drop this table directly in a live production environment.
-- - First stop the backend feature that creates/uses challenges.
-- - Revoke or safely process all pending encrypted Supabase sessions through
--   reviewed backend maintenance.
-- - Only then use a separate, reviewed cleanup migration if the table is to be removed.
-- - Do not use DROP TABLE ... CASCADE as rollback guidance.
-- - Do NOT alter or drop existing user or session tables during rollback.
-- ============================================================================

-- ============================================================================
-- 1. TABLE CREATION: public.auth_2fa_challenges
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.auth_2fa_challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_session_payload text NOT NULL,
    encryption_iv text NOT NULL,
    encryption_tag text NOT NULL,
    encryption_key_version integer NOT NULL DEFAULT 1,
    expires_at timestamptz NOT NULL,
    failed_attempts integer NOT NULL DEFAULT 0,
    processing_until timestamptz NULL,
    processing_id uuid NULL,
    consumed_at timestamptz NULL,
    revoked_at timestamptz NULL,
    revocation_retry_count integer NOT NULL DEFAULT 0,
    revocation_error_code varchar(32) NULL,
    last_revocation_attempt_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- ── Integrity Constraints ───────────────────────────────────────────────
    CONSTRAINT auth_2fa_challenges_failed_attempts_non_negative
        CHECK (failed_attempts >= 0),

    CONSTRAINT auth_2fa_challenges_revocation_retry_count_non_negative
        CHECK (revocation_retry_count >= 0),

    CONSTRAINT auth_2fa_challenges_key_version_positive
        CHECK (encryption_key_version >= 1),

    CONSTRAINT auth_2fa_challenges_expires_after_created
        CHECK (expires_at > created_at),

    CONSTRAINT auth_2fa_challenges_terminal_state_mutual_exclusion
        CHECK (NOT (consumed_at IS NOT NULL AND revoked_at IS NOT NULL)),

    CONSTRAINT auth_2fa_challenges_processing_pair_integrity
        CHECK ((processing_id IS NULL AND processing_until IS NULL) OR (processing_id IS NOT NULL AND processing_until IS NOT NULL)),

    CONSTRAINT auth_2fa_challenges_revocation_error_code_valid
        CHECK (revocation_error_code IS NULL OR revocation_error_code IN (
            'REVOKE_NETWORK_TIMEOUT',
            'REVOKE_UPSTREAM_5XX',
            'REVOKE_AUTH_REJECTED',
            'REVOKE_UNEXPECTED'
        ))
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

-- Index 1: Active challenge consumption lookup (by challenge id, user, and expiration)
CREATE INDEX IF NOT EXISTS idx_auth_2fa_challenges_active_lookup
    ON public.auth_2fa_challenges (id, user_id, expires_at)
    WHERE consumed_at IS NULL AND revoked_at IS NULL;

-- Index 2: User-level pending challenge lookup (for opportunistic revocation on new login)
CREATE INDEX IF NOT EXISTS idx_auth_2fa_challenges_user_pending
    ON public.auth_2fa_challenges (user_id, created_at)
    WHERE consumed_at IS NULL AND revoked_at IS NULL;

-- Index 3: Worker cleanup / expiry selection (for expired challenges and retry processing)
CREATE INDEX IF NOT EXISTS idx_auth_2fa_challenges_worker_cleanup
    ON public.auth_2fa_challenges (expires_at, failed_attempts, revocation_retry_count)
    WHERE consumed_at IS NULL AND revoked_at IS NULL;

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_auth_2fa_challenges_updated_at ON public.auth_2fa_challenges;
CREATE TRIGGER trg_auth_2fa_challenges_updated_at
  BEFORE UPDATE ON public.auth_2fa_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 4. ROW LEVEL SECURITY & PERMISSIONS
-- ============================================================================

-- Enable Row Level Security (default deny all)
ALTER TABLE public.auth_2fa_challenges ENABLE ROW LEVEL SECURITY;

-- Explicitly revoke all table permissions from public, anon, and authenticated roles
REVOKE ALL ON TABLE public.auth_2fa_challenges FROM PUBLIC, anon, authenticated;

-- Grant table management exclusively to service_role for backend operations.
-- Note: In Supabase, service_role bypasses RLS, but explicit GRANT ensures
-- least-privilege consistency across environments.
GRANT ALL ON TABLE public.auth_2fa_challenges TO service_role;
