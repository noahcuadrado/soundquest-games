<template>
  <div v-if="show" class="celebration-overlay" @click="handleClose">
    <div class="celebration-content" @click.stop>
      <!-- Confetti Animation -->
      <div class="confetti-container">
        <div v-for="i in 50" :key="i" class="confetti" :style="getConfettiStyle(i)"></div>
      </div>

      <!-- Celebration Message -->
      <div class="celebration-message">
        <div class="celebration-icon">{{ celebrationData.icon }}</div>
        <h2 class="celebration-title">{{ celebrationData.title }}</h2>
        <p class="celebration-subtitle">{{ celebrationData.message }}</p>
        
        <!-- Score Display -->
        <div v-if="celebrationData.score !== undefined" class="score-celebration">
          <div class="score-circle">
            <div class="score-number">{{ celebrationData.score }}</div>
            <div class="score-label">{{ celebrationData.scoreLabel || 'Score' }}</div>
          </div>
        </div>

        <!-- Achievement Badges -->
        <div v-if="celebrationData.achievements && celebrationData.achievements.length > 0" class="achievements">
          <h3>Achievements Unlocked!</h3>
          <div class="achievement-badges">
            <div 
              v-for="achievement in celebrationData.achievements" 
              :key="achievement.id"
              class="achievement-badge"
            >
              <div class="badge-icon">{{ achievement.icon }}</div>
              <div class="badge-text">{{ achievement.name }}</div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="celebration-actions">
          <button 
            v-if="celebrationData.showPlayAgain" 
            class="celebration-btn primary"
            @click="handlePlayAgain"
          >
            🔄 Play Again
          </button>
          <button 
            v-if="celebrationData.showNextLevel" 
            class="celebration-btn success"
            @click="handleNextLevel"
          >
            ⬆️ Next Level
          </button>
          <button
            v-if="celebrationData.showBackToQuestline"
            class="celebration-btn secondary"
            @click="handleBackToQuestline"
          >
            ← Back to Questline
          </button>
          <button
            v-else
            class="celebration-btn secondary"
            @click="handleClose"
          >
            ← Back to Games
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  celebrationData: {
    type: Object,
    default: () => ({
      icon: '🎉',
      title: 'Congratulations!',
      message: 'Great job!',
      score: undefined,
      scoreLabel: 'Score',
      achievements: [],
      showPlayAgain: true,
      showNextLevel: false
    })
  }
})

const emit = defineEmits(['close', 'play-again', 'next-level', 'back-to-questline'])

// Generate random confetti styles
function getConfettiStyle(index) {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8']
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  const randomDelay = Math.random() * 3
  const randomDuration = 3 + Math.random() * 2
  const randomLeft = Math.random() * 100
  
  return {
    backgroundColor: randomColor,
    left: randomLeft + '%',
    animationDelay: randomDelay + 's',
    animationDuration: randomDuration + 's'
  }
}

function handleClose() {
  emit('close')
}

function handlePlayAgain() {
  emit('play-again')
}

function handleNextLevel() {
  emit('next-level')
}

function handleBackToQuestline() {
  emit('back-to-questline')
}

// Auto-close after 10 seconds if no interaction
let autoCloseTimer = null

onMounted(() => {
  if (props.show) {
    autoCloseTimer = setTimeout(() => {
      handleClose()
    }, 10000)
  }
})

onUnmounted(() => {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
  }
})
</script>

<style scoped>
.celebration-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.celebration-content {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(230, 245, 255, 0.92));
  border-radius: 28px;
  padding: 3.25rem 3rem;
  max-width: 520px;
  width: min(92%, 520px);
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 30px 80px rgba(10, 27, 40, 0.35);
  animation: celebrationBounce 0.6s ease;
  overflow: hidden;
  backdrop-filter: blur(14px);
}

.celebration-content::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at top left, rgba(88, 204, 2, 0.18), transparent 55%),
              radial-gradient(circle at bottom right, rgba(28, 176, 246, 0.18), transparent 45%);
  pointer-events: none;
  z-index: 0;
}

.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: 24px;
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  top: -10px;
  animation: confettiFall linear infinite;
}

.celebration-message {
  position: relative;
  z-index: 1;
}

.celebration-icon {
  width: 78px;
  height: 78px;
  margin: 0 auto 1.5rem;
  border-radius: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 3.1rem;
  background: radial-gradient(circle at top, rgba(255, 255, 255, 0.95), rgba(230, 244, 255, 0.8));
  box-shadow: 0 18px 36px rgba(28, 176, 246, 0.25);
  animation: bounce 2.4s infinite;
}

.celebration-title {
  font-size: 2.6rem;
  color: #154b61;
  margin: 0 0 1rem 0;
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.celebration-subtitle {
  font-size: 1.1rem;
  color: #4f6373;
  margin: 0 0 2.25rem 0;
  line-height: 1.55;
}

.score-celebration {
  margin: 2.25rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.score-circle {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: conic-gradient(from 160deg, #58cc02, #1cb0f6 55%, #58cc02);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  color: #102a43;
  box-shadow: 0 18px 38px rgba(28, 176, 246, 0.32);
  animation: scoreGlow 2.8s ease-in-out infinite alternate;
  overflow: hidden;
}

.score-circle::before {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: radial-gradient(circle at top, #ffffff, #f2fbff 70%);
  box-shadow: inset 0 12px 18px rgba(0, 0, 0, 0.05);
}

.score-circle::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.4), transparent 60%);
  pointer-events: none;
}

.score-number {
  position: relative;
  font-size: 2.6rem;
  font-weight: 800;
  line-height: 1;
  color: #18435f;
  text-shadow: 0 3px 8px rgba(16, 42, 67, 0.15);
  z-index: 1;
}

.score-label {
  position: relative;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 600;
  color: #3a5162;
  margin-top: 0.4rem;
  z-index: 1;
}

.achievements {
  margin: 2rem 0;
}

.achievements h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.achievement-badges {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.achievement-badge {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  border-radius: 12px;
  padding: 1rem;
  min-width: 80px;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  animation: badgeShine 3s ease-in-out infinite;
}

.badge-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.badge-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: #8b5a00;
}

.celebration-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2rem;
}

.celebration-btn {
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-family: 'Manrope', sans-serif;
}

.celebration-btn:hover {
  transform: translateY(-2px);
}

.celebration-btn.primary {
  background: linear-gradient(135deg, #1cb0f6, #136df6);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(28, 176, 246, 0.35);
}

.celebration-btn.primary:hover {
  background: linear-gradient(135deg, #1aa0e3, #125de0);
  box-shadow: 0 14px 28px rgba(28, 160, 226, 0.45);
}

.celebration-btn.success {
  background: #10b981;
  color: white;
}

.celebration-btn.success:hover {
  background: #059669;
}

.celebration-btn.secondary {
  background: var(--background-color);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.celebration-btn.secondary:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes celebrationBounce {
  0% { 
    opacity: 0;
    transform: scale(0.3) translateY(-100px);
  }
  50% { 
    opacity: 1;
    transform: scale(1.05) translateY(0);
  }
  70% { 
    transform: scale(0.95);
  }
  100% { 
    transform: scale(1);
  }
}

@keyframes confettiFall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes scoreGlow {
  0% {
    box-shadow: 0 8px 25px rgba(26, 83, 92, 0.3);
  }
  100% {
    box-shadow: 0 8px 35px rgba(26, 83, 92, 0.6);
  }
}

@keyframes badgeShine {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .celebration-content {
    padding: 2.25rem 1.9rem;
    margin: 1rem;
  }
  
  .celebration-title {
    font-size: 2rem;
  }
  
  .celebration-icon {
    width: 64px;
    height: 64px;
    font-size: 2.6rem;
  }
  
  .score-circle {
    width: 110px;
    height: 110px;
  }
  
  .score-number {
    font-size: 2rem;
  }

  .score-label {
    font-size: 0.75rem;
  }
  
  .celebration-actions {
    flex-direction: column;
  }
  
  .celebration-btn {
    width: 100%;
  }
}
</style>
