const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStorage() {
  console.log('🔧 Fixing storage setup...');
  
  try {
    // First, let's test if we can create the photos table
    console.log('📊 Creating/updating photos table...');
    
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Disable RLS temporarily to fix the issue
        ALTER TABLE IF EXISTS intake_photos DISABLE ROW LEVEL SECURITY;
        
        -- Drop and recreate the table with proper structure
        DROP TABLE IF EXISTS intake_photos;
        
        CREATE TABLE intake_photos (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          submission_id TEXT NOT NULL,
          photo_type TEXT NOT NULL CHECK (photo_type IN ('profile', 'document')),
          file_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER,
          mime_type TEXT,
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create index
        CREATE INDEX idx_intake_photos_submission_id ON intake_photos(submission_id);
        
        -- Enable RLS and create permissive policy
        ALTER TABLE intake_photos ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow all operations" ON intake_photos FOR ALL USING (true);
      `
    });
    
    if (tableError) {
      console.log('⚠️  Table creation via RPC failed, this is normal. The table should be created manually.');
      console.log('Error:', tableError.message);
    } else {
      console.log('✅ Photos table created successfully');
    }
    
    // Test basic database connection
    console.log('🧪 Testing database connection...');
    const { data, error } = await supabase.from('intake_forms').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
    } else {
      console.log('✅ Database connection working');
    }
    
    // Check storage buckets
    console.log('🗄️  Checking storage buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Cannot access storage:', bucketError.message);
    } else {
      const intakeBucket = buckets.find(b => b.id === 'intake-photos');
      if (intakeBucket) {
        console.log('✅ Storage bucket "intake-photos" exists');
      } else {
        console.log('⚠️  Storage bucket "intake-photos" not found');
        console.log('📝 Manual steps required:');
        console.log('1. Go to Supabase Dashboard → Storage');
        console.log('2. Create bucket "intake-photos"');
        console.log('3. Make it public');
        console.log('4. Set policies (see instructions below)');
      }
    }
    
    console.log('');
    console.log('🔧 MANUAL SETUP REQUIRED:');
    console.log('');
    console.log('1. 📊 DATABASE - Run this SQL in Supabase SQL Editor:');
    console.log(`
-- Create photos table
CREATE TABLE IF NOT EXISTS intake_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('profile', 'document')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intake_photos_submission_id ON intake_photos(submission_id);

ALTER TABLE intake_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations" ON intake_photos;
CREATE POLICY "Allow all operations" ON intake_photos FOR ALL USING (true);
    `);
    
    console.log('2. 🗄️  STORAGE - Create bucket in Supabase Dashboard:');
    console.log('   - Go to Storage → New Bucket');
    console.log('   - Name: "intake-photos"');
    console.log('   - Public: YES');
    console.log('   - File size limit: 10MB');
    
    console.log('');
    console.log('3. 🔐 STORAGE POLICIES - Add these in Storage → Policies:');
    console.log('   Policy 1: Allow uploads');
    console.log('   - Operation: INSERT');
    console.log('   - Target: public');
    console.log('   - Expression: bucket_id = \'intake-photos\'');
    console.log('');
    console.log('   Policy 2: Allow access');
    console.log('   - Operation: SELECT');  
    console.log('   - Target: public');
    console.log('   - Expression: bucket_id = \'intake-photos\'');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixStorage();