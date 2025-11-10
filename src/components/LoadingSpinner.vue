<template>
  <div class="loading-spinner" :class="{ inline: inline }">
    <div class="spinner" :class="size"></div>
    <span v-if="text" class="loading-text">{{ text }}</span>
  </div>
</template>

<script setup>
defineProps({
  inline: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
})
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
}

.loading-spinner.inline {
  flex-direction: row;
  padding: 0.5rem;
  gap: 0.5rem;
}

.spinner {
  border: 3px solid rgba(26, 83, 92, 0.1);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.spinner.medium {
  width: 40px;
  height: 40px;
}

.spinner.large {
  width: 60px;
  height: 60px;
  border-width: 4px;
}

.loading-text {
  color: var(--text-light);
  font-weight: 600;
  font-size: 1rem;
}

.loading-spinner.inline .loading-text {
  font-size: 0.9rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>