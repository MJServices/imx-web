const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const seedData = [
  {
    submission_id: 'seed_001',
    first_name: 'John',
    last_name: 'Doe',
    phone_number: '(555) 123-4567',
    vehicle_year: '2023',
    make: 'Toyota',
    model: 'Camry',
    ownership: 'Financed'
  },
  {
    submission_id: 'seed_002',
    first_name: 'Jane',
    last_name: 'Smith',
    phone_number: '(555) 987-6543',
    vehicle_year: '2022',
    make: 'Honda',
    model: 'Civic',
    ownership: 'Leased'
  },
  {
    submission_id: 'seed_003',
    first_name: 'Mike',
    last_name: 'Johnson',
    phone_number: '(555) 456-7890',
    vehicle_year: '2021',
    make: 'Ford',
    model: 'F-150',
    ownership: 'Paid Off'
  },
  {
    submission_id: 'seed_004',
    first_name: 'Sarah',
    last_name: 'Williams',
    phone_number: '(555) 321-0987',
    vehicle_year: '2024',
    make: 'BMW',
    model: '3 Series',
    ownership: 'Financed'
  },
  {
    submission_id: 'seed_005',
    first_name: 'David',
    last_name: 'Brown',
    phone_number: '(555) 654-3210',
    vehicle_year: '2020',
    make: 'Mercedes-Benz',
    model: 'C-Class',
    ownership: 'Leased'
  }
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Test connection first
    console.log('🔗 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('intake_forms')
      .select('count')
      .limit(1);
    
    if (testError) {
      throw new Error(`Connection test failed: ${testError.message}`);
    }
    
    console.log('✅ Connection successful!');
    
    // Clear existing seed data
    console.log('🧹 Clearing existing seed data...');
    const { error: deleteError } = await supabase
      .from('intake_forms')
      .delete()
      .like('submission_id', 'seed_%');
    
    if (deleteError) {
      console.warn(`⚠️  Warning during cleanup: ${deleteError.message}`);
    }
    
    // Insert seed data
    console.log('📝 Inserting seed data...');
    const { data, error } = await supabase
      .from('intake_forms')
      .insert(seedData)
      .select();
    
    if (error) {
      throw new Error(`Insert failed: ${error.message}`);
    }
    
    console.log(`✅ Successfully inserted ${data.length} records!`);
    
    // Verify the data
    console.log('🔍 Verifying inserted data...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('intake_forms')
      .select('*')
      .like('submission_id', 'seed_%')
      .order('created_at', { ascending: true });
    
    if (verifyError) {
      throw new Error(`Verification failed: ${verifyError.message}`);
    }
    
    console.log(`✅ Verification complete! Found ${verifyData.length} records:`);
    console.log('');
    console.log('📊 Seeded Records:');
    console.log('==================');
    
    verifyData.forEach((record, index) => {
      console.log(`${index + 1}. ${record.first_name} ${record.last_name}`);
      console.log(`   Phone: ${record.phone_number}`);
      console.log(`   Vehicle: ${record.vehicle_year} ${record.make} ${record.model} (${record.ownership})`);
      console.log(`   ID: ${record.submission_id}`);
      console.log('');
    });
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('🔗 Next steps:');
    console.log('1. Visit http://localhost:3000/test-supabase to test the connection');
    console.log('2. Visit http://localhost:3000/intake/questions to test the form');
    console.log('3. Check your Supabase dashboard → Table Editor → intake_forms');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase();