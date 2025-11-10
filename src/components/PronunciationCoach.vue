<template>
  <div class="pronunciation-coach">
    <header class="game-header">
      <div class="header-title">
        <h1>Pronunciation Coach</h1>
        <p class="subtitle">Speak into your microphone and get real-time feedback</p>
      </div>
      <div class="header-level" v-if="gameState === 'playing'">
        <span class="header-emoji">{{ getCurrentLevelEmoji() }}</span>
        <div class="header-pill">
          <span class="pill-label">Difficulty</span>
          <span class="pill-name">{{ currentDifficultyName }}</span>
        </div>
      </div>
    </header>

    <!-- Permission Request -->
    <div v-if="gameState === 'permission'" class="permission-request">
      <div class="permission-card">
        <div class="mic-icon">🎤</div>
        <h2>Microphone Access Required</h2>
        <p>This game needs access to your microphone to analyze your pronunciation and provide feedback.</p>
        
        <!-- Browser Compatibility Warning -->
        <div v-if="!isCompatible" class="compatibility-warning">
          <div class="warning-icon">⚠️</div>
          <div class="warning-content">
            <h3>Browser Compatibility Issue</h3>
            <p>{{ browserWarning }}</p>
            <p class="recommendation">Recommended: Chrome, Firefox, or Edge on desktop</p>
          </div>
        </div>
        
        <button class="permission-btn" @click="requestPermission" :disabled="isRequestingPermission || !isCompatible">
          {{ isRequestingPermission ? 'Requesting...' : 'Allow Microphone Access' }}
        </button>
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>
    </div>

    <!-- Difficulty Selection -->
    <div v-else-if="gameState === 'difficulty'" class="difficulty-selection">
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
        🎯 Start Pronunciation Coach
      </button>
    </div>

    <!-- Game Play -->
    <div v-else-if="gameState === 'playing'" class="game-layout">
      <!-- LEFT: Main game area -->
      <div class="game-main">
        <div class="challenge-card">
          <div class="challenge-header">
            <h2>Challenge {{ currentChallenge + 1 }} of {{ totalChallenges }}</h2>
            <div class="score-display">Score: {{ score }}/{{ totalChallenges * 100 }}</div>
          </div>
          
          <div class="target-display">
            <div class="target-symbol">{{ currentChallengeData.symbol }}</div>
            <div class="target-info">
              <h3>Target Sound: {{ currentChallengeData.name }}</h3>
              <p>{{ currentChallengeData.description }}</p>
            </div>
            <button
              class="play-target-btn"
              @click="playTargetSound"
              :disabled="isPlayingTarget"
            >
              {{ isPlayingTarget ? '🔊' : '▶️' }} Play Target
            </button>
          </div>

          <div class="pronunciation-area">
            <div class="vowel-chart">
              <svg viewBox="0 0 400 300" class="chart-svg">
                <!-- Chart background -->
                <rect x="0" y="0" width="400" height="300" fill="var(--surface-color)" stroke="var(--border-color)" stroke-width="2" rx="8"/>
                
                <!-- Grid lines -->
                <defs>
                  <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 30" fill="none" stroke="var(--border-color)" stroke-width="0.5" opacity="0.3"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                <!-- Axis labels -->
                <text x="200" y="20" text-anchor="middle" class="axis-label">F2 (Hz)</text>
                <text x="20" y="150" text-anchor="middle" class="axis-label" transform="rotate(-90 20 150)">F1 (Hz)</text>
                
                <!-- Target position -->
                <circle
                  v-if="targetPosition"
                  :cx="targetPosition.x"
                  :cy="targetPosition.y"
                  r="12"
                  fill="var(--primary-color)"
                  stroke="white"
                  stroke-width="3"
                  opacity="0.8"
                />
                <text
                  v-if="targetPosition"
                  :x="targetPosition.x"
                  :y="targetPosition.y + 5"
                  text-anchor="middle"
                  class="target-label"
                >
                  TARGET
                </text>
                
                <!-- Current position -->
                <circle
                  v-if="currentPosition && gateOpen"
                  :cx="currentPosition.x"
                  :cy="currentPosition.y"
                  r="8"
                  fill="#10b981"
                  stroke="white"
                  stroke-width="2"
                  class="current-position"
                />
                
                <!-- Trail -->
                <path
                  v-if="trailPath"
                  :d="trailPath"
                  fill="none"
                  stroke="#10b981"
                  stroke-width="2"
                  opacity="0.6"
                />
              </svg>
            </div>

            <div class="recording-controls">
              <div class="audio-level">
                <div class="level-bar">
                  <div
                    class="level-fill"
                    :style="{ width: (audioLevel * 100) + '%' }"
                  ></div>
                </div>
                <span class="level-text">{{ gateOpen ? 'Speaking' : 'Silent' }}</span>
              </div>
              
              <button
                class="record-btn"
                :class="{ recording: isRecording, ready: gateOpen }"
                @click="toggleRecording"
              >
                {{ isRecording ? '⏹️ Stop' : '🎤 Start' }}
              </button>
            </div>

            <div class="feedback-area">
              <div v-if="currentFeedback" class="feedback-message" :class="currentFeedback.type">
                {{ currentFeedback.message }}
              </div>
              <div v-if="isRecording && gateOpen" class="live-feedback">
                <div class="formant-display">
                  <div>F1: {{ Math.round(currentFormants.F1) }}Hz</div>
                  <div>F2: {{ Math.round(currentFormants.F2) }}Hz</div>
                </div>
                <div class="accuracy-meter">
                  <div class="accuracy-bar">
                    <div
                      class="accuracy-fill"
                      :style="{ width: currentAccuracy + '%', backgroundColor: getAccuracyColor(currentAccuracy) }"
                    ></div>
                  </div>
                  <span>{{ Math.round(currentAccuracy) }}% Accurate</span>
                </div>
              </div>
            </div>
          </div>

          <div class="challenge-actions">
            <button
              v-if="!challengeCompleted"
              class="submit-btn"
              @click="submitChallenge"
              :disabled="!hasRecorded || isRecording"
            >
              Submit Pronunciation
            </button>
            <button
              v-else
              class="next-btn"
              @click="nextChallenge"
            >
              {{ currentChallenge + 1 < totalChallenges ? 'Next Challenge' : 'View Results' }}
            </button>
          </div>
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
              <span class="metric-label">Challenge</span>
              <span class="metric-value">{{ currentChallenge + 1 }}/{{ totalChallenges }}</span>
            </div>
            <div class="hud-metric">
              <span class="metric-label">Score</span>
              <span class="metric-value">{{ score }}/{{ totalChallenges * 100 }}</span>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAudioCapture } from '../composables/useAudioCapture.js'
