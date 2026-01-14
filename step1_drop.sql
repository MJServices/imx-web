-- STEP 1: Run this query first to remove the blocking rule.
ALTER TABLE intake_photos DROP CONSTRAINT IF EXISTS intake_photos_photo_type_check CASCADE;
