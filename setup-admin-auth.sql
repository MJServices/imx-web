-- STEP 9: Admin Authentication Setup
-- Run this SQL in your Supabase SQL Editor

-- =====================================================
-- ADMIN ROLE SETUP
-- =====================================================

-- Create admin role in auth.users metadata
-- This will be handled by the application, but we can set up triggers

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_email text)
RETURNS boolean AS $$
BEGIN
  -- Check if email ends with @imxautogroup.com
  RETURN user_email LIKE '%@imxautogroup.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set admin role on user creation
CREATE OR REPLACE FUNCTION set_admin_role()
RETURNS trigger AS $$
BEGIN
  -- If user email is from IMX Auto Group, set admin role
  IF NEW.email LIKE '%@imxautogroup.com' THEN
    NEW.raw_user_meta_data = COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set admin role
DROP TRIGGER IF EXISTS set_admin_role_trigger ON auth.users;
CREATE TRIGGER set_admin_role_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_role();

-- =====================================================
-- ADMIN ACCESS POLICIES
-- =====================================================

-- Update existing RLS policies to use proper admin check
DROP POLICY IF EXISTS "Admins can read all submissions" ON intake_forms;
DROP POLICY IF EXISTS "Admins can update all submissions" ON intake_forms;
DROP POLICY IF EXISTS "Admins can read all questionnaires" ON vehicle_questionnaire;
DROP POLICY IF EXISTS "Admins can read all photos" ON intake_photos;
DROP POLICY IF EXISTS "Admins can update all photos" ON intake_photos;

-- Recreate admin policies with proper email check
CREATE POLICY "Admins can read all submissions"
ON intake_forms
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' LIKE '%@imxautogroup.com'
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can update all submissions"
ON intake_forms
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'email' LIKE '%@imxautogroup.com'
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  auth.jwt() ->> 'email' LIKE '%@imxautogroup.com'
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can read all questionnaires"
ON vehicle_questionnaire
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' LIKE '%@imxautogroup.com'
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can read all photos"
ON intake_photos
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' LIKE '%@imxautogroup.com'
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can update all photos"
ON intake_photos
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'email' LIKE '%@imxautogroup.com'
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  auth.jwt() ->> 'email' LIKE '%@imxautogroup.com'
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- =====================================================
-- ADMIN DASHBOARD VIEWS
-- =====================================================

-- Create view for admin dashboard statistics
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM intake_forms) as total_submissions,
  (SELECT COUNT(*) FROM intake_forms WHERE status = 'in_progress') as pending_submissions,
  (SELECT COUNT(*) FROM intake_forms WHERE status = 'completed') as completed_submissions,
  (SELECT COUNT(*) FROM intake_photos) as total_photos,
  (SELECT COUNT(DISTINCT submission_id) FROM vehicle_questionnaire) as questionnaires_completed;

-- Grant access to admin users
GRANT SELECT ON admin_dashboard_stats TO authenticated;

-- Create RLS policy for admin dashboard stats
CREATE POLICY "Admins can view dashboard stats"
ON admin_dashboard_stats
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' LIKE '%@imxautogroup.com'
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- =====================================================
-- ADMIN FUNCTIONS
-- =====================================================

-- Function to get all submissions for admin
CREATE OR REPLACE FUNCTION get_admin_submissions()
RETURNS TABLE (
  submission_id text,
  first_name text,
  last_name text,
  phone_number text,
  vehicle_year text,
  make text,
  model text,
  ownership text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  photos_count bigint,
  questionnaire_completed boolean
) AS $$
BEGIN
  -- Check if user is admin
  IF NOT (
    auth.jwt() ->> 'email' LIKE '%@imxautogroup.com'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    f.submission_id,
    f.first_name,
    f.last_name,
    f.phone_number,
    f.vehicle_year,
    f.make,
    f.model,
    f.ownership,
    COALESCE(f.status, 'in_progress') as status,
    f.created_at,
    f.updated_at,
    COALESCE(p.photo_count, 0) as photos_count,
    CASE WHEN q.submission_id IS NOT NULL THEN true ELSE false END as questionnaire_completed
  FROM intake_forms f
  LEFT JOIN (
    SELECT submission_id, COUNT(*) as photo_count
    FROM intake_photos
    GROUP BY submission_id
  ) p ON f.submission_id = p.submission_id
  LEFT JOIN (
    SELECT DISTINCT submission_id
    FROM vehicle_questionnaire
  ) q ON f.submission_id = q.submission_id
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_admin_submissions() TO authenticated;

-- =====================================================
-- EMAIL DOMAIN RESTRICTION
-- =====================================================

-- Function to validate admin email domains
CREATE OR REPLACE FUNCTION validate_admin_email()
RETURNS trigger AS $$
BEGIN
  -- Only allow @imxautogroup.com emails for admin accounts
  IF NEW.raw_user_meta_data ->> 'role' = 'admin' 
     AND NEW.email NOT LIKE '%@imxautogroup.com' THEN
    RAISE EXCEPTION 'Admin accounts must use @imxautogroup.com email addresses';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to validate admin emails
DROP TRIGGER IF EXISTS validate_admin_email_trigger ON auth.users;
CREATE TRIGGER validate_admin_email_trigger
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION validate_admin_email();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Test admin functions
SELECT 'Admin authentication setup completed!' as status;

-- Show admin-related policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE policyname LIKE '%admin%' OR policyname LIKE '%Admin%'
ORDER BY tablename, policyname;

-- Show created functions
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name IN ('is_admin', 'set_admin_role', 'get_admin_submissions', 'validate_admin_email')
ORDER BY routine_name;