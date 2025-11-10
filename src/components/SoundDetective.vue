<template>
  <div class="sound-detective">
    <header class="game-header">
      <div class="header-title">
        <h1>Sound Detective</h1>
        <p class="subtitle">Listen carefully and identify the IPA symbol</p>
      </div>
      <div class="header-level" v-if="gameStarted">
        <span class="header-emoji">{{ getCurrentLevelEmoji() }}</span>
        <div class="header-pill">
          <span class="pill-label">Difficulty</span>
          <span class="pill-name">{{ currentDifficultyName }}</span>
        </div>
      </div>
    </header>

    <!-- Difficulty Selection -->
    <div v-if="gameState === 'difficulty'" class="difficulty-selection">
      <div class="difficulty-cards">
        <div
          v-for="level in availableLevels"
          :key="level.id"
          class="difficulty-card"
          :class="{
            selected: selectedDifficulty === level.id,
            locked: !level.unlocked
          }"
          @click="selectDifficulty(level.id)"
        >
          <div class="difficulty-header">
            <span class="difficulty-emoji">{{ level.emoji }}</span>
            <h3>{{ level.name }}</h3>
          </div>
          <p class="difficulty-description">{{ level.description }}</p>
          <div v-if="!level.unlocked" class="locked-overlay">
            <span class="lock-icon">🔒</span>
            <span>Complete previous level to unlock</span>
          </div>
        </div>
      </div>
      <button
        class="start-game-btn"
        @click="startGame"
        :disabled="!selectedDifficulty || !isLevelUnlocked(selectedDifficulty)"
      >
        🎵 Start Sound Detective
      </button>
    </div>

    <!-- Game Play -->
    <div v-else-if="gameState === 'playing'" class="game-layout">
      <!-- LEFT: Main game area -->
      <div class="game-main">
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
          <div class="result-details">
            <div class="result-message" :class="{ correct: isCorrect, incorrect: !isCorrect }">
              <span class="result-icon">{{ isCorrect ? '✅' : '❌' }}</span>
              <span class="result-text">
                {{ isCorrect ? 'Correct!' : 'Incorrect!' }}
              </span>
            </div>
            <div class="correct-answer" v-if="!isCorrect">
              The correct answer was: <strong>{{ correctAnswer }}</strong>
            </div>
          </div>
          <button @click="nextQuestion" class="btn-next mobile-action-button">
            {{ currentQuestion + 1 < totalQuestions ? 'Next Question' : 'View Results' }}
          </button>
        </div>

        <div
          v-if="showResult"
          class="mobile-result-toast"
          :class="{ correct: isCorrect, incorrect: !isCorrect }"
        >
          <span class="toast-icon">{{ isCorrect ? '✅' : '❌' }}</span>
          <div class="toast-text">
            <span class="toast-title">{{ isCorrect ? 'Correct!' : 'Incorrect!' }}</span>
            <span
              v-if="!isCorrect"
              class="toast-answer"
            >
              Answer: <strong>{{ correctAnswer }}</strong>
            </span>
          </div>
        </div>

        <!-- Submit Answer Button -->
        <div class="submit-section" v-if="!showResult && selectedAnswer">
          <button @click="submitAnswer" class="btn-submit mobile-action-button">
            Submit Answer
          </button>
        </div>
      </div>

      <!-- RIGHT: Side HUD -->
      <aside class="side-hud">
        <div class="side-hud-card">
          <div class="side-hud-header">
            <span class="summary-emoji">{{ getCurrentLevelEmoji() }}</span>
            <div class="summary-text">
              <span class="summary-label">Current level</span>
              <h2>{{ currentDifficultyName }}</h2>
            </div>
          </div>
          <p class="summary-description">
            {{ getCurrentLevelDescription() }}
          </p>

          <div class="side-hud-metrics">
            <div class="hud-metric">
              <span class="metric-label">Score</span>
              <span class="metric-value">{{ score }}/{{ currentQuestion + (showResult ? 1 : 0) }}</span>
            </div>
            <div class="hud-metric">
              <span class="metric-label">Accuracy</span>
              <span class="metric-value">{{ accuracy }}%</span>
            </div>
            <div class="hud-metric">
              <span class="metric-label">Best</span>
              <span class="metric-value">{{ bestScore > 0 ? bestScore : 'N/A' }}</span>
            </div>
          </div>

          <button @click="resetGame" class="hud-cta side-hud-cta">
            New Game
          </button>
        </div>
      </aside>
    </div>

    <!-- Game Celebration Component -->
    <GameCelebration
      :show="showCompletion"
      :celebrationData="celebrationData"
      @close="handleCelebrationClose"
      @play-again="handlePlayAgain"
      @back-to-questline="handleBackToQuestline"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { playIPASound, preloadIPAAudio } from '../services/ipaAudioService'
