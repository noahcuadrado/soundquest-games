const { Client } = require('pg');

async function testConnection() {
  const connectionString = process.env.NEON_DATABASE_URL || 
    'postgresql://neondb_owner:npg_w9ADg2ukjetN@ep-noisy-pond-adpc2mvs-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
  
  console.log('Testing connection to Neon database...');
  console.log('Connection string:', connectionString.replace(/:[^:@]+@/, ':****@'));
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Successfully connected to database!');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query test successful:', result.rows[0].current_time);
    
    // Create interactive_progress table
    console.log('\nCreating interactive_progress table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS interactive_progress (
        id SERIAL PRIMARY KEY,
        chat_id VARCHAR(255) UNIQUE NOT NULL,
        native_language VARCHAR(100) NOT NULL,
        target_language VARCHAR(100) NOT NULL,
        current_step INTEGER DEFAULT 0,
        steps_visited INTEGER[] DEFAULT '{}'::int[],
        steps_not_visited INTEGER[] DEFAULT '{}'::int[],
        is_completed BOOLEAN DEFAULT FALSE,
        onboarding_complete BOOLEAN DEFAULT FALSE,
        completion_percentage DECIMAL(5,2) DEFAULT 0.00,
        session_data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Table created/verified successfully!');
    
    // Create indexes
    console.log('\nCreating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_interactive_progress_chat_id ON interactive_progress(chat_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_interactive_progress_completed ON interactive_progress(is_completed);
    `);
    console.log('✅ Indexes created successfully!');
    
    // Check if table exists and show structure
    const tableCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'interactive_progress'
      ORDER BY ordinal_position;
    `);
    console.log('\n📋 Table structure:');
    tableCheck.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n✅ All tests passed! Database is ready to use.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection();