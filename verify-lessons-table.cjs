const { Client } = require('pg');

async function verifyLessons() {
  const connectionString = process.env.NEON_DATABASE_URL || 
    'postgresql://neondb_owner:npg_w9ADg2ukjetN@ep-noisy-pond-adpc2mvs-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('📊 Verifying generated_lessons table...\n');
    
    // Get all cached lessons
    const result = await client.query(`
      SELECT 
        id,
        native_language,
        target_language,
        created_at,
        LENGTH(lesson_display) as display_length
      FROM generated_lessons
      ORDER BY native_language, target_language, created_at;
    `);
    
    if (result.rows.length === 0) {
      console.log('ℹ️  No cached lessons found yet.');
      return;
    }
    
    console.log(`Found ${result.rows.length} cached lesson(s):\n`);
    
    // Group by language pair
    const groupedLessons = {};
    result.rows.forEach(row => {
      const key = `${row.native_language} → ${row.target_language}`;
      if (!groupedLessons[key]) {
        groupedLessons[key] = [];
      }
      groupedLessons[key].push(row);
    });
    
    Object.entries(groupedLessons).forEach(([pair, lessons]) => {
      console.log(`📚 ${pair} (${lessons.length}/5 lessons)`);
      lessons.forEach((lesson, index) => {
        console.log(`   ${index + 1}. ID: ${lesson.id} | Created: ${new Date(lesson.created_at).toLocaleString()} | Size: ${lesson.display_length} chars`);
      });
      console.log('');
    });
    
    console.log('✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyLessons();