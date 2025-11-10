<template>
  <!-- This file contains shared game components -->
  <div></div>
</template>

<script setup>
// Shared game components will be defined here as needed
</script>

<script>
// Export shared component functions and utilities
export const GameComponentUtils = {
  // Format score for display
  formatScore(score, total) {
    return `${score}/${total}`
  },

  // Get accuracy color class
  getAccuracyColor(accuracy) {
    if (accuracy >= 80) return 'success'
    if (accuracy >= 60) return 'warning'
    return 'danger'
  },

  // Format time duration
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
  },

  // Generate difficulty options
  getDifficultyOptions() {
    return [
      {
        id: 'easy',
        name: 'Easy',
        description: 'Most common vowels',
        color: '#10b981'
      },
      {
        id: 'medium',
        name: 'Medium',
        description: 'Common + distinct vowels',
        color: '#f59e0b'
      },
      {
        id: 'hard',
        name: 'Hard',
        description: 'All vowels including rare',
        color: '#ef4444'
      }
    ]
  }
}
</script>

<style scoped>
/* Shared game component styles */

/* Difficulty Selection Card */
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

.difficulty-card h3 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.difficulty-card p {
  color: var(--text-light);
  margin: 0;
}

/* Game Action Buttons */
.game-btn {
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-family: 'Manrope', sans-serif;
}

.game-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.game-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.game-btn.primary {
  background: var(--primary-color);
  color: white;
}

.game-btn.primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.game-btn.secondary {
  background: var(--background-color);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.game-btn.secondary:hover:not(:disabled) {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.game-btn.success {
  background: #10b981;
  color: white;
}

.game-btn.success:hover:not(:disabled) {
  background: #059669;
}

.game-btn.danger {
  background: #ef4444;
  color: white;
}

.game-btn.danger:hover:not(:disabled) {
  background: #dc2626;
}

/* Game Cards */
.game-card {
  background: var(--surface-color);
  border-radius: 20px;
  padding: 2rem;
  border: 2px solid var(--border-color);
  margin-bottom: 2rem;
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

.game-header .subtitle {
  font-size: 1.2rem;
  color: var(--text-light);
  margin: 0;
}

/* Score Display */
.score-display {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 1.1rem;
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

/* Feedback Messages */
.feedback-message {
  padding: 1.5rem;
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

.feedback-message.info {
  background: #eff6ff;
  color: #1e40af;
  border: 2px solid #3b82f6;
}

/* Progress Bars */
.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  margin: 0.5rem 0;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-fill.success {
  background: #10b981;
}

.progress-fill.warning {
  background: #f59e0b;
}

.progress-fill.danger {
  background: #ef4444;
}

.progress-fill.primary {
  background: var(--primary-color);
}

/* IPA Symbol Display */
.ipa-symbol {
  font-family: 'Doulos SIL', 'Charis SIL', serif;
  font-weight: bold;
  color: var(--primary-color);
}

.ipa-symbol.large {
  font-size: 3rem;
}

.ipa-symbol.medium {
  font-size: 2rem;
}

.ipa-symbol.small {
  font-size: 1.5rem;
}

/* Audio Controls */
.audio-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.audio-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: scale(1.1);
}

.audio-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.audio-btn.small {
  width: 32px;
  height: 32px;
  font-size: 0.9rem;
}

.audio-btn.medium {
  width: 40px;
  height: 40px;
  font-size: 1rem;
}

.audio-btn.large {
  width: 60px;
  height: 60px;
  font-size: 1.5rem;
}

/* Loading States */
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: var(--text-light);
  font-style: italic;
}

/* Game Grid Layouts */
.game-grid {
  display: grid;
  gap: 1rem;
}

.game-grid.cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.game-grid.cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.game-grid.cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.game-grid.auto-fit {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

/* Responsive Design */
@media (max-width: 768px) {
  .game-header h1 {
    font-size: 2rem;
  }
  
  .game-card {
    padding: 1rem;
  }
  
  .game-grid.cols-2,
  .game-grid.cols-3,
  .game-grid.cols-4 {
    grid-template-columns: 1fr;
  }
  
  .final-score {
    font-size: 2.5rem;
  }
}

@media (max-width: 480px) {
  .game-header h1 {
    font-size: 1.8rem;
  }
  
  .game-btn {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }
  
  .final-score {
    font-size: 2rem;
  }
}
</style>