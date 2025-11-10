<template>
  <div class="sound-detective">
    <header class="game-header">
      <h1>🔍 Sound Detective</h1>
      <p class="subtitle">Listen carefully and identify the IPA symbol</p>
    </header>

    <!-- Difficulty Selector -->
    <div class="difficulty-selector" v-if="!gameStarted">
      <button
        v-for="level in difficulties"
        :key="level.id"
        @click="selectDifficulty(level.id)"
        class="difficulty-btn"
        :class="{ active: selectedDifficulty === level.id }"
      >
        <span class="difficulty-emoji">{{ level.emoji }}</span>
        <span class="difficulty-name">{{ level.name }}</span>
        <span class="difficulty-desc">{{ level.description }}</span>
      </button>
    </div>

    <!-- Start Game Button -->
    <div class="start-section" v-if="!gameStarted">
      <button @click="startGame" class="btn-start">
        🎵 Start Sound Detective
      </button>
    </div>

    <!-- Game Area -->
    <div class="game-area" v-if="gameStarted">
      <!-- Current Question -->
      <div class="question-section">
        <div class="question-number">
          Question {{ currentQuestion + 1 }} of {{ totalQuestions }}
        </div>
        
        <div class="audio-section">
          <button 
            @click="playCurrentSound" 
            class="play-btn"
            :disabled="isPlaying"
            :class="{ playing: isPlaying }"
          >
            <span class="play-icon">{{ isPlaying ? '🔊' : '🔊' }}</span>
            <span class="play-text">{{ isPlaying ? 'Playing...' : 'Play Sound' }}</span>
          </button>
          <div class="play-count">
            Plays remaining: {{ playsRemaining }}
          </div>
        </div>
      </div>

      <!-- Answer Choices -->
      <div class="choices-grid">
        <button
          v-for="(choice, index) in currentChoices"
          :key="index"
          @click="selectAnswer(choice)"
          class="choice-btn"
          :class="{ 
            selected: selectedAnswer === choice,
            correct: showResult && choice === correctAnswer,
            incorrect: showResult && selectedAnswer === choice && choice !== correctAnswer
          }"
          :disabled="showResult"
        >
          {{ choice }}
        </button>
      </div>

      <!-- Result Feedback -->
      <div class="result-section" v-if="showResult">
        <div class="result-message" :class="{ correct: isCorrect, incorrect: !isCorrect }">
          <span class="result-icon">{{ isCorrect ? '✅' : '❌' }}</span>
          <span class="result-text">
            {{ isCorrect ? 'Correct!' : 'Incorrect!' }}
          </span>
        </div>
        <div class="correct-answer" v-if="!isCorrect">
          The correct answer was: <strong>{{ correctAnswer }}</strong>
        </div>
        <button @click="nextQuestion" class="btn-next">
          {{ currentQuestion + 1 < totalQuestions ? 'Next Question' : 'View Results' }}
        </button>
      </div>

      <!-- Submit Answer Button -->
      <div class="submit-section" v-if="!showResult && selectedAnswer">
        <button @click="submitAnswer" class="btn-submit">
          Submit Answer
        </button>
      </div>
    </div>

    <!-- Game Stats -->
    <div class="game-stats" v-if="gameStarted">
      <div class="stat-item">
        <span class="stat-label">Difficulty:</span>
        <span class="stat-value">{{ currentDifficultyName }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Score:</span>
        <span class="stat-value">{{ score }}/{{ currentQuestion + (showResult ? 1 : 0) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Accuracy:</span>
        <span class="stat-value">{{ accuracy }}%</span>
      </div>
    </div>

    <!-- Final Results -->
    <div v-if="gameComplete" class="completion-overlay" @click="closeResults">
      <div class="completion-popup" @click.stop>
        <div class="completion-icon">🎉</div>
        <h2>Game Complete!</h2>
        <p>You identified {{ score }} out of {{ totalQuestions }} sounds correctly!</p>
        <div class="completion-stats">
          <div class="stat-box">
            <span class="stat-num">{{ score }}/{{ totalQuestions }}</span>
            <span class="stat-txt">Correct</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">{{ accuracy }}%</span>
            <span class="stat-txt">Accuracy</span>
          </div>
          <div class="stat-box" v-if="isNewBest">
            <span class="stat-num">🏆</span>
            <span class="stat-txt">New Best!</span>
          </div>
        </div>
        <div class="completion-actions">
          <button @click="playAgain" class="btn-play-again">
            Play Again
          </button>
          <button @click="closeResults" class="btn-close">
            Back to Games
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { playIPASound, preloadIPAAudio } from '../services/ipaAudioService'
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

// Difficulty levels with vowels organized by commonality
const difficulties = [
  {
    id: 'easy',
    name: 'Easy',
    emoji: '🟢',
    description: 'Most common vowels',
    symbols: ['i', 'e', 'a', 'o', 'u', 'ə']
  },
  {
    id: 'medium',
    name: 'Medium',
    emoji: '🟡',
    description: 'Common + distinct vowels',
    symbols: ['i', 'ɪ', 'e', 'ɛ', 'æ', 'ɑ', 'ɔ', 'o', 'ʊ', 'u', 'ə', 'ʌ']
  },
  {
    id: 'hard',
    name: 'Hard',
    emoji: '🔴',
    description: 'All vowels including rare',
    symbols: [
      'i', 'y', 'ɨ', 'ʉ', 'ɯ', 'u',
      'ɪ', 'ʏ', 'ʊ',
      'e', 'ø', 'ɘ', 'ɵ', 'ɤ', 'o',
      'ə',
      'ɛ', 'œ', 'ɜ', 'ɞ', 'ʌ', 'ɔ',
      'æ', 'ɐ',
      'a', 'ɶ', 'ɑ', 'ɒ'
    ]
  }
]

// Game state
const selectedDifficulty = ref('easy')
const gameStarted = ref(false)
const gameComplete = ref(false)
const currentQuestion = ref(0)
const totalQuestions = ref(10)
const score = ref(0)
const questions = ref([])
const selectedAnswer = ref('')
const showResult = ref(false)
const isCorrect = ref(false)
const correctAnswer = ref('')
const currentChoices = ref([])
const isPlaying = ref(false)
const playsRemaining = ref(3)
const isNewBest = ref(false)

// Computed properties
const currentDifficultyName = computed(() => {
  return difficulties.find(d => d.id === selectedDifficulty.value)?.name || 'Easy'
})

const accuracy = computed(() => {
  const questionsAnswered = currentQuestion.value + (showResult.value ? 1 : 0)
  return questionsAnswered > 0 ? Math.round((score.value / questionsAnswered) * 100) : 0
})

// Game functions
function selectDifficulty(difficultyId) {
  selectedDifficulty.value = difficultyId
}

function startGame() {
  // Check if language is selected, redirect if not
  if (!checkLanguageSelection()) {
    return
  }
  
  gameStarted.value = true
  generateQuestions()
  loadQuestion()
}

function generateQuestions() {
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
    const difficulty = difficulties.find(d => d.id === selectedDifficulty.value)
    availableSymbols = [...difficulty.symbols]
  }
  
  questions.value = []
  
  for (let i = 0; i < totalQuestions.value; i++) {
    // Pick a random correct answer
    const correctSymbol = availableSymbols[Math.floor(Math.random() * availableSymbols.length)]
    
    // Generate 3 wrong answers from the same difficulty level
    const wrongAnswers = availableSymbols
      .filter(symbol => symbol !== correctSymbol)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    
    // Combine and shuffle all choices
    const choices = [correctSymbol, ...wrongAnswers].sort(() => Math.random() - 0.5)
    
    questions.value.push({
      correctAnswer: correctSymbol,
      choices: choices
    })
  }
}

function loadQuestion() {
  if (currentQuestion.value >= totalQuestions.value) {
    completeGame()
    return
  }
  
  const question = questions.value[currentQuestion.value]
  correctAnswer.value = question.correctAnswer
  currentChoices.value = question.choices
  selectedAnswer.value = ''
  showResult.value = false
  playsRemaining.value = 3
  
  // Auto-play the sound once
  setTimeout(() => {
    playCurrentSound()
  }, 500)
}

async function playCurrentSound() {
  if (playsRemaining.value <= 0 || isPlaying.value) return
  
  isPlaying.value = true
  playsRemaining.value--
  
  try {
    // Get audio URL from database phonemes if available
    const phoneme = languagePhonemes.value.find(p => p.phoneme_ipa === correctAnswer.value)
    const audioUrl = phoneme?.audio_url || null
    
    // Use the enhanced IPA audio service with database URL and Wikipedia fallback
    await playIPASound(correctAnswer.value, audioUrl)
  } catch (error) {
    console.error('Error playing sound:', error)
  }
  
  // Reset playing state after a delay
  setTimeout(() => {
    isPlaying.value = false
  }, 1500)
}

function selectAnswer(choice) {
  if (showResult.value) return
  selectedAnswer.value = choice
}

function submitAnswer() {
  if (!selectedAnswer.value) return
  
  isCorrect.value = selectedAnswer.value === correctAnswer.value
  if (isCorrect.value) {
    score.value++
  }
  
  showResult.value = true
  
  // Update play count in localStorage
  const playCountKey = `game-sound-detective-play-count`
  const currentCount = parseInt(localStorage.getItem(playCountKey) || '0')
  localStorage.setItem(playCountKey, (currentCount + 1).toString())
}

function nextQuestion() {
  currentQuestion.value++
  loadQuestion()
}

function completeGame() {
  gameComplete.value = true
  
  // Check if this is a new best score
  const bestScoreKey = `game-sound-detective-best-${selectedDifficulty.value}`
  const currentBest = parseInt(localStorage.getItem(bestScoreKey) || '0')
  
  if (score.value > currentBest) {
    isNewBest.value = true
    localStorage.setItem(bestScoreKey, score.value.toString())
  }
}

function playAgain() {
  // Reset game state
  gameStarted.value = false
  gameComplete.value = false
  currentQuestion.value = 0
  score.value = 0
  selectedAnswer.value = ''
  showResult.value = false
  isNewBest.value = false
}

function closeResults() {
  router.push('/')
}

// Initialize on mount
onMounted(async () => {
  // Check if language is selected, redirect if not
  if (!checkLanguageSelection()) {
    return
  }
  
  // Preload audio for current phonemes if available
  if (languagePhonemes.value.length > 0) {
    const symbols = languagePhonemes.value.map(p => p.phoneme_ipa)
    await preloadIPAAudio(symbols)
  } else {
    // Fallback: preload default symbols
    const allSymbols = difficulties.flatMap(d => d.symbols)
    const uniqueSymbols = [...new Set(allSymbols)]
    await preloadIPAAudio(uniqueSymbols)
  }
})
</script>

<style scoped>
.sound-detective {
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

.difficulty-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 3rem;
}

.difficulty-btn {
  padding: 1.5rem 1rem;
  background: var(--surface-color);
  border: 3px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Manrope', sans-serif;
}

.difficulty-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(26, 83, 92, 0.2);
  border-color: var(--primary-color);
}

.difficulty-btn.active {
  background: linear-gradient(135deg, var(--primary-color), #2d6e78);
  border-color: var(--primary-color);
  color: white;
  box-shadow: 0 6px 20px rgba(26, 83, 92, 0.3);
}

.difficulty-emoji {
  font-size: 2rem;
  line-height: 1;
}

.difficulty-name {
  font-size: 1.2rem;
  font-weight: 700;
}

.difficulty-desc {
  font-size: 0.85rem;
  opacity: 0.8;
}

.difficulty-btn.active .difficulty-desc {
  opacity: 1;
}

.start-section {
  text-align: center;
  margin-bottom: 2rem;
}

.btn-start {
  padding: 1.5rem 3rem;
  font-size: 1.3rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, var(--primary-color), #2d6e78);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Manrope', sans-serif;
  box-shadow: 0 6px 20px rgba(26, 83, 92, 0.3);
}

.btn-start:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(26, 83, 92, 0.4);
}

.game-area {
  max-width: 700px;
  margin: 0 auto;
}

.question-section {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: var(--surface-color);
  border-radius: 16px;
  border: 2px solid var(--border-color);
}

.question-number {
  font-size: 1.1rem;
  color: var(--text-light);
  margin-bottom: 2rem;
  font-weight: 600;
}

.audio-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.play-btn {
  padding: 1.5rem 2rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, var(--success-color), #27ae60);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Manrope', sans-serif;
  box-shadow: 0 4px 12px rgba(45, 143, 71, 0.3);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.play-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(45, 143, 71, 0.4);
}

.play-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.play-btn.playing {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.play-icon {
  font-size: 1.5rem;
}

.play-count {
  font-size: 0.9rem;
  color: var(--text-light);
}

.choices-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.choice-btn {
  padding: 2rem;
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
  background: var(--surface-color);
  border: 3px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Doulos SIL', 'Charis SIL', 'Gentium', serif;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.choice-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(26, 83, 92, 0.2);
  border-color: var(--primary-color);
}

.choice-btn.selected {
  background: linear-gradient(135deg, var(--secondary-color), #fce5c8);
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(26, 83, 92, 0.2);
}

.choice-btn.correct {
  background: linear-gradient(135deg, var(--success-color), #27ae60);
  border-color: var(--success-color);
  color: white;
  animation: correctPulse 0.6s ease-out;
}

.choice-btn.incorrect {
  background: linear-gradient(135deg, var(--error-color), #c0392b);
  border-color: var(--error-color);
  color: white;
  animation: shake 0.6s ease-out;
}

@keyframes correctPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.result-section {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: var(--surface-color);
  border-radius: 12px;
  border: 2px solid var(--border-color);
}

.result-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.result-message.correct {
  color: var(--success-color);
}

.result-message.incorrect {
  color: var(--error-color);
}

.result-icon {
  font-size: 2rem;
}

.correct-answer {
  font-size: 1.1rem;
  color: var(--text-light);
  margin-bottom: 1.5rem;
}

.correct-answer strong {
  color: var(--primary-color);
  font-family: 'Doulos SIL', 'Charis SIL', 'Gentium', serif;
  font-size: 1.3rem;
}

.submit-section {
  text-align: center;
  margin-bottom: 2rem;
}

.btn-submit, .btn-next {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  background: var(--primary-color);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Manrope', sans-serif;
  box-shadow: 0 4px 12px rgba(26, 83, 92, 0.3);
}

.btn-submit:hover, .btn-next:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(26, 83, 92, 0.4);
}

.game-stats {
  display: flex;
  justify-content: space-around;
  padding: 1.5rem;
  background: var(--surface-color);
  border-radius: 12px;
  border: 2px solid var(--border-color);
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(26, 83, 92, 0.1);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.stat-value {
  font-size: 1.5rem;
  color: var(--primary-color);
  font-weight: 700;
  font-family: 'Manrope', sans-serif;
}

.completion-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.completion-popup {
  background: var(--surface-color);
  padding: 3rem;
  border-radius: 20px;
  text-align: center;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.completion-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.completion-popup h2 {
  color: var(--primary-color);
  margin: 0 0 1rem 0;
  font-size: 2rem;
}

.completion-popup p {
  color: var(--text-light);
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.completion-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-num {
  font-size: 2rem;
  color: var(--primary-color);
  font-weight: 800;
  font-family: 'Manrope', sans-serif;
}

.stat-txt {
  font-size: 0.9rem;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.completion-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-play-again, .btn-close {
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Manrope', sans-serif;
}

.btn-play-again {
  background: var(--primary-color);
  color: white;
  box-shadow: 0 4px 12px rgba(26, 83, 92, 0.3);
}

.btn-play-again:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(26, 83, 92, 0.4);
}

.btn-close {
  background: var(--text-light);
  color: white;
}

.btn-close:hover {
  background: #555;
  transform: translateY(-2px);
}

@media (max-width: 640px) {
  .sound-detective {
    padding: 1rem;
  }
  
  .game-header h1 {
    font-size: 1.75rem;
  }
  
  .difficulty-selector {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .choices-grid {
    grid-template-columns: 1fr;
  }
  
  .choice-btn {
    padding: 1.5rem;
    font-size: 1.5rem;
    min-height: 80px;
  }
  
  .game-stats {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .completion-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .completion-actions {
    flex-direction: column;
  }
}
</style>