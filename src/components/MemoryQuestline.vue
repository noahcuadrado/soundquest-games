<template>
  <div class="memory-questline">
    <header class="questline-header">
      <button @click="goBack" class="back-btn">
        <span class="back-icon"><</span>
        Back to Games
      </button>
      <div class="header-content">
        <h1>IPA Memory Questline</h1>
        <p class="subtitle">Follow the Duolingo-inspired path and unlock new IPA memory skills one level at a time.</p>
      </div>
    </header>

    <div class="questline-container">
      <section class="progress-panel">
        <div class="panel-header">
          <div class="panel-icon">🎯</div>
          <div class="panel-copy">
            <h2>Quest Progress</h2>
            <p>Keep the streak alive to earn more rewards.</p>
          </div>
        </div>

        <div class="progress-stats">
          <div class="stat">
            <span class="stat-number">{{ completedLevels }}</span>
            <span class="stat-label">Completed</span>
          </div>
          <div class="stat">
            <span class="stat-number">{{ totalStars }}</span>
            <span class="stat-label">Stars</span>
          </div>
          <div class="stat">
            <span class="stat-number">{{ progressPercent }}%</span>
            <span class="stat-label">Progress</span>
          </div>
        </div>

        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </section>

      <section class="questline-map">
        <div class="map-track">
          <div class="track-background"></div>
          <div class="track-progress" :style="{ height: progressPercent + '%' }"></div>
        </div>

        <div
          v-for="(level, index) in levels"
          :key="level.id"
          class="map-node"
          :class="[
            `position-${getNodeAlignment(index)}`,
            {
              'is-locked': !level.unlocked,
              'is-completed': level.completed,
              'is-current': level.unlocked && !level.completed && isNextLevel(level, index)
            }
          ]"
        >
          <div class="node-content">
            <div class="node-circle" @click="selectLevel(level)">
              <span v-if="!level.unlocked" class="node-icon">🔒</span>
              <span v-else-if="level.completed" class="node-icon">🌟</span>
              <span v-else class="node-index">{{ index + 1 }}</span>
            </div>

            <div class="node-card">
              <div class="card-header">
                <span class="level-name">{{ level.name }}</span>
                <div v-if="level.completed" class="level-stars">
                  <span
                    v-for="star in 3"
                    :key="star"
                    class="star"
                    :class="{ filled: star <= level.stars }"
                  >
                    ★
                  </span>
                </div>
              </div>

              <p class="level-description">{{ level.description }}</p>

              <div class="card-footer">
                <span v-if="level.completed" class="best-score">Best: {{ level.bestScore }} moves</span>
                <button
                  v-if="level.unlocked"
                  type="button"
                  class="play-level-btn"
                  :class="{ primary: level.unlocked && !level.completed && isNextLevel(level, index) }"
                  @click="selectLevel(level)"
                >
                  {{ level.completed ? 'Replay' : 'Start' }}
                </button>
                <span v-else class="locked-message">
                  Complete {{ getPreviousLevelName(index) }} to unlock
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMemoryLevels, memoryProgressionSystem } from '../utils/progressionSystem'

const router = useRouter()
const levels = ref([])

const completedLevels = computed(() => {
  return levels.value.filter(level => level.completed).length
})

const totalStars = computed(() => {
  return levels.value.reduce((total, level) => total + (level.stars || 0), 0)
})

const overallProgress = computed(() => {
  return memoryProgressionSystem.getOverallProgress()
})

const progressPercent = computed(() => {
  const progress = Number(overallProgress.value ?? 0)

  if (!Number.isFinite(progress)) {
    return 0
  }

  return Math.min(100, Math.max(0, Math.round(progress)))
})

function isNextLevel(level, index) {
  const uncompletedUnlocked = levels.value.filter(l => l.unlocked && !l.completed)
  return uncompletedUnlocked.length > 0 && uncompletedUnlocked[0].id === level.id
}

function getPreviousLevelName(index) {
  return index > 0 ? levels.value[index - 1].name : ''
}

function getNodeAlignment(index) {
  if (index === 0) {
    return 'center'
  }

  return index % 2 === 0 ? 'left' : 'right'
}

function selectLevel(level) {
  if (!level.unlocked) {
    return
  }

  router.push({
    path: '/memory-game',
    query: { level: level.id }
  })
}

function goBack() {
  router.push('/')
}

function loadLevels() {
  levels.value = getMemoryLevels()
}

onMounted(() => {
  loadLevels()
})
</script>

<style scoped>
.memory-questline {
  min-height: 100vh;
  padding: 2.5rem 1.5rem 4rem;
  background: linear-gradient(180deg, #f0f8ff 0%, #ffffff 45%, #f7f9ff 100%);
}

.questline-header {
  max-width: 960px;
  margin: 0 auto 2.5rem auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.back-btn {
  align-self: flex-start;
  background: transparent;
  border: none;
  color: #2f3d46;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border-radius: 999px;
  transition: background 0.2s ease, transform 0.2s ease;
}

.back-icon {
  font-size: 1.1rem;
  font-weight: 700;
  transform: translateY(-1px);
}

.back-btn:hover {
  background: rgba(44, 62, 80, 0.08);
  transform: translateX(-2px);
}

.header-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.header-content h1 {
  font-size: 2.75rem;
  font-weight: 800;
  color: #1a3a5a;
  margin: 0;
}

.subtitle {
  margin: 0;
  font-size: 1.05rem;
  color: #5f6f7d;
  max-width: 520px;
  align-self: center;
}

.questline-container {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.progress-panel {
  background: #ffffff;
  border-radius: 28px;
  padding: 1.75rem 2rem;
  box-shadow: 0 18px 36px rgba(17, 37, 52, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.panel-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(145deg, #58cc02, #45b800);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  box-shadow: 0 12px 20px rgba(88, 204, 2, 0.28);
}

.panel-copy h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #23405c;
  font-weight: 700;
}

.panel-copy p {
  margin: 0.15rem 0 0 0;
  color: #6a7a88;
  font-size: 0.95rem;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.stat {
  flex: 1;
  background: #f5f9ff;
  border-radius: 20px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1a3a5a;
}

.stat-label {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #7f8c99;
}

.progress-bar {
  position: relative;
  height: 14px;
  background: #e6ecf5;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #58cc02 0%, #1cb0f6 100%);
  transition: width 0.4s ease;
}

.questline-map {
  position: relative;
  padding: 3rem 0 4rem;
}

.map-track {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 12px;
  transform: translateX(-50%);
}

.track-background,
.track-progress {
  position: absolute;
  border-radius: 999px;
  inset: 0;
}

.track-background {
  background: linear-gradient(180deg, rgba(152, 170, 199, 0.5) 0%, rgba(116, 140, 177, 0.7) 100%);
}

.track-progress {
  top: 0;
  bottom: auto;
  background: linear-gradient(180deg, #58cc02 0%, #2fb86d 100%);
  transition: height 0.4s ease;
  height: 0;
}

.map-node {
  position: relative;
  display: flex;
  width: 100%;
  margin: 3.5rem 0;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 1.75rem;
  position: relative;
}

.position-left {
  justify-content: flex-start;
  padding-right: 50%;
}

.position-left .node-content {
  flex-direction: row-reverse;
}

.position-right {
  justify-content: flex-end;
  padding-left: 50%;
}

.position-center {
  justify-content: center;
}

.position-center .node-content {
  flex-direction: column;
  gap: 1.25rem;
}

.node-circle {
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: linear-gradient(145deg, #ffe066, #f8b700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 2rem;
  color: #384152;
  cursor: pointer;
  box-shadow: 0 18px 28px rgba(248, 183, 0, 0.35);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.node-circle::after {
  content: '';
  position: absolute;
  bottom: -16px;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 18px;
  border-radius: 50%;
  background: rgba(40, 57, 76, 0.2);
  filter: blur(6px);
  z-index: -1;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.map-node.is-locked .node-circle {
  background: linear-gradient(145deg, #d7dee8, #c1c9d4);
  color: #7b8794;
  cursor: default;
  box-shadow: none;
}

.map-node.is-locked .node-circle::after {
  opacity: 0.45;
}

.map-node.is-completed .node-circle {
  background: linear-gradient(145deg, #3fcd8d, #2db37b);
  color: #ffffff;
  box-shadow: 0 18px 32px rgba(47, 179, 123, 0.35);
}

.map-node.is-current .node-circle {
  box-shadow: 0 18px 32px rgba(28, 176, 246, 0.35);
  animation: float 2s ease-in-out infinite;
}

.node-index {
  font-family: 'Manrope', sans-serif;
}

.node-icon {
  font-size: 2.1rem;
}

.node-card {
  min-width: 260px;
  max-width: 380px;
  padding: 1.1rem 1.5rem;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 16px 24px rgba(20, 42, 66, 0.12);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.map-node.is-locked .node-card {
  opacity: 0.65;
}

.map-node.is-current .node-card {
  transform: translateY(-4px);
  box-shadow: 0 22px 32px rgba(28, 176, 246, 0.16);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.level-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: #18314f;
  margin: 0;
}

.level-description {
  margin: 0;
  color: #5a6b78;
  font-size: 0.95rem;
  line-height: 1.5;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.best-score {
  font-size: 0.85rem;
  font-weight: 600;
  color: #2db37b;
}

.play-level-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background: #1cb0f6;
  color: #ffffff;
  border: none;
  border-radius: 999px;
  padding: 0.55rem 1.6rem;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

.play-level-btn.primary {
  background: #58cc02;
  box-shadow: 0 12px 24px rgba(88, 204, 2, 0.35);
}

.play-level-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 22px rgba(28, 176, 246, 0.28);
}

.play-level-btn.primary:hover {
  box-shadow: 0 14px 26px rgba(88, 204, 2, 0.42);
}

.locked-message {
  font-size: 0.85rem;
  color: #7f90a0;
}

.level-stars {
  display: flex;
  gap: 0.25rem;
}

.star {
  font-size: 0.9rem;
  color: #d0d6e0;
}

.star.filled {
  color: #ffc400;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@media (max-width: 900px) {
  .memory-questline {
    padding: 2rem 1rem 3.5rem;
  }

  .progress-panel {
    padding: 1.5rem;
  }

  .progress-stats {
    flex-wrap: wrap;
  }

  .stat {
    min-width: 160px;
  }

  .map-node {
    margin: 3rem 0;
  }

  .node-card {
    min-width: 240px;
  }
}

@media (max-width: 680px) {
  .questline-header {
    align-items: center;
    text-align: center;
  }

  .back-btn {
    align-self: flex-start;
  }

  .questline-map {
    padding: 2.5rem 0 3rem;
  }

  .map-track {
    left: 36px;
    width: 10px;
  }

  .map-node {
    justify-content: flex-start;
    padding-left: 88px;
    margin: 2.75rem 0;
  }

  .position-left,
  .position-right,
  .position-center {
    justify-content: flex-start;
    padding: 0;
  }

  .node-content {
    flex-direction: row;
    gap: 1.15rem;
  }

  .node-card {
    min-width: 0;
    width: clamp(240px, 72vw, 320px);
    padding: 1rem 1.2rem;
    border-radius: 20px;
    box-shadow: 0 14px 22px rgba(20, 42, 66, 0.12);
  }

  .node-circle {
    width: 74px;
    height: 74px;
    font-size: 1.7rem;
    box-shadow: 0 14px 24px rgba(248, 183, 0, 0.28);
  }

  .node-circle::after {
    width: 54px;
    height: 14px;
    bottom: -12px;
  }

  .node-icon {
    font-size: 1.8rem;
  }

  .card-header {
    align-items: flex-start;
  }

  .level-name {
    font-size: 1.1rem;
  }

  .level-stars {
    gap: 0.2rem;
  }

  .level-description {
    font-size: 0.9rem;
  }

  .card-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 0.65rem;
  }

  .best-score {
    font-size: 0.8rem;
  }

  .play-level-btn {
    width: 100%;
    text-align: center;
    padding: 0.6rem 1rem;
  }

  .locked-message {
    width: 100%;
    text-align: left;
    font-size: 0.8rem;
    line-height: 1.4;
  }
}

@media (max-width: 520px) {
  .memory-questline {
    padding: 1.75rem 0.85rem 3rem;
  }

  .header-content h1 {
    font-size: 2.2rem;
  }

  .subtitle {
    font-size: 0.95rem;
  }

  .progress-panel {
    padding: 1.35rem 1.25rem;
    border-radius: 24px;
    gap: 1.25rem;
  }

  .progress-stats {
    flex-direction: column;
  }

  .map-track {
    left: 26px;
  }

  .map-node {
    padding-left: 70px;
    margin: 2.35rem 0;
  }

  .node-card {
    width: min(100%, 300px);
    padding: 0.95rem 1.05rem;
  }

  .card-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.55rem;
  }

  .play-level-btn {
    align-self: stretch;
    font-size: 0.9rem;
  }

  .node-circle {
    width: 66px;
    height: 66px;
    font-size: 1.5rem;
  }

  .node-circle::after {
    width: 46px;
    height: 12px;
    bottom: -10px;
  }
}
</style>
