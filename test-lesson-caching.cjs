const testNativeLanguage = 'English (US)';
const testTargetLanguage = 'French';

async function testLessonCaching() {
  console.log('🧪 Testing Lesson Caching System\n');
  
  const baseUrl = 'http://localhost:8888/.netlify/functions/neon-tracking';
  
  // Test 1: Check initial count
  console.log('1️⃣  Checking initial lesson count...');
  let response = await fetch(`${baseUrl}/lessons/count?native=${encodeURIComponent(testNativeLanguage)}&target=${encodeURIComponent(testTargetLanguage)}`);
  let data = await response.json();
  console.log(`✅ Current count: ${data.count}/5\n`);
  
  const initialCount = data.count;
  
  // Test 2: Save a lesson (if count < 5)
  if (initialCount < 5) {
    console.log('2️⃣  Saving a new lesson...');
    const mockLesson = {
      nativeLanguage: testNativeLanguage,
      targetLanguage: testTargetLanguage,
      lessonData: {
        vowel: {
          symbol: '/y/',
          targetVowelFormants: { F1: 250, F2: 2100 }
        },
        closestNativeVowel: {
          symbol: '/i/',
          formants: { F1: 280, F2: 2250 }
        }
      },
      lessonDisplay: `# The sound (/y/)\n\nThis is a test lesson for ${testTargetLanguage}.`
    };
    
    response = await fetch(`${baseUrl}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockLesson)
    });
    
    data = await response.json();
    if (response.ok) {
      console.log(`✅ Lesson saved! Count: ${data.currentCount}/${data.maxCount}\n`);
    } else {
      console.log(`❌ Error: ${data.error || data.message}\n`);
    }
  } else {
    console.log('2️⃣  Skipping save - already at maximum (5 lessons)\n');
  }
  
  // Test 3: Get count again
  console.log('3️⃣  Checking updated lesson count...');
  response = await fetch(`${baseUrl}/lessons/count?native=${encodeURIComponent(testNativeLanguage)}&target=${encodeURIComponent(testTargetLanguage)}`);
  data = await response.json();
  console.log(`✅ Current count: ${data.count}/5\n`);
  
  // Test 4: Fetch a random lesson
  console.log('4️⃣  Fetching random lesson...');
  response = await fetch(`${baseUrl}/lessons/random?native=${encodeURIComponent(testNativeLanguage)}&target=${encodeURIComponent(testTargetLanguage)}`);
  
  if (response.ok) {
    data = await response.json();
    console.log('✅ Random lesson retrieved:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Languages: ${data.native_language} → ${data.target_language}`);
    console.log(`   Created: ${new Date(data.created_at).toLocaleString()}`);
    console.log(`   Lesson preview: ${data.lesson_display.substring(0, 50)}...\n`);
  } else {
    data = await response.json();
    console.log(`❌ Error: ${data.error}\n`);
  }
  
  console.log('✅ Lesson caching tests completed!');
}

testLessonCaching().catch(console.error);