-- Update photos table to support vehicle photo types
-- Run this SQL in your Supabase SQL Editor

-- First, let's modify the existing table to support the new structure
ALTER TABLE intake_photos 
DROP CONSTRAINT IF EXISTS intake_photos_photo_type_check;

-- Add new constraint for vehicle photo types
ALTER TABLE intake_photos 
ADD CONSTRAINT intake_photos_photo_type_check 
CHECK (photo_type IN (
  'front_view', 'rear_view', 'driver_side', 'passenger_side',
  'interior_front', 'interior_rear', 'odometer', 'engine_bay',
  'wheels_tires', 'vin_number', 'profile', 'document'
));

-- Add unique constraint for submission_id + photo_type (one photo per type per submission)
ALTER TABLE intake_photos 
DROP CONSTRAINT IF EXISTS unique_submission_photo_type;

ALTER TABLE intake_photos 
ADD CONSTRAINT unique_submission_photo_type 
UNIQUE (submission_id, photo_type);

-- Add status column to intake_forms if it doesn't exist
ALTER TABLE intake_forms 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress';

-- Update existing records to have proper status
UPDATE intake_forms 
SET status = 'in_progress' 
WHERE status IS NULL;

-- Verify the changes
SELECT 'Photos table updated successfully' as status;