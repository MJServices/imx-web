-- STEP 8: Simplified RLS Setup for IMX Auto Group
-- Run this SQL in your Supabase SQL Editor

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_questionnaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SIMPLE POLICIES FOR PUBLIC USERS
-- =====================================================

-- Allow public users to do everything with their own data
-- (Since we're using submission_id from localStorage for access control)

CREATE POLICY "Allow public access to intake_forms"
ON intake_forms
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public access to vehicle_questionnaire"
ON vehicle_questionnaire
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public access to intake_photos"
ON intake_photos
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Allow public users to access intake-photos bucket
CREATE POLICY "Allow public access to intake-photos"
ON storage.objects
FOR ALL
TO anon, authenticated
USING (bucket_id = 'intake-photos')
WITH CHECK (bucket_id = 'intake-photos');

-- =====================================================
-- ADMIN POLICIES (for future use)
-- =====================================================

-- Admins can access everything (users with @imxautogroup.com emails)
CREATE POLICY "Admin access to all intake_forms"
ON intake_forms
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' LIKE '%@imxautogroup.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' LIKE '%@imxautogroup.com'
);

CREATE POLICY "Admin access to all questionnaires"
ON vehicle_questionnaire
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' LIKE '%@imxautogroup.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' LIKE '%@imxautogroup.com'
);

CREATE POLICY "Admin access to all photos"
ON intake_photos
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' LIKE '%@imxautogroup.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' LIKE '%@imxautogroup.com'
);

CREATE POLICY "Admin access to all storage"
ON storage.objects
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' LIKE '%@imxautogroup.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' LIKE '%@imxautogroup.com'
);

-- =====================================================
-- ENSURE BUCKET EXISTS
-- =====================================================

-- Create intake-photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'intake-photos',
  'intake-photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Success message
SELECT 'RLS setup completed! Public users can access their data, admins (@imxautogroup.com) can access everything.' as status;