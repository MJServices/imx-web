-- Add vin_number column to intake_forms table
ALTER TABLE intake_forms 
ADD COLUMN IF NOT EXISTS vin_number VARCHAR(17);

-- Add comment
COMMENT ON COLUMN intake_forms.vin_number IS 'Vehicle Identification Number (17 characters)';
