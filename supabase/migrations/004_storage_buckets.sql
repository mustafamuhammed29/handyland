-- ============================================================
-- HandyLand: Supabase Storage Buckets Setup
-- (Images stored in Supabase Storage with size limits)
-- ============================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('products', 'products', true, 2097152, ARRAY['image/jpeg','image/png','image/webp']),
  ('accessories', 'accessories', true, 2097152, ARRAY['image/jpeg','image/png','image/webp']),
  ('avatars', 'avatars', true, 1048576, ARRAY['image/jpeg','image/png','image/webp']),
  ('repairs', 'repairs', false, 5242880, ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('warranties', 'warranties', false, 5242880, ARRAY['image/jpeg','image/png','application/pdf']),
  ('pages', 'pages', true, 2097152, ARRAY['image/jpeg','image/png','image/webp']),
  ('blueprints', 'blueprints', true, 2097152, ARRAY['image/jpeg','image/png','image/webp']),
  ('signatures', 'signatures', false, 1048576, ARRAY['image/png','image/jpeg'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage file_size_limit:
-- 2097152 = 2MB (product images — compressed)
-- 1048576 = 1MB (avatars)
-- 5242880 = 5MB (repair photos, documents)

-- ============================================================
-- Storage RLS Policies
-- ============================================================

-- PRODUCTS bucket: public read, admin write
CREATE POLICY "Public read products storage"
  ON storage.objects FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Admins upload products storage"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'products' AND public.is_admin()
  );

CREATE POLICY "Admins delete products storage"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'products' AND public.is_admin()
  );

CREATE POLICY "Admins update products storage"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'products' AND public.is_admin()
  );

-- ACCESSORIES bucket: public read, admin write
CREATE POLICY "Public read accessories storage"
  ON storage.objects FOR SELECT USING (bucket_id = 'accessories');

CREATE POLICY "Admins upload accessories storage"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'accessories' AND public.is_admin()
  );

CREATE POLICY "Admins update accessories storage"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'accessories' AND public.is_admin()
  );

CREATE POLICY "Admins delete accessories storage"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'accessories' AND public.is_admin()
  );

-- AVATARS bucket: users manage own avatar
CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- REPAIRS bucket: users read own, admin full access
CREATE POLICY "Users read own repair files"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'repairs' AND (
      public.is_admin() OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Users upload repair files"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'repairs' AND (
      public.is_admin() OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );

-- WARRANTIES bucket: admin only
CREATE POLICY "Admins manage warranties storage"
  ON storage.objects FOR ALL USING (
    bucket_id = 'warranties' AND (public.is_admin() OR auth.role() = 'service_role')
  );

-- PAGES bucket: public read, admin write
CREATE POLICY "Public read pages storage"
  ON storage.objects FOR SELECT USING (bucket_id = 'pages');

CREATE POLICY "Admins upload pages storage"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'pages' AND public.is_admin()
  );

CREATE POLICY "Admins update pages storage"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'pages' AND public.is_admin()
  );

CREATE POLICY "Admins delete pages storage"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'pages' AND public.is_admin()
  );

-- BLUEPRINTS bucket: public read, admin write
CREATE POLICY "Public read blueprints storage"
  ON storage.objects FOR SELECT USING (bucket_id = 'blueprints');

CREATE POLICY "Admins upload blueprints storage"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'blueprints' AND public.is_admin()
  );

CREATE POLICY "Admins update blueprints storage"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'blueprints' AND public.is_admin()
  );

CREATE POLICY "Admins delete blueprints storage"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'blueprints' AND public.is_admin()
  );

-- SIGNATURES bucket: service role only
CREATE POLICY "Service role manages signatures"
  ON storage.objects FOR ALL USING (
    bucket_id = 'signatures' AND auth.role() = 'service_role'
  );
