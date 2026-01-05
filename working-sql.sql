-- WORKING SQL QUERY FOR PHOTO UPLOAD
-- Copy and paste this entire block into your Supabase SQL Editor

-- Create photos table
CREATE TABLE IF NOT EXISTS intake_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('profile', 'document')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_intake_photos_submission_id ON intake_photos(submission_id);

-- Enable Row Level Security
ALTER TABLE intake_photos ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies
DROP POLICY IF EXISTS "Allow all operations" ON intake_photos;
DROP POLICY IF EXISTS "Allow all operations on intake_photos" ON intake_photos;

-- Create a simple policy that allows all operations
CREATE POLICY "Enable all operations for intake_photos" ON intake_photos
FOR ALL 
TO public
USING (true)
WITH CHECK (true);

-- Verify the table was created
SELECT 'intake_photos table created successfully' as status;