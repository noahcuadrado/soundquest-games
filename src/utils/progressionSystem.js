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
      emoji: '🧠',
      description: 'Most common vowels',
      unlocked: true, // Always unlocked
      performanceMetric: 'moves',
      completionRequirement: {
        maxMoves: 50, // Complete in 50 moves or less
        minAccuracy: 100 // Must match all pairs
      },
      starThresholds: {
        moves: {
          three: 30,
          two: 40,
          one: 50
        }
      }
    },
    medium: {
      id: 'medium',
      name: 'Medium',
      emoji: '🧠',
      description: 'Common + distinct vowels',
      unlocked: false,
      prerequisite: 'easy',
      performanceMetric: 'moves',
      completionRequirement: {
        maxMoves: 60,
        minAccuracy: 100
      },
      starThresholds: {
        moves: {
          three: 36,
          two: 48,
          one: 60
        }
      }
    },
    hard: {
      id: 'hard',
      name: 'Hard',
      emoji: '🧠',
      description: 'All vowels including rare',
      unlocked: false,
      prerequisite: 'medium',
      performanceMetric: 'moves',
      completionRequirement: {
        maxMoves: 80,
        minAccuracy: 100
      },
      starThresholds: {
        moves: {
          three: 48,
          two: 64,
          one: 80
        }
      }
    }
  },
  symbolSleuth: {
    easy: {
      id: 'easy',
      name: 'Easy',
      emoji: '🔍',
      description: 'Match core vowels with their sounds',
      unlocked: true,
      performanceMetric: 'score',
      maxScore: 10,
      symbols: ['a', 'e', 'i', 'o', 'u', 'ɑ'],
      completionRequirement: {
        minScore: 6
      },
      starThresholds: {
        score: {
          one: 6,
          two: 8,
          three: 10
        }
      }
    },
    medium: {
      id: 'medium',
      name: 'Medium',
      emoji: '🕵️',
      description: 'Add trickier central vowels and reduced sounds',
      unlocked: false,
      prerequisite: 'easy',
      performanceMetric: 'score',
      maxScore: 10,
      symbols: ['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ', 'ə', 'ʌ'],
      completionRequirement: {
        minScore: 7
      },
      starThresholds: {
        score: {
          one: 7,
          two: 9,
          three: 10
        }
      }
    },
    hard: {
      id: 'hard',
      name: 'Hard',
      emoji: '🧠',
      description: 'Rare vowels and contrast-rich tongue positions',
      unlocked: false,
      prerequisite: 'medium',
      performanceMetric: 'score',
      maxScore: 10,
      symbols: ['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ', 'ə', 'ʌ', 'æ', 'ɒ', 'ɜ', 'ɨ', 'ɵ', 'ɯ', 'ɤ', 'ɞ', 'ɘ', 'ɶ', 'œ', 'ʏ', 'ɐ', 'ɚ', 'ɝ'],
      completionRequirement: {
        minScore: 8
      },
      starThresholds: {
        score: {
          one: 8,
          two: 9,
          three: 10
        }
      }
    }
  },
  soundDetective: {
    easy: {
      id: 'easy',
      name: 'Easy',
      emoji: '🎧',
      description: 'Identify staple vowels with plenty of hints',
      unlocked: true,
      performanceMetric: 'score',
      maxScore: 10,
      symbols: ['/i/', '/e/', '/a/', '/o/', '/u/', '/ə/'],
      completionRequirement: {
        minScore: 6
      },
      starThresholds: {
        score: {
          one: 6,
          two: 8,
          three: 10
        }
      }
    },
    medium: {
      id: 'medium',
      name: 'Medium',
      emoji: '🕵️',
      description: 'Broader vowel inventory with subtle contrasts',
      unlocked: false,
      prerequisite: 'easy',
      performanceMetric: 'score',
      maxScore: 10,
      symbols: ['/i/', '/ɪ/', '/e/', '/ɛ/', '/æ/', '/ɑ/', '/ɔ/', '/o/', '/ʊ/', '/u/', '/ə/', '/ʌ/'],
      completionRequirement: {
        minScore: 7
      },
      starThresholds: {
        score: {
          one: 7,
          two: 9,
          three: 10
        }
      }
    },
    hard: {
      id: 'hard',
      name: 'Hard',
      emoji: '🚨',
      description: 'Advanced vowels and rounded-front challenges',
      unlocked: false,
      prerequisite: 'medium',
      performanceMetric: 'score',
      maxScore: 10,
      symbols: ['/i/', '/y/', '/ɨ/', '/ʉ/', '/ɯ/', '/u/', '/ɪ/', '/ʏ/', '/ʊ/', '/e/', '/ø/', '/ɘ/', '/ɵ/', '/ɤ/', '/o/', '/ə/', '/ɛ/', '/œ/', '/ɜ/', '/ɞ/', '/ʌ/', '/ɔ/', '/æ/', '/ɐ/', '/a/', '/ɶ/', '/ɑ/', '/ɒ/'],
      completionRequirement: {
        minScore: 8
      },
      starThresholds: {
        score: {
          one: 8,
          two: 9,
          three: 10
        }
      }
    }
  },
  minimalPairs: {
    easy: {
      id: 'easy',
      name: 'Easy',
      emoji: '🎯',
      description: 'Classic English tense/lax vowel contrasts',
      unlocked: true,
      performanceMetric: 'score',
      maxScore: 1000,
      symbols: ['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɔ', 'ɛ', 'ɪ', 'ʊ'],
      examplePairs: ['i / ɪ', 'e / ɛ', 'u / ʊ'],
      completionRequirement: {
        minScore: 600
      },
      starThresholds: {
        score: {
          one: 600,
          two: 800,
          three: 900
        }
      }
    },
    medium: {
      id: 'medium',
      name: 'Medium',
      emoji: '🧩',
      description: 'Mix of central vowels and reduced sounds',
      unlocked: false,
      prerequisite: 'easy',
      performanceMetric: 'score',
      maxScore: 1000,
      symbols: ['e', 'o', 'æ', 'ɑ', 'ɔ', 'ə', 'ɛ', 'ɪ', 'ʊ', 'ʌ'],
      examplePairs: ['ɛ / æ', 'ɪ / e', 'ʊ / o'],
      completionRequirement: {
        minScore: 700
      },
      starThresholds: {
        score: {
          one: 700,
          two: 850,
          three: 950
        }
      }
    },
    hard: {
      id: 'hard',
      name: 'Hard',
      emoji: '🧠',
      description: 'Rare vowels and nuanced articulatory shifts',
      unlocked: false,
      prerequisite: 'medium',
      performanceMetric: 'score',
      maxScore: 1000,
      symbols: ['æ', 'œ', 'ɐ', 'ɘ', 'ə', 'ɜ', 'ɞ', 'ɨ', 'ɯ', 'ɶ'],
      examplePairs: ['æ / ɐ', 'ɜ / ə', 'ɨ / ɯ'],
      completionRequirement: {
        minScore: 800
      },
      starThresholds: {
        score: {
          one: 800,
          two: 900,
          three: 1000
        }
      }
    }
  },
  pronunciationCoach: {
    easy: {
      id: 'easy',
      name: 'Easy',
      emoji: '🎤',
      description: 'Practice five cornerstone vowels with guidance',
      unlocked: true,
      performanceMetric: 'score',
      maxScore: 500,
      symbols: ['a', 'e', 'i', 'o', 'u'],
      focusAreas: ['Sustain pure vowels', 'Match pitch and length', 'Keep jaw relaxed'],
      completionRequirement: {
        minScore: 300
      },
      starThresholds: {
        score: {
          one: 300,
          two: 400,
          three: 450
        }
      }
    },
    medium: {
      id: 'medium',
      name: 'Medium',
      emoji: '🎙️',
      description: 'Contrast tense vs lax vowels with accuracy tracking',
      unlocked: false,
      prerequisite: 'easy',
      performanceMetric: 'score',
      maxScore: 500,
      symbols: ['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ'],
      focusAreas: ['Shift tongue height quickly', 'Control rounding vs spread', 'Use minimal jaw movement'],
      completionRequirement: {
        minScore: 350
      },
      starThresholds: {
        score: {
          one: 350,
          two: 425,
          three: 475
        }
      }
    },
    hard: {
      id: 'hard',
      name: 'Hard',
      emoji: '🚀',
      description: 'Advanced feedback on reduced and rhotic vowels',
      unlocked: false,
      prerequisite: 'medium',
      performanceMetric: 'score',
      maxScore: 500,
      symbols: ['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ', 'ə', 'ʌ'],
      focusAreas: ['Maintain clarity when reducing vowels', 'Tune formants with micro adjustments', 'Monitor consistency across takes'],
      completionRequirement: {
        minScore: 400
      },
      starThresholds: {
        score: {
          one: 400,
          two: 450,
          three: 490
        }
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

    const completionRequirement = levelReq.completionRequirement || {}
    const meetsScoreRequirement = completionRequirement.minScore === undefined || (typeof score === 'number' && score >= completionRequirement.minScore)
    const meetsMoveRequirement = completionRequirement.maxMoves === undefined || (typeof moves === 'number' && moves <= completionRequirement.maxMoves)
    const meetsAccuracyRequirement = completionRequirement.minAccuracy === undefined || (typeof accuracy === 'number' && accuracy >= completionRequirement.minAccuracy)
    const meetsRequirements = meetsScoreRequirement && meetsMoveRequirement && meetsAccuracyRequirement

    if (meetsRequirements) {
      // Mark level as completed
      if (!progression.completedLevels.includes(levelId)) {
        progression.completedLevels.push(levelId)
      }

      // Calculate star rating (1-3 stars)
      const starRating = this.calculateStarRating(levelId, { moves, accuracy, score })
      progression.stars[levelId] = Math.max(progression.stars[levelId] || 0, starRating)

      // Update best score
      const metric = levelReq.performanceMetric || (completionRequirement.maxMoves !== undefined ? 'moves' : 'score')
      const currentBest = progression.bestScores[levelId]
      let isNewBest = false

      if (metric === 'score') {
        if (typeof score === 'number' && (currentBest === undefined || score > currentBest)) {
          progression.bestScores[levelId] = score
          isNewBest = true
        }
      } else {
        if (typeof moves === 'number' && (currentBest === undefined || moves < currentBest)) {
          progression.bestScores[levelId] = moves
          isNewBest = true
        }
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
        isNewBest
      }
    }

    return { newUnlocks: [], starRating: 0, completed: false }
  }

  // Calculate star rating based on performance
  calculateStarRating(levelId, { moves, accuracy, score }) {
    const levelConfig = LEVEL_REQUIREMENTS[this.gameKey][levelId]
    if (!levelConfig) return 0

    const completionRequirement = levelConfig.completionRequirement || {}
    const thresholds = levelConfig.starThresholds || {}

    if (thresholds.score && typeof score === 'number') {
      if (score >= thresholds.score.three) return 3
      if (score >= thresholds.score.two) return 2
      if (score >= thresholds.score.one) return 1
      return 0
    }

    if (thresholds.moves && typeof moves === 'number') {
      if (moves <= thresholds.moves.three) return 3
      if (moves <= thresholds.moves.two) return 2
      if (moves <= thresholds.moves.one) return 1
      return 0
    }

    // Fallbacks if explicit thresholds are not defined
    if (completionRequirement.maxMoves !== undefined && typeof moves === 'number') {
      const maxMoves = completionRequirement.maxMoves
      if (moves <= maxMoves * 0.6) return 3
      if (moves <= maxMoves * 0.8) return 2
      if (moves <= maxMoves && (completionRequirement.minAccuracy === undefined || (typeof accuracy === 'number' && accuracy >= completionRequirement.minAccuracy))) return 1
    }

    if (completionRequirement.minScore !== undefined && typeof score === 'number') {
      const base = completionRequirement.minScore
      if (score >= base * 1.3) return 3
      if (score >= base * 1.15) return 2
      if (score >= base) return 1
    }

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
export const symbolSleuthProgressionSystem = new ProgressionSystem('symbolSleuth')
export const soundDetectiveProgressionSystem = new ProgressionSystem('soundDetective')
export const minimalPairsProgressionSystem = new ProgressionSystem('minimalPairs')
export const pronunciationCoachProgressionSystem = new ProgressionSystem('pronunciationCoach')

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

export function getSymbolSleuthProgression() {
  return symbolSleuthProgressionSystem.getProgression()
}

export function isSymbolSleuthLevelUnlocked(levelId) {
  return symbolSleuthProgressionSystem.isLevelUnlocked(levelId)
}

export function completeSymbolSleuthLevel(levelId, score, moves, accuracy = 100) {
  return symbolSleuthProgressionSystem.completeLevel(levelId, score, moves, accuracy)
}

export function getSymbolSleuthLevels() {
  return symbolSleuthProgressionSystem.getAvailableLevels()
}

export function getSoundDetectiveProgression() {
  return soundDetectiveProgressionSystem.getProgression()
}

export function isSoundDetectiveLevelUnlocked(levelId) {
  return soundDetectiveProgressionSystem.isLevelUnlocked(levelId)
}

export function completeSoundDetectiveLevel(levelId, score, moves, accuracy = 100) {
  return soundDetectiveProgressionSystem.completeLevel(levelId, score, moves, accuracy)
}

export function getSoundDetectiveLevels() {
  return soundDetectiveProgressionSystem.getAvailableLevels()
}

export function getMinimalPairsProgression() {
  return minimalPairsProgressionSystem.getProgression()
}

export function isMinimalPairsLevelUnlocked(levelId) {
  return minimalPairsProgressionSystem.isLevelUnlocked(levelId)
}

export function completeMinimalPairsLevel(levelId, score, moves, accuracy = 100) {
  return minimalPairsProgressionSystem.completeLevel(levelId, score, moves, accuracy)
}

export function getMinimalPairsLevels() {
  return minimalPairsProgressionSystem.getAvailableLevels()
}

export function getPronunciationCoachProgression() {
  return pronunciationCoachProgressionSystem.getProgression()
}

export function isPronunciationCoachLevelUnlocked(levelId) {
  return pronunciationCoachProgressionSystem.isLevelUnlocked(levelId)
}

export function completePronunciationCoachLevel(levelId, score, moves, accuracy = 100) {
  return pronunciationCoachProgressionSystem.completeLevel(levelId, score, moves, accuracy)
}

export function getPronunciationCoachLevels() {
  return pronunciationCoachProgressionSystem.getAvailableLevels()
}

export default {
  LEVEL_REQUIREMENTS,
  ProgressionSystem,
  memoryProgressionSystem,
  symbolSleuthProgressionSystem,
  soundDetectiveProgressionSystem,
  minimalPairsProgressionSystem,
  pronunciationCoachProgressionSystem,
  getMemoryProgression,
  isMemoryLevelUnlocked,
  completeMemoryLevel,
  getMemoryLevels,
  getSymbolSleuthProgression,
  isSymbolSleuthLevelUnlocked,
  completeSymbolSleuthLevel,
  getSymbolSleuthLevels,
  getSoundDetectiveProgression,
  isSoundDetectiveLevelUnlocked,
  completeSoundDetectiveLevel,
  getSoundDetectiveLevels,
  getMinimalPairsProgression,
  isMinimalPairsLevelUnlocked,
  completeMinimalPairsLevel,
  getMinimalPairsLevels,
  getPronunciationCoachProgression,
  isPronunciationCoachLevelUnlocked,
  completePronunciationCoachLevel,
  getPronunciationCoachLevels
}
