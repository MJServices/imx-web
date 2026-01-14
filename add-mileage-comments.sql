-- Migration to add mileage and comments to intake_forms table

-- Add current_mileage column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intake_forms' AND column_name = 'current_mileage') THEN
        ALTER TABLE intake_forms ADD COLUMN current_mileage TEXT;
    END IF;
END $$;

-- Add comments column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intake_forms' AND column_name = 'comments') THEN
        ALTER TABLE intake_forms ADD COLUMN comments TEXT;
    END IF;
END $$;

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'intake_forms' 
AND column_name IN ('current_mileage', 'comments');