import { selectedLanguage, languagePhonemes } from '../stores/languageStore'
import GameCelebration from './shared/GameCelebration.vue'
import { soundDetectiveProgressionSystem, getSoundDetectiveLevels, completeSoundDetectiveLevel } from '../utils/progressionSystem'

const router = useRouter()

// Get available levels from progression system
const availableLevels = ref([])

// Game state
const gameState = ref('difficulty') // 'difficulty', 'playing', 'results'
const selectedDifficulty = ref('easy')
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
const showCompletion = ref(false)
const bestScore = ref(0)
const isNewBest = ref(false)
const levelCompleted = ref(false)
const newUnlocks = ref([])
const starRating = ref(0)
const feedbackAudioContext = ref(null)

const accuracy = computed(() => {
  const questionsAnswered = currentQuestion.value + (showResult.value ? 1 : 0)
  if (questionsAnswered === 0) return 0
  return Math.round((score.value / questionsAnswered) * 100)
})

// Celebration data for GameCelebration component
const celebrationData = computed(() => {
  const baseData = {
    icon: levelCompleted.value ? '🏆' : '🎧',
    title: levelCompleted.value ? 'Level Complete!' : 'Game Finished!',
    message: `You identified ${score.value} out of ${totalQuestions.value} sounds correctly!`,
    score: score.value,
    scoreLabel: 'Correct',
    achievements: [],
    showPlayAgain: true,
    showNextLevel: false,
    showBackToQuestline: true
  }

  if (isNewBest.value) {
    baseData.achievements.push({
      id: 'new-best',
      icon: '🏅',
      name: 'New Best Score!'
    })
  }

  if (levelCompleted.value && starRating.value > 0) {
    const starText = '⭐️'.repeat(starRating.value)
    baseData.achievements.push({
      id: 'star-rating',
      icon: starText,
      name: `${starRating.value} Star${starRating.value > 1 ? 's' : ''} Earned!`
    })
  }

  newUnlocks.value.forEach(level => {
    baseData.achievements.push({
      id: `unlock-${level.id}`,
      icon: '🔓',
      name: `${level.name} Level Unlocked!`
    })
  })

  const nextLevel = availableLevels.value.find(level =>
    level.unlocked && !level.completed && level.id !== selectedDifficulty.value
  )
  baseData.showNextLevel = !!nextLevel

  return baseData
})

// Load best score from localStorage
function loadBestScore() {
  const key = `game-sound-detective-best-${selectedDifficulty.value}`
  const saved = localStorage.getItem(key)
  bestScore.value = saved ? parseInt(saved) : 0
}

// Save best score to localStorage
function saveBestScore(score) {
  const key = `game-sound-detective-best-${selectedDifficulty.value}`
  localStorage.setItem(key, score.toString())
  bestScore.value = score
}

// Check if a level is unlocked
function isLevelUnlocked(levelId) {
  const level = availableLevels.value.find(l => l.id === levelId)
  return level?.unlocked || false
}

// Get current level emoji
function getCurrentLevelEmoji() {
  const level = availableLevels.value.find(d => d.id === selectedDifficulty.value)
  return level?.emoji || '🟢'
}

// Get current level description
function getCurrentLevelDescription() {
  const level = availableLevels.value.find(d => d.id === selectedDifficulty.value)
  return level?.description || 'Most common vowels'
}

// Check if user has selected a language
function checkLanguageSelection() {
  if (!selectedLanguage.value) {
    console.warn('No language selected, using fallback symbols')
  }
  return true
}

// Select difficulty and start game
function selectDifficulty(difficultyId) {
  const level = availableLevels.value.find(l => l.id === difficultyId)
  if (!level || !level.unlocked) {
    console.warn('Level not unlocked:', difficultyId)
    return
  }
  
  selectedDifficulty.value = difficultyId
  loadBestScore()
}

function startGame() {
  // Check if language is selected
  if (!checkLanguageSelection()) {
    return
  }
  
  gameState.value = 'playing'
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
    // Fallback to default difficulty symbols from progression system
    const level = availableLevels.value.find(l => l.id === selectedDifficulty.value)
    if (level && level.symbols) {
      availableSymbols = level.symbols
    } else {
      // Ultimate fallback
      const defaultSymbols = {
        easy: ['/i/', '/e/', '/a/', '/o/', '/u/', '/ə/'],
        medium: ['/i/', '/ɪ/', '/e/', '/ɛ/', '/æ/', '/ɑ/', '/ɔ/', '/o/', '/ʊ/', '/u/', '/ə/', '/ʌ/'],
        hard: ['/i/', '/y/', '/ɨ/', '/ʉ/', '/ɯ/', '/u/', '/ɪ/', '/ʏ/', '/ʊ/', '/e/', '/ø/', '/ɘ/', '/ɵ/', '/ɤ/', '/o/', '/ə/', '/ɛ/', '/œ/', '/ɜ/', '/ɞ/', '/ʌ/', '/ɔ/', '/æ/', '/ɐ/', '/a/', '/ɶ/', '/ɑ/', '/ɒ/']
      }
      availableSymbols = defaultSymbols[selectedDifficulty.value] || defaultSymbols.easy
    }
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
    playCorrectChime()
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

function getFeedbackAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null
  if (!feedbackAudioContext.value) {
    feedbackAudioContext.value = new AudioContext()
  }
  return feedbackAudioContext.value
}

function playCorrectChime() {
  const context = getFeedbackAudioContext()
  if (!context) return
  
  if (context.state === 'suspended') {
    context.resume().catch(error => {
      console.warn('Unable to resume audio context:', error)
    })
  }
  
  const now = context.currentTime
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  
  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(660, now)
  oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.2)
  
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)
  
  oscillator.connect(gain)
  gain.connect(context.destination)
  
  oscillator.start(now)
  oscillator.stop(now + 0.5)
  oscillator.onended = () => {
    oscillator.disconnect()
    gain.disconnect()
  }
}

function completeGame() {
  if (bestScore.value === 0 || score.value > bestScore.value) {
    isNewBest.value = true
    saveBestScore(score.value)
  }

  const completionResult = completeSoundDetectiveLevel(
    selectedDifficulty.value,
    score.value,
    0,
    accuracy.value
  )
  levelCompleted.value = completionResult.completed
  newUnlocks.value = completionResult.newUnlocks
  starRating.value = completionResult.starRating
  if (completionResult.isNewBest) {
    isNewBest.value = true
    bestScore.value = Math.max(bestScore.value, score.value)
  }
  
  // Refresh available levels to show new unlocks
  loadAvailableLevels()
  
  showCompletion.value = true
}

function resetGame() {
  showCompletion.value = false
  gameState.value = 'difficulty'
  currentQuestion.value = 0
  score.value = 0
  selectedAnswer.value = ''
  showResult.value = false
  isNewBest.value = false
  levelCompleted.value = false
  newUnlocks.value = []
  starRating.value = 0
}

function handleCelebrationClose() {
  showCompletion.value = false
  gameState.value = 'difficulty'
}

function handlePlayAgain() {
  showCompletion.value = false
  startGame()
}

function handleBackToQuestline() {
  router.push('/memory-questline')
}

// Load available levels from progression system
function loadAvailableLevels() {
  availableLevels.value = getSoundDetectiveLevels()
  
  // Ensure we have a valid selected difficulty
  if (!availableLevels.value.find(l => l.id === selectedDifficulty.value && l.unlocked)) {
    // Find first unlocked level
    const firstUnlocked = availableLevels.value.find(l => l.unlocked)
    if (firstUnlocked) {
      selectedDifficulty.value = firstUnlocked.id
    }
  }
}

// Initialize on mount
onMounted(async () => {
  // Check if language is selected, redirect if not
  if (!checkLanguageSelection()) {
    return
  }
  
  // Load progression system levels
  loadAvailableLevels()
  
  // Check if a specific level was requested via query parameter
  const route = router.currentRoute.value
  if (route.query.level) {
    const requestedLevel = availableLevels.value.find(l => l.id === route.query.level)
    if (requestedLevel && requestedLevel.unlocked) {
      selectedDifficulty.value = route.query.level
    }
  }
  
  loadBestScore()
  
  // Preload audio for current phonemes
  if (languagePhonemes.value.length > 0) {
    const symbols = languagePhonemes.value.map(p => p.phoneme_ipa)
    await preloadIPAAudio(symbols)
  } else {
    // Fallback: preload default symbols
    const allSymbols = ['/i/', '/e/', '/a/', '/o/', '/u/', '/ə/', '/ɪ/', '/ɛ/', '/æ/', '/ɑ/', '/ɔ/', '/ʊ/', '/ʌ/']
    await preloadIPAAudio(allSymbols)
  }
})
</script>

<style scoped>
.sound-detective {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.25rem 2.5rem 2.5rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.header-title h1 {
  font-size: 2.25rem;
  color: var(--primary-color);
  margin: 0 0 0.35rem 0;
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
}

.header-title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.subtitle {
  font-size: 1.05rem;
  color: var(--text-light);
  margin: 0;
}

.header-level {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  box-shadow: 0 6px 18px rgba(26, 83, 92, 0.12);
}

.header-emoji {
  font-size: 2rem;
  line-height: 1;
}

.header-pill {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.pill-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-light);
  font-weight: 600;
}

.pill-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary-color);
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
  position: relative;
}

.difficulty-card:hover:not(.locked) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.difficulty-card.selected {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.difficulty-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--background-color);
}

.difficulty-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.difficulty-emoji {
  font-size: 2rem;
}

.difficulty-card h3 {
  font-size: 1.5rem;
  margin: 0;
  color: var(--text-primary);
}

.difficulty-description {
  color: var(--text-light);
  margin: 0 0 1rem 0;
}

.locked-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.lock-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
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

/* Game Layout */
.game-layout {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(260px, 1.4fr);
  align-items: flex-start;
  gap: 2rem;
  margin-top: 1.5rem;
}

.game-main {
  width: 100%;
}

/* Question Section */
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

/* Answer Choices */
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

/* Result Section */
.result-section {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: var(--surface-color);
  border-radius: 12px;
  border: 2px solid var(--border-color);
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
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

.mobile-result-toast {
  display: none;
}

.toast-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.toast-icon {
  font-size: 1.5rem;
}

.toast-title {
  font-weight: 700;
}

.toast-answer {
  font-size: 0.85rem;
  font-weight: 600;
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

/* Side HUD */
.side-hud {
  display: flex;
  justify-content: flex-start;
}

.side-hud-card {
  width: 100%;
  padding: 1.5rem;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(249, 219, 189, 0.15));
  box-shadow: 0 12px 32px rgba(17, 37, 52, 0.15);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 100%;
  border: 1px solid rgba(26, 83, 92, 0.1);
  backdrop-filter: blur(4px);
}

.side-hud-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(26, 83, 92, 0.08);
}

.summary-emoji {
  font-size: 2.1rem;
}

.summary-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.summary-text h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--primary-color);
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
}

.summary-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-light);
  font-weight: 600;
}

.summary-description {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-light);
  line-height: 1.5;
}

.side-hud-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hud-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(26, 83, 92, 0.08);
  border: 1px solid rgba(26, 83, 92, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hud-metric:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(26, 83, 92, 0.12);
}

