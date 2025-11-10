<template>
  <div class="symbol-sleuth-game">
    <header class="game-header">
      <div class="header-title">
        <h1>Symbol Sleuth</h1>
        <p class="subtitle">See IPA symbols and identify their sounds</p>
      </div>
      <div class="header-level" v-if="gameState !== 'difficulty'">
        <span class="header-emoji">{{ currentLevelEmoji }}</span>
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

          <div v-if="level.examplePairs?.length" class="example-pairs">
            <span v-for="pair in level.examplePairs" :key="pair" class="example-pill">{{ pair }}</span>
          </div>

          <div v-if="level.stars || level.bestScore" class="level-status">
            <span v-if="level.stars" class="level-stars">{{ '⭐️'.repeat(level.stars) }}</span>
            <span v-if="level.bestScore" class="level-best">
              Best: {{ level.bestScore }}/{{ level.maxScore || totalQuestions }}
            </span>
          </div>

          <div v-if="level.unlocked" class="difficulty-actions">
            <button
              type="button"
              class="difficulty-play-btn"
              :class="{ primary: selectedDifficulty === level.id }"
              @click.stop="startLevel(level.id)"
            >
              {{ getLevelActionLabel(level) }}
            </button>
          </div>

          <div v-if="!level.unlocked" class="locked-overlay">
            <span class="lock-icon">🔒</span>
            <span>Complete previous level to unlock</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Game Play -->
    <div v-else-if="gameState === 'playing'" class="game-layout">
      <div class="game-main">
        <div class="question-card">
          <div class="question-header">
            <h2>Question {{ currentQuestion + 1 }} of {{ totalQuestions }}</h2>
          </div>

          <div class="symbol-display">
            <div class="ipa-symbol">{{ currentSymbol }}</div>
            <p class="instruction">Which sound does this symbol represent?</p>
          </div>

          <div class="audio-options">
            <div
              v-for="(option, index) in currentOptions"
              :key="`${currentQuestion}-${option}-${index}`"
              class="audio-option"
              :class="{
                selected: selectedAnswer === index,
                correct: showResult && index === correctIndex,
                incorrect: showResult && selectedAnswer === index && index !== correctIndex,
                playing: playingSymbol === option
              }"
              @click="selectAnswer(index)"
            >
              <button
                class="play-audio-btn"
                @click.stop="playAudio(option)"
                :disabled="isPlaying && playingSymbol !== option"
              >
                <span v-if="isPlaying && playingSymbol === option">🔊</span>
                <span v-else>▶️</span>
              </button>
              <span class="option-label">Option {{ index + 1 }}</span>
              <span class="option-symbol">{{ option }}</span>
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
            <div v-if="selectedAnswer === correctIndex" class="correct-feedback">
              ✅ Correct! The symbol {{ currentSymbol }} represents this sound.
            </div>
            <div v-else class="incorrect-feedback">
              ❌ Incorrect.
              <span v-if="correctIndex >= 0">
                The symbol {{ currentSymbol }} is the sound in Option {{ correctIndex + 1 }}.
              </span>
            </div>
          </div>
        </div>
      </div>

      <aside class="side-hud">
        <div class="side-hud-card">
          <div class="side-hud-header">
            <span class="summary-emoji">{{ currentLevelEmoji }}</span>
            <div class="summary-text">
              <span class="summary-label">Current level</span>
              <h2>{{ currentDifficultyName }}</h2>
            </div>
          </div>
          <p class="summary-description">
            {{ currentDifficultyDescription }}
          </p>

          <div class="side-hud-metrics">
            <div class="hud-metric">
              <span class="metric-label">Score</span>
              <span class="metric-value">{{ score }}/{{ totalQuestions }}</span>
            </div>
            <div class="hud-metric">
              <span class="metric-label">Accuracy</span>
              <span class="metric-value">{{ accuracy }}%</span>
            </div>
            <div class="hud-metric">
              <span class="metric-label">Best</span>
              <span class="metric-value">
                {{ bestScore ? `${bestScore}/${maxScore}` : 'N/A' }}
              </span>
            </div>
          </div>

          <button @click="resetGame" class="hud-cta side-hud-cta">
            New Game
          </button>
        </div>
      </aside>
    </div>

    <!-- Results -->
    <div v-else-if="gameState === 'results'" class="game-results">
      <div class="results-card">
        <h2>Great listening! 🎧</h2>
        <div class="score-display">
          <div class="final-score">{{ score }}/{{ totalQuestions }}</div>
          <div class="accuracy">Accuracy: {{ accuracy }}%</div>
        </div>

        <div v-if="starRating > 0" class="results-stars">
          {{ '⭐️'.repeat(starRating) }}
        </div>

        <div class="performance-message">
          <p v-if="isNewBest">New personal best for {{ currentDifficultyName }}!</p>
          <p v-else>Keep training to unlock even more sounds.</p>
        </div>

        <div v-if="newUnlocks.length" class="unlock-message">
          <p v-for="unlock in newUnlocks" :key="unlock.id">🔓 {{ unlock.name }} unlocked!</p>
        </div>

        <div class="results-actions">
          <button class="play-again-btn" @click="startGame">Play Again</button>
          <button class="back-btn" @click="resetGame">Change Difficulty</button>
        </div>
      </div>
    </div>

    <GameCelebration
      :show="showCompletion"
      :celebrationData="celebrationData"
      @close="handleCelebrationClose"
      @play-again="handlePlayAgain"
      @next-level="handleNextLevel"
      @back-to-questline="handleBackToQuestline"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ipaAudioService } from '../services/ipaAudioService.js'
import { selectedLanguage, languagePhonemes } from '../stores/languageStore.js'
import GameCelebration from './shared/GameCelebration.vue'
import { getSymbolSleuthLevels, completeSymbolSleuthLevel } from '../utils/progressionSystem'

const router = useRouter()

const availableLevels = ref([])
const gameState = ref('difficulty')
const selectedDifficulty = ref('easy')
const currentQuestion = ref(0)
const totalQuestions = ref(10)
const questions = ref([])
const selectedAnswer = ref(null)
const showResult = ref(false)
const score = ref(0)
const isPlaying = ref(false)
const playingSymbol = ref(null)
const showCompletion = ref(false)
const levelCompleted = ref(false)
const newUnlocks = ref([])
const starRating = ref(0)
const isNewBest = ref(false)

const DEFAULT_SYMBOLS = {
  easy: ['a', 'e', 'i', 'o', 'u', 'ɑ'],
  medium: ['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ', 'ə', 'ʌ'],
  hard: ['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ', 'ə', 'ʌ', 'æ', 'ɒ', 'ɜ', 'ɨ', 'ɵ', 'ɯ', 'ɤ', 'ɞ', 'ɘ', 'ɶ', 'œ', 'ʏ', 'ɐ', 'ɚ', 'ɝ']
}

const currentLevel = computed(() =>
  availableLevels.value.find(level => level.id === selectedDifficulty.value) || null
)

const currentDifficultyName = computed(() => currentLevel.value?.name || 'Easy')
const currentDifficultyDescription = computed(() => currentLevel.value?.description || 'Match the vowel to its IPA symbol')
const currentLevelEmoji = computed(() => currentLevel.value?.emoji || '🔤')
const maxScore = computed(() => currentLevel.value?.maxScore || totalQuestions.value)
const bestScore = computed(() => currentLevel.value?.bestScore || 0)

const currentQuestionData = computed(() => questions.value[currentQuestion.value] || null)
const currentSymbol = computed(() => currentQuestionData.value?.symbol || '')
const currentOptions = computed(() => currentQuestionData.value?.options || [])
const correctIndex = computed(() => currentQuestionData.value?.correctIndex ?? -1)

const accuracy = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round((score.value / totalQuestions.value) * 100)
})

const celebrationData = computed(() => {
  const achievements = []

  if (isNewBest.value) {
    achievements.push({
      id: 'new-best',
      icon: '🏅',
      name: 'New Best Score!'
    })
  }

  if (levelCompleted.value && starRating.value > 0) {
    achievements.push({
      id: 'star-rating',
      icon: '⭐️'.repeat(starRating.value),
      name: `${starRating.value} Star${starRating.value > 1 ? 's' : ''} Earned`
    })
  }

  newUnlocks.value.forEach(level => {
    achievements.push({
      id: `unlock-${level.id}`,
      icon: '🔓',
      name: `${level.name} Unlocked`
    })
  })

  const nextLevel = availableLevels.value.find(
    level => level.unlocked && !level.completed && level.id !== selectedDifficulty.value
  )

  return {
    icon: levelCompleted.value ? '🏆' : '🎉',
    title: levelCompleted.value ? 'Level Complete!' : 'Great listening!',
    message: `You matched ${score.value} of ${totalQuestions.value} symbols.`,
    score: score.value,
    scoreLabel: 'Correct',
    achievements,
    showPlayAgain: true,
    showNextLevel: !!nextLevel,
    showBackToQuestline: true
  }
})

function checkLanguageSelection() {
  if (!selectedLanguage.value) {
    console.warn('No language selected, using fallback IPA sets')
  }
  return true
}

function loadAvailableLevels() {
  availableLevels.value = getSymbolSleuthLevels()
  const unlocked = availableLevels.value.find(level => level.unlocked)
  if (unlocked && !availableLevels.value.find(level => level.id === selectedDifficulty.value && level.unlocked)) {
    selectedDifficulty.value = unlocked.id
  }
}

function isLevelUnlocked(levelId) {
  const level = availableLevels.value.find(level => level.id === levelId)
  return level?.unlocked ?? false
}

function getCurrentSymbols() {
  const levelSymbols = currentLevel.value?.symbols
  if (Array.isArray(levelSymbols) && levelSymbols.length > 0) {
    return [...levelSymbols]
  }
  return DEFAULT_SYMBOLS[selectedDifficulty.value] || DEFAULT_SYMBOLS.easy
}

function generateQuestions() {
  let availableSymbols = []

  if (languagePhonemes.value.length > 0) {
    const difficultyMap = {
      easy: ['easy'],
      medium: ['easy', 'medium'],
      hard: ['easy', 'medium', 'hard']
    }

    const allowed = difficultyMap[selectedDifficulty.value] || ['medium']
    const filtered = languagePhonemes.value.filter(phoneme =>
      allowed.includes(phoneme.difficulty_level)
    )

    availableSymbols = filtered.length > 0
      ? filtered.map(p => p.phoneme_ipa)
      : languagePhonemes.value.map(p => p.phoneme_ipa)
  } else {
    availableSymbols = getCurrentSymbols()
  }

  questions.value = []

  for (let i = 0; i < totalQuestions.value; i++) {
    const correctSymbol = availableSymbols[Math.floor(Math.random() * availableSymbols.length)]

    const distractors = []
    while (distractors.length < 3) {
      const candidate = availableSymbols[Math.floor(Math.random() * availableSymbols.length)]
      if (candidate !== correctSymbol && !distractors.includes(candidate)) {
        distractors.push(candidate)
      }
    }

    const options = [...distractors, correctSymbol].sort(() => Math.random() - 0.5)
    questions.value.push({
      symbol: correctSymbol,
      options,
      correctIndex: options.indexOf(correctSymbol)
    })
  }
}

function selectDifficulty(levelId) {
  const level = availableLevels.value.find(l => l.id === levelId)
  if (!level || !level.unlocked) return
  selectedDifficulty.value = levelId
}

function startLevel(levelId) {
  if (!isLevelUnlocked(levelId)) return
  selectDifficulty(levelId)
  startGame()
}

function getLevelActionLabel(level) {
  if (!level.unlocked) return 'Locked'
  return level.completed ? 'Replay' : 'Start'
}

function startGame() {
  if (!checkLanguageSelection()) return

  score.value = 0
  currentQuestion.value = 0
  selectedAnswer.value = null
  showResult.value = false
  showCompletion.value = false
  levelCompleted.value = false
  newUnlocks.value = []
  starRating.value = 0
  isNewBest.value = false

  generateQuestions()
  gameState.value = 'playing'
}

function selectAnswer(index) {
  if (showResult.value) return
  selectedAnswer.value = index
}

function submitAnswer() {
  if (selectedAnswer.value === null) return
  const question = currentQuestionData.value
  if (!question) return

  showResult.value = true
  if (selectedAnswer.value === question.correctIndex) {
    score.value += 1
  }
}

function nextQuestion() {
  if (currentQuestion.value + 1 < totalQuestions.value) {
    currentQuestion.value += 1
    selectedAnswer.value = null
    showResult.value = false
  } else {
    finishGame()
  }
}

function finishGame() {
  gameState.value = 'results'
  saveGameStats()

  const completionResult = completeSymbolSleuthLevel(
    selectedDifficulty.value,
    score.value,
    0,
    accuracy.value
  )

  levelCompleted.value = completionResult.completed
  newUnlocks.value = completionResult.newUnlocks
  starRating.value = completionResult.starRating
  isNewBest.value = completionResult.isNewBest

  loadAvailableLevels()
  showCompletion.value = true
}

function saveGameStats() {
  try {
    const stats = JSON.parse(localStorage.getItem('symbolSleuthStats') || '{}')
    const difficultyStats = stats[selectedDifficulty.value] || { played: 0, bestScore: 0 }

    difficultyStats.played += 1
    if (score.value > difficultyStats.bestScore) {
      difficultyStats.bestScore = score.value
    }

    stats[selectedDifficulty.value] = difficultyStats
    localStorage.setItem('symbolSleuthStats', JSON.stringify(stats))
  } catch (error) {
    console.error('Error saving game stats:', error)
  }
}

async function playAudio(symbol) {
  if (isPlaying.value && playingSymbol.value === symbol) return

  try {
    isPlaying.value = true
    playingSymbol.value = symbol

    const phoneme = languagePhonemes.value.find(p => p.phoneme_ipa === symbol)
    const audioUrl = phoneme?.audio_url || null

    await ipaAudioService.playSound(symbol, audioUrl)
  } catch (error) {
    console.error('Error playing audio:', error)
  } finally {
    isPlaying.value = false
    playingSymbol.value = null
  }
}

function resetGame() {
  gameState.value = 'difficulty'
  showCompletion.value = false
  score.value = 0
  currentQuestion.value = 0
  selectedAnswer.value = null
  showResult.value = false
}

function handleCelebrationClose() {
  showCompletion.value = false
}

function handlePlayAgain() {
  showCompletion.value = false
  startGame()
}

function handleNextLevel() {
  const nextLevel = availableLevels.value.find(
    level => level.unlocked && !level.completed && level.id !== selectedDifficulty.value
  )

  if (nextLevel) {
    selectedDifficulty.value = nextLevel.id
    showCompletion.value = false
    startGame()
  }
}

function handleBackToQuestline() {
  router.push('/memory-questline')
}

onMounted(async () => {
  loadAvailableLevels()

  const route = router.currentRoute.value
  if (route.query.level) {
    const requested = availableLevels.value.find(level => level.id === route.query.level)
    if (requested?.unlocked) {
      selectedDifficulty.value = requested.id
    }
  }

  if (!checkLanguageSelection()) return

  try {
    const symbolsToPreload = languagePhonemes.value.length > 0
      ? languagePhonemes.value.map(p => p.phoneme_ipa)
      : Array.from(new Set(Object.values(DEFAULT_SYMBOLS).flat()))

    await ipaAudioService.preloadAudio(symbolsToPreload)
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

.header-level {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding: 0.5rem 1rem;
  background: var(--surface-color);
  border-radius: 999px;
  border: 2px solid var(--border-color);
}

.header-emoji {
  font-size: 1.5rem;
}

.header-pill {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.pill-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-light);
  font-weight: 600;
}

.pill-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

/* Difficulty Selection */
.difficulty-selection {
  text-align: center;
}

.difficulty-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.difficulty-card {
  position: relative;
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: 20px;
  padding: 2rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.difficulty-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(15, 59, 80, 0.12);
}

.difficulty-card.selected {
  border-color: var(--primary-color);
  background: var(--primary-light);
  box-shadow: 0 14px 30px rgba(49, 186, 124, 0.18);
}

.difficulty-card.locked {
  cursor: not-allowed;
  opacity: 0.6;
}

.difficulty-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.difficulty-emoji {
  font-size: 2rem;
}

.difficulty-card h3 {
  font-size: 1.4rem;
  margin: 0;
  color: var(--text-primary);
}

.difficulty-description {
  margin: 0;
  color: var(--text-light);
  line-height: 1.5;
  min-height: 3rem;
}

.example-pairs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: center;
}

.example-pill {
  background: var(--background-color);
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.85rem;
  color: var(--text-light);
}

.level-status {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-light);
}

.level-stars {
  font-size: 1rem;
}

.level-best {
  font-weight: 600;
}

.difficulty-actions {
  margin-top: auto;
  display: flex;
  justify-content: center;
}

.difficulty-play-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 180px;
  margin: 0 auto;
  padding: 0.6rem 1.5rem;
  border-radius: 999px;
  border: none;
  font-weight: 700;
  font-size: 0.95rem;
  font-family: 'Manrope', sans-serif;
  color: #ffffff;
  background: linear-gradient(135deg, #1cb0f6, #1592d8);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  box-shadow: 0 10px 20px rgba(28, 176, 246, 0.25);
}

.difficulty-play-btn.primary {
  background: linear-gradient(135deg, var(--primary-color), #2fb86d);
  box-shadow: 0 12px 24px rgba(47, 184, 109, 0.35);
}

.difficulty-play-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(28, 176, 246, 0.32);
}

.difficulty-play-btn.primary:hover {
  box-shadow: 0 14px 28px rgba(47, 184, 109, 0.42);
}

.locked-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text-light);
}

.lock-icon {
  font-size: 1.5rem;
}

/* Game Layout */
.game-layout {
  display: grid;
  grid-template-columns: minmax(0, 2.5fr) minmax(240px, 1fr);
  gap: 2rem;
  align-items: flex-start;
}

.question-card {
  background: var(--surface-color);
  border-radius: 24px;
  padding: 2.5rem;
  border: 2px solid var(--border-color);
  box-shadow: 0 18px 45px rgba(19, 68, 90, 0.08);
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.question-header h2 {
  color: var(--text-light);
  font-size: 1.1rem;
  margin: 0;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.symbol-display {
  text-align: center;
  margin-bottom: 1rem;
}

.ipa-symbol {
  font-size: 4rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.75rem;
  font-family: 'Doulos SIL', 'Charis SIL', serif;
}

.instruction {
  font-size: 1.1rem;
  color: var(--text-light);
  margin: 0;
}

.audio-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.2rem;
}

.audio-option {
  background: var(--background-color);
  border: 2px solid var(--border-color);
  border-radius: 14px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.audio-option:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(20, 120, 180, 0.1);
}

.audio-option.selected {
  border-color: var(--primary-color);
  background: rgba(88, 204, 2, 0.08);
}

.audio-option.correct {
  border-color: #10b981;
  background: #ecfdf5;
}

.audio-option.incorrect {
  border-color: #ef4444;
  background: #fef2f2;
}

.audio-option.playing {
  box-shadow: 0 10px 24px rgba(49, 186, 124, 0.18);
}

.play-audio-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: var(--primary-color);
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-audio-btn:hover:not(:disabled) {
  transform: scale(1.05);
  background: var(--primary-dark);
}

.play-audio-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.option-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.option-symbol {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-left: auto;
  font-family: 'Doulos SIL', 'Charis SIL', serif;
}

.question-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.submit-btn,
.next-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.85rem 2.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}

