const baseUrl = 'http://localhost:8888/.netlify/functions/neon-tracking';
const testNative = 'English (US)';
const testTarget = 'French';

async function testFullCycle() {
  console.log('🧪 Testing Full Lesson Caching Cycle\n');
  
  // Check current count
  let response = await fetch(`${baseUrl}/lessons/count?native=${encodeURIComponent(testNative)}&target=${encodeURIComponent(testTarget)}`);
  let data = await response.json();
  const currentCount = data.count;
  console.log(`Current cached lessons: ${currentCount}/5\n`);
  
  // Generate lessons until we reach 5
  if (currentCount < 5) {
    console.log(`Generating ${5 - currentCount} more lesson(s) to reach limit...\n`);
    
    for (let i = currentCount; i < 5; i++) {
      const mockLesson = {
        nativeLanguage: testNative,
        targetLanguage: testTarget,
        lessonData: {
          vowel: {
            symbol: `/test${i + 1}/`,
            targetVowelFormants: { F1: 250 + i * 10, F2: 2100 + i * 10 }
          }
        },
        lessonDisplay: `# Test Lesson ${i + 1}\n\nThis is test lesson number ${i + 1} for ${testTarget}.`
      };
      
      response = await fetch(`${baseUrl}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockLesson)
      });
      
      data = await response.json();
      if (response.ok) {
        console.log(`✅ Lesson ${i + 1}/5 saved`);
      } else {
        console.log(`❌ Error saving lesson: ${data.error || data.message}`);
      }
    }
    console.log('');
  }
  
  // Verify we have 5 lessons
  response = await fetch(`${baseUrl}/lessons/count?native=${encodeURIComponent(testNative)}&target=${encodeURIComponent(testTarget)}`);
  data = await response.json();
  console.log(`✅ Total cached lessons: ${data.count}/5\n`);
  
  // Test fetching random lessons
  console.log('Testing random lesson fetching (5 times)...\n');
  const fetchedIds = [];
  
  for (let i = 0; i < 5; i++) {
    response = await fetch(`${baseUrl}/lessons/random?native=${encodeURIComponent(testNative)}&target=${encodeURIComponent(testTarget)}`);
    data = await response.json();
    fetchedIds.push(data.id);
    console.log(`  ${i + 1}. Fetched lesson ID: ${data.id}`);
  }
  
  const uniqueIds = [...new Set(fetchedIds)];
  console.log(`\n📊 Fetched ${uniqueIds.length} unique lesson(s) out of 5 attempts`);
  console.log(`   IDs: [${uniqueIds.join(', ')}]`);
  
  // Try to save a 6th lesson (should fail)
  console.log('\n🚫 Testing maximum limit (attempting to save 6th lesson)...');
  const extraLesson = {
    nativeLanguage: testNative,
    targetLanguage: testTarget,
    lessonData: { test: 'extra' },
    lessonDisplay: '# Extra Lesson\n\nThis should not be saved.'
  };
  
  response = await fetch(`${baseUrl}/lessons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(extraLesson)
  });
  
  data = await response.json();
  if (!response.ok) {
    console.log(`✅ Correctly rejected: ${data.message || data.error}`);
  } else {
    console.log(`❌ Unexpectedly accepted 6th lesson!`);
  }
  
  console.log('\n✅ Full caching cycle test complete!');
}

testFullCycle().catch(console.error);