.metric-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-light);
  font-weight: 600;
}

.metric-value {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--primary-color);
  font-family: 'Manrope', sans-serif;
  line-height: 1;
}

.hud-cta {
  border: none;
  border-radius: 999px;
  padding: 0.75rem 1.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, #58cc02, #2fb86d);
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(88, 204, 2, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  justify-self: end;
}

.hud-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(88, 204, 2, 0.45);
}

.side-hud-cta {
  width: 100%;
  margin-top: 1.5rem;
  padding: 0.85rem 1.5rem;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 12px;
  background: linear-gradient(135deg, #58cc02, #2fb86d);
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(88, 204, 2, 0.4);
  transition: all 0.2s ease;
  border: none;
  letter-spacing: 0.02em;
}

.side-hud-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(88, 204, 2, 0.5);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .sound-detective {
    padding: 1.5rem;
    max-width: 100%;
  }

  .game-layout {
    grid-template-columns: minmax(0, 2fr) minmax(240px, 1.2fr);
    gap: 1.5rem;
    margin-top: 1.25rem;
  }
}

@media (max-width: 640px) {
  .sound-detective {
    padding: 1rem;
  }
  
  .game-main {
    padding-bottom: 5.5rem;
  }
  
  .game-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .game-header h1 {
    font-size: 1.75rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .header-level {
    align-self: stretch;
    justify-content: flex-start;
  }
  
  .game-layout {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    margin-top: 1.25rem;
  }
  
  .side-hud {
    order: 2;
  }
  
  .difficulty-cards {
    grid-template-columns: 1fr;
  }
  
  .choices-grid {
    grid-template-columns: 1fr;
  }
  
  .choice-btn {
    padding: 1.5rem;
    font-size: 1.5rem;
    min-height: 80px;
  }
  
  .result-section {
    background: transparent;
    border: none;
    padding: 0;
    margin-bottom: 1rem;
  }
  
  .result-details {
    display: none;
  }
  
  .mobile-result-toast {
    position: fixed;
    bottom: calc(6.25rem + env(safe-area-inset-bottom, 0px));
    left: 50%;
    transform: translate(-50%, 24px);
    width: min(420px, calc(100% - 2.5rem));
    padding: 0.95rem 1.1rem;
    border-radius: 16px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    box-shadow: 0 18px 32px rgba(26, 83, 92, 0.35);
    z-index: 850;
    opacity: 0;
    animation: toast-pop 0.35s ease-out forwards;
  }
  
  .mobile-result-toast.correct {
    background: linear-gradient(135deg, var(--success-color), #2ecc71);
    color: #ffffff;
  }
  
  .mobile-result-toast.correct .toast-answer strong {
    color: #ffffff;
  }
  
  .mobile-result-toast.incorrect {
    background: linear-gradient(135deg, var(--error-color), #d64541);
    color: #ffffff;
  }
  
  .mobile-result-toast.incorrect .toast-answer strong {
    color: #ffffff;
  }
  
  .mobile-result-toast .toast-answer {
    color: inherit;
  }
  
  .mobile-result-toast .toast-answer strong {
    font-weight: 700;
  }
  
  .toast-icon {
    font-size: 1.75rem;
  }
  
  .toast-title {
    font-size: 1.1rem;
    letter-spacing: 0.01em;
  }
  
  @keyframes toast-pop {
    0% {
      opacity: 0;
      transform: translate(-50%, 32px);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
  
  .submit-section {
    margin-bottom: 0;
  }
  
  .mobile-action-button {
    position: fixed;
    bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
    left: 50%;
    transform: translateX(-50%);
    width: min(420px, calc(100% - 2rem));
    z-index: 800;
    box-shadow: 0 16px 28px rgba(26, 83, 92, 0.35);
  }
  
  .mobile-action-button:hover:not(:disabled) {
    transform: translate(-50%, -2px);
  }
  
  .mobile-action-button:active:not(:disabled) {
    transform: translate(-50%, 0);
  }
  
  .hud-cta,
  .side-hud-cta {
    width: 100%;
  }
}
</style>
