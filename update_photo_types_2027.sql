-- Update the photo type constraint to include the new types: back_left_deck and back_right_deck
-- Run this in your Supabase SQL Editor

-- 1. Drop the existing constraint
ALTER TABLE intake_photos DROP CONSTRAINT IF EXISTS intake_photos_photo_type_check;

-- 2. Add the updated constraint with the two new photo types
ALTER TABLE intake_photos 
ADD CONSTRAINT intake_photos_photo_type_check 
CHECK (photo_type IN (
  'front_view',
  'exterior_rear_view',
  'exterior_left_door_panel',
  'exterior_trunk_cargo_area',
  'interior_front_seats',
  'interior_driver_side_dashboard',
  'interior_rear_door_open_view',
  'interior_rear_seat_area',
  'odometer_reading',
  'engine_compartment',
  'wheels_tires',
  'back_left_deck',
  'back_right_deck',
  'profile',
  'document'
));

-- Verify the update
DO $$ 
BEGIN
  RAISE NOTICE 'Photo type constraint updated successfully to include 2027 adjustments.';
END $$;
