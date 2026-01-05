-- STORAGE POLICIES FIX SQL QUERY
-- This will create the storage bucket and set up proper policies
-- Copy and paste this entire block into your Supabase SQL Editor

-- Create the storage bucket for intake photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'intake-photos',
  'intake-photos', 
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- Remove any existing storage policies for this bucket
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "intake_photos_upload" ON storage.objects;
DROP POLICY IF EXISTS "intake_photos_select" ON storage.objects;

-- Create policy for uploading files to intake-photos bucket
CREATE POLICY "intake_photos_upload" ON storage.objects
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'intake-photos');

-- Create policy for accessing/downloading files from intake-photos bucket
CREATE POLICY "intake_photos_select" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'intake-photos');

-- Create policy for updating files (optional, for file replacements)
CREATE POLICY "intake_photos_update" ON storage.objects
FOR UPDATE 
TO public
USING (bucket_id = 'intake-photos')
WITH CHECK (bucket_id = 'intake-photos');

-- Create policy for deleting files (for remove functionality)
CREATE POLICY "intake_photos_delete" ON storage.objects
FOR DELETE 
TO public
USING (bucket_id = 'intake-photos');

-- Verify the setup
SELECT 
  'Storage bucket and policies created successfully' as status,
  (SELECT count(*) FROM storage.buckets WHERE id = 'intake-photos') as bucket_exists,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE 'intake_photos_%') as policies_count;