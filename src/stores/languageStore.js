import { ref } from 'vue'
import { neonService } from '../services/neonService'

// Global language state
const selectedLanguage = ref(null)
const availableLanguages = ref([])
const languagePhonemes = ref([])

// Load selected language from localStorage
function loadSelectedLanguage() {
  const saved = localStorage.getItem('selected-language')
  if (saved) {
    try {
      selectedLanguage.value = JSON.parse(saved)
    } catch (error) {
      console.warn('Failed to load selected language:', error)
      selectedLanguage.value = null
    }
  }
}

// Save selected language to localStorage
function saveSelectedLanguage(language) {
  selectedLanguage.value = language
  localStorage.setItem('selected-language', JSON.stringify(language))
}

// Load available languages from database (only those with all valid audio URLs)
async function loadAvailableLanguages() {
  try {
    const languages = await neonService.getLanguages()
    availableLanguages.value = languages
    return languages
  } catch (error) {
    console.error('Failed to load available languages:', error)
    availableLanguages.value = []
    return []
  }
}

// Load phonemes for the selected language
async function loadLanguagePhonemes() {
  if (!selectedLanguage.value) {
    languagePhonemes.value = []
    return []
  }
  
  try {
    const phonemes = await neonService.getPhonemes(selectedLanguage.value.language_code)
    languagePhonemes.value = phonemes
    return phonemes
  } catch (error) {
    console.error('Failed to load phonemes for language:', selectedLanguage.value.language_code, error)
    languagePhonemes.value = []
    return []
  }
}

// Select a language and load its phonemes
async function selectLanguage(language) {
  saveSelectedLanguage(language)
  await loadLanguagePhonemes()
}

// Initialize the store
async function initializeLanguageStore() {
  loadSelectedLanguage()
  await loadAvailableLanguages()
  
  // If we have a selected language, load its phonemes
  if (selectedLanguage.value) {
    await loadLanguagePhonemes()
  }
}

export {
  selectedLanguage,
  availableLanguages,
  languagePhonemes,
  loadAvailableLanguages,
  loadLanguagePhonemes,
  selectLanguage,
  initializeLanguageStore
}