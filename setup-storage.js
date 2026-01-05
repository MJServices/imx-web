const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  console.log('🗄️  Setting up Supabase Storage...');
  
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      return;
    }
    
    const bucketExists = buckets.some(bucket => bucket.id === 'intake-photos');
    
    if (bucketExists) {
      console.log('✅ Storage bucket "intake-photos" already exists');
    } else {
      // Create bucket
      const { data, error } = await supabase.storage.createBucket('intake-photos', {
        public: true,
        allowedMimeTypes: [
          'image/jpeg',
          'image/png', 
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (error) {
        console.error('❌ Error creating bucket:', error.message);
        return;
      }
      
      console.log('✅ Created storage bucket "intake-photos"');
    }
    
    // Test upload
    console.log('🧪 Testing file upload...');
    const testFile = Buffer.from('test file content');
    const testPath = 'test/test-file.txt';
    
    const { error: uploadError } = await supabase.storage
      .from('intake-photos')
      .upload(testPath, testFile, {
        contentType: 'text/plain',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message);
      return;
    }
    
    console.log('✅ Upload test successful');
    
    // Clean up test file
    await supabase.storage.from('intake-photos').remove([testPath]);
    console.log('🧹 Cleaned up test file');
    
    console.log('');
    console.log('🎉 Storage setup completed successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Run the updated SQL schema in your Supabase SQL Editor');
    console.log('2. Visit http://localhost:3000/intake/photos to test photo uploads');
    console.log('3. Check your Supabase Storage dashboard to see uploaded files');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupStorage();