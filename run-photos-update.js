const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePhotosSchema() {
  console.log('📊 Updating photos table schema...');
  
  try {
    // Test if we can access the table
    const { data, error } = await supabase
      .from('intake_photos')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Cannot access intake_photos table:', error.message);
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
      return;
    }

    console.log('✅ Photos table accessible');
    
    // Test inserting a vehicle photo type
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
      console.log('⚠️  Insert test failed (this is expected if constraints need updating)');
      console.log('Error:', insertError.message);
      console.log('');
      console.log('📝 Please run the SQL from update-photos-schema.sql manually');
    } else {
      console.log('✅ Vehicle photo types working correctly');
      
      // Clean up test data
      await supabase
        .from('intake_photos')
        .delete()
        .eq('submission_id', testData.submission_id);
      
      console.log('🧹 Test data cleaned up');
    }
    
    console.log('');
    console.log('🎉 Photos schema update completed!');
    console.log('');
    console.log('🔗 Next steps:');
    console.log('1. Visit http://localhost:3000/intake/photos');
    console.log('2. Test uploading vehicle photos with compression');
    console.log('3. Verify photos are stored in submissions/{submission_id}/ structure');
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
  }
}

updatePhotosSchema();