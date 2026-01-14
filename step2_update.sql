-- STEP 2: Run this query AFTER Step 1 is successful.

-- Clean up data: Trim whitespace
UPDATE intake_photos SET photo_type = TRIM(photo_type);

-- Migrate old photo types to new ones
UPDATE intake_photos SET photo_type = 'exterior_rear_view' WHERE photo_type = 'rear_view';
UPDATE intake_photos SET photo_type = 'exterior_left_door_panel' WHERE photo_type = 'driver_side';
UPDATE intake_photos SET photo_type = 'exterior_left_door_panel' WHERE photo_type = 'driver_side_view'; 
UPDATE intake_photos SET photo_type = 'exterior_trunk_cargo_area' WHERE photo_type = 'passenger_side'; -- Mapping passenger side to cargo area simply to preserve it, or use 'document'
UPDATE intake_photos SET photo_type = 'interior_front_seats' WHERE photo_type = 'interior_front';
UPDATE intake_photos SET photo_type = 'interior_rear_seat_area' WHERE photo_type = 'interior_rear';
UPDATE intake_photos SET photo_type = 'odometer_reading' WHERE photo_type = 'odometer';
UPDATE intake_photos SET photo_type = 'engine_compartment' WHERE photo_type = 'engine_bay';

-- Safety Net: Convert REPL/unknown types to 'document'
UPDATE intake_photos 
SET photo_type = 'document' 
WHERE photo_type NOT IN (
  'engine_compartment',
  'exterior_left_door_panel',
  'exterior_rear_view',
  'exterior_trunk_cargo_area',
  'front_view',
  'interior_front_seats',
  'interior_driver_side_dashboard',
  'interior_rear_door_open_view',
  'interior_rear_seat_area',
  'odometer_reading',
  'wheels_tires',
  'profile',
  'document'
);

-- Apply the new constraint
ALTER TABLE intake_photos 
ADD CONSTRAINT intake_photos_photo_type_check 
CHECK (photo_type IN (
  'engine_compartment',
  'exterior_left_door_panel',
  'exterior_rear_view',
  'exterior_trunk_cargo_area',
  'front_view',
  'interior_front_seats',
  'interior_driver_side_dashboard',
  'interior_rear_door_open_view',
  'interior_rear_seat_area',
  'odometer_reading',
  'wheels_tires',
  'profile',
  'document'
));
