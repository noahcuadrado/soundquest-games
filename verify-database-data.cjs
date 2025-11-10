const { Client } = require('pg');

async function verifyData() {
  const connectionString = process.env.NEON_DATABASE_URL || 
    'postgresql://neondb_owner:npg_w9ADg2ukjetN@ep-noisy-pond-adpc2mvs-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('📊 Verifying data in interactive_progress table...\n');
    
    // Get all records
    const result = await client.query(`
      SELECT 
        chat_id,
        native_language,
        target_language,
        current_step,
        steps_visited,
        is_completed,
        completion_percentage,
        created_at,
        updated_at
      FROM interactive_progress
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    
    if (result.rows.length === 0) {
      console.log('ℹ️  No records found in the database yet.');
      return;
    }
    
    console.log(`Found ${result.rows.length} record(s):\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. Chat ID: ${row.chat_id}`);
      console.log(`   Languages: ${row.native_language} → ${row.target_language}`);
      console.log(`   Current Step: ${row.current_step}`);
      console.log(`   Steps Visited: [${row.steps_visited.join(', ')}]`);
      console.log(`   Completion: ${row.completion_percentage}%`);
      console.log(`   Completed: ${row.is_completed}`);
      console.log(`   Created: ${new Date(row.created_at).toLocaleString()}`);
      console.log(`   Updated: ${new Date(row.updated_at).toLocaleString()}`);
      console.log('');
    });
    
    console.log('✅ Database verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyData();