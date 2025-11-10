<template>
  <div class="minimal-pairs-game">
    <header class="game-header">
      <h1>⚖️ Minimal Pairs Master</h1>
      <p class="subtitle">Distinguish between similar-sounding vowels</p>
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
          <div class="example-pairs">
            <span v-for="pair in level.examplePairs" :key="pair" class="example-pair">{{ pair }}</span>
          </div>
        </div>
      </div>
      <button 
        class="start-game-btn"
        @click="startGame"
        :disabled="!selectedDifficulty"
      >
        🎯 Start Minimal Pairs Master
      </button>
    </div>

    <!-- Game Play -->
    <div v-else-if="gameState === 'playing'" class="game-play">
      <div class="pairs-card">
        <div class="pairs-header">
          <h2>Question {{ currentQuestion + 1 }} of {{ totalQuestions }}</h2>
          <div class="score-display">Score: {{ score }}/{{ totalQuestions * 100 }}</div>
        </div>
        
        <div class="pair-display">
          <h3>Listen carefully and identify which sound you hear:</h3>
          <div class="sound-pair">
            <div class="pair-symbols">
              <span class="symbol-option">{{ currentPair.symbol1 }}</span>
              <span class="vs-text">vs</span>
              <span class="symbol-option">{{ currentPair.symbol2 }}</span>
            </div>
            <div class="pair-description">
              <p>{{ currentPair.description }}</p>
            </div>
          </div>
        </div>

        <div class="audio-section">
          <div class="play-sound-area">
            <button 
              class="play-mystery-btn"
              @click="playMysterySound"
              :disabled="isPlaying"
            >
              <span v-if="isPlaying">🔊 Playing...</span>
              <span v-else>🎵 Play Mystery Sound</span>
            </button>
            <div class="plays-remaining">
              Plays remaining: {{ playsRemaining }}
            </div>
          </div>

          <div class="reference-sounds">
            <h4>Reference sounds (listen to compare):</h4>
            <div class="reference-buttons">
              <button 
                class="reference-btn"
                @click="playReferenceSound(currentPair.symbol1)"
                :disabled="isPlaying"
              >
                <span class="ref-symbol">{{ currentPair.symbol1 }}</span>
                <span class="ref-label">{{ currentPair.label1 }}</span>
              </button>
              <button 
                class="reference-btn"
                @click="playReferenceSound(currentPair.symbol2)"
                :disabled="isPlaying"
              >
                <span class="ref-symbol">{{ currentPair.symbol2 }}</span>
                <span class="ref-label">{{ currentPair.label2 }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="answer-section">
          <h4>Which sound did you hear in the mystery audio?</h4>
          <div class="answer-options">
            <button 
              class="answer-btn"
              :class="{ 
                selected: selectedAnswer === currentPair.symbol1,
                correct: showResult && currentPair.symbol1 === correctAnswer,
                incorrect: showResult && selectedAnswer === currentPair.symbol1 && currentPair.symbol1 !== correctAnswer
              }"
              @click="selectAnswer(currentPair.symbol1)"
              :disabled="showResult"
            >
              <span class="answer-symbol">{{ currentPair.symbol1 }}</span>
              <span class="answer-label">{{ currentPair.label1 }}</span>
            </button>
            <button 
              class="answer-btn"
              :class="{ 
                selected: selectedAnswer === currentPair.symbol2,
                correct: showResult && currentPair.symbol2 === correctAnswer,
                incorrect: showResult && selectedAnswer === currentPair.symbol2 && currentPair.symbol2 !== correctAnswer
              }"
              @click="selectAnswer(currentPair.symbol2)"
              :disabled="showResult"
            >
              <span class="answer-symbol">{{ currentPair.symbol2 }}</span>
              <span class="answer-label">{{ currentPair.label2 }}</span>
            </button>
          </div>
        </div>

        <div class="question-actions">
          <button 
            v-if="!showResult"
            class="submit-btn"
            @click="submitAnswer"
            :disabled="!selectedAnswer"
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
          <div v-if="selectedAnswer === correctAnswer" class="correct-feedback">
            ✅ Correct! You heard the {{ correctAnswer }} sound.
            <div class="feedback-detail">{{ getFeedbackMessage() }}</div>
          </div>
          <div v-else class="incorrect-feedback">
            ❌ Incorrect. The mystery sound was {{ correctAnswer }}.
            <div class="feedback-detail">{{ getFeedbackMessage() }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-else-if="gameState === 'results'" class="game-results">
      <div class="results-card">
        <h2>⚖️ Minimal Pairs Master Complete!</h2>
        <div class="score-display">
          <div class="final-score">{{ score }}/{{ totalQuestions * 100 }}</div>
          <div class="accuracy">{{ Math.round((score / (totalQuestions * 100)) * 100) }}% Accuracy</div>
        </div>
        
        <div class="pairs-breakdown">
          <h3>Pair Results:</h3>
          <div class="pair-results">
            <div 
              v-for="(result, index) in questionResults" 
              :key="index"
              class="pair-result"
            >
              <span class="pair-symbols">{{ result.pair }}</span>
              <span class="pair-score" :class="{ correct: result.correct }">
                {{ result.correct ? '✅ 100' : '❌ 0' }}
              </span>
              <div class="pair-bar">
                <div 
                  class="pair-fill" 
                  :style="{ width: result.correct ? '100%' : '0%', backgroundColor: result.correct ? '#10b981' : '#ef4444' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="performance-message">
          <p v-if="accuracy >= 90">🏆 Outstanding! You have excellent vowel discrimination skills!</p>
          <p v-else-if="accuracy >= 75">👍 Great job! You can distinguish most vowel pairs well.</p>
          <p v-else-if="accuracy >= 60">📚 Good effort! Keep practicing with similar vowel sounds.</p>
          <p v-else>💪 Keep practicing! Vowel discrimination improves with training.</p>
        </div>

        <div class="results-actions">
          <button class="play-again-btn" @click="resetGame">
            🔄 Practice Again
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
import { selectedLanguage, languagePhonemes } from '../stores/languageStore.js'

const router = useRouter()

// Game state
const gameState = ref('difficulty')
const selectedDifficulty = ref('easy')
const currentQuestion = ref(0)
const totalQuestions = ref(10)
const score = ref(0)
const questionResults = ref([])
const selectedAnswer = ref(null)
const showResult = ref(false)
const correctAnswer = ref(null)
const playsRemaining = ref(3)
const isPlaying = ref(false)

// Minimal pairs for different difficulty levels
const minimalPairs = {
  easy: [
    {
      symbol1: 'i', symbol2: 'ɪ',
      label1: 'FLEECE', label2: 'KIT',
      description: 'Close front vowels - tense vs lax',
      feedback: 'The /i/ sound is longer and more tense, while /ɪ/ is shorter and more relaxed.'
    },
    {
      symbol1: 'e', symbol2: 'ɛ',
      label1: 'FACE', label2: 'DRESS',
      description: 'Mid front vowels - close vs open',
      feedback: 'The /e/ sound is higher and more closed, while /ɛ/ is lower and more open.'
    },
    {
      symbol1: 'u', symbol2: 'ʊ',
      label1: 'GOOSE', label2: 'FOOT',
      description: 'Close back vowels - tense vs lax',
      feedback: 'The /u/ sound is longer and more tense, while /ʊ/ is shorter and more relaxed.'
    },
    {
      symbol1: 'o', symbol2: 'ɔ',
      label1: 'GOAT', label2: 'THOUGHT',
      description: 'Mid back vowels - close vs open',
      feedback: 'The /o/ sound is higher and more closed, while /ɔ/ is lower and more open.'
    },
    {
      symbol1: 'a', symbol2: 'ɑ',
      label1: 'TRAP', label2: 'PALM',
      description: 'Open vowels - front vs back',
      feedback: 'The /a/ sound is more front, while /ɑ/ is more back in the mouth.'
    }
  ],
  medium: [
    {
      symbol1: 'ɛ', symbol2: 'æ',
      label1: 'DRESS', label2: 'TRAP',
      description: 'Front vowels - mid vs low',
      feedback: 'The /ɛ/ sound is higher (mid), while /æ/ is lower (near-open).'
    },
    {
      symbol1: 'ɪ', symbol2: 'e',
      label1: 'KIT', label2: 'FACE',
      description: 'Front vowels - different heights',
      feedback: 'The /ɪ/ sound is higher but lax, while /e/ is mid but tense.'
    },
    {
      symbol1: 'ʊ', symbol2: 'o',
      label1: 'FOOT', label2: 'GOAT',
      description: 'Back vowels - different heights',
      feedback: 'The /ʊ/ sound is higher but lax, while /o/ is mid but tense.'
    },
    {
      symbol1: 'ɔ', symbol2: 'ɑ',
      label1: 'THOUGHT', label2: 'PALM',
      description: 'Back vowels - mid vs open',
      feedback: 'The /ɔ/ sound is mid-open, while /ɑ/ is fully open.'
    },
    {
      symbol1: 'ə', symbol2: 'ʌ',
      label1: 'COMMA', label2: 'STRUT',
      description: 'Central vowels - schwa vs wedge',
      feedback: 'The /ə/ sound is neutral (schwa), while /ʌ/ is more open and stressed.'
    }
  ],
  hard: [
    {
      symbol1: 'æ', symbol2: 'ɐ',
      label1: 'TRAP', label2: 'BATH',
      description: 'Near-open vowels - front vs central',
      feedback: 'The /æ/ sound is more front, while /ɐ/ is more central.'
    },
    {
      symbol1: 'ɜ', symbol2: 'ə',
      label1: 'NURSE', label2: 'COMMA',
      description: 'Central vowels - stressed vs unstressed',
      feedback: 'The /ɜ/ sound is stressed and r-colored, while /ə/ is unstressed schwa.'
    },
    {
      symbol1: 'ɨ', symbol2: 'ɯ',
      label1: 'Close central', label2: 'Close back',
      description: 'Close vowels - central vs back unrounded',
      feedback: 'The /ɨ/ sound is central, while /ɯ/ is back but unrounded.'
    },
    {
      symbol1: 'ɞ', symbol2: 'ɘ',
      label1: 'Open-mid central', label2: 'Close-mid central',
      description: 'Central vowels - different heights',
      feedback: 'The /ɞ/ sound is more open, while /ɘ/ is more closed.'
    },
    {
      symbol1: 'œ', symbol2: 'ɶ',
      label1: 'Close-mid front rounded', label2: 'Open front rounded',
      description: 'Front rounded vowels - different heights',
      feedback: 'The /œ/ sound is close-mid, while /ɶ/ is open.'
    }
  ]
}

// Difficulty levels
const difficultyLevels = [
  {
    id: 'easy',
    name: 'Easy',
    description: 'Common English vowel pairs',
    color: '#10b981',
    examplePairs: ['i/ɪ', 'e/ɛ', 'u/ʊ']
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Challenging vowel distinctions',
    color: '#f59e0b',
    examplePairs: ['ɛ/æ', 'ə/ʌ', 'ɔ/ɑ']
  },
  {
    id: 'hard',
    name: 'Hard',
    description: 'Advanced phonetic contrasts',
    color: '#ef4444',
    examplePairs: ['ɜ/ə', 'œ/ɶ', 'ɨ/ɯ']
  }
]

// Computed properties
const currentPair = computed(() => {
  if (!questionResults.value[currentQuestion.value]) return {}
  return questionResults.value[currentQuestion.value].pairData
})

const accuracy = computed(() => {
  return (score.value / (totalQuestions.value * 100)) * 100
})

// Language selection check
function checkLanguageSelection() {
  if (!selectedLanguage.value) {
    router.push('/')
    return false
  }
  return true
}

// Game functions
function startGame() {
  // Check if language is selected
  if (!checkLanguageSelection()) {
    return
  }
  
  generateQuestions()
  gameState.value = 'playing'
  currentQuestion.value = 0
  score.value = 0
}

function generateQuestions() {
  let pairs = []
  
  // Use database phonemes if available
  if (languagePhonemes.value.length > 0) {
    pairs = generateDynamicPairs()
  } else {
    // Fallback to default minimal pairs
    pairs = minimalPairs[selectedDifficulty.value]
  }
  
  // Ensure we have pairs to work with
  if (pairs.length === 0) {
    pairs = minimalPairs[selectedDifficulty.value]
  }
  
  questionResults.value = []

  for (let i = 0; i < totalQuestions.value; i++) {
    // Select a random pair
    const pairData = pairs[Math.floor(Math.random() * pairs.length)]
    
    // Randomly choose which symbol is the correct answer
    const correctSymbol = Math.random() < 0.5 ? pairData.symbol1 : pairData.symbol2
    
    questionResults.value.push({
      pairData,
      correctAnswer: correctSymbol,
      pair: `${pairData.symbol1}/${pairData.symbol2}`,
      correct: false,
      answered: false
    })
  }
}

function generateDynamicPairs() {
  // Create difficulty mapping for database phonemes
  const difficultyMap = {
    easy: ['easy'],
    medium: ['easy', 'medium'],
    hard: ['easy', 'medium', 'hard']
  }
  
  const allowedDifficulties = difficultyMap[selectedDifficulty.value] || ['easy']
  const filteredPhonemes = languagePhonemes.value.filter(p =>
    allowedDifficulties.includes(p.difficulty_level)
  )
  
  const pairs = []
  
  // Create pairs from available phonemes
  for (let i = 0; i < filteredPhonemes.length; i++) {
    for (let j = i + 1; j < filteredPhonemes.length; j++) {
      const phoneme1 = filteredPhonemes[i]
      const phoneme2 = filteredPhonemes[j]
      
      pairs.push({
        symbol1: phoneme1.phoneme_ipa,
        symbol2: phoneme2.phoneme_ipa,
        label1: phoneme1.phoneme_ipa.toUpperCase(),
        label2: phoneme2.phoneme_ipa.toUpperCase(),
        description: `${phoneme1.phoneme_ipa} vs ${phoneme2.phoneme_ipa}`,
        feedback: `Listen carefully to distinguish between ${phoneme1.phoneme_ipa} and ${phoneme2.phoneme_ipa}.`
      })
    }
  }
  
  return pairs
}

async function playMysterySound() {
  if (isPlaying.value || playsRemaining.value <= 0) return
  
  try {
    isPlaying.value = true
    playsRemaining.value--
    correctAnswer.value = questionResults.value[currentQuestion.value].correctAnswer
    
    // Get audio URL from database phonemes if available
    const phoneme = languagePhonemes.value.find(p => p.phoneme_ipa === correctAnswer.value)
    const audioUrl = phoneme?.audio_url || null
    
    // Use the enhanced IPA audio service with database URL and Wikipedia fallback
    await ipaAudioService.playSound(correctAnswer.value, audioUrl)
  } catch (error) {
    console.error('Error playing mystery sound:', error)
  } finally {
    isPlaying.value = false
  }
}

async function playReferenceSound(symbol) {
  if (isPlaying.value) return
  
  try {
    isPlaying.value = true
    
    // Get audio URL from database phonemes if available
    const phoneme = languagePhonemes.value.find(p => p.phoneme_ipa === symbol)
    const audioUrl = phoneme?.audio_url || null
    
    // Use the enhanced IPA audio service with database URL and Wikipedia fallback
    await ipaAudioService.playSound(symbol, audioUrl)
  } catch (error) {
    console.error('Error playing reference sound:', error)
  } finally {
    isPlaying.value = false
  }
}

function selectAnswer(symbol) {
  if (showResult.value) return
  selectedAnswer.value = symbol
}

function submitAnswer() {
  if (!selectedAnswer.value) return
  
  showResult.value = true
  const isCorrect = selectedAnswer.value === correctAnswer.value
  
  questionResults.value[currentQuestion.value].correct = isCorrect
  questionResults.value[currentQuestion.value].answered = true
  
  if (isCorrect) {
    score.value += 100
  }
}

function getFeedbackMessage() {
  return currentPair.value.feedback || ''
}

function nextQuestion() {
  if (currentQuestion.value + 1 < totalQuestions.value) {
    currentQuestion.value++
    selectedAnswer.value = null
    showResult.value = false
    correctAnswer.value = null
    playsRemaining.value = 3
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
    const stats = JSON.parse(localStorage.getItem('minimalPairsStats') || '{}')
    const difficultyStats = stats[selectedDifficulty.value] || { played: 0, bestScore: 0 }
    
    difficultyStats.played++
    if (score.value > difficultyStats.bestScore) {
      difficultyStats.bestScore = score.value
    }
    
    stats[selectedDifficulty.value] = difficultyStats
    localStorage.setItem('minimalPairsStats', JSON.stringify(stats))

    // Update overall game progress
    const gameProgress = JSON.parse(localStorage.getItem('gameProgress') || '{}')
    gameProgress.minimalPairs = (gameProgress.minimalPairs || 0) + 1
    localStorage.setItem('gameProgress', JSON.stringify(gameProgress))
  } catch (error) {
    console.error('Error saving game stats:', error)
  }
}

function resetGame() {
  gameState.value = 'difficulty'
  currentQuestion.value = 0
  score.value = 0
  questionResults.value = []
  selectedAnswer.value = null
  showResult.value = false
  correctAnswer.value = null
  playsRemaining.value = 3
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
      await ipaAudioService.preloadAudio()
    }
  } catch (error) {
    console.error('Error preloading audio:', error)
  }
})
</script>

<style scoped>
.minimal-pairs-game {
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
  margin: 0 0 1rem 0;
}

.example-pairs {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.example-pair {
  background: var(--background-color);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-family: 'Doulos SIL', 'Charis SIL', serif;
  font-size: 0.9rem;
  color: var(--primary-color);
  font-weight: 600;
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
.pairs-card {
  background: var(--surface-color);
  border-radius: 20px;
  padding: 2rem;
  border: 2px solid var(--border-color);
}

.pairs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.pairs-header h2 {
  color: var(--text-light);
  font-size: 1.1rem;
  margin: 0;
  font-weight: 500;
}

.score-display {
  font-weight: 600;
  color: var(--primary-color);
}

.pair-display {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: var(--background-color);
  border-radius: 16px;
  border: 2px solid var(--border-color);
}

.pair-display h3 {
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
  font-size: 1.3rem;
}

.sound-pair {
  margin-bottom: 1rem;
}

.pair-symbols {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.symbol-option {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--primary-color);
  font-family: 'Doulos SIL', 'Charis SIL', serif;
  padding: 1rem;
  background: var(--surface-color);
  border-radius: 12px;
  border: 2px solid var(--border-color);
}

.vs-text {
  font-size: 1.2rem;
  color: var(--text-light);
  font-weight: 600;
}

.pair-description p {
  color: var(--text-light);
  margin: 0;
  font-style: italic;
}

.audio-section {
  margin-bottom: 2rem;
}

.play-sound-area {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: var(--background-color);
  border-radius: 12px;
  border: 2px solid var(--border-color);
}

.play-mystery-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 1.5rem 3rem;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
}

.play-mystery-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

.play-mystery-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.plays-remaining {
  color: var(--text-light);
  font-weight: 600;
}

.reference-sounds {
  text-align: center;
}

.reference-sounds h4 {
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.reference-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.reference-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.reference-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  background: var(--primary-light);
  transform: translateY(-2px);
}

.reference-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.ref-symbol {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--primary-color);
  font-family: 'Doulos SIL', 'Charis SIL', serif;
}

.ref-label {
  font-size: 0.9rem;
  color: var(--text-light);
  font-weight: 600;
}

.answer-section {
  margin-bottom: 2rem;
  text-align: center;
}

.answer-section h4 {
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
}

.answer-options {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.answer-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 150px;
}

.answer-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  background: var(--primary-light);
  transform: translateY(-2px);
}

.answer-btn.selected {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.answer-btn.correct {
  border-color: #10b981;
  background: #ecfdf5;
}

.answer-btn.incorrect {
  border-color: #ef4444;
  background: #fef2f2;
}

.answer-btn:disabled {
  cursor: not-allowed;
}

.answer-symbol {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
  font-family: 'Doulos SIL', 'Charis SIL', serif;
}

.answer-label {
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 600;
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

.feedback-detail {
  margin-top: 1rem;
  font-style: italic;
  opacity: 0.9;
  font-weight: normal;
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

.pairs-breakdown {
  margin-bottom: 2rem;
  text-align: left;
}

.pairs-breakdown h3 {
  margin-bottom: 1rem;
  color: var(--text-primary);
  text-align: center;
}

.pair-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pair-result {
  display: grid;
  grid-template-columns: 100px 80px 1fr;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--background-color);
  border-radius: 8px;
}

.pair-symbols {
  font-family: 'Doulos SIL', 'Charis SIL', serif;
  font-weight: 600;
  color: var(--primary-color);
}

.pair-score {
  font-weight: 600;
  text-align: center;
}

.pair-score.correct {
  color: #10b981;
}

.pair-bar {
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.pair-fill {
  height: 100%;
  transition: width 0.5s ease;
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
  .minimal-pairs-game {
    padding: 1rem;
  }
  
  .difficulty-cards {
    grid-template-columns: 1fr;
  }
  
  .pairs-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .pair-symbols {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .symbol-option {
    font-size: 2rem;
  }
  
  .reference-buttons, .answer-options {
    flex-direction: column;
    align-items: center;
  }
  
  .pair-result {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 0.5rem;
  }
  
  .results-actions {
    flex-direction: column;
  }
}
</style>