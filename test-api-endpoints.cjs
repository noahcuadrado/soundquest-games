const { default: fetch } = require('node-fetch');

async function testEndpoints() {
  const baseUrl = 'http://localhost:8888/.netlify/functions/neon-tracking';
  
  console.log('🧪 Testing API endpoints...\n');
  
  try {
    // Test languages endpoint
    console.log('1. Testing /languages endpoint...');
    const languagesResponse = await fetch(`${baseUrl}/languages`);
    console.log(`Status: ${languagesResponse.status}`);
    
    if (languagesResponse.ok) {
      const languages = await languagesResponse.json();
      console.log('Languages:', JSON.stringify(languages, null, 2));
      
      if (languages.length > 0) {
        // Test phonemes endpoint with first language
        const firstLanguage = languages[0];
        console.log(`\n2. Testing /phonemes/${encodeURIComponent(firstLanguage.language_code)} endpoint...`);
        
        const phonemesResponse = await fetch(`${baseUrl}/phonemes/${encodeURIComponent(firstLanguage.language_code)}`);
        console.log(`Status: ${phonemesResponse.status}`);
        
        if (phonemesResponse.ok) {
          const phonemes = await phonemesResponse.json();
          console.log(`Phonemes for ${firstLanguage.language_name}:`, JSON.stringify(phonemes.slice(0, 3), null, 2));
          console.log(`Total phonemes: ${phonemes.length}`);
        } else {
          const error = await phonemesResponse.text();
          console.error('Phonemes error:', error);
        }
      }
    } else {
      const error = await languagesResponse.text();
      console.error('Languages error:', error);
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testEndpoints();