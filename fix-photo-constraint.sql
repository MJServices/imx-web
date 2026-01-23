-- Add unique constraint to intake_photos for submission_id and photo_type
-- This is required for the application's upsert logic to work properly

ALTER TABLE intake_photos 
ADD CONSTRAINT intake_photos_submission_id_photo_type_key 
UNIQUE (submission_id, photo_type);

-- Verify the constraint was added
SELECT 'Unique constraint added successfully to intake_photos' as status;
