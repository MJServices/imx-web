const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSchema() {
  console.log('📊 Updating database schema...');
  
  try {
    // Create photos table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
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

        DROP POLICY IF EXISTS "Allow all operations on intake_photos" ON intake_photos;
        CREATE POLICY "Allow all operations on intake_photos" ON intake_photos FOR ALL USING (true);
      `
    });
    
    if (error) {
      console.error('❌ Schema update failed:', error.message);
      return;
    }
    
    console.log('✅ Database schema updated successfully!');
    console.log('');
    console.log('📝 Manual Steps Required:');
    console.log('1. Go to your Supabase Dashboard → Storage');
    console.log('2. Create a new bucket called "intake-photos"');
    console.log('3. Make it public');
    console.log('4. Set file size limit to 10MB');
    console.log('5. Test the photo upload at http://localhost:3000/intake/photos');
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
  }
}

updateSchema();