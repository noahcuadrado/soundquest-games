/**
 * Shared utilities for IPA games
 */

// Common IPA vowel sets for different difficulty levels
export const IPA_VOWEL_SETS = {
  easy: ['a', 'e', 'i', 'o', 'u', 'ɑ'],
  medium: ['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ', 'ə', 'ʌ'],
  hard: ['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ', 'ə', 'ʌ', 'æ', 'ɒ', 'ɜ', 'ɨ', 'ɵ', 'ɯ', 'ɤ', 'ɞ', 'ɘ', 'ɶ', 'œ', 'ʏ', 'ɐ', 'ɚ', 'ɝ', 'ɹ']
}

// Common difficulty level configurations
export const DIFFICULTY_LEVELS = {
  easy: {
    id: 'easy',
    name: 'Easy',
    color: '#10b981',
    description: 'Most common vowels'
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    color: '#f59e0b',
    description: 'Common + distinct vowels'
  },
  hard: {
    id: 'hard',
    name: 'Hard',
    color: '#ef4444',
    description: 'All vowels including rare'
  }
}

// Game progress management
export class GameProgressManager {
  constructor(gameKey) {
    this.gameKey = gameKey
  }

  // Save game statistics
  saveStats(difficulty, score, bestScore = null) {
    try {
      const statsKey = `${this.gameKey}Stats`
      const stats = JSON.parse(localStorage.getItem(statsKey) || '{}')
      const difficultyStats = stats[difficulty] || { played: 0, bestScore: 0 }
      
      difficultyStats.played++
      if (bestScore !== null && bestScore > difficultyStats.bestScore) {
        difficultyStats.bestScore = bestScore
      } else if (score > difficultyStats.bestScore) {
        difficultyStats.bestScore = score
      }
      
      stats[difficulty] = difficultyStats
      localStorage.setItem(statsKey, JSON.stringify(stats))

      // Update overall game progress
      this.updateGameProgress()
      
      return difficultyStats
    } catch (error) {
      console.error('Error saving game stats:', error)
      return null
    }
  }

  // Get game statistics
  getStats(difficulty = null) {
    try {
      const statsKey = `${this.gameKey}Stats`
      const stats = JSON.parse(localStorage.getItem(statsKey) || '{}')
      
      if (difficulty) {
        return stats[difficulty] || { played: 0, bestScore: 0 }
      }
      
      return stats
    } catch (error) {
      console.error('Error getting game stats:', error)
      return difficulty ? { played: 0, bestScore: 0 } : {}
    }
  }

  // Update overall game progress counter
  updateGameProgress() {
    try {
      const gameProgress = JSON.parse(localStorage.getItem('gameProgress') || '{}')
      gameProgress[this.gameKey] = (gameProgress[this.gameKey] || 0) + 1
      localStorage.setItem('gameProgress', JSON.stringify(gameProgress))
    } catch (error) {
      console.error('Error updating game progress:', error)
    }
  }

  // Get total plays across all difficulties
  getTotalPlays() {
    const stats = this.getStats()
    return Object.values(stats).reduce((total, diffStats) => total + (diffStats.played || 0), 0)
  }

  // Get best score across all difficulties
  getBestScore() {
    const stats = this.getStats()
    return Object.values(stats).reduce((best, diffStats) => Math.max(best, diffStats.bestScore || 0), 0)
  }
}

// Shuffle array utility
export function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Generate random selection from array
export function getRandomSelection(array, count) {
  const shuffled = shuffleArray(array)
  return shuffled.slice(0, Math.min(count, array.length))
}

// Calculate accuracy percentage
export function calculateAccuracy(correct, total) {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}

// Get performance message based on accuracy
export function getPerformanceMessage(accuracy) {
  if (accuracy >= 90) return { emoji: '🏆', message: 'Outstanding! Excellent performance!' }
  if (accuracy >= 75) return { emoji: '👍', message: 'Great job! Keep up the good work!' }
  if (accuracy >= 60) return { emoji: '📚', message: 'Good effort! Keep practicing!' }
  return { emoji: '💪', message: 'Keep practicing! You\'ll improve with time!' }
}

// Format time duration
export function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  return `${remainingSeconds}s`
}

// Debounce function for performance
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Audio playback queue manager
export class AudioQueue {
  constructor() {
    this.queue = []
    this.isPlaying = false
  }

  async add(audioFunction) {
    return new Promise((resolve, reject) => {
      this.queue.push({ audioFunction, resolve, reject })
      this.processQueue()
    })
  }

  async processQueue() {
    if (this.isPlaying || this.queue.length === 0) return

    this.isPlaying = true
    const { audioFunction, resolve, reject } = this.queue.shift()

    try {
      await audioFunction()
      resolve()
    } catch (error) {
      reject(error)
    } finally {
      this.isPlaying = false
      // Process next item in queue
      setTimeout(() => this.processQueue(), 100)
    }
  }

  clear() {
    this.queue = []
    this.isPlaying = false
  }
}

// Game state management
export class GameStateManager {
  constructor(initialState = {}) {
    this.state = { ...initialState }
    this.listeners = new Map()
  }

  setState(updates) {
    const prevState = { ...this.state }
    this.state = { ...this.state, ...updates }
    
    // Notify listeners of state changes
    Object.keys(updates).forEach(key => {
      if (this.listeners.has(key)) {
        this.listeners.get(key).forEach(callback => {
          callback(this.state[key], prevState[key])
        })
      }
    })
  }

  getState(key = null) {
    return key ? this.state[key] : { ...this.state }
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key).add(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.listeners.delete(key)
        }
      }
    }
  }

  reset() {
    this.state = {}
    this.listeners.clear()
  }
}

// Validation utilities
export function validateIPASymbol(symbol) {
  // Basic IPA symbol validation
  const ipaPattern = /^[a-zɑɛɪɔʊəʌæɒɜɨɵɯɤɞɘɶœʏɐɚɝɹ]+$/i
  return ipaPattern.test(symbol)
}

export function validateScore(score, min = 0, max = 100) {
  return typeof score === 'number' && score >= min && score <= max
}

// Local storage utilities with error handling
export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error)
      return defaultValue
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error)
      return false
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error)
      return false
    }
  },

  clear() {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('Error clearing localStorage:', error)
      return false
    }
  }
}

// Export all utilities as default object
export default {
  IPA_VOWEL_SETS,
  DIFFICULTY_LEVELS,
  GameProgressManager,
  shuffleArray,
  getRandomSelection,
  calculateAccuracy,
  getPerformanceMessage,
  formatDuration,
  debounce,
  AudioQueue,
  GameStateManager,
  validateIPASymbol,
  validateScore,
  storage
}