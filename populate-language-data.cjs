const { Client } = require('pg');

async function populateLanguageData() {
  const connectionString = process.env.NEON_DATABASE_URL || 
    'postgresql://neondb_owner:npg_w9ADg2ukjetN@ep-noisy-pond-adpc2mvs-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('📊 Populating target_language_lessons table with sample data...\n');
    
    // Sample language data with IPA phonemes
    const languageData = [
      // English
      { language_name: 'English', language_code: 'en', phoneme_ipa: '/i/', audio_url: null, description: 'Close front unrounded vowel', difficulty_level: 'easy' },
      { language_name: 'English', language_code: 'en', phoneme_ipa: '/ɪ/', audio_url: null, description: 'Near-close near-front unrounded vowel', difficulty_level: 'medium' },
      { language_name: 'English', language_code: 'en', phoneme_ipa: '/e/', audio_url: null, description: 'Close-mid front unrounded vowel', difficulty_level: 'easy' },
      { language_name: 'English', language_code: 'en', phoneme_ipa: '/ɛ/', audio_url: null, description: 'Open-mid front unrounded vowel', difficulty_level: 'medium' },
      { language_name: 'English', language_code: 'en', phoneme_ipa: '/æ/', audio_url: null, description: 'Near-open front unrounded vowel', difficulty_level: 'medium' },
      { language_name: 'English', language_code: 'en', phoneme_ipa: '/a/', audio_url: null, description: 'Open front unrounded vowel', difficulty_level: 'easy' },
      { language_name: 'English', language_code: 'en', phoneme_ipa: '/ɑ/', audio_url: null, description: 'Open back unrounded vowel', difficulty_level: 'medium' },
      { language_name: 'English', language_code: 'en', phoneme_ipa: '/ɔ/', audio_url: null, description: 'Open-mid back rounded vowel', difficulty_level: 'medium' },
      { language_name: 'English', language_code: 'en', phoneme_ipa: '/o/', audio_url: null, description: 'Close-mid back rounded vowel', difficulty_level: 'easy' },
      { language_name: 'English', language_code: 'en', phoneme_ipa: '/ʊ/', audio_url: null, description: 'Near-close near-back rounded vowel', difficulty_level: 'medium' },
      { language_name: 'English', language_code: 'en', phoneme_ipa: '/u/', audio_url: null, description: 'Close back rounded vowel', difficulty_level: 'easy' },
      { language_name: 'English', language_code: 'en', phoneme_ipa: '/ə/', audio_url: null, description: 'Mid-central vowel (schwa)', difficulty_level: 'easy' },
      { language_name: 'English', language_code: 'en', phoneme_ipa: '/ʌ/', audio_url: null, description: 'Open-mid back unrounded vowel', difficulty_level: 'medium' },
      
      // Spanish
      { language_name: 'Spanish', language_code: 'es', phoneme_ipa: '/i/', audio_url: null, description: 'Close front unrounded vowel', difficulty_level: 'easy' },
      { language_name: 'Spanish', language_code: 'es', phoneme_ipa: '/e/', audio_url: null, description: 'Close-mid front unrounded vowel', difficulty_level: 'easy' },
      { language_name: 'Spanish', language_code: 'es', phoneme_ipa: '/a/', audio_url: null, description: 'Open front unrounded vowel', difficulty_level: 'easy' },
      { language_name: 'Spanish', language_code: 'es', phoneme_ipa: '/o/', audio_url: null, description: 'Close-mid back rounded vowel', difficulty_level: 'easy' },
      { language_name: 'Spanish', language_code: 'es', phoneme_ipa: '/u/', audio_url: null, description: 'Close back rounded vowel', difficulty_level: 'easy' },
      
      // French
      { language_name: 'French', language_code: 'fr', phoneme_ipa: '/i/', audio_url: null, description: 'Close front unrounded vowel', difficulty_level: 'easy' },
      { language_name: 'French', language_code: 'fr', phoneme_ipa: '/y/', audio_url: null, description: 'Close front rounded vowel', difficulty_level: 'hard' },
      { language_name: 'French', language_code: 'fr', phoneme_ipa: '/e/', audio_url: null, description: 'Close-mid front unrounded vowel', difficulty_level: 'easy' },
      { language_name: 'French', language_code: 'fr', phoneme_ipa: '/ø/', audio_url: null, description: 'Close-mid front rounded vowel', difficulty_level: 'hard' },
      { language_name: 'French', language_code: 'fr', phoneme_ipa: '/ɛ/', audio_url: null, description: 'Open-mid front unrounded vowel', difficulty_level: 'medium' },
      { language_name: 'French', language_code: 'fr', phoneme_ipa: '/œ/', audio_url: null, description: 'Open-mid front rounded vowel', difficulty_level: 'hard' },
      { language_name: 'French', language_code: 'fr', phoneme_ipa: '/a/', audio_url: null, description: 'Open front unrounded vowel', difficulty_level: 'easy' },
      { language_name: 'French', language_code: 'fr', phoneme_ipa: '/ɑ/', audio_url: null, description: 'Open back unrounded vowel', difficulty_level: 'medium' },
      { language_name: 'French', language_code: 'fr', phoneme_ipa: '/ɔ/', audio_url: null, description: 'Open-mid back rounded vowel', difficulty_level: 'medium' },
      { language_name: 'French', language_code: 'fr', phoneme_ipa: '/o/', audio_url: null, description: 'Close-mid back rounded vowel', difficulty_level: 'easy' },
      { language_name: 'French', language_code: 'fr', phoneme_ipa: '/u/', audio_url: null, description: 'Close back rounded vowel', difficulty_level: 'easy' },
      { language_name: 'French', language_code: 'fr', phoneme_ipa: '/ə/', audio_url: null, description: 'Mid-central vowel (schwa)', difficulty_level: 'easy' },
      
      // German
      { language_name: 'German', language_code: 'de', phoneme_ipa: '/i/', audio_url: null, description: 'Close front unrounded vowel', difficulty_level: 'easy' },
      { language_name: 'German', language_code: 'de', phoneme_ipa: '/y/', audio_url: null, description: 'Close front rounded vowel', difficulty_level: 'hard' },
      { language_name: 'German', language_code: 'de', phoneme_ipa: '/ɪ/', audio_url: null, description: 'Near-close near-front unrounded vowel', difficulty_level: 'medium' },
      { language_name: 'German', language_code: 'de', phoneme_ipa: '/ʏ/', audio_url: null, description: 'Near-close near-front rounded vowel', difficulty_level: 'hard' },
      { language_name: 'German', language_code: 'de', phoneme_ipa: '/e/', audio_url: null, description: 'Close-mid front unrounded vowel', difficulty_level: 'easy' },
      { language_name: 'German', language_code: 'de', phoneme_ipa: '/ø/', audio_url: null, description: 'Close-mid front rounded vowel', difficulty_level: 'hard' },
      { language_name: 'German', language_code: 'de', phoneme_ipa: '/ɛ/', audio_url: null, description: 'Open-mid front unrounded vowel', difficulty_level: 'medium' },
      { language_name: 'German', language_code: 'de', phoneme_ipa: '/œ/', audio_url: null, description: 'Open-mid front rounded vowel', difficulty_level: 'hard' },
      { language_name: 'German', language_code: 'de', phoneme_ipa: '/a/', audio_url: null, description: 'Open front unrounded vowel', difficulty_level: 'easy' },
      { language_name: 'German', language_code: 'de', phoneme_ipa: '/ɑ/', audio_url: null, description: 'Open back unrounded vowel', difficulty_level: 'medium' },
      { language_name: 'German', language_code: 'de', phoneme_ipa: '/ɔ/', audio_url: null, description: 'Open-mid back rounded vowel', difficulty_level: 'medium' },
      { language_name: 'German', language_code: 'de', phoneme_ipa: '/o/', audio_url: null, description: 'Close-mid back rounded vowel', difficulty_level: 'easy' },
      { language_name: 'German', language_code: 'de', phoneme_ipa: '/ʊ/', audio_url: null, description: 'Near-close near-back rounded vowel', difficulty_level: 'medium' },
      { language_name: 'German', language_code: 'de', phoneme_ipa: '/u/', audio_url: null, description: 'Close back rounded vowel', difficulty_level: 'easy' },
      { language_name: 'German', language_code: 'de', phoneme_ipa: '/ə/', audio_url: null, description: 'Mid-central vowel (schwa)', difficulty_level: 'easy' }
    ];
    
    // Clear existing data
    await client.query('DELETE FROM target_language_lessons');
    console.log('🗑️  Cleared existing language data');
    
    // Insert new data
    for (const data of languageData) {
      await client.query(`
        INSERT INTO target_language_lessons (language_name, language_code, phoneme_ipa, audio_url, description, difficulty_level)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (language_code, phoneme_ipa) DO UPDATE SET
          language_name = EXCLUDED.language_name,
          audio_url = EXCLUDED.audio_url,
          description = EXCLUDED.description,
          difficulty_level = EXCLUDED.difficulty_level
      `, [data.language_name, data.language_code, data.phoneme_ipa, data.audio_url, data.description, data.difficulty_level]);
    }
    
    console.log(`✅ Inserted ${languageData.length} phoneme records`);
    
    // Show summary
    const summary = await client.query(`
      SELECT language_name, language_code, COUNT(*) as phoneme_count
      FROM target_language_lessons
      GROUP BY language_name, language_code
      ORDER BY language_name
    `);
    
    console.log('\n📋 Language Summary:');
    summary.rows.forEach(row => {
      console.log(`  - ${row.language_name} (${row.language_code}): ${row.phoneme_count} phonemes`);
    });
    
    console.log('\n✅ Database populated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

populateLanguageData();