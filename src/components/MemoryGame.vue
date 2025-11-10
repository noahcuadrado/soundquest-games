<template>
  <div class="ipa-game">
    <header class="game-header">
      <div class="header-title">
        <h1>IPA Memory Challenge</h1>
        <p class="subtitle">Master vowel sounds through play</p>
      </div>
      <div class="header-level">
        <span class="header-emoji">{{ getCurrentLevelEmoji() }}</span>
        <div class="header-pill">
          <span class="pill-label">Difficulty</span>
          <span class="pill-name">{{ currentDifficultyName }}</span>
        </div>
      </div>
    </header>

    <!-- Layout based on Figma reference:
         - Large left grid of cards
         - Single tall right panel with level info + stats + actions
         - Top header kept separate -->
    <div class="game-layout">
      <!-- LEFT: Memory grid -->
      <div class="memory-game">
        <div class="game-grid">
          <div
            v-for="(card, index) in cards"
            :key="index"
            class="memory-card"
            :class="{
              flipped: card.flipped,
              matched: card.matched,
              disabled: isChecking
            }"
            @click="flipCard(index)"
          >
            <div class="card-inner">
              <div class="card-front">
                <img src="/SQ.svg" alt="SQ" class="card-icon" />
              </div>
              <div class="card-back">{{ card.symbol }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Single vertical HUD panel -->
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
              <span class="metric-label">Pairs</span>
              <span class="metric-value">{{ matchedPairs }}/{{ totalPairs }}</span>
            </div>
            <div class="hud-metric">
              <span class="metric-label">Moves</span>
              <span class="metric-value">{{ moves }}</span>
            </div>
            <div class="hud-metric">
              <span class="metric-label">Best</span>
              <span class="metric-value">{{ bestMoves > 0 ? bestMoves : 'N/A' }}</span>
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
import { playIPASound, preloadIPAAudio } from '../services/ipaAudioService'
import { selectedLanguage, languagePhonemes } from '../stores/languageStore'
import { useRouter } from 'vue-router'
import GameCelebration from './shared/GameCelebration.vue'
import { memoryProgressionSystem, getMemoryLevels, completeMemoryLevel } from '../utils/progressionSystem'

// Get available levels from progression system
const availableLevels = ref([])

const router = useRouter()
const selectedDifficulty = ref('easy')
const cards = ref([])
const flippedCards = ref([])
const matchedPairs = ref(0)
const totalPairs = ref(6)
const moves = ref(0)
const isChecking = ref(false)
const showCompletion = ref(false)
const bestMoves = ref(0)
const isNewBest = ref(false)
const levelCompleted = ref(false)
const newUnlocks = ref([])
const starRating = ref(0)

// Celebration data for GameCelebration component
const celebrationData = computed(() => {
  const baseData = {
    icon: levelCompleted.value ? '🏆' : '🎯',
    title: levelCompleted.value ? 'Level Complete!' : 'Game Finished!',
    message: `You matched all ${totalPairs.value} pairs in ${moves.value} moves!`,
    score: moves.value,
    scoreLabel: 'Moves',
    achievements: [],
    showPlayAgain: true,
    showNextLevel: false
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
  baseData.showBackToQuestline = true

  return baseData
})

// Load best moves from localStorage
function loadBestMoves() {
  const key = `game-memory-best-${selectedDifficulty.value}`
  const saved = localStorage.getItem(key)
  bestMoves.value = saved ? parseInt(saved) : 0
}

// Save best moves to localStorage
function saveBestMoves(moves) {
  const key = `game-memory-best-${selectedDifficulty.value}`
  localStorage.setItem(key, moves.toString())
  bestMoves.value = moves
}

// Play success sound effect using Web Audio API
// Play success sound effect using Web Audio API (iOS compatible)
function playSuccessSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // Resume if suspended (iOS requirement)
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        playSoundWithContext(audioContext)
      }).catch(err => {
        console.error('Failed to resume AudioContext:', err)
      })
    } else {
      playSoundWithContext(audioContext)
    }
  } catch (err) {
    console.error('Failed to play success sound:', err)
    // Fail silently - don't break game flow
  }
}

function playSoundWithContext(audioContext) {
  try {
    const now = audioContext.currentTime
    
    // Create oscillator for pleasant "ding" sound
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Pleasant chord frequencies
    oscillator.frequency.setValueAtTime(800, now)
    oscillator.frequency.setValueAtTime(1000, now + 0.1)
    
    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
    
    oscillator.start(now)
    oscillator.stop(now + 0.4)
  } catch (err) {
    console.error('Error playing sound:', err)
  }
}

const currentDifficultyName = computed(() => {
  return availableLevels.value.find(d => d.id === selectedDifficulty.value)?.name || 'Easy'
})

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

// Check if user has selected a language, redirect if not
function checkLanguageSelection() {
  if (!selectedLanguage.value) {
    // For testing purposes, allow playing without language selection
    console.warn('No language selected, using fallback symbols')
    return true
  }
  return true
}

// Select difficulty and restart game
function selectDifficulty(difficultyId) {
  const level = availableLevels.value.find(l => l.id === difficultyId)
  if (!level || !level.unlocked) {
    console.warn('Level not unlocked:', difficultyId)
    return
  }
  
  selectedDifficulty.value = difficultyId
  loadBestMoves()
  initializeGame()
}

// Initialize game based on selected difficulty and language
function initializeGame() {
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
    availableSymbols = languagePhonemes.value
      .filter(phoneme => allowedDifficulties.includes(phoneme.difficulty_level))
      .map(phoneme => phoneme.phoneme_ipa)
    
    // If not enough phonemes for selected difficulty, use all available
    if (availableSymbols.length < totalPairs.value) {
      availableSymbols = languagePhonemes.value.map(phoneme => phoneme.phoneme_ipa)
    }
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
  
  // Ensure we have enough symbols
  if (availableSymbols.length < totalPairs.value) {
    console.warn('Not enough phonemes available, using all available symbols')
    totalPairs.value = Math.min(availableSymbols.length, 6)
  }
  
  // Select random IPA symbols
  const selectedSymbols = [...availableSymbols]
    .sort(() => Math.random() - 0.5)
    .slice(0, totalPairs.value)
  
  // Create pairs and shuffle
  const cardPairs = [...selectedSymbols, ...selectedSymbols]
    .sort(() => Math.random() - 0.5)
    .map(symbol => ({
      symbol,
      flipped: false,
      matched: false,
      audioUrl: getPhonemeAudioUrl(symbol)
    }))
  
  cards.value = cardPairs
  flippedCards.value = []
  matchedPairs.value = 0
  moves.value = 0
  isNewBest.value = false
  levelCompleted.value = false
  newUnlocks.value = []
  starRating.value = 0
}

// Get audio URL for a phoneme from database
function getPhonemeAudioUrl(ipaSymbol) {
  const phoneme = languagePhonemes.value.find(p => p.phoneme_ipa === ipaSymbol)
  return phoneme?.audio_url || null
}

// Flip a card
function flipCard(index) {
  if (isChecking.value || cards.value[index].flipped || cards.value[index].matched) {
    return
  }
  
  cards.value[index].flipped = true
  flippedCards.value.push(index)
  
  // Play IPA sound with database URL and Wikipedia fallback
  const card = cards.value[index]
  playIPASound(card.symbol, card.audioUrl)
  
  if (flippedCards.value.length === 2) {
    moves.value++
    checkMatch()
  }
}

// Check if two flipped cards match
function checkMatch() {
  isChecking.value = true
  const [first, second] = flippedCards.value
  
  if (cards.value[first].symbol === cards.value[second].symbol) {
    // Match found
    playSuccessSound()
    
    setTimeout(() => {
      cards.value[first].matched = true
      cards.value[second].matched = true
      flippedCards.value = []
      matchedPairs.value++
      isChecking.value = false
      
      // Check if game is complete
      if (matchedPairs.value === totalPairs.value) {
        setTimeout(() => {
          // Check if this is a new best score
          if (bestMoves.value === 0 || moves.value < bestMoves.value) {
            isNewBest.value = true
            saveBestMoves(moves.value)
          }
          
          // Check level completion and unlocks
          const completionResult = completeMemoryLevel(selectedDifficulty.value, 0, moves.value, 100)
          levelCompleted.value = completionResult.completed
          newUnlocks.value = completionResult.newUnlocks
          starRating.value = completionResult.starRating
          
          // Refresh available levels to show new unlocks
          loadAvailableLevels()
          
          showCompletion.value = true
        }, 500)
      }
    }, 500)
  } else {
    // No match
    setTimeout(() => {
      cards.value[first].flipped = false
      cards.value[second].flipped = false
      flippedCards.value = []
      isChecking.value = false
    }, 1000)
  }
}

