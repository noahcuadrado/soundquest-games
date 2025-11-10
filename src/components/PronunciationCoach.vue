<template>
  <div class="pronunciation-coach">
    <header class="game-header">
      <h1>🎤 Pronunciation Coach</h1>
      <p class="subtitle">Speak into your microphone and get real-time feedback</p>
    </header>

    <!-- Permission Request -->
    <div v-if="gameState === 'permission'" class="permission-request">
      <div class="permission-card">
        <div class="mic-icon">🎤</div>
        <h2>Microphone Access Required</h2>
        <p>This game needs access to your microphone to analyze your pronunciation and provide feedback.</p>
        <button class="permission-btn" @click="requestPermission" :disabled="isRequestingPermission">
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
        🎯 Start Pronunciation Coach
      </button>
    </div>

    <!-- Game Play -->
    <div v-else-if="gameState === 'playing'" class="game-play">
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

    <!-- Results -->
    <div v-else-if="gameState === 'results'" class="game-results">
      <div class="results-card">
        <h2>🎤 Pronunciation Coach Complete!</h2>
        <div class="score-display">
          <div class="final-score">{{ score }}/{{ totalChallenges * 100 }}</div>
          <div class="accuracy">{{ Math.round((score / (totalChallenges * 100)) * 100) }}% Overall</div>
        </div>
        
        <div class="performance-breakdown">
          <h3>Challenge Breakdown:</h3>
          <div class="challenge-results">
            <div 
              v-for="(result, index) in challengeResults" 
              :key="index"
              class="challenge-result"
            >
              <span class="challenge-symbol">{{ result.symbol }}</span>
              <span class="challenge-score">{{ result.score }}/100</span>
              <div class="challenge-bar">
                <div 
                  class="challenge-fill" 
                  :style="{ width: result.score + '%', backgroundColor: getScoreColor(result.score) }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="performance-message">
          <p v-if="overallAccuracy >= 90">🏆 Outstanding! Your pronunciation is excellent!</p>
          <p v-else-if="overallAccuracy >= 75">👍 Great job! Keep practicing to perfect your pronunciation.</p>
          <p v-else-if="overallAccuracy >= 60">📚 Good effort! Focus on the challenging sounds.</p>
          <p v-else>💪 Keep practicing! Pronunciation improvement takes time and patience.</p>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAudioCapture } from '../composables/useAudioCapture.js'
import { ipaAudioService } from '../services/ipaAudioService.js'
import { selectedLanguage, languagePhonemes } from '../stores/languageStore.js'

const router = useRouter()

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

// Difficulty levels
const difficultyLevels = [
  {
    id: 'easy',
    name: 'Easy',
    description: 'Basic vowels (a, e, i, o, u)',
    color: '#10b981',
    symbols: ['a', 'e', 'i', 'o', 'u']
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Common IPA vowels',
    color: '#f59e0b',
    symbols: ['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ']
  },
  {
    id: 'hard',
    name: 'Hard',
    description: 'Advanced vowel sounds',
    color: '#ef4444',
    symbols: ['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ', 'ə', 'ʌ']
  }
]

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

// Game functions
async function requestPermission() {
  // Check if language is selected first
  if (!checkLanguageSelection()) {
    return
  }
  
  isRequestingPermission.value = true
  try {
    const success = await requestMicrophonePermission()
    if (success) {
      gameState.value = 'difficulty'
    }
  } finally {
    isRequestingPermission.value = false
  }
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
    // Fallback to default difficulty levels
    const difficulty = difficultyLevels.find(d => d.id === selectedDifficulty.value)
    symbols = [...difficulty.symbols]
  }
  
  // Ensure we have symbols to work with
  if (symbols.length === 0) {
    const difficulty = difficultyLevels.find(d => d.id === selectedDifficulty.value)
    symbols = [...difficulty.symbols]
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
    finishGame()
  }
}

function finishGame() {
  gameState.value = 'results'
  saveGameStats()
}

function saveGameStats() {
  try {
    const stats = JSON.parse(localStorage.getItem('pronunciationCoachStats') || '{}')
    const difficultyStats = stats[selectedDifficulty.value] || { played: 0, bestScore: 0 }
    
    difficultyStats.played++
    if (score.value > difficultyStats.bestScore) {
      difficultyStats.bestScore = score.value
    }
    
    stats[selectedDifficulty.value] = difficultyStats
    localStorage.setItem('pronunciationCoachStats', JSON.stringify(stats))

    // Update overall game progress
    const gameProgress = JSON.parse(localStorage.getItem('gameProgress') || '{}')
    gameProgress.pronunciationCoach = (gameProgress.pronunciationCoach || 0) + 1
    localStorage.setItem('gameProgress', JSON.stringify(gameProgress))
  } catch (error) {
    console.error('Error saving game stats:', error)
  }
}

function resetGame() {
  gameState.value = 'difficulty'
  currentChallenge.value = 0
  score.value = 0
  challengeResults.value = []
  challengeCompleted.value = false
  hasRecorded.value = false
  currentFeedback.value = null
  stopRecording()
}

function goBack() {
  cleanup()
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

.performance-breakdown {
  margin-bottom: 2rem;
  text-align: left;
}

.performance-breakdown h3 {
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.challenge-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.challenge-result {
  display: grid;
  grid-template-columns: 60px 80px 1fr;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--background-color);
  border-radius: 8px;
}

.challenge-symbol {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
  font-family: 'Doulos SIL', 'Charis SIL', serif;
  text-align: center;
}

.challenge-score {
  font-weight: 600;
  text-align: center;
}

.challenge-bar {
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.challenge-fill {
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
  .pronunciation-coach {
    padding: 1rem;
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
}
</style>