const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createStorageBucket() {
  console.log('🪣 Creating storage bucket...');
  console.log('');
  
  try {
    // Check existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Cannot access storage:', listError.message);
      console.log('');
      console.log('🔧 Manual Setup Required:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Click "Storage" in the left sidebar');
      console.log('3. Click "New Bucket"');
      console.log('4. Name: "intake-photos"');
      console.log('5. Check "Public bucket"');
      console.log('6. Click "Create bucket"');
      return;
    }

    console.log('📋 Current buckets:', buckets.map(b => b.name).join(', ') || 'None');

    // Check if intake-photos bucket exists
    const intakeBucket = buckets.find(bucket => bucket.name === 'intake-photos');
    
    if (intakeBucket) {
      console.log('✅ "intake-photos" bucket already exists');
      console.log('   - Public:', intakeBucket.public);
    } else {
      console.log('⚠️  "intake-photos" bucket not found');
      console.log('');
      console.log('🔧 Please create the bucket manually:');
      console.log('1. Go to Supabase Dashboard → Storage');
      console.log('2. Click "New Bucket"');
      console.log('3. Name: intake-photos');
      console.log('4. Check "Public bucket" ✅');
      console.log('5. Click "Create bucket"');
      console.log('');
      console.log('After creating the bucket, the photo upload will work!');
      return;
    }

    // Test upload to verify it works
    console.log('🧪 Testing upload...');
    const testPath = `test_${Date.now()}/test.txt`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('intake-photos')
      .upload(testPath, 'Test file content', {
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message);
      console.log('');
      console.log('🔧 This might be a permissions issue. Try:');
      console.log('1. Make sure the bucket is set to "Public"');
      console.log('2. Check Storage policies in Supabase Dashboard');
    } else {
      console.log('✅ Upload test successful!');
      
      // Clean up test file
      await supabase.storage.from('intake-photos').remove([testPath]);
      console.log('✅ Test file cleaned up');
    }

    console.log('');
    console.log('🎉 Storage setup complete!');
    console.log('📁 Ready to use: intake-photos bucket');
    console.log('🔗 Test at: http://localhost:3000/intake/photos');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

createStorageBucket();