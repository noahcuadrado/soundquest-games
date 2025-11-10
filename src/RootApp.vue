<template>
  <div id="app">
    <header class="app-header">
      <div class="logo">
        <img src="/soundquest-logo.svg" alt="SoundQuest" />
      </div>
      
      <!-- Language Display in Header -->
      <div class="header-language-display" v-if="selectedLanguage">
        <span class="language-name">{{ selectedLanguage.language_name }}</span>
        <button @click="changeLanguage" class="change-language-btn">Change</button>
      </div>
      
      <nav class="app-nav" v-if="showBackButton">
        <button @click="goHome" class="back-btn">
          ← Back to Games
        </button>
      </nav>
    </header>

    <main class="app-main">
      <router-view />
    </main>

    <footer class="app-footer">
      <p>&copy; 2024 SoundQuest. Tune in before you speak.</p>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { selectedLanguage } from './stores/languageStore'

const route = useRoute()
const router = useRouter()

// Show back button on all pages except game selection
const showBackButton = computed(() => {
  return route.name !== 'GameSelection'
})

function goHome() {
  router.push('/')
}

function changeLanguage() {
  // Clear the selected language and navigate to home
  localStorage.removeItem('selected-language')
  selectedLanguage.value = null
  router.push('/')
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 1.5rem 2rem;
  background: var(--surface-color);
  border-bottom: 2px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(26, 83, 92, 0.1);
  gap: 1rem;
}

.logo {
  display: flex;
  align-items: center;
  margin: 0;
}

.logo img {
  height: 50px;
  width: auto;
  display: block;
  /* Tint white SVG to primary color #1A535C */
  filter: brightness(0) saturate(100%) invert(26%) sepia(25%) saturate(1234%) hue-rotate(145deg) brightness(95%) contrast(92%);
}

.header-language-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: var(--text-primary);
  flex: 1;
  justify-content: flex-end;
}

.header-language-display .language-name {
  font-weight: 600;
  color: var(--primary-color);
  font-family: 'Manrope', sans-serif;
}

.header-language-display .change-language-btn {
  background: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Manrope', sans-serif;
}

.header-language-display .change-language-btn:hover {
  background: var(--primary-color);
  color: white;
}

.app-nav {
  display: flex;
  align-items: center;
}

.back-btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-color);
  background: transparent;
  border: 2px solid var(--primary-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Manrope', sans-serif;
}

.back-btn:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 83, 92, 0.3);
}

.app-main {
  flex: 1;
  background: linear-gradient(135deg, var(--surface-color) 0%, #f5e8d8 100%);
  position: relative;
}

.app-main::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(26, 83, 92, 0.02) 2px,
      rgba(26, 83, 92, 0.02) 4px
    );
  pointer-events: none;
  opacity: 0.5;
}

.app-footer {
  padding: 1.5rem 2rem;
  background: var(--surface-color);
  border-top: 2px solid var(--border-color);
  text-align: center;
  color: var(--text-light);
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .app-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .back-btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}
</style>