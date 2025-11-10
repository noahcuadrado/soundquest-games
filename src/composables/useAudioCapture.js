import { ref, onUnmounted } from 'vue'
import { formantAnalyzer } from '../services/formantAnalyzer.js'

export function useAudioCapture() {
  const isInitialized = ref(false)
  const isAudioContextReady = ref(false)
  const isRecording = ref(false)
  const error = ref(null)
  const currentFormants = ref({ F1: 0, F2: 0 })
  const audioLevel = ref(0)
  const gateOpen = ref(false)
  const trail = ref([])

  let animationFrameId = null

  // Request microphone permission
  async function requestMicrophonePermission() {
    try {
      error.value = null
      await formantAnalyzer.initialize()
      isInitialized.value = true
      isAudioContextReady.value = true
      return true
    } catch (err) {
      console.error('Microphone permission error:', err)
      error.value = err.message || 'Microphone access denied'
      isInitialized.value = false
      isAudioContextReady.value = false
      return false
    }
  }

  // Start audio context (iOS compatibility)
  async function startAudioContext() {
    try {
      if (!isInitialized.value) {
        await requestMicrophonePermission()
      }
      
      await formantAnalyzer.resumeAudioContext()
      isAudioContextReady.value = true
      error.value = null
      return true
    } catch (err) {
      console.error('Audio context error:', err)
      error.value = err.message || 'Failed to start audio context'
      isAudioContextReady.value = false
      return false
    }
  }

  // Start recording and analysis
  async function startRecording() {
    try {
      if (!isAudioContextReady.value) {
        await startAudioContext()
      }

      isRecording.value = true
      error.value = null
      
      // Start the analysis loop
      startAnalysisLoop()
      
      return true
    } catch (err) {
      console.error('Recording start error:', err)
      error.value = err.message || 'Failed to start recording'
      isRecording.value = false
      return false
    }
  }

  // Stop recording
  function stopRecording() {
    isRecording.value = false
    
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  // Analysis loop
  function startAnalysisLoop() {
    function analyze() {
      if (!isRecording.value) return

      try {
        const result = formantAnalyzer.getCurrentFormantsWithLevel()
        
        // Update reactive values
        currentFormants.value = {
          F1: result.F1,
          F2: result.F2
        }
        audioLevel.value = result.audioLevel
        gateOpen.value = result.gateOpen
        trail.value = result.trail || []

      } catch (err) {
        console.error('Analysis error:', err)
        error.value = err.message || 'Analysis failed'
      }

      if (isRecording.value) {
        animationFrameId = requestAnimationFrame(analyze)
      }
    }

    analyze()
  }

  // Cleanup function
  function cleanup() {
    stopRecording()
    formantAnalyzer.cleanup()
    isInitialized.value = false
    isAudioContextReady.value = false
    error.value = null
    currentFormants.value = { F1: 0, F2: 0 }
    audioLevel.value = 0
    gateOpen.value = false
    trail.value = []
  }

  // Cleanup on unmount
  onUnmounted(() => {
    cleanup()
  })

  return {
    // State
    isInitialized,
    isAudioContextReady,
    isRecording,
    error,
    currentFormants,
    audioLevel,
    gateOpen,
    trail,

    // Methods
    requestMicrophonePermission,
    startAudioContext,
    startRecording,
    stopRecording,
    cleanup
  }
}