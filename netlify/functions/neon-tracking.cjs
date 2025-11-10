const { Client } = require('pg');

// Get database connection string from environment variables
function getDatabaseClient() {
  const connectionString = 
    process.env.NEON_DATABASE_URL || 
    process.env.NETLIFY_DATABASE_URL || 
    process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('Database connection string not found in environment variables');
  }
  
  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

// Initialize database with required table and indexes
async function initializeDatabase(client) {
  try {
    // Create interactive_progress table if it doesn't exist
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
    
    // Create generated_lessons table for caching lessons
    await client.query(`
      CREATE TABLE IF NOT EXISTS generated_lessons (
        id SERIAL PRIMARY KEY,
        native_language VARCHAR(100) NOT NULL,
        target_language VARCHAR(100) NOT NULL,
        lesson_data JSONB NOT NULL,
        lesson_display TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(native_language, target_language, id)
      );
    `);
    
    // target_language_lessons table already exists with different structure
    // No need to create it again
    
    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_interactive_progress_chat_id ON interactive_progress(chat_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_interactive_progress_completed ON interactive_progress(is_completed);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_generated_lessons_languages ON generated_lessons(native_language, target_language);
    `);
    
    console.log('Database initialized successfully with interactive_progress and generated_lessons tables');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const client = getDatabaseClient();
  
  try {
    await client.connect();
    await initializeDatabase(client);
    
    const path = event.path.replace('/.netlify/functions/neon-tracking', '');
    const method = event.httpMethod;
    
    // POST /user - Create or update user
    if (path === '/user' && method === 'POST') {
      const { chatId, nativeLanguage, targetLanguage } = JSON.parse(event.body);
      
      if (!chatId || !nativeLanguage || !targetLanguage) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields: chatId, nativeLanguage, targetLanguage' })
        };
      }
      
      const result = await client.query(`
        INSERT INTO interactive_progress (chat_id, native_language, target_language, current_step, steps_visited, completion_percentage)
        VALUES ($1, $2, $3, 1, ARRAY[1], 20.00)
        ON CONFLICT (chat_id)
        DO UPDATE SET
          native_language = EXCLUDED.native_language,
          target_language = EXCLUDED.target_language,
          updated_at = NOW()
        RETURNING *;
      `, [chatId, nativeLanguage, targetLanguage]);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }
    
    // GET /user/:chatId - Get user by chatId
    if (path.startsWith('/user/') && method === 'GET') {
      const chatId = path.split('/')[2];
      
      const result = await client.query(
        'SELECT * FROM interactive_progress WHERE chat_id = $1',
        [chatId]
      );
      
      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'User not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }
    
    // PUT /step - Update user step
    if (path === '/step' && method === 'PUT') {
      const { chatId, step, nativeLanguage, targetLanguage } = JSON.parse(event.body);
      
      if (!chatId || step === undefined) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields: chatId, step' })
        };
      }
      
      // Calculate completion percentage (5 steps total)
      const percentage = (step / 5) * 100;
      
      // Build dynamic query based on whether languages are provided
      let query;
      let params;
      
      if (nativeLanguage && targetLanguage) {
        query = `
          UPDATE interactive_progress
          SET
            current_step = $2,
            steps_visited = array_append(steps_visited, $2),
            completion_percentage = $3,
            native_language = $4,
            target_language = $5,
            updated_at = NOW()
          WHERE chat_id = $1
          RETURNING *;
        `;
        params = [chatId, step, percentage, nativeLanguage, targetLanguage];
      } else {
        query = `
          UPDATE interactive_progress
          SET
            current_step = $2,
            steps_visited = array_append(steps_visited, $2),
            completion_percentage = $3,
            updated_at = NOW()
          WHERE chat_id = $1
          RETURNING *;
        `;
        params = [chatId, step, percentage];
      }
      
      const result = await client.query(query, params);
      
      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'User not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }
    
    // PUT /complete - Mark onboarding complete
    if (path === '/complete' && method === 'PUT') {
      const { chatId } = JSON.parse(event.body);
      
      if (!chatId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required field: chatId' })
        };
      }
      
      const result = await client.query(`
        UPDATE interactive_progress
        SET
          is_completed = true,
          onboarding_complete = true,
          completion_percentage = 100.00,
          updated_at = NOW()
        WHERE chat_id = $1
        RETURNING *;
      `, [chatId]);
      
      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'User not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }
    
    // GET /stats - Get aggregated statistics
    if (path === '/stats' && method === 'GET') {
      const result = await client.query(`
        SELECT
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE is_completed = true) as completed_users,
          AVG(completion_percentage) as avg_completion,
          COUNT(DISTINCT native_language) as unique_native_languages,
          COUNT(DISTINCT target_language) as unique_target_languages,
          native_language,
          target_language,
          COUNT(*) as pair_count
        FROM interactive_progress
        GROUP BY native_language, target_language
        ORDER BY pair_count DESC;
      `);
      
      const summary = await client.query(`
        SELECT
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE is_completed = true) as completed_users,
          AVG(completion_percentage) as avg_completion
        FROM interactive_progress;
      `);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          summary: summary.rows[0],
          languagePairs: result.rows
        })
      };
    }
    
    // GET /lessons/count - Count lessons for language pair
    if (path === '/lessons/count' && method === 'GET') {
      const params = new URL(`http://localhost${event.path}?${event.rawQuery || ''}`).searchParams;
      const nativeLanguage = params.get('native');
      const targetLanguage = params.get('target');
      
      if (!nativeLanguage || !targetLanguage) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required parameters: native, target' })
        };
      }
      
      const result = await client.query(
        'SELECT COUNT(*) as count FROM generated_lessons WHERE native_language = $1 AND target_language = $2',
        [nativeLanguage, targetLanguage]
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          count: parseInt(result.rows[0].count),
          nativeLanguage,
          targetLanguage
        })
      };
    }
    
    // GET /lessons/random - Get random lesson for language pair
    if (path === '/lessons/random' && method === 'GET') {
      const params = new URL(`http://localhost${event.path}?${event.rawQuery || ''}`).searchParams;
      const nativeLanguage = params.get('native');
      const targetLanguage = params.get('target');
      
      if (!nativeLanguage || !targetLanguage) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required parameters: native, target' })
        };
      }
      
      const result = await client.query(`
        SELECT * FROM generated_lessons
        WHERE native_language = $1 AND target_language = $2
        ORDER BY RANDOM()
        LIMIT 1
      `, [nativeLanguage, targetLanguage]);
      
      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'No lessons found for this language pair' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }
    
    // POST /lessons - Save a new lesson
    if (path === '/lessons' && method === 'POST') {
      const { nativeLanguage, targetLanguage, lessonData, lessonDisplay } = JSON.parse(event.body);
      
      if (!nativeLanguage || !targetLanguage || !lessonData || !lessonDisplay) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields: nativeLanguage, targetLanguage, lessonData, lessonDisplay' })
        };
      }
      
      // Check current count
      const countResult = await client.query(
        'SELECT COUNT(*) as count FROM generated_lessons WHERE native_language = $1 AND target_language = $2',
        [nativeLanguage, targetLanguage]
      );
      
      const currentCount = parseInt(countResult.rows[0].count);
      
      if (currentCount >= 5) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Maximum lessons reached',
            message: 'This language pair already has 5 lessons. Use random endpoint to fetch one.',
            currentCount: 5
          })
        };
      }
      
      const result = await client.query(`
        INSERT INTO generated_lessons (native_language, target_language, lesson_data, lesson_display)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `, [nativeLanguage, targetLanguage, JSON.stringify(lessonData), lessonDisplay]);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...result.rows[0],
          currentCount: currentCount + 1,
          maxCount: 5
        })
      };
    }
    
    // DELETE /lessons - Clear all lessons for a language pair (admin)
    if (path === '/lessons' && method === 'DELETE') {
      const { nativeLanguage, targetLanguage } = JSON.parse(event.body);
      
      if (!nativeLanguage || !targetLanguage) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields: nativeLanguage, targetLanguage' })
        };
      }
      
      const result = await client.query(
        'DELETE FROM generated_lessons WHERE native_language = $1 AND target_language = $2 RETURNING id',
        [nativeLanguage, targetLanguage]
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          deleted: result.rowCount,
          message: `Deleted ${result.rowCount} lesson(s) for ${nativeLanguage} → ${targetLanguage}`
        })
      };
    }
    
    // GET /languages - Get all available languages for IPA Memory Challenge (only those with all valid audio URLs)
    if (path === '/languages' && method === 'GET') {
      const result = await client.query(`
        SELECT
          target_language as language_name,
          target_language as language_code,
          COUNT(*) as phoneme_count
        FROM target_language_lessons
        WHERE target_language IN (
          SELECT target_language
          FROM target_language_lessons
          GROUP BY target_language
          HAVING COUNT(*) = COUNT(pronunciation_url) AND COUNT(pronunciation_url) > 0
        )
        GROUP BY target_language
        ORDER BY target_language;
      `);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows)
      };
    }
    
    // GET /phonemes/:languageCode - Get phonemes for a specific language
    if (path.startsWith('/phonemes/') && method === 'GET') {
      const languageCode = decodeURIComponent(path.split('/')[2]);
      
      const result = await client.query(`
        SELECT
          phoneme_ipa,
          pronunciation_url as audio_url,
          COALESCE(lesson_data->>'description', 'No description') as description,
          'medium' as difficulty_level
        FROM target_language_lessons
        WHERE target_language = $1
        ORDER BY phoneme_ipa;
      `, [languageCode]);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows)
      };
    }
    
    // POST /test - Test database connection
    if (path === '/test' && method === 'POST') {
      const result = await client.query('SELECT NOW()');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          timestamp: result.rows[0].now,
          message: 'Database connection successful'
        })
      };
    }
    
    // Unknown route
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' })
    };
    
  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  } finally {
    await client.end();
  }
};