/**
 * Achievement System for IPA Games
 * Tracks player progress and unlocks achievements
 */

// Achievement definitions
export const ACHIEVEMENTS = {
  // Universal achievements
  FIRST_GAME: {
    id: 'first_game',
    name: 'Getting Started',
    description: 'Play your first game',
    icon: '🎮',
    condition: (stats) => stats.totalGamesPlayed >= 1
  },
  DEDICATED_PLAYER: {
    id: 'dedicated_player',
    name: 'Dedicated Player',
    description: 'Play 10 games',
    icon: '🏆',
    condition: (stats) => stats.totalGamesPlayed >= 10
  },
  PERFECTIONIST: {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Get 100% accuracy in any game',
    icon: '💎',
    condition: (stats) => stats.bestAccuracy >= 100
  },
  CONSISTENT_PERFORMER: {
    id: 'consistent_performer',
    name: 'Consistent Performer',
    description: 'Maintain 80%+ accuracy across 5 games',
    icon: '⭐',
    condition: (stats) => stats.consistentHighScores >= 5
  },

  // Memory Game achievements
  MEMORY_MASTER: {
    id: 'memory_master',
    name: 'Memory Master',
    description: 'Complete Memory Game on Hard difficulty',
    icon: '🧠',
    condition: (stats) => stats.memoryGame?.hard?.played >= 1
  },
  QUICK_RECALL: {
    id: 'quick_recall',
    name: 'Quick Recall',
    description: 'Complete Memory Game in under 30 moves',
    icon: '⚡',
    condition: (stats) => stats.memoryGame?.bestMoves <= 30
  },

  // Sound Detective achievements
  SOUND_DETECTIVE: {
    id: 'sound_detective',
    name: 'Sound Detective',
    description: 'Perfect score in Sound Detective',
    icon: '🔍',
    condition: (stats) => stats.soundDetective?.bestScore >= 1000
  },
  KEEN_EAR: {
    id: 'keen_ear',
    name: 'Keen Ear',
    description: 'Complete Sound Detective without replaying any sound',
    icon: '👂',
    condition: (stats) => stats.soundDetective?.noReplayRuns >= 1
  },

  // Symbol Sleuth achievements
  SYMBOL_SLEUTH: {
    id: 'symbol_sleuth',
    name: 'Symbol Sleuth',
    description: 'Perfect score in Symbol Sleuth',
    icon: '👁️',
    condition: (stats) => stats.symbolSleuth?.bestScore >= 1000
  },

  // Pronunciation Coach achievements
  PRONUNCIATION_PRO: {
    id: 'pronunciation_pro',
    name: 'Pronunciation Pro',
    description: 'Achieve 90%+ accuracy in Pronunciation Coach',
    icon: '🎤',
    condition: (stats) => stats.pronunciationCoach?.bestAccuracy >= 90
  },
  VOWEL_VIRTUOSO: {
    id: 'vowel_virtuoso',
    name: 'Vowel Virtuoso',
    description: 'Master all vowel positions in Pronunciation Coach',
    icon: '🎵',
    condition: (stats) => stats.pronunciationCoach?.mastered?.length >= 12
  },

  // Sound Sequence achievements
  SEQUENCE_SOLVER: {
    id: 'sequence_solver',
    name: 'Sequence Solver',
    description: 'Perfect score in Sound Sequence',
    icon: '🔢',
    condition: (stats) => stats.soundSequence?.bestScore >= 500
  },
  PATTERN_MASTER: {
    id: 'pattern_master',
    name: 'Pattern Master',
    description: 'Complete all difficulty levels in Sound Sequence',
    icon: '🧩',
    condition: (stats) => {
      const ss = stats.soundSequence || {}
      return ss.easy?.played >= 1 && ss.medium?.played >= 1 && ss.hard?.played >= 1
    }
  },

  // Minimal Pairs achievements
  PAIRS_EXPERT: {
    id: 'pairs_expert',
    name: 'Pairs Expert',
    description: 'Perfect score in Minimal Pairs',
    icon: '⚖️',
    condition: (stats) => stats.minimalPairs?.bestScore >= 1000
  },
  DISTINCTION_MASTER: {
    id: 'distinction_master',
    name: 'Distinction Master',
    description: 'Complete Minimal Pairs on Hard difficulty',
    icon: '🎯',
    condition: (stats) => stats.minimalPairs?.hard?.played >= 1
  },

  // Combo achievements
  GAME_EXPLORER: {
    id: 'game_explorer',
    name: 'Game Explorer',
    description: 'Try all 6 games',
    icon: '🗺️',
    condition: (stats) => {
      const games = ['memoryGame', 'soundDetective', 'symbolSleuth', 'pronunciationCoach', 'soundSequence', 'minimalPairs']
      return games.every(game => stats[game]?.played >= 1)
    }
  },
  IPA_CHAMPION: {
    id: 'ipa_champion',
    name: 'IPA Champion',
    description: 'Achieve high scores in all games',
    icon: '👑',
    condition: (stats) => {
      const games = ['memoryGame', 'soundDetective', 'symbolSleuth', 'pronunciationCoach', 'soundSequence', 'minimalPairs']
      return games.every(game => (stats[game]?.bestScore || 0) >= 800)
    }
  }
}

// Achievement system class
export class AchievementSystem {
  constructor() {
    this.storageKey = 'ipaGameAchievements'
    this.statsKey = 'ipaGameStats'
  }

  // Get all unlocked achievements
  getUnlockedAchievements() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '[]')
    } catch (error) {
      console.error('Error loading achievements:', error)
      return []
    }
  }

  // Get comprehensive game statistics
  getGameStats() {
    try {
      const stats = JSON.parse(localStorage.getItem(this.statsKey) || '{}')
      
      // Calculate derived stats
      stats.totalGamesPlayed = this.calculateTotalGamesPlayed(stats)
      stats.bestAccuracy = this.calculateBestAccuracy(stats)
      stats.consistentHighScores = this.calculateConsistentHighScores(stats)
      
      return stats
    } catch (error) {
      console.error('Error loading game stats:', error)
      return {}
    }
  }

  // Update game statistics
  updateGameStats(gameKey, gameData) {
    try {
      const stats = this.getGameStats()
      
      if (!stats[gameKey]) {
        stats[gameKey] = {}
      }
      
      // Merge new data
      Object.assign(stats[gameKey], gameData)
      
      localStorage.setItem(this.statsKey, JSON.stringify(stats))
      
      // Check for new achievements
      return this.checkAchievements(stats)
    } catch (error) {
      console.error('Error updating game stats:', error)
      return []
    }
  }

  // Check for newly unlocked achievements
  checkAchievements(stats = null) {
    if (!stats) {
      stats = this.getGameStats()
    }
    
    const unlockedAchievements = this.getUnlockedAchievements()
    const unlockedIds = new Set(unlockedAchievements.map(a => a.id))
    const newAchievements = []
    
    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (!unlockedIds.has(achievement.id) && achievement.condition(stats)) {
        const newAchievement = {
          ...achievement,
          unlockedAt: new Date().toISOString()
        }
        
        unlockedAchievements.push(newAchievement)
        newAchievements.push(newAchievement)
      }
    }
    
    if (newAchievements.length > 0) {
      localStorage.setItem(this.storageKey, JSON.stringify(unlockedAchievements))
    }
    
    return newAchievements
  }

  // Calculate total games played across all games
  calculateTotalGamesPlayed(stats) {
    let total = 0
    const games = ['memoryGame', 'soundDetective', 'symbolSleuth', 'pronunciationCoach', 'soundSequence', 'minimalPairs']
    
    for (const game of games) {
      if (stats[game]) {
        // Sum up plays across all difficulties
        for (const [key, value] of Object.entries(stats[game])) {
          if (typeof value === 'object' && value.played) {
            total += value.played
          } else if (key === 'played') {
            total += value
          }
        }
      }
    }
    
    return total
  }

  // Calculate best accuracy across all games
  calculateBestAccuracy(stats) {
    let bestAccuracy = 0
    const games = ['memoryGame', 'soundDetective', 'symbolSleuth', 'pronunciationCoach', 'soundSequence', 'minimalPairs']
    
    for (const game of games) {
      if (stats[game]?.bestAccuracy) {
        bestAccuracy = Math.max(bestAccuracy, stats[game].bestAccuracy)
      }
      
      // Check difficulty-specific accuracies
      if (stats[game]) {
        for (const difficulty of ['easy', 'medium', 'hard']) {
          if (stats[game][difficulty]?.bestAccuracy) {
            bestAccuracy = Math.max(bestAccuracy, stats[game][difficulty].bestAccuracy)
          }
        }
      }
    }
    
    return bestAccuracy
  }

  // Calculate consistent high scores (80%+ accuracy)
  calculateConsistentHighScores(stats) {
    // This would need to be tracked per game session
    // For now, return a placeholder based on total games
    return Math.floor(this.calculateTotalGamesPlayed(stats) * 0.7)
  }

  // Get celebration data based on game performance
  getCelebrationData(gameKey, score, accuracy, isNewBest = false, difficulty = null) {
    const newAchievements = this.updateGameStats(gameKey, {
      lastScore: score,
      lastAccuracy: accuracy,
      bestScore: Math.max(score, this.getGameStats()[gameKey]?.bestScore || 0),
      bestAccuracy: Math.max(accuracy, this.getGameStats()[gameKey]?.bestAccuracy || 0),
      played: (this.getGameStats()[gameKey]?.played || 0) + 1
    })

    // Determine celebration level
    let celebrationLevel = 'good'
    let icon = '🎉'
    let title = 'Well Done!'
    let message = 'Keep practicing to improve!'

    if (accuracy >= 95) {
      celebrationLevel = 'perfect'
      icon = '🏆'
      title = 'Perfect!'
      message = 'Outstanding performance!'
    } else if (accuracy >= 85) {
      celebrationLevel = 'excellent'
      icon = '⭐'
      title = 'Excellent!'
      message = 'Great job on that score!'
    } else if (accuracy >= 70) {
      celebrationLevel = 'good'
      icon = '👍'
      title = 'Good Job!'
      message = 'You\'re making progress!'
    } else {
      celebrationLevel = 'encouraging'
      icon = '💪'
      title = 'Keep Going!'
      message = 'Practice makes perfect!'
    }

    return {
      icon,
      title,
      message,
      score: `${accuracy}%`,
      scoreLabel: 'Accuracy',
      achievements: newAchievements,
      showPlayAgain: true,
      showNextLevel: difficulty === 'easy' && accuracy >= 80,
      celebrationLevel,
      isNewBest
    }
  }

  // Reset all achievements (for testing)
  resetAchievements() {
    localStorage.removeItem(this.storageKey)
    localStorage.removeItem(this.statsKey)
  }

  // Get achievement progress
  getAchievementProgress() {
    const stats = this.getGameStats()
    const progress = {}
    
    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      progress[achievement.id] = {
        ...achievement,
        unlocked: achievement.condition(stats),
        progress: this.calculateAchievementProgress(achievement, stats)
      }
    }
    
    return progress
  }

  // Calculate progress towards an achievement (0-100)
  calculateAchievementProgress(achievement, stats) {
    // This is a simplified version - could be more sophisticated
    try {
      if (achievement.condition(stats)) {
        return 100
      }
      
      // Basic progress calculation based on achievement type
      if (achievement.id.includes('total_games')) {
        return Math.min(100, (stats.totalGamesPlayed / 10) * 100)
      }
      
      return 0
    } catch (error) {
      return 0
    }
  }
}

// Export singleton instance
export const achievementSystem = new AchievementSystem()

// Helper functions
export function getCelebrationForScore(gameKey, score, accuracy, difficulty = null) {
  return achievementSystem.getCelebrationData(gameKey, score, accuracy, false, difficulty)
}

export function getUnlockedAchievements() {
  return achievementSystem.getUnlockedAchievements()
}

export function checkForNewAchievements() {
  return achievementSystem.checkAchievements()
}

export default {
  ACHIEVEMENTS,
  AchievementSystem,
  achievementSystem,
  getCelebrationForScore,
  getUnlockedAchievements,
  checkForNewAchievements
}