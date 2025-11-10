<template>
  <div>
    <slot v-if="!error"></slot>
    <div v-else class="error-boundary">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p class="error-message">{{ error.message }}</p>
        <p class="error-details">We've encountered an unexpected error. Please try refreshing the page.</p>
        <div class="error-actions">
          <button @click="resetError" class="retry-btn">Try Again</button>
          <button @click="goHome" class="home-btn">Back to Games</button>
        </div>
        <details v-if="showDetails" class="error-stack">
          <summary>Technical Details</summary>
          <pre>{{ error.stack }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const error = ref(null)
const showDetails = ref(false)

onErrorCaptured((err) => {
  error.value = err
  console.error('ErrorBoundary caught error:', err)
  return false // Prevent error from propagating
})

function resetError() {
  error.value = null
  window.location.reload()
}

function goHome() {
  router.push('/')
  error.value = null
}

// Expose method to manually set error (for testing)
function setError(err) {
  error.value = err
}

defineExpose({ setError })
</script>

<style scoped>
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--surface-color) 0%, #f5e8d8 100%);
  padding: 2rem;
}

.error-content {
  background: var(--surface-color);
  border: 3px solid var(--border-color);
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 8px 25px rgba(26, 83, 92, 0.2);
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-content h2 {
  color: var(--primary-color);
  margin: 0 0 1rem 0;
  font-size: 2rem;
  font-family: 'Manrope', sans-serif;
}

.error-message {
  color: var(--error-color, #e74c3c);
  font-weight: 600;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.error-details {
  color: var(--text-light);
  margin-bottom: 2rem;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.retry-btn, .home-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Manrope', sans-serif;
}

.retry-btn {
  background: var(--primary-color);
  color: white;
}

.retry-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.home-btn {
  background: var(--text-light);
  color: white;
}

.home-btn:hover {
  background: #555;
  transform: translateY(-2px);
}

.error-stack {
  text-align: left;
  margin-top: 2rem;
}

.error-stack summary {
  color: var(--text-light);
  cursor: pointer;
  margin-bottom: 1rem;
}

.error-stack pre {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.8rem;
  color: #666;
  border: 1px solid #e9ecef;
}

@media (max-width: 640px) {
  .error-content {
    padding: 2rem;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .retry-btn, .home-btn {
    width: 100%;
  }
}
</style>