import { ipaAudioService } from '../services/ipaAudioService.js'
import { selectedLanguage, languagePhonemes } from '../stores/languageStore.js'
import GameCelebration from './shared/GameCelebration.vue'
import { pronunciationCoachProgressionSystem, getPronunciationCoachLevels, completePronunciationCoachLevel } from '../utils/progressionSystem'

const router = useRouter()

// Get available levels from progression system
const availableLevels = ref([])

// Audio capture composable
const {
  isInitialized,
  isRecording,
  error,
  currentFormants,
  audioLevel,
  gateOpen,
  trail,
  requestMicrophonePermission,
  startRecording,
  stopRecording,
  cleanup
} = useAudioCapture()

// Game state
const gameState = ref('permission')
const selectedDifficulty = ref('easy')
const currentChallenge = ref(0)
const totalChallenges = ref(5)
const score = ref(0)
const challengeResults = ref([])
const challengeCompleted = ref(false)
const hasRecorded = ref(false)
const isRequestingPermission = ref(false)
const isPlayingTarget = ref(false)
const currentFeedback = ref(null)
const browserWarning = ref('')
const isCompatible = ref(true)
const showCompletion = ref(false)
const bestScore = ref(0)
const isNewBest = ref(false)
const levelCompleted = ref(false)
const newUnlocks = ref([])
const starRating = ref(0)

// Celebration data for GameCelebration component
const celebrationData = computed(() => {
  const baseData = {
    icon: levelCompleted.value ? '🏆' : '🎤',
    title: levelCompleted.value ? 'Level Complete!' : 'Game Finished!',
    message: `You scored ${score.value} out of ${totalChallenges.value * 100} points!`,
    score: score.value,
    scoreLabel: 'Points',
    achievements: [],
    showPlayAgain: true,
    showNextLevel: false,
    showBackToQuestline: true
  }

  // Add achievements for new best score
  if (isNewBest.value) {
    baseData.achievements.push({
      id: 'new-best',
      icon: '🏆',
      name: 'New Best Score!'
    })
  }

  // Add star rating achievement
  if (levelCompleted.value && starRating.value > 0) {
    const starText = '⭐'.repeat(starRating.value)
    baseData.achievements.push({
      id: 'star-rating',
      icon: starText,
      name: `${starRating.value} Star${starRating.value > 1 ? 's' : ''} Earned!`
    })
  }

  // Add level unlock achievements
  newUnlocks.value.forEach(level => {
    baseData.achievements.push({
      id: `unlock-${level.id}`,
      icon: '🔓',
      name: `${level.name} Level Unlocked!`
    })
  })

  // Show next level button if there are unlocked levels
  const nextLevel = availableLevels.value.find(level =>
    level.unlocked && !level.completed && level.id !== selectedDifficulty.value
  )
  baseData.showNextLevel = !!nextLevel

  return baseData
})

// Load best score from localStorage
function loadBestScore() {
  const key = `game-pronunciation-coach-best-${selectedDifficulty.value}`
  const saved = localStorage.getItem(key)
  bestScore.value = saved ? parseInt(saved) : 0
}

// Save best score to localStorage
function saveBestScore(score) {
  const key = `game-pronunciation-coach-best-${selectedDifficulty.value}`
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
  return level?.description || 'Basic vowels'
}

// Check compatibility on mount
onMounted(() => {
  const compatibility = checkBrowserCompatibility()
  isCompatible.value = compatibility.isCompatible
  if (compatibility.issues.length > 0) {
    browserWarning.value = compatibility.issues.join('. ')
  }
})

// Target formant ranges for different vowels
const vowelTargets = {
  'a': { F1: 730, F2: 1090, name: 'Open front unrounded', description: 'Like "father"' },
  'e': { F1: 530, F2: 1840, name: 'Close-mid front unrounded', description: 'Like "bed"' },
  'i': { F1: 270, F2: 2290, name: 'Close front unrounded', description: 'Like "see"' },
  'o': { F1: 570, F2: 840, name: 'Close-mid back rounded', description: 'Like "boat"' },
  'u': { F1: 300, F2: 870, name: 'Close back rounded', description: 'Like "boot"' },
  'ɑ': { F1: 750, F2: 940, name: 'Open back unrounded', description: 'Like "father"' },
  'ɛ': { F1: 610, F2: 1900, name: 'Open-mid front unrounded', description: 'Like "bet"' },
  'ɪ': { F1: 400, F2: 2000, name: 'Near-close front unrounded', description: 'Like "bit"' },
  'ɔ': { F1: 590, F2: 880, name: 'Open-mid back rounded', description: 'Like "bought"' },
  'ʊ': { F1: 450, F2: 1030, name: 'Near-close back rounded', description: 'Like "book"' },
  'ə': { F1: 500, F2: 1500, name: 'Mid central', description: 'Like "about"' },
  'ʌ': { F1: 640, F2: 1190, name: 'Open-mid back unrounded', description: 'Like "but"' }
}

// Computed properties
const currentChallengeData = computed(() => {
  if (!challengeResults.value[currentChallenge.value]) return {}
  const symbol = challengeResults.value[currentChallenge.value].symbol
  return {
    symbol,
    ...vowelTargets[symbol]
  }
})

const targetPosition = computed(() => {
  if (!currentChallengeData.value.F1) return null
  return formantToPosition(currentChallengeData.value.F1, currentChallengeData.value.F2)
})

const currentPosition = computed(() => {
  if (!currentFormants.value.F1 || !currentFormants.value.F2) return null
  return formantToPosition(currentFormants.value.F1, currentFormants.value.F2)
})

const trailPath = computed(() => {
  if (!trail.value || trail.value.length < 2) return ''
  
  const points = trail.value.map(point => formantToPosition(point.f1, point.f2))
  let path = `M ${points[0].x} ${points[0].y}`
  
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`
  }
  
  return path
})

const currentAccuracy = computed(() => {
  if (!currentFormants.value.F1 || !currentChallengeData.value.F1) return 0
  
  const f1Diff = Math.abs(currentFormants.value.F1 - currentChallengeData.value.F1)
  const f2Diff = Math.abs(currentFormants.value.F2 - currentChallengeData.value.F2)
  
  const f1Accuracy = Math.max(0, 100 - (f1Diff / 10))
  const f2Accuracy = Math.max(0, 100 - (f2Diff / 20))
  
  return Math.min(100, (f1Accuracy + f2Accuracy) / 2)
})

const overallAccuracy = computed(() => {
  return (score.value / (totalChallenges.value * 100)) * 100
})

const currentDifficultyName = computed(() => {
  return availableLevels.value.find(d => d.id === selectedDifficulty.value)?.name || 'Easy'
})

// Helper functions
function formantToPosition(f1, f2) {
  // Map formant frequencies to chart coordinates
  const x = Math.max(20, Math.min(380, 380 - ((f2 - 500) / 2000) * 360))
  const y = Math.max(20, Math.min(280, ((f1 - 200) / 800) * 260 + 20))
  return { x, y }
}

function getAccuracyColor(accuracy) {
  if (accuracy >= 80) return '#10b981'
  if (accuracy >= 60) return '#f59e0b'
  return '#ef4444'
}

function getScoreColor(score) {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

// Language selection check
function checkLanguageSelection() {
  if (!selectedLanguage.value) {
    router.push('/')
    return false
  }
  return true
}

// Check browser compatibility
function checkBrowserCompatibility() {
  const compatibility = {
    isCompatible: true,
    issues: []
  }

  // Check for getUserMedia support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    compatibility.isCompatible = false
    compatibility.issues.push('Microphone access not supported in this browser')
  }

  // Check for Web Audio API support
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) {
    compatibility.isCompatible = false
    compatibility.issues.push('Web Audio API not supported')
  }

  // Check for iOS Safari specific issues
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  if (isIOS) {
    compatibility.issues.push('iOS Safari has limited audio analysis capabilities')
  }

  return compatibility
}

// Game functions
async function requestPermission() {
  // Check if language is selected first
  if (!checkLanguageSelection()) {
    return
  }
  
  // Check browser compatibility
  const compatibility = checkBrowserCompatibility()
  if (!compatibility.isCompatible) {
    error.value = `Browser not compatible: ${compatibility.issues.join(', ')}. Please try Chrome, Firefox, or Edge on desktop.`
    return
  }
  
  isRequestingPermission.value = true
  try {
    const success = await requestMicrophonePermission()
    if (success) {
      gameState.value = 'difficulty'
    }
  } catch (err) {
    error.value = `Failed to access microphone: ${err.message}. Please check browser permissions.`
  } finally {
    isRequestingPermission.value = false
  }
}

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
  
  generateChallenges()
  gameState.value = 'playing'
  currentChallenge.value = 0
  score.value = 0
  challengeCompleted.value = false
  hasRecorded.value = false
  currentFeedback.value = null
}

function generateChallenges() {
  let symbols = []
  
  // Use database phonemes if available
  if (languagePhonemes.value.length > 0) {
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
    
    symbols = filteredPhonemes.map(p => p.phoneme_ipa)
  } else {
    // Fallback to default difficulty levels from progression system
    const level = availableLevels.value.find(l => l.id === selectedDifficulty.value)
    if (level && level.symbols) {
      symbols = level.symbols
    } else {
      // Ultimate fallback
      const defaultSymbols = {
        easy: ['a', 'e', 'i', 'o', 'u'],
        medium: ['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ'],
        hard: ['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ', 'ə', 'ʌ']
      }
      symbols = defaultSymbols[selectedDifficulty.value] || defaultSymbols.easy
    }
  }
  
  // Ensure we have symbols to work with
  if (symbols.length === 0) {
    const level = availableLevels.value.find(l => l.id === selectedDifficulty.value)
    symbols = level?.symbols || ['a', 'e', 'i', 'o', 'u']
  }
  
  challengeResults.value = []

  // Shuffle and select challenges
  for (let i = 0; i < totalChallenges.value; i++) {
    const randomIndex = Math.floor(Math.random() * symbols.length)
    const symbol = symbols[randomIndex]
    challengeResults.value.push({
      symbol,
      score: 0,
      completed: false
    })
  }
}

async function playTargetSound() {
  if (isPlayingTarget.value) return
  
  try {
    isPlayingTarget.value = true
    
    // Get audio URL from database phonemes if available
    const phoneme = languagePhonemes.value.find(p => p.phoneme_ipa === currentChallengeData.value.symbol)
    const audioUrl = phoneme?.audio_url || null
    
    // Use the enhanced IPA audio service with database URL and Wikipedia fallback
    await ipaAudioService.playSound(currentChallengeData.value.symbol, audioUrl)
  } catch (error) {
    console.error('Error playing target sound:', error)
  } finally {
    isPlayingTarget.value = false
  }
}

async function toggleRecording() {
  if (isRecording.value) {
    stopRecording()
    hasRecorded.value = true
  } else {
    await startRecording()
    challengeCompleted.value = false
    hasRecorded.value = false
  }
}

function submitChallenge() {
  if (!hasRecorded.value) return
  
  // Calculate final score based on recent accuracy
  let finalAccuracy = 0
  let sampleCount = 0
  
  // Use trail data to calculate average accuracy
  if (trail.value && trail.value.length > 0) {
    const recentTrail = trail.value.slice(-10) // Last 10 points
    for (const point of recentTrail) {
      const f1Diff = Math.abs(point.f1 - currentChallengeData.value.F1)
      const f2Diff = Math.abs(point.f2 - currentChallengeData.value.F2)
      
      const f1Acc = Math.max(0, 100 - (f1Diff / 10))
      const f2Acc = Math.max(0, 100 - (f2Diff / 20))
      
      finalAccuracy += (f1Acc + f2Acc) / 2
      sampleCount++
    }
    
    if (sampleCount > 0) {
      finalAccuracy = Math.min(100, finalAccuracy / sampleCount)
    }
  }
  
  const challengeScore = Math.round(finalAccuracy)
  challengeResults.value[currentChallenge.value].score = challengeScore
  challengeResults.value[currentChallenge.value].completed = true
  score.value += challengeScore
  
  challengeCompleted.value = true
  
  // Provide feedback
  if (challengeScore >= 80) {
    currentFeedback.value = { type: 'success', message: 'Excellent pronunciation! 🎉' }
  } else if (challengeScore >= 60) {
    currentFeedback.value = { type: 'good', message: 'Good job! Keep practicing. 👍' }
  } else {
    currentFeedback.value = { type: 'needs-work', message: 'Keep trying! Listen to the target sound again. 💪' }
  }
  
  stopRecording()
}

function nextChallenge() {
  currentFeedback.value = null
  
  if (currentChallenge.value + 1 < totalChallenges.value) {
    currentChallenge.value++
    challengeCompleted.value = false
    hasRecorded.value = false
  } else {
    completeGame()
  }
}

function completeGame() {
  // Check if this is a new best score
  if (bestScore.value === 0 || score.value > bestScore.value) {
    isNewBest.value = true
    saveBestScore(score.value)
  }
  
  // Check level completion and unlocks
  const completionResult = completePronunciationCoachLevel(
    selectedDifficulty.value,
    score.value,
    0,
    overallAccuracy.value
  )
  levelCompleted.value = completionResult.completed
  newUnlocks.value = completionResult.newUnlocks
  starRating.value = completionResult.starRating
  if (completionResult.isNewBest) {
    isNewBest.value = true
  }
  
  // Refresh available levels to show new unlocks
  loadAvailableLevels()
  
  showCompletion.value = true
}

function resetGame() {
  showCompletion.value = false
  gameState.value = 'difficulty'
  currentChallenge.value = 0
  score.value = 0
  challengeResults.value = []
  challengeCompleted.value = false
  hasRecorded.value = false
  currentFeedback.value = null
  isNewBest.value = false
  levelCompleted.value = false
  newUnlocks.value = []
  starRating.value = 0
  stopRecording()
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
  availableLevels.value = getPronunciationCoachLevels()
  
  // Ensure we have a valid selected difficulty
  if (!availableLevels.value.find(l => l.id === selectedDifficulty.value && l.unlocked)) {
    // Find first unlocked level
    const firstUnlocked = availableLevels.value.find(l => l.unlocked)
    if (firstUnlocked) {
      selectedDifficulty.value = firstUnlocked.id
    }
  }
}

// Initialize audio service
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

onUnmounted(() => {
  cleanup()
})

// Watch for permission changes
watch(isInitialized, (newValue) => {
  if (newValue && gameState.value === 'permission') {
    gameState.value = 'difficulty'
  }
})
</script>

<style scoped>
.pronunciation-coach {
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

/* Permission Request */
.permission-request {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.permission-card {
  background: var(--surface-color);
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  border: 2px solid var(--border-color);
  max-width: 500px;
}

.mic-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.permission-card h2 {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.permission-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.permission-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

.permission-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  color: #ef4444;
  margin-top: 1rem;
  padding: 1rem;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.compatibility-warning {
  margin: 1rem 0;
  padding: 1rem;
  background: #fffbeb;
  border: 1px solid #f59e0b;
  border-radius: 8px;
}

.warning-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.warning-content h3 {
  color: #92400e;
  margin: 0 0 0.5rem 0;
}

.warning-content p {
  color: #92400e;
  margin: 0 0 0.5rem 0;
}

.recommendation {
  font-weight: 600;
  font-style: italic;
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

/* Challenge Card */
.challenge-card {
  background: var(--surface-color);
  border-radius: 20px;
  padding: 2rem;
  border: 2px solid var(--border-color);
}

.challenge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.challenge-header h2 {
  color: var(--text-light);
  font-size: 1.1rem;
  margin: 0;
  font-weight: 500;
}

.score-display {
  font-weight: 600;
  color: var(--primary-color);
}

.target-display {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: var(--background-color);
  border-radius: 16px;
  border: 2px solid var(--border-color);
}

.target-symbol {
  font-size: 3rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-family: 'Doulos SIL', 'Charis SIL', serif;
}

.target-info h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.target-info p {
  margin: 0 0 1rem 0;
  color: var(--text-light);
}

.play-target-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-target-btn:hover:not(:disabled) {
  background: var(--primary-dark);
}

.play-target-btn:disabled {
  opacity: 0.7;
}

.pronunciation-area {
  margin-bottom: 2rem;
}

.vowel-chart {
  margin-bottom: 2rem;
}

.chart-svg {
  width: 100%;
  height: 300px;
  border-radius: 12px;
}

.axis-label {
  font-size: 12px;
  fill: var(--text-light);
}

.target-label {
  font-size: 10px;
  fill: white;
  font-weight: bold;
}

.current-position {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.recording-controls {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--background-color);
  border-radius: 12px;
}

.audio-level {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.level-bar {
  flex: 1;
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.level-fill {
  height: 100%;
  background: #10b981;
  transition: width 0.1s ease;
}

.level-text {
  font-weight: 600;
  color: var(--text-primary);
  min-width: 80px;
}

.record-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.record-btn:hover {
  background: var(--primary-dark);
}

.record-btn.recording {
  background: #ef4444;
  animation: recording-pulse 1s infinite;
}

.record-btn.ready {
  background: #10b981;
}

@keyframes recording-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.feedback-area {
  min-height: 100px;
}

.feedback-message {
  padding: 1rem;
  border-radius: 12px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1rem;
}

.feedback-message.success {
  background: #ecfdf5;
  color: #065f46;
  border: 2px solid #10b981;
}

.feedback-message.good {
  background: #fffbeb;
  color: #92400e;
  border: 2px solid #f59e0b;
}

.feedback-message.needs-work {
  background: #fef2f2;
  color: #991b1b;
  border: 2px solid #ef4444;
}

.live-feedback {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--surface-color);
  border-radius: 12px;
  border: 2px solid var(--border-color);
}

.formant-display {
  display: flex;
  gap: 2rem;
  font-family: monospace;
  font-weight: 600;
}

.accuracy-meter {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.accuracy-bar {
  width: 150px;
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.accuracy-fill {
  height: 100%;
  transition: all 0.3s ease;
}

.challenge-actions {
  text-align: center;
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
  .pronunciation-coach {
    padding: 1.5rem;
    max-width: 100%;
  }

  .game-layout {
    grid-template-columns: minmax(0, 2fr) minmax(240px, 1.2fr);
    gap: 1.5rem;
    margin-top: 1.25rem;
  }
}

@media (max-width: 768px) {
  .pronunciation-coach {
    padding: 1rem;
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
  
  .challenge-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .recording-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .live-feedback {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .challenge-result {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .results-actions {
    flex-direction: column;
  }
  
  .hud-cta,
  .side-hud-cta {
    width: 100%;
  }
}
</style>
