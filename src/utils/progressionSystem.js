/**
 * Level Progression System for IPA Games
 * Manages unlocking levels based on completion requirements
 */

import { storage } from './gameUtils.js'

// Level completion requirements
export const LEVEL_REQUIREMENTS = {
  memory: {
    easy: {
      id: 'easy',
      name: 'Easy',
      emoji: '🟢',
      description: 'Most common vowels',
      unlocked: true, // Always unlocked
      completionRequirement: {
        maxMoves: 50, // Complete in 50 moves or less
        minAccuracy: 100 // Must match all pairs
      }
    },
    medium: {
      id: 'medium',
      name: 'Medium',
      emoji: '🟡',
      description: 'Common + distinct vowels',
      unlocked: false,
      prerequisite: 'easy',
      completionRequirement: {
        maxMoves: 60,
        minAccuracy: 100
      }
    },
    hard: {
      id: 'hard',
      name: 'Hard',
      emoji: '🔴',
      description: 'All vowels including rare',
      unlocked: false,
      prerequisite: 'medium',
      completionRequirement: {
        maxMoves: 80,
        minAccuracy: 100
      }
    }
  }
}

// Progress tracking class
export class ProgressionSystem {
  constructor(gameKey) {
    this.gameKey = gameKey
    this.storageKey = `${gameKey}-progression`
  }

  // Get progression data for the game
  getProgression() {
    const defaultProgression = {
      completedLevels: [],
      unlockedLevels: ['easy'], // Easy is always unlocked
      bestScores: {},
      stars: {} // Star ratings for each level
    }
    
    return storage.get(this.storageKey, defaultProgression)
  }

  // Save progression data
  saveProgression(progression) {
    return storage.set(this.storageKey, progression)
  }

  // Check if a level is unlocked
  isLevelUnlocked(levelId) {
    const progression = this.getProgression()
    return progression.unlockedLevels.includes(levelId)
  }

  // Check if a level is completed
  isLevelCompleted(levelId) {
    const progression = this.getProgression()
    return progression.completedLevels.includes(levelId)
  }

  // Get star rating for a level (1-3 stars based on performance)
  getStarRating(levelId) {
    const progression = this.getProgression()
    return progression.stars[levelId] || 0
  }

  // Complete a level and check for unlocks
  completeLevel(levelId, score, moves, accuracy = 100) {
    const progression = this.getProgression()
    const requirements = LEVEL_REQUIREMENTS[this.gameKey]
    
    if (!requirements || !requirements[levelId]) {
      console.warn(`No requirements found for ${this.gameKey} level ${levelId}`)
      return { newUnlocks: [], starRating: 0 }
    }

    const levelReq = requirements[levelId]
    const newUnlocks = []

    // Check if level is completed based on requirements
    const meetsRequirements = moves <= levelReq.completionRequirement.maxMoves && 
                             accuracy >= levelReq.completionRequirement.minAccuracy

    if (meetsRequirements) {
      // Mark level as completed
      if (!progression.completedLevels.includes(levelId)) {
        progression.completedLevels.push(levelId)
      }

      // Calculate star rating (1-3 stars)
      const starRating = this.calculateStarRating(levelId, moves, accuracy)
      progression.stars[levelId] = Math.max(progression.stars[levelId] || 0, starRating)

      // Update best score
      if (!progression.bestScores[levelId] || moves < progression.bestScores[levelId]) {
        progression.bestScores[levelId] = moves
      }

      // Check for level unlocks
      Object.values(requirements).forEach(level => {
        if (level.prerequisite === levelId && !progression.unlockedLevels.includes(level.id)) {
          progression.unlockedLevels.push(level.id)
          newUnlocks.push(level)
        }
      })

      this.saveProgression(progression)
      
      return { 
        newUnlocks, 
        starRating, 
        completed: true,
        isNewBest: !progression.bestScores[levelId] || moves < progression.bestScores[levelId]
      }
    }

    return { newUnlocks: [], starRating: 0, completed: false }
  }

  // Calculate star rating based on performance
  calculateStarRating(levelId, moves, accuracy) {
    const requirements = LEVEL_REQUIREMENTS[this.gameKey][levelId]
    if (!requirements) return 0

    const maxMoves = requirements.completionRequirement.maxMoves
    
    // 3 stars: Excellent performance (under 60% of max moves)
    if (moves <= maxMoves * 0.6) return 3
    
    // 2 stars: Good performance (under 80% of max moves)
    if (moves <= maxMoves * 0.8) return 2
    
    // 1 star: Meets minimum requirements
    if (moves <= maxMoves && accuracy >= requirements.completionRequirement.minAccuracy) return 1
    
    return 0
  }

  // Get available levels with their unlock status
  getAvailableLevels() {
    const progression = this.getProgression()
    const requirements = LEVEL_REQUIREMENTS[this.gameKey]
    
    if (!requirements) return []

    return Object.values(requirements).map(level => ({
      ...level,
      unlocked: progression.unlockedLevels.includes(level.id),
      completed: progression.completedLevels.includes(level.id),
      stars: progression.stars[level.id] || 0,
      bestScore: progression.bestScores[level.id] || null
    }))
  }

  // Reset progression (for testing)
  resetProgression() {
    storage.remove(this.storageKey)
  }

  // Get overall progress percentage
  getOverallProgress() {
    const progression = this.getProgression()
    const requirements = LEVEL_REQUIREMENTS[this.gameKey]
    
    if (!requirements) return 0

    const totalLevels = Object.keys(requirements).length
    const completedLevels = progression.completedLevels.length
    
    return Math.round((completedLevels / totalLevels) * 100)
  }

  // Get total stars earned
  getTotalStars() {
    const progression = this.getProgression()
    return Object.values(progression.stars).reduce((total, stars) => total + stars, 0)
  }

  // Get maximum possible stars
  getMaxStars() {
    const requirements = LEVEL_REQUIREMENTS[this.gameKey]
    return requirements ? Object.keys(requirements).length * 3 : 0
  }
}

// Export singleton instances for each game
export const memoryProgressionSystem = new ProgressionSystem('memory')

// Helper functions
export function getMemoryProgression() {
  return memoryProgressionSystem.getProgression()
}

export function isMemoryLevelUnlocked(levelId) {
  return memoryProgressionSystem.isLevelUnlocked(levelId)
}

export function completeMemoryLevel(levelId, score, moves, accuracy = 100) {
  return memoryProgressionSystem.completeLevel(levelId, score, moves, accuracy)
}

export function getMemoryLevels() {
  return memoryProgressionSystem.getAvailableLevels()
}

export default {
  LEVEL_REQUIREMENTS,
  ProgressionSystem,
  memoryProgressionSystem,
  getMemoryProgression,
  isMemoryLevelUnlocked,
  completeMemoryLevel,
  getMemoryLevels
}