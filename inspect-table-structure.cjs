const { Client } = require('pg');

async function inspectTableStructure() {
  const connectionString = process.env.NEON_DATABASE_URL || 
    'postgresql://neondb_owner:npg_w9ADg2ukjetN@ep-noisy-pond-adpc2mvs-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('📊 Inspecting database structure...\n');
    
    // List all tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Available tables:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    console.log('');
    
    // Check if target_language_lessons exists
    const targetTable = tables.rows.find(row => row.table_name === 'target_language_lessons');
    
    if (targetTable) {
      console.log('🔍 target_language_lessons table structure:');
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'target_language_lessons'
        ORDER BY ordinal_position;
      `);
      
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Get sample data
      const sampleData = await client.query(`
        SELECT * FROM target_language_lessons LIMIT 5;
      `);
      
      console.log(`\n📄 Sample data (${sampleData.rows.length} rows):`);
      sampleData.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${JSON.stringify(row, null, 2)}`);
      });
      
    } else {
      console.log('❌ target_language_lessons table not found');
      
      // Look for similar table names
      const similarTables = tables.rows.filter(row => 
        row.table_name.includes('language') || 
        row.table_name.includes('lesson') ||
        row.table_name.includes('ipa') ||
        row.table_name.includes('phoneme')
      );
      
      if (similarTables.length > 0) {
        console.log('\n🔍 Found similar tables:');
        for (const table of similarTables) {
          console.log(`\n📋 ${table.table_name} structure:`);
          const columns = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = $1
            ORDER BY ordinal_position;
          `, [table.table_name]);
          
          columns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
          });
          
          // Get sample data
          const sampleData = await client.query(`
            SELECT * FROM ${table.table_name} LIMIT 3;
          `);
          
          if (sampleData.rows.length > 0) {
            console.log(`  Sample data:`);
            sampleData.rows.forEach((row, index) => {
              console.log(`    ${index + 1}. ${JSON.stringify(row, null, 2)}`);
            });
          }
        }
      }
    }
    
    console.log('\n✅ Inspection complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

inspectTableStructure();