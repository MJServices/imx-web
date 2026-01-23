-- =====================================================
-- IMX AUTO GROUP - DATABASE RESTORATION SCRIPT
-- =====================================================
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- intake_forms table
CREATE TABLE IF NOT EXISTS intake_forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    vehicle_year TEXT,
    make TEXT,
    model TEXT,
    ownership TEXT,
    status TEXT DEFAULT 'in_progress',
    current_mileage TEXT,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- vehicle_questionnaire table
CREATE TABLE IF NOT EXISTS vehicle_questionnaire (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    selected_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(submission_id, question_id)
);

-- intake_photos table
CREATE TABLE IF NOT EXISTS intake_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id TEXT NOT NULL,
    photo_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(submission_id, photo_type)
);

-- 3. INDICES
CREATE INDEX IF NOT EXISTS idx_intake_forms_submission_id ON intake_forms(submission_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_questionnaire_submission_id ON vehicle_questionnaire(submission_id);
CREATE INDEX IF NOT EXISTS idx_intake_photos_submission_id ON intake_photos(submission_id);

-- 4. ROW LEVEL SECURITY (RLS)

-- Enable RLS on all tables
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_questionnaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_photos ENABLE ROW LEVEL SECURITY;

-- 4a. intake_forms policies
DROP POLICY IF EXISTS "Enable insert for all users" ON intake_forms;
CREATE POLICY "Enable insert for all users" ON intake_forms 
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read for all users" ON intake_forms;
CREATE POLICY "Enable read for all users" ON intake_forms 
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Enable update for all users" ON intake_forms;
CREATE POLICY "Enable update for all users" ON intake_forms 
FOR UPDATE TO public USING (true) WITH CHECK (true);

-- 4b. vehicle_questionnaire policies
DROP POLICY IF EXISTS "Enable all access for all users" ON vehicle_questionnaire;
CREATE POLICY "Enable all access for all users" ON vehicle_questionnaire 
FOR ALL TO public USING (true) WITH CHECK (true);

-- 4c. intake_photos policies
DROP POLICY IF EXISTS "Enable all access for all users" ON intake_photos;
CREATE POLICY "Enable all access for all users" ON intake_photos 
FOR ALL TO public USING (true) WITH CHECK (true);

-- 4d. Admin Policies (Restricted to @imxautogroup.com)
-- Note: The above policies are permissive to allow the intake form to work without auth.
-- If you want to restrict Admin Panel access strictly:
/*
CREATE POLICY "Admin only read" ON intake_forms
FOR SELECT TO authenticated
USING (auth.jwt() ->> 'email' LIKE '%@imxautogroup.com');
*/

-- 5. STORAGE SETUP

-- Note: In some Supabase environments, you cannot ALTER storage.objects via SQL.
-- If the following section fails, please set Storage policies via the Dashboard UI.

-- Create the intake-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'intake-photos',
  'intake-photos', 
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

-- Storage RLS Policies
-- We wrap these in a DO block to prevent the whole script from failing if permissions are tight
DO $$
BEGIN
    -- Only attempt to create policies if you have permission
    -- If this fails, use the Dashboard UI: Storage -> Policies -> intake-photos
    EXECUTE 'DROP POLICY IF EXISTS "Public Upload" ON storage.objects';
    EXECUTE 'CREATE POLICY "Public Upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = ''intake-photos'')';
    
    EXECUTE 'DROP POLICY IF EXISTS "Public Access" ON storage.objects';
    EXECUTE 'CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = ''intake-photos'')';
    
    EXECUTE 'DROP POLICY IF EXISTS "Public Delete" ON storage.objects';
    EXECUTE 'CREATE POLICY "Public Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = ''intake-photos'')';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not set storage policies via SQL. Please set them manually in the Dashboard.';
END $$;

-- SUCCESS MESSAGE
SELECT 'Database schema restoration complete!' as status;
