/**
 * Test script for the Memory Game Progression System
 */

import { memoryProgressionSystem, completeMemoryLevel, getMemoryLevels } from './src/utils/progressionSystem.js';

console.log('🧪 Testing Memory Game Progression System\n');

// Reset progression for clean test
memoryProgressionSystem.resetProgression();
console.log('✅ Reset progression system');

// Test initial state
console.log('\n📊 Initial State:');
const initialLevels = getMemoryLevels();
initialLevels.forEach(level => {
  console.log(`  ${level.emoji} ${level.name}: ${level.unlocked ? '🔓 Unlocked' : '🔒 Locked'} ${level.completed ? '(Completed ⭐'.repeat(level.stars) + ')' : ''}`);
});

// Test completing Easy level with good performance (should get 3 stars)
console.log('\n🎮 Completing Easy level with 20 moves (excellent performance)...');
const easyResult = completeMemoryLevel('easy', 0, 20, 100);
console.log(`  Result: ${easyResult.completed ? '✅ Completed' : '❌ Failed'}`);
console.log(`  Stars earned: ${'⭐'.repeat(easyResult.starRating)}`);
console.log(`  New unlocks: ${easyResult.newUnlocks.map(u => u.name).join(', ') || 'None'}`);

// Check state after Easy completion
console.log('\n📊 State after Easy completion:');
const afterEasyLevels = getMemoryLevels();
afterEasyLevels.forEach(level => {
  console.log(`  ${level.emoji} ${level.name}: ${level.unlocked ? '🔓 Unlocked' : '🔒 Locked'} ${level.completed ? '(Completed ' + '⭐'.repeat(level.stars) + ')' : ''}`);
});

// Test completing Medium level with average performance (should get 2 stars)
console.log('\n🎮 Completing Medium level with 48 moves (good performance)...');
const mediumResult = completeMemoryLevel('medium', 0, 48, 100);
console.log(`  Result: ${mediumResult.completed ? '✅ Completed' : '❌ Failed'}`);
console.log(`  Stars earned: ${'⭐'.repeat(mediumResult.starRating)}`);
console.log(`  New unlocks: ${mediumResult.newUnlocks.map(u => u.name).join(', ') || 'None'}`);

// Check final state
console.log('\n📊 Final State:');
const finalLevels = getMemoryLevels();
finalLevels.forEach(level => {
  console.log(`  ${level.emoji} ${level.name}: ${level.unlocked ? '🔓 Unlocked' : '🔒 Locked'} ${level.completed ? '(Completed ' + '⭐'.repeat(level.stars) + ')' : ''}`);
});

// Test progression stats
const progression = memoryProgressionSystem.getProgression();
console.log('\n📈 Progression Stats:');
console.log(`  Overall Progress: ${memoryProgressionSystem.getOverallProgress()}%`);
console.log(`  Total Stars: ${memoryProgressionSystem.getTotalStars()}/${memoryProgressionSystem.getMaxStars()}`);
console.log(`  Completed Levels: ${progression.completedLevels.join(', ')}`);
console.log(`  Unlocked Levels: ${progression.unlockedLevels.join(', ')}`);

// Test failing a level (too many moves)
console.log('\n🎮 Attempting Hard level with 100 moves (poor performance)...');
const hardFailResult = completeMemoryLevel('hard', 0, 100, 100);
console.log(`  Result: ${hardFailResult.completed ? '✅ Completed' : '❌ Failed'}`);
console.log(`  Stars earned: ${'⭐'.repeat(hardFailResult.starRating)}`);

console.log('\n🎉 Progression system test completed!');