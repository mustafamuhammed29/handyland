-- ============================================================
-- HandyLand: Supabase Storage Media Bucket Setup (012)
-- Dedicated storage bucket for Hero video showcase & media assets
-- ============================================================

-- 1. Idempotent bucket provisioning
-- Existing bucket settings are NOT overwritten if the bucket already exists.
-- Bucket-level MIME/size restrictions are intentionally NOT forced here so the
-- bucket can host video posters, fallback visuals, and related media assets.
-- Strict enforcement of the 25 MB limit and MP4/WebM MIME/magic-byte checks
-- is handled securely in the backend admin Hero video upload route.
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Idempotent Storage RLS Policy
-- Scoped strictly to objects residing in the 'media' bucket.
-- Uses a guarded DO block against pg_policies to avoid dropping or altering
-- any existing policies on the shared storage.objects table.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read media storage'
  ) THEN
    CREATE POLICY "Public read media storage"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'media');
  END IF;
END
$$;

-- Note on write/delete permissions:
-- No direct client INSERT, UPDATE, or DELETE policies are granted to anon or
-- authenticated roles. All Hero media mutations are executed exclusively via
-- the backend API using supabaseAdmin (service_role), ensuring strict authorization
-- and server-side binary validation.