.submit-btn:hover:not(:disabled),
.next-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result-feedback {
  text-align: center;
  padding: 1.2rem;
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

/* Side HUD */
.side-hud {
  position: sticky;
  top: 2rem;
}

.side-hud-card {
  background: linear-gradient(180deg, rgba(241, 249, 255, 0.95), rgba(236, 250, 244, 0.95));
  border-radius: 20px;
  padding: 1.8rem;
  border: 1px solid rgba(49, 186, 124, 0.18);
  box-shadow: 0 18px 35px rgba(15, 59, 80, 0.12);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.side-hud-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.summary-emoji {
  font-size: 2.2rem;
}

.summary-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-light);
  font-weight: 600;
}

.summary-text h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.summary-description {
  margin: 0;
  color: var(--text-light);
  line-height: 1.5;
}

.side-hud-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.hud-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(26, 83, 92, 0.08);
  transition: all 0.2s ease;
}

.hud-metric:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(26, 83, 92, 0.12);
}

.metric-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-light);
  font-weight: 600;
}

.metric-value {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--primary-color);
  font-family: 'Manrope', sans-serif;
}

.hud-cta {
  border: none;
  border-radius: 12px;
  padding: 0.85rem 1.8rem;
  font-weight: 700;
  font-size: 1rem;
  background: linear-gradient(135deg, #58cc02, #2fb86d);
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(88, 204, 2, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hud-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgba(88, 204, 2, 0.45);
}

.side-hud-cta {
  width: 100%;
}

/* Results */
.game-results {
  text-align: center;
  display: flex;
  justify-content: center;
}

.results-card {
  background: var(--surface-color);
  border-radius: 24px;
  padding: 3rem;
  border: 2px solid var(--border-color);
  box-shadow: 0 20px 40px rgba(18, 60, 80, 0.12);
  max-width: 520px;
  width: 100%;
}

.results-card h2 {
  font-size: 2rem;
  color: var(--primary-color);
  margin: 0 0 2rem 0;
}

.score-display {
  margin-bottom: 1.5rem;
}

.final-score {
  font-size: 3rem;
  font-weight: 800;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.accuracy {
  font-size: 1.2rem;
  color: var(--text-light);
}

.results-stars {
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
}

.performance-message {
  margin-bottom: 1.5rem;
}

.performance-message p {
  font-size: 1.05rem;
  color: var(--text-primary);
  margin: 0;
}

.unlock-message p {
  margin: 0.25rem 0;
  color: var(--primary-color);
  font-weight: 600;
}

.results-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2rem;
}

.play-again-btn,
.back-btn {
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.05rem;
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

/* Responsive */
@media (max-width: 1024px) {
  .symbol-sleuth-game {
    padding: 1.5rem;
  }

  .game-layout {
    grid-template-columns: 1fr;
  }

  .side-hud {
    position: static;
    order: -1;
  }
}

@media (max-width: 768px) {
  .symbol-sleuth-game {
    padding: 1.25rem;
  }

  .game-header {
    text-align: left;
  }

  .difficulty-cards {
    grid-template-columns: 1fr;
  }

  .audio-options {
    grid-template-columns: 1fr;
  }

  .ipa-symbol {
    font-size: 3.2rem;
  }

  .results-actions {
    flex-direction: column;
  }
}

@media (max-width: 600px) {
  .game-header h1 {
    font-size: 2rem;
  }

  .question-card {
    padding: 1.75rem;
  }

  .play-audio-btn {
    width: 42px;
    height: 42px;
  }
}
</style>
