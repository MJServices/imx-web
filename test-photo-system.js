const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPhotoSystem() {
  console.log('🧪 Testing Photo Upload System...');
  console.log('');
  
  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    const { data: dbTest, error: dbError } = await supabase
      .from('intake_photos')
      .select('count')
      .limit(1);

    if (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
      return;
    }
    console.log('✅ Database connection successful');

    // 2. Test storage bucket
    console.log('2. Testing storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Storage access failed:', bucketError.message);
      return;
    }

    const intakePhotosBucket = buckets.find(bucket => bucket.name === 'intake-photos');
    if (!intakePhotosBucket) {
      console.log('⚠️  "intake-photos" bucket not found');
      console.log('📝 Please create the "intake-photos" bucket in your Supabase Storage dashboard');
    } else {
      console.log('✅ Storage bucket "intake-photos" exists');
    }

    // 3. Test vehicle photo types constraint
    console.log('3. Testing vehicle photo types...');
    const testSubmissionId = 'test_' + Date.now();
    
    // Test valid photo type
    const { data: validInsert, error: validError } = await supabase
      .from('intake_photos')
      .insert({
        submission_id: testSubmissionId,
        photo_type: 'front_view',
        file_name: 'test_front_view.jpg',
        file_path: `submissions/${testSubmissionId}/front_view.jpg`,
        file_size: 1024,
        mime_type: 'image/jpeg'
      })
      .select();

    if (validError) {
      console.error('❌ Valid photo type insert failed:', validError.message);
      console.log('📝 Please run the SQL from update-photos-schema.sql in your Supabase SQL Editor');
      return;
    } else {
      console.log('✅ Vehicle photo types constraint working');
    }

    // Test invalid photo type (should fail)
    const { data: invalidInsert, error: invalidError } = await supabase
      .from('intake_photos')
      .insert({
        submission_id: testSubmissionId + '_invalid',
        photo_type: 'invalid_type',
        file_name: 'test_invalid.jpg',
        file_path: `submissions/${testSubmissionId}/invalid.jpg`,
        file_size: 1024,
        mime_type: 'image/jpeg'
      });

    if (invalidError) {
      console.log('✅ Invalid photo type correctly rejected');
    } else {
      console.log('⚠️  Invalid photo type was accepted (constraint may not be active)');
    }

    // 4. Test unique constraint
    console.log('4. Testing unique constraint...');
    const { data: duplicateInsert, error: duplicateError } = await supabase
      .from('intake_photos')
      .insert({
        submission_id: testSubmissionId,
        photo_type: 'front_view', // Same as first insert
        file_name: 'test_front_view_2.jpg',
        file_path: `submissions/${testSubmissionId}/front_view_2.jpg`,
        file_size: 2048,
        mime_type: 'image/jpeg'
      });

    if (duplicateError) {
      console.log('✅ Unique constraint working (duplicate photo type rejected)');
    } else {
      console.log('⚠️  Duplicate photo type was accepted (unique constraint may not be active)');
    }

    // Clean up test data
    console.log('5. Cleaning up test data...');
    await supabase
      .from('intake_photos')
      .delete()
      .like('submission_id', 'test_%');
    
    console.log('✅ Test data cleaned up');

    console.log('');
    console.log('🎉 Photo system test completed!');
    console.log('');
    console.log('📋 Summary:');
    console.log('- Database: ✅ Connected');
    console.log('- Storage: ' + (intakePhotosBucket ? '✅ Ready' : '⚠️  Needs setup'));
    console.log('- Photo Types: ' + (validError ? '⚠️  Needs SQL update' : '✅ Working'));
    console.log('');
    console.log('🔗 Next steps:');
    if (!intakePhotosBucket) {
      console.log('1. Create "intake-photos" bucket in Supabase Storage');
    }
    if (validError) {
      console.log('2. Run SQL from update-photos-schema.sql');
    }
    console.log('3. Visit http://localhost:3000/intake/photos to test upload');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPhotoSystem();