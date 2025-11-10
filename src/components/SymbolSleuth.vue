<template>
  <div class="symbol-sleuth-game">
    <header class="game-header">
      <h1>👁️ Symbol Sleuth</h1>
      <p class="subtitle">See IPA symbols and identify their sounds</p>
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
        🎯 Start Symbol Sleuth
      </button>
    </div>

    <!-- Game Play -->
    <div v-else-if="gameState === 'playing'" class="game-play">
      <div class="question-card">
        <div class="question-header">
          <h2>Question {{ currentQuestion + 1 }} of {{ totalQuestions }}</h2>
        </div>
        
        <div class="symbol-display">
          <div class="ipa-symbol">{{ currentQuestionData.symbol }}</div>
          <p class="instruction">Which sound does this symbol represent?</p>
        </div>

        <div class="audio-options">
          <div 
            v-for="(option, index) in currentQuestionData.options" 
            :key="index"
            class="audio-option"
            :class="{ 
              selected: selectedAnswer === index,
              correct: showResult && index === currentQuestionData.correctIndex,
              incorrect: showResult && selectedAnswer === index && index !== currentQuestionData.correctIndex
            }"
            @click="selectAnswer(index)"
          >
            <button 
              class="play-audio-btn"
              @click.stop="playAudio(option.symbol)"
              :disabled="isPlaying"
            >
              <span v-if="isPlaying && playingSymbol === option.symbol">🔊</span>
              <span v-else>▶️</span>
            </button>
            <span class="option-label">Option {{ index + 1 }}</span>
            <span class="option-symbol">{{ option.symbol }}</span>
          </div>
        </div>

        <div class="question-actions">
          <button 
            v-if="!showResult"
            class="submit-btn"
            @click="submitAnswer"
            :disabled="selectedAnswer === null"
          >
            Submit Answer
          </button>
          <button 
            v-else
            class="next-btn"
            @click="nextQuestion"
          >
            {{ currentQuestion + 1 < totalQuestions ? 'Next Question' : 'View Results' }}
          </button>
        </div>

        <div v-if="showResult" class="result-feedback">
          <div v-if="selectedAnswer === currentQuestionData.correctIndex" class="correct-feedback">
            ✅ Correct! The symbol {{ currentQuestionData.symbol }} represents this sound.
          </div>
          <div v-else class="incorrect-feedback">
            ❌ Incorrect. The symbol {{ currentQuestionData.symbol }} represents the sound in Option {{ currentQuestionData.correctIndex + 1 }}.
          </div>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-else-if="gameState === 'results'" class="game-results">
      <div class="results-card">
        <h2>🎯 Symbol Sleuth Complete!</h2>
        <div class="score-display">
          <div class="final-score">{{ correctAnswers }}/{{ totalQuestions }}</div>
          <div class="accuracy">{{ Math.round((correctAnswers / totalQuestions) * 100) }}% Accuracy</div>
        </div>
        
        <div class="performance-message">
          <p v-if="accuracy >= 90">🏆 Excellent! You're a true Symbol Sleuth!</p>
          <p v-else-if="accuracy >= 70">👍 Great job! Keep practicing to master all symbols.</p>
          <p v-else-if="accuracy >= 50">📚 Good effort! Review the symbols and try again.</p>
          <p v-else>💪 Keep practicing! Familiarity with IPA symbols takes time.</p>
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
const gameState = ref('difficulty') // 'difficulty', 'playing', 'results'
const selectedDifficulty = ref('hard')
const currentQuestion = ref(0)
const totalQuestions = ref(10)
const selectedAnswer = ref(null)
const showResult = ref(false)
const correctAnswers = ref(0)
const questions = ref([])
const isPlaying = ref(false)
const playingSymbol = ref(null)

// Difficulty levels
const difficultyLevels = [
  {
    id: 'easy',
    name: 'Easy',
    description: 'Most common vowels',
    color: '#10b981',
    symbols: ['a', 'e', 'i', 'o', 'u', 'ɑ']
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Common + distinct vowels',
    color: '#f59e0b',
    symbols: ['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ', 'ə', 'ʌ']
  },
  {
    id: 'hard',
    name: 'Hard',
    description: 'All vowels including rare',
    color: '#ef4444',
    symbols: ['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ', 'ə', 'ʌ', 'æ', 'ɒ', 'ɜ', 'ɨ', 'ɵ', 'ɯ', 'ɤ', 'ɞ', 'ɘ', 'ɶ', 'œ', 'ʏ', 'ɐ', 'ɚ', 'ɝ', 'ɹ']
  }
]

// Computed properties
const currentQuestionData = computed(() => {
  return questions.value[currentQuestion.value] || {}
})

const accuracy = computed(() => {
  return Math.round((correctAnswers.value / totalQuestions.value) * 100)
})

// Game functions
const startGame = () => {
  // Check if language is selected, redirect if not
  if (!checkLanguageSelection()) {
    return
  }
  
  generateQuestions()
  gameState.value = 'playing'
  currentQuestion.value = 0
  correctAnswers.value = 0
}

const generateQuestions = () => {
  let availableSymbols = []
  
  // Use database phonemes if available, otherwise fallback to default
  if (languagePhonemes.value.length > 0) {
    // Filter phonemes by difficulty if specified
    const difficultyMap = {
      'easy': ['easy'],
      'medium': ['easy', 'medium'],
      'hard': ['easy', 'medium', 'hard']
    }
    
    const allowedDifficulties = difficultyMap[selectedDifficulty.value] || ['medium']
    const filteredPhonemes = languagePhonemes.value.filter(phoneme =>
      allowedDifficulties.includes(phoneme.difficulty_level)
    )
    
    availableSymbols = filteredPhonemes.length > 0
      ? filteredPhonemes.map(p => p.phoneme_ipa)
      : languagePhonemes.value.map(p => p.phoneme_ipa)
  } else {
    // Fallback to default difficulty symbols
    const difficulty = difficultyLevels.find(d => d.id === selectedDifficulty.value)
    availableSymbols = [...difficulty.symbols]
  }
  
  questions.value = []

  for (let i = 0; i < totalQuestions.value; i++) {
    // Pick a random symbol as the correct answer
    const correctSymbol = availableSymbols[Math.floor(Math.random() * availableSymbols.length)]
    
    // Generate 3 incorrect options
    const incorrectOptions = []
    while (incorrectOptions.length < 3) {
      const randomSymbol = availableSymbols[Math.floor(Math.random() * availableSymbols.length)]
      if (randomSymbol !== correctSymbol && !incorrectOptions.includes(randomSymbol)) {
        incorrectOptions.push(randomSymbol)
      }
    }

    // Create options array with correct answer in random position
    const correctIndex = Math.floor(Math.random() * 4)
    const options = []
    
    for (let j = 0; j < 4; j++) {
      if (j === correctIndex) {
        options.push({ symbol: correctSymbol })
      } else {
        options.push({ symbol: incorrectOptions.pop() })
      }
    }

    questions.value.push({
      symbol: correctSymbol,
      options: options,
      correctIndex: correctIndex
    })
  }
}

const selectAnswer = (index) => {
  if (showResult.value) return
  selectedAnswer.value = index
}

const submitAnswer = () => {
  if (selectedAnswer.value === null) return
  
  showResult.value = true
  if (selectedAnswer.value === currentQuestionData.value.correctIndex) {
    correctAnswers.value++
  }
}

const nextQuestion = () => {
  if (currentQuestion.value + 1 < totalQuestions.value) {
    currentQuestion.value++
    selectedAnswer.value = null
    showResult.value = false
  } else {
    finishGame()
  }
}

const finishGame = () => {
  gameState.value = 'results'
  saveGameStats()
}

const saveGameStats = () => {
  try {
    const stats = JSON.parse(localStorage.getItem('symbolSleuthStats') || '{}')
    const difficultyStats = stats[selectedDifficulty.value] || { played: 0, bestScore: 0 }
    
    difficultyStats.played++
    if (correctAnswers.value > difficultyStats.bestScore) {
      difficultyStats.bestScore = correctAnswers.value
    }
    
    stats[selectedDifficulty.value] = difficultyStats
    localStorage.setItem('symbolSleuthStats', JSON.stringify(stats))

    // Update overall game progress
    const gameProgress = JSON.parse(localStorage.getItem('gameProgress') || '{}')
    gameProgress.symbolSleuth = (gameProgress.symbolSleuth || 0) + 1
    localStorage.setItem('gameProgress', JSON.stringify(gameProgress))
  } catch (error) {
    console.error('Error saving game stats:', error)
  }
}

const playAudio = async (symbol) => {
  if (isPlaying.value) return
  
  try {
    isPlaying.value = true
    playingSymbol.value = symbol
    
    // Get audio URL from database phonemes if available
    const phoneme = languagePhonemes.value.find(p => p.phoneme_ipa === symbol)
    const audioUrl = phoneme?.audio_url || null
    
    // Use the enhanced IPA audio service with database URL and Wikipedia fallback
    await ipaAudioService.playSound(symbol, audioUrl)
  } catch (error) {
    console.error('Error playing audio:', error)
  } finally {
    isPlaying.value = false
    playingSymbol.value = null
  }
}

const resetGame = () => {
  gameState.value = 'difficulty'
  currentQuestion.value = 0
  selectedAnswer.value = null
  showResult.value = false
  correctAnswers.value = 0
  questions.value = []
}

const goBack = () => {
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
      const allSymbols = difficultyLevels.flatMap(d => d.symbols)
      const uniqueSymbols = [...new Set(allSymbols)]
      await ipaAudioService.preloadAudio(uniqueSymbols)
    }
  } catch (error) {
    console.error('Error preloading audio:', error)
  }
})
</script>

<style scoped>
.symbol-sleuth-game {
  max-width: 900px;
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

.difficulty-card h3 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.difficulty-card p {
  color: var(--text-light);
  margin: 0;
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
.question-card {
  background: var(--surface-color);
  border-radius: 20px;
  padding: 2rem;
  border: 2px solid var(--border-color);
}

.question-header {
  text-align: center;
  margin-bottom: 2rem;
}

.question-header h2 {
  color: var(--text-light);
  font-size: 1.1rem;
  margin: 0;
  font-weight: 500;
}

.symbol-display {
  text-align: center;
  margin-bottom: 3rem;
}

.ipa-symbol {
  font-size: 4rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-family: 'Doulos SIL', 'Charis SIL', serif;
}

.instruction {
  font-size: 1.2rem;
  color: var(--text-light);
  margin: 0;
}

.audio-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.audio-option {
  background: var(--background-color);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.audio-option:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.audio-option.selected {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.audio-option.correct {
  border-color: #10b981;
  background: #ecfdf5;
}

.audio-option.incorrect {
  border-color: #ef4444;
  background: #fef2f2;
}

.play-audio-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.play-audio-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: scale(1.1);
}

.play-audio-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.option-label {
  font-weight: 600;
  color: var(--text-primary);
}

.option-symbol {
  font-family: 'Doulos SIL', 'Charis SIL', serif;
  font-size: 1.2rem;
  color: var(--text-light);
  margin-left: auto;
}

.question-actions {
  text-align: center;
  margin-bottom: 1rem;
}

.submit-btn, .next-btn {
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
  padding: 1rem;
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

.score-display {
  margin-bottom: 2rem;
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
  .symbol-sleuth-game {
    padding: 1rem;
  }
  
  .difficulty-cards {
    grid-template-columns: 1fr;
  }
  
  .audio-options {
    grid-template-columns: 1fr;
  }
  
  .ipa-symbol {
    font-size: 3rem;
  }
  
  .results-actions {
    flex-direction: column;
  }
}
</style>