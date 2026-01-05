const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createQuestionnaireTable() {
  console.log('📊 Creating vehicle questionnaire table...');
  
  try {
    // Create the table using a direct query
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS vehicle_questionnaire (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          submission_id TEXT NOT NULL,
          question_id TEXT NOT NULL,
          question_text TEXT NOT NULL,
          selected_answer TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(submission_id, question_id)
        );

        CREATE INDEX IF NOT EXISTS idx_vehicle_questionnaire_submission_id ON vehicle_questionnaire(submission_id);

        ALTER TABLE vehicle_questionnaire ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Allow all operations on vehicle_questionnaire" ON vehicle_questionnaire;
        CREATE POLICY "Allow all operations on vehicle_questionnaire" ON vehicle_questionnaire
        FOR ALL 
        TO public
        USING (true)
        WITH CHECK (true);
      `
    });
    
    if (error) {
      console.log('⚠️  Table creation via RPC failed, this is normal. Please run the SQL manually.');
      console.log('Error:', error.message);
    } else {
      console.log('✅ Vehicle questionnaire table created successfully');
    }
    
    // Test the table by trying to insert a sample record
    console.log('🧪 Testing table functionality...');
    const testData = {
      submission_id: 'test_' + Date.now(),
      question_id: 'q1',
      question_text: 'Test question',
      selected_answer: 'Test answer'
    };

    const { data, error: insertError } = await supabase
      .from('vehicle_questionnaire')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Table test failed:', insertError.message);
      console.log('');
      console.log('📝 Please run this SQL manually in your Supabase SQL Editor:');
      console.log(`
CREATE TABLE IF NOT EXISTS vehicle_questionnaire (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  selected_answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_questionnaire_submission_id ON vehicle_questionnaire(submission_id);

ALTER TABLE vehicle_questionnaire ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on vehicle_questionnaire" ON vehicle_questionnaire;
CREATE POLICY "Allow all operations on vehicle_questionnaire" ON vehicle_questionnaire
FOR ALL 
TO public
USING (true)
WITH CHECK (true);
      `);
    } else {
      console.log('✅ Table test successful!');
      
      // Clean up test data
      await supabase
        .from('vehicle_questionnaire')
        .delete()
        .eq('submission_id', testData.submission_id);
      
      console.log('🧹 Test data cleaned up');
    }
    
    console.log('');
    console.log('🎉 Vehicle questionnaire setup completed!');
    console.log('');
    console.log('🔗 Next steps:');
    console.log('1. Visit http://localhost:3000/intake/questions');
    console.log('2. Complete the form and proceed to questionnaire');
    console.log('3. Test the 15 MCQ questions with auto-save');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

createQuestionnaireTable();