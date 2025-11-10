<template>
  <div class="sound-sequence-game">
    <header class="game-header">
      <h1>🔢 Sound Sequence</h1>
      <p class="subtitle">Arrange IPA sounds in the correct order</p>
    </header>

    <!-- Difficulty Selection -->
    <div v-if="gameState === 'difficulty'" class="difficulty-selection">
      <div class="difficulty-cards">
        <div 
          v-for="level in difficultyLevels" 
          :key="level.id"
          class="difficulty-card"
          :class="{ selected: selectedDifficulty === level.id }"
          @click="selectedDifficulty = level.id"
        >
          <div class="difficulty-dot" :style="{ backgroundColor: level.color }"></div>
          <h3>{{ level.name }}</h3>
          <p>{{ level.description }}</p>
        </div>
      </div>
      <button 
        class="start-game-btn"
        @click="startGame"
        :disabled="!selectedDifficulty"
      >
        🎯 Start Sound Sequence
      </button>
    </div>

    <!-- Game Play -->
    <div v-else-if="gameState === 'playing'" class="game-play">
      <div class="sequence-card">
        <div class="sequence-header">
          <h2>Round {{ currentRound + 1 }} of {{ totalRounds }}</h2>
          <div class="score-display">Score: {{ score }}</div>
        </div>
        
        <div class="challenge-info">
          <h3>{{ currentChallenge.title }}</h3>
          <p>{{ currentChallenge.instruction }}</p>
          <div class="challenge-hint">
            <span class="hint-icon">💡</span>
            {{ currentChallenge.hint }}
          </div>
        </div>

        <div class="sequence-area">
          <!-- Draggable symbols -->
          <div class="symbols-pool">
            <h4>Drag the symbols:</h4>
            <div class="symbols-container">
              <div 
                v-for="symbol in shuffledSymbols" 
                :key="symbol"
                class="draggable-symbol"
                :class="{ dragging: draggedSymbol === symbol }"
                draggable="true"
                @dragstart="startDrag(symbol, $event)"
                @dragend="endDrag"
              >
                <span class="symbol-text">{{ symbol }}</span>
                <button 
                  class="play-symbol-btn"
                  @click="playSymbolSound(symbol)"
                  :disabled="isPlayingSymbol"
                >
                  {{ isPlayingSymbol && playingSymbol === symbol ? '🔊' : '▶️' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Drop zones -->
          <div class="sequence-slots">
            <h4>{{ currentChallenge.dropZoneLabel }}:</h4>
            <div class="slots-container">
              <div 
                v-for="(slot, index) in sequenceSlots" 
                :key="index"
                class="drop-slot"
                :class="{ 
                  'has-symbol': slot !== null,
                  'drag-over': dragOverSlot === index,
                  'correct': showResult && slot === correctSequence[index],
                  'incorrect': showResult && slot !== null && slot !== correctSequence[index]
                }"
                @dragover.prevent="dragOver(index)"
                @dragleave="dragLeave"
                @drop="dropSymbol(index, $event)"
              >
                <span v-if="slot" class="dropped-symbol">{{ slot }}</span>
                <span v-else class="slot-placeholder">{{ index + 1 }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="sequence-actions">
          <button 
            class="clear-btn"
            @click="clearSequence"
            :disabled="sequenceSlots.every(slot => slot === null)"
          >
            🗑️ Clear All
          </button>
          <button 
            v-if="!showResult"
            class="submit-btn"
            @click="submitSequence"
            :disabled="sequenceSlots.some(slot => slot === null)"
          >
            Submit Sequence
          </button>
          <button 
            v-else
            class="next-btn"
            @click="nextRound"
          >
            {{ currentRound + 1 < totalRounds ? 'Next Round' : 'View Results' }}
          </button>
        </div>

        <div v-if="showResult" class="result-feedback">
          <div v-if="isSequenceCorrect" class="correct-feedback">
            ✅ Perfect! You arranged the sounds correctly.
            <div class="correct-sequence">
              Correct order: <span v-for="(symbol, index) in correctSequence" :key="index" class="sequence-symbol">{{ symbol }}</span>
            </div>
          </div>
          <div v-else class="incorrect-feedback">
            ❌ Not quite right. Here's the correct sequence:
            <div class="correct-sequence">
              <span v-for="(symbol, index) in correctSequence" :key="index" class="sequence-symbol">{{ symbol }}</span>
            </div>
            <div class="explanation">{{ currentChallenge.explanation }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-else-if="gameState === 'results'" class="game-results">
      <div class="results-card">
        <h2>🔢 Sound Sequence Complete!</h2>
        <div class="score-display">
          <div class="final-score">{{ score }}/{{ totalRounds * 100 }}</div>
          <div class="accuracy">{{ Math.round((score / (totalRounds * 100)) * 100) }}% Accuracy</div>
        </div>
        
        <div class="round-breakdown">
          <h3>Round Results:</h3>
          <div class="round-results">
            <div 
              v-for="(result, index) in roundResults" 
              :key="index"
              class="round-result"
            >
              <span class="round-number">Round {{ index + 1 }}</span>
              <span class="round-challenge">{{ result.challenge }}</span>
              <span class="round-score" :class="{ correct: result.correct }">
                {{ result.correct ? '✅ 100' : '❌ 0' }}
              </span>
            </div>
          </div>
        </div>

        <div class="performance-message">
          <p v-if="accuracy >= 90">🏆 Excellent! You have mastered sound sequences!</p>
          <p v-else-if="accuracy >= 70">👍 Great job! You understand most sound patterns.</p>
          <p v-else-if="accuracy >= 50">📚 Good effort! Review the vowel chart positions.</p>
          <p v-else>💪 Keep practicing! Sound sequences take time to master.</p>
        </div>

        <div class="results-actions">
          <button class="play-again-btn" @click="resetGame">
            🔄 Play Again
          </button>
          <button class="back-btn" @click="goBack">
            ← Back to Games
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ipaAudioService } from '../services/ipaAudioService.js'
import { selectedLanguage, languagePhonemes } from '../stores/languageStore'

const router = useRouter()

// Check if user has selected a language, redirect if not
function checkLanguageSelection() {
  if (!selectedLanguage.value) {
    // Redirect to home page to select language
    router.push('/')
    return false
  }
  return true
}

// Game state
const gameState = ref('difficulty')
const selectedDifficulty = ref('easy')
const currentRound = ref(0)
const totalRounds = ref(5)
const score = ref(0)
const roundResults = ref([])
const sequenceSlots = ref([])
const shuffledSymbols = ref([])
const correctSequence = ref([])
const showResult = ref(false)
const draggedSymbol = ref(null)
const dragOverSlot = ref(null)
const isPlayingSymbol = ref(false)
const playingSymbol = ref(null)

// Difficulty levels with different sequence challenges
const difficultyLevels = [
  {
    id: 'easy',
    name: 'Easy',
    description: 'Basic vowel positions',
    color: '#10b981'
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Front to back sequences',
    color: '#f59e0b'
  },
  {
    id: 'hard',
    name: 'Hard',
    description: 'Complex vowel patterns',
    color: '#ef4444'
  }
]

// Challenge templates for different difficulties
const challengeTemplates = {
  easy: [
    {
      title: 'Height Sequence',
      instruction: 'Arrange these vowels from CLOSE to OPEN (high to low)',
      dropZoneLabel: 'Close → Open',
      symbols: ['i', 'e', 'a'],
      correctOrder: ['i', 'e', 'a'],
      hint: 'Think about tongue height: i (high), e (mid), a (low)',
      explanation: 'Vowel height refers to how high or low the tongue is positioned.'
    },
    {
      title: 'Frontness Sequence',
      instruction: 'Arrange these vowels from FRONT to BACK',
      dropZoneLabel: 'Front → Back',
      symbols: ['i', 'ə', 'u'],
      correctOrder: ['i', 'ə', 'u'],
      hint: 'Think about tongue position: front, center, back',
      explanation: 'Vowel frontness refers to how far forward or back the tongue is positioned.'
    },
    {
      title: 'Basic Height',
      instruction: 'Arrange from CLOSE to OPEN',
      dropZoneLabel: 'Close → Open',
      symbols: ['u', 'o', 'ɑ'],
      correctOrder: ['u', 'o', 'ɑ'],
      hint: 'u is close (high), o is mid, ɑ is open (low)',
      explanation: 'Back vowels also follow the close-to-open pattern.'
    }
  ],
  medium: [
    {
      title: 'Front Vowel Series',
      instruction: 'Arrange front vowels from CLOSE to OPEN',
      dropZoneLabel: 'Close → Open',
      symbols: ['i', 'ɪ', 'e', 'ɛ', 'a'],
      correctOrder: ['i', 'ɪ', 'e', 'ɛ', 'a'],
      hint: 'Follow the front vowel chain on the IPA chart',
      explanation: 'Front vowels progress from close i to open a.'
    },
    {
      title: 'Back Vowel Series',
      instruction: 'Arrange back vowels from CLOSE to OPEN',
      dropZoneLabel: 'Close → Open',
      symbols: ['u', 'ʊ', 'o', 'ɔ', 'ɑ'],
      correctOrder: ['u', 'ʊ', 'o', 'ɔ', 'ɑ'],
      hint: 'Follow the back vowel chain on the IPA chart',
      explanation: 'Back vowels progress from close u to open ɑ.'
    },
    {
      title: 'Cross-Height Comparison',
      instruction: 'Arrange from FRONT-CLOSE to BACK-OPEN',
      dropZoneLabel: 'Front-Close → Back-Open',
      symbols: ['i', 'e', 'ə', 'o', 'ɑ'],
      correctOrder: ['i', 'e', 'ə', 'o', 'ɑ'],
      hint: 'Move diagonally across the vowel space',
      explanation: 'This sequence moves from front-close to back-open.'
    }
  ],
  hard: [
    {
      title: 'Complete Front Series',
      instruction: 'Arrange all front vowels from CLOSE to OPEN',
      dropZoneLabel: 'Close → Open',
      symbols: ['i', 'ɪ', 'e', 'ɛ', 'æ', 'a'],
      correctOrder: ['i', 'ɪ', 'e', 'ɛ', 'æ', 'a'],
      hint: 'Include all positions from close i to open a',
      explanation: 'The complete front vowel series with all intermediate positions.'
    },
    {
      title: 'Central Vowel Chain',
      instruction: 'Arrange central vowels from CLOSE to OPEN',
      dropZoneLabel: 'Close → Open',
      symbols: ['ɨ', 'ə', 'ɐ', 'a'],
      correctOrder: ['ɨ', 'ə', 'ɐ', 'a'],
      hint: 'Central vowels have their own height progression',
      explanation: 'Central vowels progress from close ɨ through schwa ə to open a.'
    },
    {
      title: 'Rounded Vowel Pattern',
      instruction: 'Arrange rounded vowels by frontness: BACK to FRONT',
      dropZoneLabel: 'Back → Front',
      symbols: ['u', 'o', 'ɔ', 'œ', 'y'],
      correctOrder: ['u', 'o', 'ɔ', 'œ', 'y'],
      hint: 'Rounded vowels can be back or front',
      explanation: 'This shows rounded vowels from back u to front y.'
    }
  ]
}

// Computed properties
const currentChallenge = computed(() => {
  // Use database phonemes if available, otherwise fallback to default templates
  if (languagePhonemes.value.length > 0) {
    return generateDynamicChallenge()
  } else {
    const templates = challengeTemplates[selectedDifficulty.value]
    return templates[currentRound.value % templates.length]
  }
})

// Generate dynamic challenges based on database phonemes
function generateDynamicChallenge() {
  const difficulty = selectedDifficulty.value
  const availablePhonemes = languagePhonemes.value
  
  // Filter phonemes by difficulty if specified
  const difficultyMap = {
    'easy': ['easy'],
    'medium': ['easy', 'medium'],
    'hard': ['easy', 'medium', 'hard']
  }
  
  const allowedDifficulties = difficultyMap[difficulty] || ['medium']
  const filteredPhonemes = availablePhonemes.filter(phoneme =>
    allowedDifficulties.includes(phoneme.difficulty_level)
  )
  
  const phonemesToUse = filteredPhonemes.length > 0 ? filteredPhonemes : availablePhonemes
  
  // Create different challenge types based on difficulty
  const challengeTypes = {
    easy: [
      {
        title: 'Height Sequence',
        instruction: 'Arrange these vowels from CLOSE to OPEN (high to low)',
        dropZoneLabel: 'Close → Open',
        hint: 'Think about tongue height: close vowels are high, open vowels are low',
        explanation: 'Vowel height refers to how high or low the tongue is positioned.'
      },
      {
        title: 'Frontness Sequence',
        instruction: 'Arrange these vowels from FRONT to BACK',
        dropZoneLabel: 'Front → Back',
        hint: 'Think about tongue position: front, center, back',
        explanation: 'Vowel frontness refers to how far forward or back the tongue is positioned.'
      }
    ],
    medium: [
      {
        title: 'Vowel Chain',
        instruction: 'Arrange vowels by height from CLOSE to OPEN',
        dropZoneLabel: 'Close → Open',
        hint: 'Follow the vowel height progression',
        explanation: 'Vowels progress from close (high) to open (low) positions.'
      },
      {
        title: 'Front-Back Sequence',
        instruction: 'Arrange vowels from FRONT to BACK position',
        dropZoneLabel: 'Front → Back',
        hint: 'Consider the horizontal tongue position',
        explanation: 'Vowels can be positioned from front to back in the mouth.'
      }
    ],
    hard: [
      {
        title: 'Complex Vowel Pattern',
        instruction: 'Arrange vowels by phonetic properties',
        dropZoneLabel: 'Sequence Order',
        hint: 'Consider height, frontness, and rounding',
        explanation: 'Advanced vowel sequences consider multiple phonetic dimensions.'
      }
    ]
  }
  
  const templates = challengeTypes[difficulty] || challengeTypes.medium
  const template = templates[currentRound.value % templates.length]
  
  // Select 3-5 random phonemes for the challenge
  const numPhonemes = Math.min(Math.max(3, Math.floor(phonemesToUse.length / 3)), 5)
  const selectedPhonemes = [...phonemesToUse]
    .sort(() => Math.random() - 0.5)
    .slice(0, numPhonemes)
    .map(p => p.phoneme_ipa)
  
  // For simplicity, create a random correct order
  // In a real implementation, you might want more sophisticated ordering logic
  const correctOrder = [...selectedPhonemes].sort()
  
  return {
    ...template,
    symbols: selectedPhonemes,
    correctOrder: correctOrder
  }
}

const isSequenceCorrect = computed(() => {
  return sequenceSlots.value.every((slot, index) => slot === correctSequence.value[index])
})

const accuracy = computed(() => {
  return (score.value / (totalRounds.value * 100)) * 100
})

// Game functions
function startGame() {
  // Check if language is selected, redirect if not
  if (!checkLanguageSelection()) {
    return
  }
  
  gameState.value = 'playing'
  currentRound.value = 0
  score.value = 0
  roundResults.value = []
  setupRound()
}

function setupRound() {
  const challenge = currentChallenge.value
  correctSequence.value = [...challenge.correctOrder]
  shuffledSymbols.value = [...challenge.symbols].sort(() => Math.random() - 0.5)
  sequenceSlots.value = new Array(challenge.symbols.length).fill(null)
  showResult.value = false
}

function startDrag(symbol, event) {
  draggedSymbol.value = symbol
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', symbol)
}

function endDrag() {
  draggedSymbol.value = null
  dragOverSlot.value = null
}

function dragOver(slotIndex) {
  dragOverSlot.value = slotIndex
}

function dragLeave() {
  dragOverSlot.value = null
}

function dropSymbol(slotIndex, event) {
  event.preventDefault()
  const symbol = event.dataTransfer.getData('text/plain')
  
  if (symbol && draggedSymbol.value === symbol) {
    // Remove symbol from its current position if it's already placed
    const currentIndex = sequenceSlots.value.indexOf(symbol)
    if (currentIndex !== -1) {
      sequenceSlots.value[currentIndex] = null
    }
    
    // Place symbol in new position
    sequenceSlots.value[slotIndex] = symbol
    
    // Remove symbol from shuffled symbols if it was there
    const shuffledIndex = shuffledSymbols.value.indexOf(symbol)
    if (shuffledIndex !== -1) {
      shuffledSymbols.value.splice(shuffledIndex, 1)
    }
  }
  
  dragOverSlot.value = null
}

function clearSequence() {
  // Move all symbols back to the pool
  for (let i = 0; i < sequenceSlots.value.length; i++) {
    const symbol = sequenceSlots.value[i]
    if (symbol && !shuffledSymbols.value.includes(symbol)) {
      shuffledSymbols.value.push(symbol)
    }
  }
  
  sequenceSlots.value.fill(null)
  shuffledSymbols.value.sort(() => Math.random() - 0.5)
}

async function playSymbolSound(symbol) {
  if (isPlayingSymbol.value) return
  
  try {
    isPlayingSymbol.value = true
    playingSymbol.value = symbol
    
    // Get audio URL from database phonemes if available
    const phoneme = languagePhonemes.value.find(p => p.phoneme_ipa === symbol)
    const audioUrl = phoneme?.audio_url || null
    
    // Use the enhanced IPA audio service with database URL and Wikipedia fallback
    await ipaAudioService.playSound(symbol, audioUrl)
  } catch (error) {
    console.error('Error playing symbol sound:', error)
  } finally {
    isPlayingSymbol.value = false
    playingSymbol.value = null
  }
}

function submitSequence() {
  showResult.value = true
  
  const isCorrect = isSequenceCorrect.value
  const roundScore = isCorrect ? 100 : 0
  score.value += roundScore
  
  roundResults.value.push({
    challenge: currentChallenge.value.title,
    correct: isCorrect,
    score: roundScore
  })
}

function nextRound() {
  if (currentRound.value + 1 < totalRounds.value) {
    currentRound.value++
    setupRound()
  } else {
    finishGame()
  }
}

function finishGame() {
  gameState.value = 'results'
  saveGameStats()
}

function saveGameStats() {
  try {
    const stats = JSON.parse(localStorage.getItem('soundSequenceStats') || '{}')
    const difficultyStats = stats[selectedDifficulty.value] || { played: 0, bestScore: 0 }
    
    difficultyStats.played++
    if (score.value > difficultyStats.bestScore) {
      difficultyStats.bestScore = score.value
    }
    
    stats[selectedDifficulty.value] = difficultyStats
    localStorage.setItem('soundSequenceStats', JSON.stringify(stats))

    // Update overall game progress
    const gameProgress = JSON.parse(localStorage.getItem('gameProgress') || '{}')
    gameProgress.soundSequence = (gameProgress.soundSequence || 0) + 1
    localStorage.setItem('gameProgress', JSON.stringify(gameProgress))
  } catch (error) {
    console.error('Error saving game stats:', error)
  }
}

function resetGame() {
  gameState.value = 'difficulty'
  currentRound.value = 0
  score.value = 0
  roundResults.value = []
  sequenceSlots.value = []
  shuffledSymbols.value = []
  correctSequence.value = []
  showResult.value = false
}

function goBack() {
  router.push('/')
}

// Initialize audio service
onMounted(async () => {
  // Check if language is selected, redirect if not
  if (!checkLanguageSelection()) {
    return
  }
  
  try {
    // Preload audio for current phonemes if available
    if (languagePhonemes.value.length > 0) {
      const symbols = languagePhonemes.value.map(p => p.phoneme_ipa)
      await ipaAudioService.preloadAudio(symbols)
    } else {
      // Fallback: preload default symbols
      const allSymbols = Object.values(challengeTemplates).flatMap(templates =>
        templates.flatMap(template => template.symbols)
      )
      const uniqueSymbols = [...new Set(allSymbols)]
      await ipaAudioService.preloadAudio(uniqueSymbols)
    }
  } catch (error) {
    console.error('Error preloading audio:', error)
  }
})
</script>

<style scoped>
.sound-sequence-game {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
}

.game-header {
  text-align: center;
  margin-bottom: 3rem;
}

.game-header h1 {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
}

.subtitle {
  font-size: 1.2rem;
  color: var(--text-light);
  margin: 0;
}

/* Difficulty Selection */
.difficulty-selection {
  text-align: center;
}

.difficulty-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.difficulty-card {
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.difficulty-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.difficulty-card.selected {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.difficulty-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin: 0 auto 1rem;
}

.start-game-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-game-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

.start-game-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Game Play */
.sequence-card {
  background: var(--surface-color);
  border-radius: 20px;
  padding: 2rem;
  border: 2px solid var(--border-color);
}

.sequence-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.sequence-header h2 {
  color: var(--text-light);
  font-size: 1.1rem;
  margin: 0;
  font-weight: 500;
}

.score-display {
  font-weight: 600;
  color: var(--primary-color);
}

.challenge-info {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: var(--background-color);
  border-radius: 16px;
  border: 2px solid var(--border-color);
}

.challenge-info h3 {
  color: var(--primary-color);
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.challenge-info p {
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.challenge-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-light);
  font-style: italic;
}

.hint-icon {
  font-size: 1.2rem;
}

.sequence-area {
  margin-bottom: 2rem;
}

.symbols-pool, .sequence-slots {
  margin-bottom: 2rem;
}

.symbols-pool h4, .sequence-slots h4 {
  color: var(--text-primary);
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.symbols-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--background-color);
  border-radius: 12px;
  border: 2px dashed var(--border-color);
  min-height: 80px;
}

.draggable-symbol {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 1rem;
  cursor: grab;
  transition: all 0.3s ease;
  user-select: none;
}

.draggable-symbol:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.draggable-symbol.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.symbol-text {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
  font-family: 'Doulos SIL', 'Charis SIL', serif;
}

.play-symbol-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.play-symbol-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: scale(1.1);
}

.play-symbol-btn:disabled {
  opacity: 0.7;
}

.slots-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--background-color);
  border-radius: 12px;
  border: 2px solid var(--border-color);
  min-height: 100px;
}

.drop-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: var(--surface-color);
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
}

.drop-slot.drag-over {
  border-color: var(--primary-color);
  background: var(--primary-light);
  transform: scale(1.05);
}

.drop-slot.has-symbol {
  border-style: solid;
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.drop-slot.correct {
  border-color: #10b981;
  background: #ecfdf5;
}

.drop-slot.incorrect {
  border-color: #ef4444;
  background: #fef2f2;
}

.dropped-symbol {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
  font-family: 'Doulos SIL', 'Charis SIL', serif;
}

.slot-placeholder {
  color: var(--text-light);
  font-weight: 600;
  font-size: 1.2rem;
}

.sequence-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.clear-btn, .submit-btn, .next-btn {
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.clear-btn {
  background: var(--background-color);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.clear-btn:hover:not(:disabled) {
  border-color: #ef4444;
  background: #fef2f2;
  color: #ef4444;
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn, .next-btn {
  background: var(--primary-color);
  color: white;
}

.submit-btn:hover:not(:disabled), .next-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result-feedback {
  text-align: center;
  padding: 1.5rem;
  border-radius: 12px;
  font-weight: 600;
}

.correct-feedback {
  background: #ecfdf5;
  color: #065f46;
  border: 2px solid #10b981;
}

.incorrect-feedback {
  background: #fef2f2;
  color: #991b1b;
  border: 2px solid #ef4444;
}

.correct-sequence {
  margin: 1rem 0;
  font-size: 1.1rem;
}

.sequence-symbol {
  display: inline-block;
  margin: 0 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  font-family: 'Doulos SIL', 'Charis SIL', serif;
  font-weight: bold;
}

.explanation {
  margin-top: 1rem;
  font-style: italic;
  opacity: 0.9;
}

/* Results */
.game-results {
  text-align: center;
}

.results-card {
  background: var(--surface-color);
  border-radius: 20px;
  padding: 3rem;
  border: 2px solid var(--border-color);
}

.results-card h2 {
  font-size: 2rem;
  color: var(--primary-color);
  margin: 0 0 2rem 0;
}

.final-score {
  font-size: 3rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.accuracy {
  font-size: 1.2rem;
  color: var(--text-light);
  margin-bottom: 2rem;
}

.round-breakdown {
  margin-bottom: 2rem;
  text-align: left;
}

.round-breakdown h3 {
  margin-bottom: 1rem;
  color: var(--text-primary);
  text-align: center;
}

.round-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.round-result {
  display: grid;
  grid-template-columns: 100px 1fr 80px;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--background-color);
  border-radius: 8px;
}

.round-number {
  font-weight: 600;
  color: var(--text-primary);
}

.round-challenge {
  color: var(--text-light);
}

.round-score {
  font-weight: 600;
  text-align: center;
}

.round-score.correct {
  color: #10b981;
}

.performance-message {
  margin-bottom: 2rem;
}

.performance-message p {
  font-size: 1.1rem;
  color: var(--text-primary);
  margin: 0;
}

.results-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.play-again-btn, .back-btn {
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.play-again-btn {
  background: var(--primary-color);
  color: white;
}

.play-again-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

.back-btn {
  background: var(--background-color);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.back-btn:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .sound-sequence-game {
    padding: 1rem;
  }
  
  .difficulty-cards {
    grid-template-columns: 1fr;
  }
  
  .sequence-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .symbols-container, .slots-container {
    justify-content: center;
  }
  
  .sequence-actions {
    flex-direction: column;
  }
  
  .round-result {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 0.5rem;
  }
  
  .results-actions {
    flex-direction: column;
  }
}
</style>