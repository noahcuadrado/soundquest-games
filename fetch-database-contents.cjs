const { Client } = require('pg');

async function fetchDatabaseContents() {
  const connectionString = process.env.NEON_DATABASE_URL || 
    'postgresql://neondb_owner:npg_w9ADg2ukjetN@ep-noisy-pond-adpc2mvs-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('📊 Fetching database contents...\n');
    
    // Check if target_language_lessons table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'target_language_lessons'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ target_language_lessons table does not exist yet');
      console.log('Creating table...');
      
      // Create the table
      await client.query(`
        CREATE TABLE IF NOT EXISTS target_language_lessons (
          id SERIAL PRIMARY KEY,
          language_name VARCHAR(100) NOT NULL,
          language_code VARCHAR(10) NOT NULL,
          phoneme_ipa VARCHAR(20) NOT NULL,
          audio_url TEXT,
          description TEXT,
          difficulty_level VARCHAR(20) DEFAULT 'medium',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(language_code, phoneme_ipa)
        );
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_target_language_lessons_code ON target_language_lessons(language_code);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_target_language_lessons_difficulty ON target_language_lessons(difficulty_level);
      `);
      
      console.log('✅ Table created successfully');
    }
    
    // Fetch all data from target_language_lessons
    const result = await client.query(`
      SELECT language_name, language_code, phoneme_ipa, audio_url, description, difficulty_level
      FROM target_language_lessons
      ORDER BY language_name, difficulty_level, phoneme_ipa
    `);
    
    if (result.rows.length === 0) {
      console.log('ℹ️  No data found in target_language_lessons table');
      return;
    }
    
    console.log(`Found ${result.rows.length} phoneme records:\n`);
    
    // Group by language
    const groupedData = {};
    result.rows.forEach(row => {
      const key = `${row.language_name} (${row.language_code})`;
      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      groupedData[key].push(row);
    });
    
    Object.entries(groupedData).forEach(([language, phonemes]) => {
      console.log(`📚 ${language} - ${phonemes.length} phonemes:`);
      phonemes.forEach(phoneme => {
        const audioStatus = phoneme.audio_url ? '🔊' : '❌';
        console.log(`  ${audioStatus} ${phoneme.phoneme_ipa} (${phoneme.difficulty_level}) - ${phoneme.description || 'No description'}`);
        if (phoneme.audio_url) {
          console.log(`      Audio: ${phoneme.audio_url}`);
        }
      });
      console.log('');
    });
    
    // Show summary
    const summary = await client.query(`
      SELECT language_name, language_code, COUNT(*) as phoneme_count,
             COUNT(audio_url) as with_audio,
             COUNT(*) - COUNT(audio_url) as without_audio
      FROM target_language_lessons
      GROUP BY language_name, language_code
      ORDER BY language_name
    `);
    
    console.log('📋 Summary:');
    summary.rows.forEach(row => {
      console.log(`  - ${row.language_name} (${row.language_code}): ${row.phoneme_count} phonemes (${row.with_audio} with audio, ${row.without_audio} without)`);
    });
    
    console.log('\n✅ Database fetch complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fetchDatabaseContents();