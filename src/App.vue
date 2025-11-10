<template>
  <div id="app">
    <!-- This component is no longer used - RootApp.vue is the main component -->
    <!-- Redirecting to game selection... -->
    <div class="redirect-message">
      <h1>SoundQuest IPA Game Center</h1>
      <p>Redirecting to games...</p>
    </div>
  </div>
</template>

<script setup>
// This component is no longer used in the game-focused version
// RootApp.vue is now the main component with Vue Router
console.log('App.vue loaded - this should not be used in the game version')
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--surface-color) 0%, #f5e8d8 100%);
}

.redirect-message {
  text-align: center;
  padding: 2rem;
  background: var(--surface-color);
  border-radius: 16px;
  border: 2px solid var(--border-color);
}

.redirect-message h1 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-family: 'Manrope', sans-serif;
}

.redirect-message p {
  color: var(--text-light);
}
</style>
