<template>
  <div class="game-selection">
    <!-- Language Selection Section -->
    <div class="language-selection-section" v-if="!selectedLanguage && availableLanguages.length > 0">
      <div class="language-prompt">
        <h2>🌍 Choose Your Learning Language</h2>
        <p>Select a language to start your IPA learning journey. Only languages with complete audio support are shown.</p>
      </div>
      
      <div class="languages-grid" v-if="availableLanguages.length > 0">
        <button
          v-for="language in availableLanguages"
          :key="language.language_code"
          @click="selectLanguage(language)"
          class="language-card"
        >
          <div class="language-name">{{ language.language_name }}</div>
          <div class="language-info">{{ language.phoneme_count }} phonemes with audio</div>
        </button>
      </div>
      
      <div v-else-if="languagesLoading" class="loading-container">
        <LoadingSpinner text="Loading available languages..." size="large" />
      </div>
      
      <div v-else class="no-languages-message">
        <p>⚠️ No languages with complete audio support are currently available.</p>
        <p>Please check back later or contact support.</p>
      </div>
    </div>


    <div class="games-grid" v-if="selectedLanguage || availableLanguages.length === 0">
      <div
        v-for="game in games"
        :key="game.id"
        class="game-card"
        :class="{ locked: game.locked, 'memory-card': game.id === 'memory' }"
        @click="selectGame(game)"
      >
        <div class="card-top">
          <div class="card-top-left">
            <div class="game-icon" aria-hidden="true">
              <component :is="game.icon" />
            </div>
            <div class="card-text">
              <div class="title-row">
                <h3 class="game-title">{{ game.name }}</h3>
                <div class="card-badges">
                  <span class="game-badge" v-if="game.isNew">NEW</span>
                  <span class="game-badge locked-badge" v-if="game.locked">
                    <LockClosedIcon class="badge-icon" aria-hidden="true" />
                    Locked
                  </span>
                </div>
              </div>
              <p class="game-description">{{ game.description }}</p>
            </div>
          </div>
          <div class="card-top-right">
            <button 
              class="play-btn"
              :disabled="game.locked"
              @click.stop="selectGame(game)"
            >
              {{ game.locked ? 'Coming Soon' : 'Play Now' }}
            </button>
          </div>
        </div>
        
        <div class="game-stats" v-if="!game.locked">
            <!-- Enhanced stats for Memory Challenge -->
            <div
              v-if="game.id === 'memory' && memorySummary && gameStats[game.id]?.progression"
              class="progression-stats memory-stats"
            >
              <div class="memory-summary">
                <div class="memory-summary-stats">
                  <div class="summary-stat">
                    <span class="summary-label">Levels</span>
                    <span class="summary-value">{{ memorySummary.completedLevels }}/{{ memorySummary.totalLevels }}</span>
                  </div>
                  <div class="summary-stat">
                    <span class="summary-label">Stars Earned</span>
                    <span class="summary-value">{{ memorySummary.totalStars }}/{{ memorySummary.maxStars }}</span>
                  </div>
                  <div class="summary-stat">
                    <span class="summary-label">Times Played</span>
                    <span class="summary-value">{{ getPlayCount(game.id) }}</span>
                  </div>
                </div>
                <div class="memory-progress">
                  <div class="memory-progress-bar" aria-hidden="true">
                    <div
                      class="memory-progress-fill"
                      :style="{ width: memorySummary.percent + '%' }"
                    ></div>
                  </div>
                  <span class="memory-progress-label">{{ memorySummary.percent }}% complete</span>
                </div>
                <div v-if="memorySummary.nextLevel" class="memory-next">
                  <div class="next-label">
                    {{ memorySummary.nextLevel.unlocked ? 'Next Goal' : 'Unlock Requirement' }}
                  </div>
                  <div class="next-details">
                    <span class="next-level-name">{{ memorySummary.nextLevel.name }}</span>
                    <span class="next-level-description">{{ memorySummary.nextLevel.description }}</span>
                  </div>
                  <div
                    v-if="memorySummary.nextLevel.requirement"
                    class="next-requirements"
                  >
                    Complete in <= {{ memorySummary.nextLevel.requirement.maxMoves }} moves and
                    {{ memorySummary.nextLevel.requirement.minAccuracy }}% accuracy
                  </div>
                </div>
              </div>

              <div class="memory-levels">
                <div
                  v-for="level in memoryLevels"
                  :key="level.id"
                  class="memory-level-card"
                  :class="{
                    completed: level.completed,
                    locked: !level.unlocked
                  }"
                >
                  <div class="memory-level-header">
                    <component
                      :is="level.icon"
                      class="level-icon"
                      :class="level.iconClass"
                      aria-hidden="true"
                    />
                    <div class="level-heading">
                      <span class="level-name">{{ level.name }}</span>
                      <span
                        class="level-status"
                        :class="{
                          completed: level.completed,
                          unlocked: level.unlocked && !level.completed,
                          locked: !level.unlocked
                        }"
                      >
                        {{ level.completed ? 'Completed' : level.unlocked ? 'Unlocked' : 'Locked' }}
                      </span>
                    </div>
                  </div>
                  <p class="level-description">{{ level.description }}</p>
                  <div class="level-metrics">
                    <div class="metric">
                      <span class="metric-label">Stars</span>
                      <div class="metric-stars" aria-hidden="true">
                        <StarIcon
                          v-for="star in 3"
                          :key="star"
                          class="mini-star-icon"
                          :class="{ filled: star <= level.stars }"
                        />
                      </div>
                    </div>
                    <div class="metric">
                      <span class="metric-label">Best Moves</span>
                      <span class="metric-value">{{ level.bestScore ?? '—' }}</span>
                    </div>
                  </div>
                  <div v-if="!level.unlocked && level.unlockHint" class="level-hint">
                    {{ level.unlockHint }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Generic progression display for other games -->
            <div
              v-else-if="game.hasProgression && gameStats[game.id]?.progression"
              class="progression-stats"
            >
              <div class="stat-item">
                <span class="stat-label">Progress</span>
                <span class="stat-value">{{ getProgressPercentage(game.id) }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Stars</span>
                <span class="stat-value">{{ getTotalStars(game.id) }}/{{ getMaxStars(game.id) }}</span>
              </div>
              <div class="progression-visual">
                <div class="level-indicators">
                  <div
                    v-for="level in getProgressionLevels(game.id)"
                    :key="level.id"
                    class="level-indicator"
                    :class="{
                      completed: level.completed,
                      unlocked: level.unlocked,
                      locked: !level.unlocked
                    }"
                    :title="`${level.name}: ${level.completed ? level.stars + ' stars' : level.unlocked ? 'Unlocked' : 'Locked'}`"
                  >
                    <span v-if="!level.unlocked" class="level-state">
                      <LockClosedIcon class="level-icon level-icon-locked" aria-hidden="true" />
                    </span>
                    <span v-else-if="level.completed" class="level-stars" aria-hidden="true">
                      <StarIcon
                        v-for="star in 3"
                        :key="star"
                        class="mini-star-icon"
                        :class="{ filled: star <= level.stars }"
                      />
                    </span>
                    <span v-else class="level-state">
                      <component
                        :is="level.icon"
                        class="level-icon"
                        :class="level.iconClass"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Regular stats for games without progression -->
            <div v-else class="regular-stats">
              <div class="stat-item">
                <span class="stat-label">Best Score</span>
                <span class="stat-value">{{ getBestScore(game.id) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Played</span>
                <span class="stat-value">{{ getPlayCount(game.id) }}</span>
              </div>
            </div>
          </div>
      </div>
    </div>

    <footer class="selection-footer">
      <div class="progress-summary">
        <h3>Your Progress</h3>
        <div class="progress-stats">
          <div class="progress-item">
            <span class="progress-number">{{ totalGamesPlayed }}</span>
            <span class="progress-label">Games Played</span>
          </div>
          <div class="progress-item">
            <span class="progress-number">{{ completedGames }}</span>
            <span class="progress-label">Games Mastered</span>
          </div>
          <div class="progress-item">
            <span class="progress-number">{{ totalAchievements }}</span>
            <span class="progress-label">Achievements</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import {
  PuzzlePieceIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  MicrophoneIcon,
  AdjustmentsHorizontalIcon,
  LockClosedIcon,
  SparklesIcon,
  BoltIcon,
  FireIcon
} from '@heroicons/vue/24/outline'
import { StarIcon } from '@heroicons/vue/24/solid'
import { selectedLanguage, availableLanguages, selectLanguage as selectLang, initializeLanguageStore } from '../stores/languageStore'
import { getMemoryProgression, LEVEL_REQUIREMENTS } from '../utils/progressionSystem'
import LoadingSpinner from './LoadingSpinner.vue'

const router = useRouter()

// Game definitions - only show implemented games that use database phonemes
const games = ref([
  {
    id: 'memory',
    name: 'IPA Memory Challenge',
    description: 'Match pairs of IPA symbols in this classic memory game',
    icon: markRaw(PuzzlePieceIcon),
    route: '/memory-questline',
    locked: false,
    isNew: false,
    hasProgression: true
  },
  {
    id: 'sound-detective',
    name: 'Sound Detective',
    description: 'Listen to IPA sounds and identify the correct symbol',
    icon: markRaw(MagnifyingGlassIcon),
    route: '/sound-detective',
    locked: false,
    isNew: false,
    hasProgression: false
  },
  {
    id: 'symbol-sleuth',
    name: 'Symbol Sleuth',
    description: 'See IPA symbols and identify their sounds',
    icon: markRaw(EyeIcon),
    route: '/symbol-sleuth',
    locked: false,
    isNew: true,
    hasProgression: false
  },
  {
    id: 'pronunciation-coach',
    name: 'Pronunciation Coach',
    description: 'Speak into your microphone and get real-time feedback',
    icon: markRaw(MicrophoneIcon),
    route: '/pronunciation-coach',
    locked: false,
    isNew: true,
    hasProgression: false
  },
  {
    id: 'minimal-pairs',
    name: 'Minimal Pairs Master',
    description: 'Distinguish between similar-sounding vowels',
    icon: markRaw(AdjustmentsHorizontalIcon),
    route: '/minimal-pairs',
    locked: false,
    isNew: true,
    hasProgression: false
  }
  // Sound Sequence is hidden as it needs more work to be fully functional
])

// Language selection state
const languagesLoading = ref(true)

// Game statistics (from localStorage)
const gameStats = ref({})

// Load game statistics from localStorage
function loadGameStats() {
  try {
    const availableGames = games.value.filter(g => !g.locked)
    
    for (const game of availableGames) {
      const stats = {
        playCount: 0,
        bestScores: {
          easy: 0,
          medium: 0,
          hard: 0
        },
        progression: null
      }
      
      // Load play count
      const playCountKey = `game-${game.id}-play-count`
      stats.playCount = parseInt(localStorage.getItem(playCountKey) || '0')
      
      // Load best scores for each difficulty
      const difficulties = ['easy', 'medium', 'hard']
      for (const difficulty of difficulties) {
        const scoreKey = `game-${game.id}-best-${difficulty}`
        const score = localStorage.getItem(scoreKey)
        if (score) {
          stats.bestScores[difficulty] = parseInt(score)
        }
      }
      
      // Load progression data for games that support it
      if (game.hasProgression && game.id === 'memory') {
        stats.progression = getMemoryProgression()
      }
      
      gameStats.value[game.id] = stats
    }
  } catch (error) {
    console.warn('Error loading game stats:', error)
    // Initialize with empty stats if there's an error
    gameStats.value = {}
  }
}

// Get best score display for a game
function getBestScore(gameId) {
  const stats = gameStats.value[gameId]
  if (!stats) return '—'
  
  const scores = Object.values(stats.bestScores).filter(score => score > 0)
  if (scores.length === 0) return '—'
  
  return Math.min(...scores).toString()
}

// Get play count for a game
function getPlayCount(gameId) {
  const stats = gameStats.value[gameId]
  return stats ? stats.playCount.toString() : '0'
}

// Get progression percentage for games with progression
function getProgressPercentage(gameId) {
  const stats = gameStats.value[gameId]
  if (!stats?.progression) return 0
  
  const totalLevels = 3 // easy, medium, hard
  const completedLevels = stats.progression.completedLevels.length
  return Math.round((completedLevels / totalLevels) * 100)
}

// Get total stars earned for a game
function getTotalStars(gameId) {
  const stats = gameStats.value[gameId]
  if (!stats?.progression?.stars) return 0
  
  return Object.values(stats.progression.stars).reduce((total, stars) => total + stars, 0)
}

// Get maximum possible stars for a game
function getMaxStars(gameId) {
  return 9 // 3 levels × 3 stars each
}

// Get progression levels for display
function getProgressionLevels(gameId) {
  const stats = gameStats.value[gameId]
  if (!stats?.progression) return []
  
  const requirements = LEVEL_REQUIREMENTS?.[gameId] || {}
  const levels = [
    {
      id: 'easy',
      name: 'Easy',
      icon: markRaw(SparklesIcon),
      iconClass: 'level-icon-easy'
    },
    {
      id: 'medium',
      name: 'Medium',
      icon: markRaw(BoltIcon),
      iconClass: 'level-icon-medium'
    },
    {
      id: 'hard',
      name: 'Hard',
      icon: markRaw(FireIcon),
      iconClass: 'level-icon-hard'
    }
  ]
  
  return levels.map(level => {
    const requirement = requirements[level.id] || {}
    const prerequisiteId = requirement.prerequisite
    const prerequisiteName = prerequisiteId ? requirements[prerequisiteId]?.name : null
    
    const unlocked = stats.progression.unlockedLevels.includes(level.id)
    const completed = stats.progression.completedLevels.includes(level.id)
    const bestScore = stats.progression.bestScores[level.id] || null
    const stars = stats.progression.stars[level.id] || 0

    const unlockHint = !unlocked
      ? prerequisiteName
        ? `Unlock by mastering ${prerequisiteName}`
        : 'Unlock conditions coming soon'
      : ''

    return {
      ...level,
      unlocked,
      completed,
      stars,
      bestScore,
      description: requirement.description || '',
      requirement: requirement.completionRequirement || null,
      prerequisiteId,
      prerequisiteName,
      unlockHint
    }
  })
}

function getMemorySummary(gameId) {
  const stats = gameStats.value[gameId]
  const requirements = LEVEL_REQUIREMENTS?.[gameId]

  if (!stats?.progression || !requirements) return null

  const totalLevels = Object.keys(requirements).length
  if (totalLevels === 0) return null

  const completedLevels = stats.progression.completedLevels.length
  const percent = Math.round((completedLevels / totalLevels) * 100)
  const totalStars = getTotalStars(gameId)
  const maxStars = getMaxStars(gameId)

  const levelOrder = Object.keys(requirements)
  const nextLevelId = levelOrder.find(levelId => !stats.progression.completedLevels.includes(levelId)) || null

  let nextLevel = null
  if (nextLevelId) {
    const config = requirements[nextLevelId] || {}
    const prerequisiteId = config.prerequisite
    const prerequisiteName = prerequisiteId ? requirements[prerequisiteId]?.name : null

    nextLevel = {
      id: nextLevelId,
      name: config.name || nextLevelId,
      description: config.description || '',
      requirement: config.completionRequirement || null,
      unlocked: stats.progression.unlockedLevels.includes(nextLevelId),
      prerequisiteName
    }
  }

  return {
    completedLevels,
    totalLevels,
    percent,
    totalStars,
    maxStars,
    nextLevel
  }
}

const memorySummary = computed(() => getMemorySummary('memory'))
const memoryLevels = computed(() => getProgressionLevels('memory'))

// Computed statistics
const totalGamesPlayed = computed(() => {
  if (!gameStats.value) return 0
  return Object.values(gameStats.value).reduce((total, stats) => total + (stats?.playCount || 0), 0)
})

const completedGames = computed(() => {
  if (!gameStats.value) return 0
  return Object.values(gameStats.value).filter(stats => {
    return stats && Object.values(stats.bestScores || {}).some(score => score > 0)
  }).length
})

const totalAchievements = computed(() => {
  if (!gameStats.value) return 0
  // Simple achievement system: 1 point per difficulty completed per game
  return Object.values(gameStats.value).reduce((total, stats) => {
    return total + (stats ? Object.values(stats.bestScores || {}).filter(score => score > 0).length : 0)
  }, 0)
})

// Select and navigate to game
function selectGame(game) {
  if (game.locked) return
  
  // Increment play count
  const playCountKey = `game-${game.id}-play-count`
  const currentCount = parseInt(localStorage.getItem(playCountKey) || '0')
  localStorage.setItem(playCountKey, (currentCount + 1).toString())
  
  // Navigate to game
  router.push(game.route)
}

// Language selection functions
async function selectLanguage(language) {
  await selectLang(language)
}


// Initialize on mount
onMounted(async () => {
  loadGameStats()
  
  // Initialize language store
  await initializeLanguageStore()
  languagesLoading.value = false
})
</script>

<style scoped>
.game-selection {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--surface-color) 0%, #f5e8d8 100%);
}

.language-selection-section {
  background: var(--surface-color);
  border: 3px solid var(--border-color);
  border-radius: 16px;
  padding: 3rem 2rem;
  margin-bottom: 4rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(26, 83, 92, 0.1);
}

.language-prompt h2 {
  color: var(--primary-color);
  margin: 0 0 1rem 0;
  font-size: 2rem;
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
}

.language-prompt p {
  color: var(--text-light);
  margin: 0 0 2rem 0;
  font-size: 1.1rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.languages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.language-card {
  background: linear-gradient(135deg, var(--primary-color), #2d6e78);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 2rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Manrope', sans-serif;
  box-shadow: 0 4px 12px rgba(26, 83, 92, 0.3);
}

.language-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(26, 83, 92, 0.4);
}

.language-card .language-name {
  display: block;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.language-card .language-info {
  display: block;
  font-size: 0.9rem;
  opacity: 0.9;
}


.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}

.no-languages-message {
  padding: 2rem;
  color: var(--text-light);
}

.no-languages-message p {
  margin: 0.5rem 0;
  color: var(--text-light);
}

.games-grid {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  margin-bottom: 4rem;
}

.game-card {
  background: var(--surface-color);
  border: 3px solid var(--border-color);
  border-radius: 16px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(26, 83, 92, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.game-card:hover:not(.locked) {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(26, 83, 92, 0.2);
  border-color: var(--primary-color);
}

.game-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
}

.card-top-left {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  flex: 1;
}

.card-text {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.card-badges {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.card-top-right {
  display: flex;
  align-items: flex-start;
}

.game-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  color: var(--primary-color);
  flex-shrink: 0;
}

.game-icon svg {
  width: 2.5rem;
  height: 2.5rem;
}

.game-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  background: var(--success-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-icon {
  width: 1rem;
  height: 1rem;
}

.locked-badge {
  background: var(--text-light);
}

.game-title {
  font-size: 1.5rem;
  color: var(--primary-color);
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
}

.game-description {
  color: var(--text-light);
  margin: 0;
  line-height: 1.5;
}

.game-stats {
  margin: 0;
  padding: 1rem;
  background: rgba(26, 83, 92, 0.05);
  border-radius: 8px;
}

.regular-stats {
  display: flex;
  gap: 2rem;
}

.progression-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progression-stats .stat-item {
  display: inline-flex;
  margin-right: 2rem;
}

.memory-stats {
  gap: 1.5rem;
}

.memory-summary {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.memory-summary-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.summary-stat {
  min-width: 140px;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: rgba(26, 83, 92, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-light);
  font-weight: 600;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-color);
  font-family: 'Manrope', sans-serif;
}

.memory-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.memory-progress-bar {
  flex: 1;
  height: 10px;
  border-radius: 999px;
  background: rgba(26, 83, 92, 0.15);
  overflow: hidden;
}

.memory-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--primary-color), #1abc9c);
  transition: width 0.4s ease;
}

.memory-progress-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary-color);
  min-width: 110px;
}

.memory-next {
  padding: 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(26, 83, 92, 0.15);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.next-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary-color);
}

.next-details {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.next-level-name {
  font-weight: 700;
  font-size: 1rem;
  color: var(--primary-color);
}

.next-level-description {
  font-size: 0.9rem;
  color: var(--text-light);
}

.next-requirements {
  font-size: 0.85rem;
  color: var(--text-muted, #4f6f6f);
}

.memory-levels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.memory-level-card {
  border: 1px solid rgba(26, 83, 92, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.memory-level-card.completed {
  border-color: var(--success-color);
  background: rgba(46, 204, 113, 0.1);
}

.memory-level-card.locked {
  opacity: 0.65;
}

.memory-level-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.level-heading {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.level-status {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: var(--text-light);
}

.level-status.completed {
  color: var(--success-color);
}

.level-status.unlocked {
  color: var(--primary-color);
}

.level-status.locked {
  color: var(--text-light);
}

.level-description {
  font-size: 0.9rem;
  color: var(--text-light);
  margin: 0;
}

.level-metrics {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.metric-label {
  font-size: 0.8rem;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.metric-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary-color);
}

.metric-stars {
  display: flex;
  gap: 0.2rem;
}

.level-hint {
  font-size: 0.8rem;
  color: var(--text-light);
}

.progression-visual {
  margin-top: 0.5rem;
}

.level-indicators {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.level-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  background: var(--surface-color);
  font-size: 0.8rem;
  transition: all 0.3s ease;
  position: relative;
}

.level-indicator.locked {
  opacity: 0.4;
  background: #f5f5f5;
}

.level-indicator.unlocked {
  border-color: var(--primary-color);
  background: rgba(26, 83, 92, 0.1);
}

.level-indicator.completed {
  border-color: var(--success-color);
  background: linear-gradient(135deg, rgba(46, 204, 113, 0.2), rgba(46, 204, 113, 0.1));
}

.level-stars {
  display: flex;
  gap: 0.2rem;
  align-items: center;
}

.level-state {
  display: flex;
  align-items: center;
  justify-content: center;
}

.level-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.level-icon-locked {
  color: var(--text-light);
}

.level-icon-easy {
  color: #22c55e;
}

.level-icon-medium {
  color: #eab308;
}

.level-icon-hard {
  color: #ef4444;
}

.mini-star-icon {
  width: 0.9rem;
  height: 0.9rem;
  color: var(--success-color);
  opacity: 0.3;
}

.mini-star-icon.filled {
  opacity: 1;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.stat-value {
  font-size: 1.25rem;
  color: var(--primary-color);
  font-weight: 700;
  font-family: 'Manrope', sans-serif;
}


.play-btn {
  width: auto;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, var(--primary-color), #2d6e78);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Manrope', sans-serif;
  box-shadow: 0 4px 12px rgba(26, 83, 92, 0.3);
  min-width: 160px;
}

.play-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-hover), #2d6e78);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(26, 83, 92, 0.4);
}

.play-btn:disabled {
  background: var(--text-light);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.selection-footer {
  text-align: center;
  padding: 2rem;
  background: var(--surface-color);
  border-radius: 16px;
  border: 2px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(26, 83, 92, 0.1);
}

.progress-summary h3 {
  color: var(--primary-color);
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-family: 'Manrope', sans-serif;
}

.progress-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
}

.progress-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.progress-number {
  font-size: 2rem;
  color: var(--primary-color);
  font-weight: 800;
  font-family: 'Manrope', sans-serif;
}

.progress-label {
  font-size: 0.9rem;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

@media (max-width: 768px) {
  .game-selection {
    padding: 1rem;
  }
  
  .logo-section {
    flex-direction: column;
    gap: 1rem;
  }
  
  .main-logo {
    height: 60px;
  }
  
  .header-text h1 {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1.1rem;
  }
  
  .games-grid {
    gap: 1.5rem;
  }
  
  .game-card {
    padding: 1.5rem;
  }

  .card-top {
    flex-direction: column;
    align-items: stretch;
  }

  .card-top-left {
    flex-direction: column;
    gap: 1rem;
  }

  .card-top-right {
    width: 100%;
    justify-content: flex-start;
  }

  .card-top-right .play-btn {
    width: 100%;
  }
  
  .regular-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .memory-summary-stats {
    flex-direction: column;
  }

  .memory-progress {
    flex-direction: column;
    align-items: flex-start;
  }

  .memory-progress-label {
    min-width: 0;
  }

  .memory-levels {
    grid-template-columns: 1fr;
  }

  .progression-stats .stat-item {
    margin-right: 1rem;
  }
  
  .level-indicators {
    justify-content: center;
  }
  
  .level-indicator {
    width: 2rem;
    height: 2rem;
  }

  .level-icon {
    width: 1rem;
    height: 1rem;
  }

  .mini-star-icon {
    width: 0.7rem;
    height: 0.7rem;
  }
  
  .progress-stats {
    flex-direction: column;
    gap: 1.5rem;
  }
}
</style>