// Reset game
function resetGame() {
  showCompletion.value = false
  initializeGame()
}

// Handle celebration close
function handleCelebrationClose() {
  showCompletion.value = false
}

// Handle play again from celebration
function handlePlayAgain() {
  showCompletion.value = false
  initializeGame()
}

// Handle back to questline from celebration
function handleBackToQuestline() {
  router.push('/memory-questline')
}

// Load available levels from progression system
function loadAvailableLevels() {
  availableLevels.value = getMemoryLevels()
  
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
  
  loadBestMoves()
  initializeGame()
  
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
.ipa-game {
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

/* Top banner retained minimal, mainly for consistency if needed later */
.game-hud {
  display: none;
}

.level-summary {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.summary-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.summary-emoji {
  font-size: 2.1rem;
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

.hud-stats {
  display: flex;
  justify-content: flex-end;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.hud-metric {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.75rem 1rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.85);
  min-width: 130px;
  box-shadow: inset 0 0 0 1px rgba(26, 83, 92, 0.08);
}

.metric-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-light);
  font-weight: 600;
}

.metric-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-top: 0.25rem;
  font-family: 'Manrope', sans-serif;
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

.game-layout {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(260px, 1.4fr);
  align-items: flex-start;
  gap: 2rem;
  margin-top: 1.5rem;
}

.hud-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(88, 204, 2, 0.45);
}

.memory-game {
  width: 100%;
}

.game-grid {
  display: grid;
  /* Exactly 3 columns that fill available width but don't grow too large */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  width: 100%;
  max-width: 520px; /* Cap total grid width to prevent cards from getting too large */
}

.memory-card {
  aspect-ratio: 4 / 5;
  perspective: 1000px;
  cursor: pointer;
  width: 100%;
  max-width: 160px; /* Cap individual card size */
  margin: 0 auto; /* Center cards in their grid cells */
}

.memory-card.disabled {
  pointer-events: none;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.memory-card.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 1.6rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.card-front {
  background: linear-gradient(135deg, var(--primary-color), #2d6e78);
  color: white;
  font-family: 'Manrope', sans-serif;
  padding: 1rem;
}

.card-icon {
  width: 60%;
  height: 60%;
  object-fit: contain;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}

.memory-card:hover:not(.flipped):not(.matched) .card-front {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(26, 83, 92, 0.3);
}

.card-back {
  background: linear-gradient(135deg, var(--secondary-color), #fce5c8);
  color: var(--primary-color);
  transform: rotateY(180deg);
  font-family: 'Doulos SIL', 'Charis SIL', 'Gentium', serif;
}

.memory-card.matched .card-inner {
  animation: matchPulse 0.5s ease-out;
}

.memory-card.matched .card-back {
  background: linear-gradient(135deg, var(--success-color), #2ecc71);
  color: white;
}

.side-hud {
  display: flex;
  justify-content: flex-start;
}

.side-hud-card {
  width: 100%;
  padding: 1.25rem 1.5rem 1.5rem;
  border-radius: 18px;
  border: 2px solid var(--border-color);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 24px rgba(17, 37, 52, 0.12);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-height: 100%;
}

.side-hud-card h3 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
  color: var(--primary-color);
}

.side-hud-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.side-hud-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.side-hud-cta {
  width: 100%;
  margin-top: 1.25rem;
  justify-self: stretch;
}

@keyframes matchPulse {
  0%, 100% {
    transform: rotateY(180deg) scale(1);
  }
  50% {
    transform: rotateY(180deg) scale(1.1);
  }
}


@media (max-width: 1024px) {
  .ipa-game {
    padding: 1.5rem;
    max-width: 100%;
  }

  .game-layout {
    grid-template-columns: minmax(0, 2fr) minmax(240px, 1.2fr);
    gap: 1.5rem;
    margin-top: 1.25rem;
  }

  .game-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    max-width: 460px;
  }
}

@media (max-width: 640px) {
  .ipa-game {
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

  .memory-game {
    justify-content: center;
  }

  .game-grid {
    margin: 0 auto;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
    max-width: 360px;
  }

  .memory-card {
    max-width: 110px; /* Smaller cards on mobile */
  }

  .card-front,
  .card-back {
    font-size: 1.4rem;
  }

  .side-hud {
    order: 2;
  }
  
  .hud-cta,
  .side-hud-cta {
    width: 100%;
  }
}
</style>






