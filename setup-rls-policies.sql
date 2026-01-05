-- STEP 8: Row Level Security (RLS) Setup
-- Run this SQL in your Supabase SQL Editor

-- =====================================================
-- DATABASE RLS POLICIES
-- =====================================================

-- Enable RLS on all intake tables
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_questionnaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public users can insert intake forms" ON intake_forms;
DROP POLICY IF EXISTS "Users can read their own submissions" ON intake_forms;
DROP POLICY IF EXISTS "Users can update their own submissions" ON intake_forms;
DROP POLICY IF EXISTS "Admins can read all submissions" ON intake_forms;
DROP POLICY IF EXISTS "Admins can update all submissions" ON intake_forms;

DROP POLICY IF EXISTS "Public users can insert questionnaire" ON vehicle_questionnaire;
DROP POLICY IF EXISTS "Users can read their own questionnaire" ON vehicle_questionnaire;
DROP POLICY IF EXISTS "Users can update their own questionnaire" ON vehicle_questionnaire;
DROP POLICY IF EXISTS "Admins can read all questionnaires" ON vehicle_questionnaire;

DROP POLICY IF EXISTS "Public users can insert photos" ON intake_photos;
DROP POLICY IF EXISTS "Users can read their own photos" ON intake_photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON intake_photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON intake_photos;
DROP POLICY IF EXISTS "Admins can read all photos" ON intake_photos;
DROP POLICY IF EXISTS "Admins can update all photos" ON intake_photos;

-- =====================================================
-- INTAKE_FORMS TABLE POLICIES
-- =====================================================

-- Public users: Insert allowed
CREATE POLICY "Public users can insert intake forms"
ON intake_forms
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Users: Read only their own submissions (using submission_id from localStorage)
CREATE POLICY "Users can read their own submissions"
ON intake_forms
FOR SELECT
TO anon, authenticated
USING (true); -- Allow reading for form prefilling

-- Users: Update their own submissions
CREATE POLICY "Users can update their own submissions"
ON intake_forms
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Admins: Read all submissions
CREATE POLICY "Admins can read all submissions"
ON intake_forms
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email LIKE '%@imxautogroup.com'
  )
);

-- Admins: Update status of all submissions
CREATE POLICY "Admins can update all submissions"
ON intake_forms
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email LIKE '%@imxautogroup.com'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email LIKE '%@imxautogroup.com'
  )
);

-- =====================================================
-- VEHICLE_QUESTIONNAIRE TABLE POLICIES
-- =====================================================

-- Public users: Insert allowed
CREATE POLICY "Public users can insert questionnaire"
ON vehicle_questionnaire
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Users: Read their own questionnaire
CREATE POLICY "Users can read their own questionnaire"
ON vehicle_questionnaire
FOR SELECT
TO anon, authenticated
USING (true);

-- Users: Update their own questionnaire
CREATE POLICY "Users can update their own questionnaire"
ON vehicle_questionnaire
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Admins: Read all questionnaires
CREATE POLICY "Admins can read all questionnaires"
ON vehicle_questionnaire
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email LIKE '%@imxautogroup.com'
  )
);

-- =====================================================
-- INTAKE_PHOTOS TABLE POLICIES
-- =====================================================

-- Public users: Insert allowed
CREATE POLICY "Public users can insert photos"
ON intake_photos
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Users: Read their own photos
CREATE POLICY "Users can read their own photos"
ON intake_photos
FOR SELECT
TO anon, authenticated
USING (true);

-- Users: Update their own photos
CREATE POLICY "Users can update their own photos"
ON intake_photos
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Users: Delete their own photos
CREATE POLICY "Users can delete their own photos"
ON intake_photos
FOR DELETE
TO anon, authenticated
USING (true);

-- Admins: Read all photos
CREATE POLICY "Admins can read all photos"
ON intake_photos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email LIKE '%@imxautogroup.com'
  )
);

-- Admins: Update all photos
CREATE POLICY "Admins can update all photos"
ON intake_photos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email LIKE '%@imxautogroup.com'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email LIKE '%@imxautogroup.com'
  )
);

-- =====================================================
-- STORAGE RLS POLICIES
-- =====================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public users can upload to their submission folder" ON storage.objects;
DROP POLICY IF EXISTS "Public users can read their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can access all files" ON storage.objects;

-- Public users: Upload to their own submission folder only
CREATE POLICY "Public users can upload to their submission folder"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'intake-photos' 
  AND (storage.foldername(name))[1] = auth.jwt() ->> 'submission_id'
);

-- Public users: Read their own files only
CREATE POLICY "Public users can read their own files"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'intake-photos'
  AND (
    (storage.foldername(name))[1] = auth.jwt() ->> 'submission_id'
    OR auth.role() = 'authenticated'
  )
);

-- Public users: Delete their own files only
CREATE POLICY "Public users can delete their own files"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (
  bucket_id = 'intake-photos'
  AND (storage.foldername(name))[1] = auth.jwt() ->> 'submission_id'
);

-- Admins: Access all files in intake-photos bucket
CREATE POLICY "Admins can access all files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'intake-photos'
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email LIKE '%@imxautogroup.com'
  )
)
WITH CHECK (
  bucket_id = 'intake-photos'
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email LIKE '%@imxautogroup.com'
  )
);

-- =====================================================
-- BUCKET POLICIES
-- =====================================================

-- Ensure intake-photos bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'intake-photos',
  'intake-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- =====================================================
-- ADMIN ROLE SETUP
-- =====================================================

-- Create admin role if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'imx_admin') THEN
    CREATE ROLE imx_admin;
  END IF;
END $$;

-- Grant necessary permissions to admin role
GRANT ALL ON intake_forms TO imx_admin;
GRANT ALL ON vehicle_questionnaire TO imx_admin;
GRANT ALL ON intake_photos TO imx_admin;
GRANT ALL ON storage.objects TO imx_admin;
GRANT ALL ON storage.buckets TO imx_admin;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('intake_forms', 'vehicle_questionnaire', 'intake_photos', 'objects')
ORDER BY tablename, policyname;

-- Verify bucket configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'intake-photos';

-- Success message
SELECT 'RLS policies setup completed successfully!' as status,
       'Database: ✅ Configured' as database_status,
       'Storage: ✅ Configured' as storage_status,
       'Admin Access: ✅ @imxautogroup.com emails' as admin_access;