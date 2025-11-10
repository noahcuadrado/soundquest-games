const testChatId = `test_${Date.now()}`;

async function testAPI(endpoint, method = 'GET', body = null) {
  const url = `http://localhost:8888/.netlify/functions/neon-tracking${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Neon Tracking API\n');
  console.log(`Test Chat ID: ${testChatId}\n`);
  
  // Test 1: Connection test
  console.log('1️⃣  Testing database connection...');
  const connTest = await testAPI('/test', 'POST');
  if (connTest.success) {
    console.log('✅ Connection successful:', connTest.data.message);
  } else {
    console.log('❌ Connection failed:', connTest.error || connTest.data);
    return;
  }
  
  // Test 2: Create user
  console.log('\n2️⃣  Creating user...');
  const createUser = await testAPI('/user', 'POST', {
    chatId: testChatId,
    nativeLanguage: 'English (US)',
    targetLanguage: 'Spanish (Spain)'
  });
  if (createUser.success) {
    console.log('✅ User created:', {
      chat_id: createUser.data.chat_id,
      languages: `${createUser.data.native_language} → ${createUser.data.target_language}`,
      step: createUser.data.current_step,
      percentage: `${createUser.data.completion_percentage}%`
    });
  } else {
    console.log('❌ User creation failed:', createUser.error || createUser.data);
    return;
  }
  
  // Test 3: Get user
  console.log('\n3️⃣  Fetching user...');
  const getUser = await testAPI(`/user/${testChatId}`);
  if (getUser.success) {
    console.log('✅ User fetched successfully');
  } else {
    console.log('❌ User fetch failed:', getUser.error || getUser.data);
  }
  
  // Test 4: Update step
  console.log('\n4️⃣  Updating to step 2...');
  const updateStep = await testAPI('/step', 'PUT', {
    chatId: testChatId,
    step: 2
  });
  if (updateStep.success) {
    console.log('✅ Step updated:', {
      current_step: updateStep.data.current_step,
      percentage: `${updateStep.data.completion_percentage}%`,
      steps_visited: updateStep.data.steps_visited
    });
  } else {
    console.log('❌ Step update failed:', updateStep.error || updateStep.data);
  }
  
  // Test 5: Complete onboarding
  console.log('\n5️⃣  Marking as complete...');
  const complete = await testAPI('/complete', 'PUT', {
    chatId: testChatId
  });
  if (complete.success) {
    console.log('✅ Onboarding completed:', {
      is_completed: complete.data.is_completed,
      onboarding_complete: complete.data.onboarding_complete,
      percentage: `${complete.data.completion_percentage}%`
    });
  } else {
    console.log('❌ Completion failed:', complete.error || complete.data);
  }
  
  // Test 6: Get stats
  console.log('\n6️⃣  Fetching statistics...');
  const stats = await testAPI('/stats');
  if (stats.success) {
    console.log('✅ Stats retrieved:', {
      total_users: stats.data.summary.total_users,
      completed: stats.data.summary.completed_users,
      avg_completion: parseFloat(stats.data.summary.avg_completion).toFixed(2) + '%'
    });
    
    if (stats.data.languagePairs.length > 0) {
      console.log('\n📊 Popular language pairs:');
      stats.data.languagePairs.slice(0, 3).forEach((pair, i) => {
        console.log(`   ${i + 1}. ${pair.native_language} → ${pair.target_language} (${pair.pair_count} users)`);
      });
    }
  } else {
    console.log('❌ Stats fetch failed:', stats.error || stats.data);
  }
  
  console.log('\n✅ All API tests completed successfully!');
}

runTests();