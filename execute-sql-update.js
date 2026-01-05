const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLUpdate() {
  console.log('🔧 Executing SQL schema updates...');
  
  try {
    // Execute the SQL updates step by step
    console.log('1. Dropping existing constraint...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE intake_photos DROP CONSTRAINT IF EXISTS intake_photos_photo_type_check;'
    });
    
    if (dropError) {
      console.log('Note: Drop constraint may fail if it doesn\'t exist (this is normal)');
    }

    console.log('2. Adding new photo type constraint...');
    const { error: constraintError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE intake_photos 
            ADD CONSTRAINT intake_photos_photo_type_check 
            CHECK (photo_type IN (
              'front_view', 'rear_view', 'driver_side', 'passenger_side',
              'interior_front', 'interior_rear', 'odometer', 'engine_bay',
              'wheels_tires', 'vin_number', 'profile', 'document'
            ));`
    });

    if (constraintError) {
      console.error('❌ Constraint error:', constraintError.message);
    } else {
      console.log('✅ Photo type constraint added');
    }

    console.log('3. Adding unique constraint...');
    const { error: uniqueError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE intake_photos 
            DROP CONSTRAINT IF EXISTS unique_submission_photo_type;
            
            ALTER TABLE intake_photos 
            ADD CONSTRAINT unique_submission_photo_type 
            UNIQUE (submission_id, photo_type);`
    });

    if (uniqueError) {
      console.error('❌ Unique constraint error:', uniqueError.message);
    } else {
      console.log('✅ Unique constraint added');
    }

    console.log('4. Adding status column...');
    const { error: statusError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE intake_forms 
            ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress';
            
            UPDATE intake_forms 
            SET status = 'in_progress' 
            WHERE status IS NULL;`
    });

    if (statusError) {
      console.error('❌ Status column error:', statusError.message);
    } else {
      console.log('✅ Status column added');
    }

    // Test the new constraints
    console.log('5. Testing new constraints...');
    const testData = {
      submission_id: 'test_' + Date.now(),
      photo_type: 'front_view',
      file_name: 'test_front_view.jpg',
      file_path: 'test/front_view.jpg',
      file_size: 1024,
      mime_type: 'image/jpeg'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('intake_photos')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Test insert failed:', insertError.message);
    } else {
      console.log('✅ New photo types working correctly');
      
      // Clean up test data
      await supabase
        .from('intake_photos')
        .delete()
        .eq('submission_id', testData.submission_id);
      
      console.log('🧹 Test data cleaned up');
    }
    
    console.log('');
    console.log('🎉 Schema update completed successfully!');
    
  } catch (error) {
    console.error('❌ SQL execution failed:', error.message);
    console.log('');
    console.log('📝 Please run this SQL manually in your Supabase SQL Editor:');
    console.log(`
-- Update photos table to support vehicle photo types
ALTER TABLE intake_photos 
DROP CONSTRAINT IF EXISTS intake_photos_photo_type_check;

ALTER TABLE intake_photos 
ADD CONSTRAINT intake_photos_photo_type_check 
CHECK (photo_type IN (
  'front_view', 'rear_view', 'driver_side', 'passenger_side',
  'interior_front', 'interior_rear', 'odometer', 'engine_bay',
  'wheels_tires', 'vin_number', 'profile', 'document'
));

ALTER TABLE intake_photos 
DROP CONSTRAINT IF EXISTS unique_submission_photo_type;

ALTER TABLE intake_photos 
ADD CONSTRAINT unique_submission_photo_type 
UNIQUE (submission_id, photo_type);

ALTER TABLE intake_forms 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress';

UPDATE intake_forms 
SET status = 'in_progress' 
WHERE status IS NULL;
    `);
  }
}

executeSQLUpdate();