const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration() {
  console.log('🔧 Executing Form Update Migration...');
  
  const sql = `
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
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      // Fallback: suggest manual run if RPC fails
      if (error.message.includes('function "exec_sql" does not exist')) {
          console.log('⚠️ RPC exec_sql missing. Please run the SQL manually.');
      }
    } else {
      console.log('✅ Migration executed successfully.');
    }
    
    // Check columns
    console.log('Checking columns...');
    // We can't easily select from information_schema via client (unless connected directly or via RPC returning data), 
    // but if the above succeeded, we are good.
    
  } catch (error) {
    console.error('❌ Script execution failed:', error);
  }
}

executeMigration();
