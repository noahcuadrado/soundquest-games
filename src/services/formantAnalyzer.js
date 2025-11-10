/**
 * Advanced Formant Analyzer
 * Based on the reference implementation from elizabethzhenliu/vv-test
 * Provides improved formant detection with gate-based audio processing
 */

// Analysis parameters
const FFT_SIZE = 4096
const SMOOTHING = 0.2
const ALPHA = 0.2
const F1_BAND = [200, 1200]
const F2_MIN = 900
const F2_MAX = 2500
const F2_GAP_FROM_F1 = 200

// Gate parameters for audio activity detection
const GATE_ON = 0.02
const GATE_OFF = 0.017
const OPEN_FRAMES = 3
const CLOSE_FRAMES = 5

// Median filtering window
const MED_WIN = 3

class FormantAnalyzer {
  constructor() {
    this.audioContext = null
    this.analyser = null
    this.mediaStream = null
    this.isRunning = false
    
    // Audio processing state
    this.gateOpen = false
    this.openCount = 0
    this.closeCount = 0
    
    // Formant tracking
    this.prevF1 = null
    this.prevF2 = null
    this.ringF1 = []
    this.ringF2 = []
    
    // Buffers
    this.timeBuf = null
    this.freqDb = null
    this.sampleRateCache = 44100
    
    // Current values
    this.currentF1 = 0
    this.currentF2 = 0
    this.currentRMS = 0
    
    // Trail for visualization
    this.trail = []
    this.trailTTL = 1200
    this.trailMax = 200
    this.trailMinDt = 40
    this.lastTrailAt = 0
  }

  async initialize() {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          echoCancellation: false, 
          noiseSuppression: false, 
          autoGainControl: false 
        },
        video: false
      })

      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // iOS Safari requires user gesture to start AudioContext
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Set up audio processing chain
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = FFT_SIZE
      this.analyser.smoothingTimeConstant = SMOOTHING
      source.connect(this.analyser)

      this.isRunning = true
      this.resetState()
      
      return true
    } catch (error) {
      console.error('Failed to initialize formant analyzer:', error)
      throw error
    }
  }

  resetState() {
    this.gateOpen = false
    this.openCount = 0
    this.closeCount = 0
    this.prevF1 = null
    this.prevF2 = null
    this.ringF1 = []
    this.ringF2 = []
    this.trail = []
    this.lastTrailAt = 0
  }

  cleanup() {
    this.isRunning = false
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
    this.analyser = null
    this.resetState()
  }

  ensureBuffers() {
    if (!this.analyser) return

    if (!this.timeBuf || this.timeBuf.length !== this.analyser.fftSize) {
      this.timeBuf = new Float32Array(this.analyser.fftSize)
    }
    
    const N = this.analyser.frequencyBinCount
    if (!this.freqDb || this.freqDb.length !== N) {
      this.freqDb = new Float32Array(N)
    }
    
    if (this.audioContext) {
      this.sampleRateCache = this.audioContext.sampleRate || this.sampleRateCache
    }
  }

  pushAndMedian(ring, value) {
    ring.push(value)
    if (ring.length > MED_WIN) ring.shift()
    
    const sorted = ring.slice().sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    
    if (sorted.length % 2 === 1) {
      return sorted[mid]
    }
    return 0.5 * (sorted[mid - 1] + sorted[mid])
  }

  smoothMagnitudesLinear(mags) {
    const out = new Float32Array(mags.length)
    const k = 3
    
    for (let i = 0; i < mags.length; i++) {
      let sum = 0
      let count = 0
      
      for (let j = -k; j <= k; j++) {
        const idx = i + j
        if (idx >= 0 && idx < mags.length) {
          sum += mags[idx]
          count++
        }
      }
      
      out[i] = sum / count
    }
    
    return out
  }

  findPeaksProminence(mags, binHz, bandMin, bandMax) {
    const N = mags.length
    const iMin = Math.max(1, Math.floor(bandMin / binHz))
    const iMax = Math.min(N - 2, Math.ceil(bandMax / binHz))

    const peaks = []
    
    for (let i = iMin; i <= iMax; i++) {
      const m = mags[i]
      if (m <= mags[i - 1] || m <= mags[i + 1]) continue

      // Find prominence
      let left = i - 1
      let leftMin = mags[left]
      while (left > iMin && mags[left - 1] < mags[left]) {
        left--
        leftMin = Math.min(leftMin, mags[left])
      }
      
      let right = i + 1
      let rightMin = mags[right]
      while (right < iMax && mags[right + 1] < mags[right]) {
        right++
        rightMin = Math.min(rightMin, mags[right])
      }

      const base = Math.max(leftMin, rightMin)
      const prominence = m - base
      peaks.push({ i, amp: m, prominence })
    }
    
    peaks.sort((a, b) => (b.prominence - a.prominence) || (b.amp - a.amp))
    return peaks
  }

  refinePeakFreq(i, mags, binHz) {
    if (i <= 0 || i >= mags.length - 1) return i * binHz
    
    const y1 = Math.log(mags[i - 1] + 1e-12)
    const y2 = Math.log(mags[i] + 1e-12)
    const y3 = Math.log(mags[i + 1] + 1e-12)
    
    const denom = (y1 - 2 * y2 + y3)
    if (Math.abs(denom) < 1e-12) return i * binHz
    
    const delta = 0.5 * (y1 - y3) / denom
    const clamped = Math.max(-0.5, Math.min(0.5, delta))
    
    return (i + clamped) * binHz
  }

  updateGate(rms) {
    if (this.gateOpen) {
      if (rms < GATE_OFF) {
        this.closeCount++
        if (this.closeCount >= CLOSE_FRAMES) {
          this.gateOpen = false
          this.closeCount = 0
          this.openCount = 0
        }
      } else {
        this.closeCount = 0
      }
    } else {
      if (rms > GATE_ON) {
        this.openCount++
        if (this.openCount >= OPEN_FRAMES) {
          this.gateOpen = true
          this.openCount = 0
          this.closeCount = 0
        }
      } else {
        this.openCount = 0
      }
    }
  }

  maybeAddTrailPoint(now) {
    if (!this.gateOpen) return
    if (now - this.lastTrailAt < this.trailMinDt) return
    
    this.lastTrailAt = now
    this.trail.push({ 
      f1: this.currentF1, 
      f2: this.currentF2, 
      t: now 
    })
    
    if (this.trail.length > this.trailMax) {
      this.trail.splice(0, this.trail.length - this.trailMax)
    }
  }

  expireTrail(now) {
    if (!this.trail || this.trail.length === 0) return
    
    let i = 0
    while (i < this.trail.length && now - this.trail[i].t > this.trailTTL) {
      i++
    }
    
    if (i > 0) {
      this.trail.splice(0, i)
    }
  }

  getCurrentFormantsWithLevel() {
    if (!this.analyser || !this.audioContext || !this.isRunning) {
      return {
        F1: this.currentF1,
        F2: this.currentF2,
        audioLevel: this.currentRMS,
        gateOpen: this.gateOpen,
        trail: this.trail
      }
    }

    this.ensureBuffers()
    
    const N = this.analyser.frequencyBinCount
    const binHz = (this.audioContext.sampleRate || this.sampleRateCache) / (2 * N)

    // Get time domain data for RMS calculation
    this.analyser.getFloatTimeDomainData(this.timeBuf)
    let sum = 0
    for (let i = 0; i < this.timeBuf.length; i++) {
      const x = this.timeBuf[i]
      sum += x * x
    }
    const rms = Math.sqrt(sum / this.timeBuf.length)
    this.currentRMS = rms

    // Update gate state
    this.updateGate(rms)

    // If gate is closed, return previous values
    if (!this.gateOpen) {
      const now = performance.now()
      this.expireTrail(now)
      
      return {
        F1: this.prevF1 ?? 0,
        F2: this.prevF2 ?? 0,
        audioLevel: rms,
        gateOpen: false,
        trail: this.trail
      }
    }

    // Get frequency domain data
    this.analyser.getFloatFrequencyData(this.freqDb)
    const mags = new Float32Array(N)
    
    for (let i = 0; i < N; i++) {
      const db = Math.max(-160, this.freqDb[i])
      mags[i] = Math.pow(10, db / 20)
    }

    // Smooth magnitudes and find peaks
    const magsSm = this.smoothMagnitudesLinear(mags)
    const peaks = this.findPeaksProminence(magsSm, binHz, 200, F2_MAX)

    // Find F1 (first formant)
    let f1 = null
    for (const p of peaks) {
      const f = p.i * binHz
      if (f >= F1_BAND[0] && f <= F1_BAND[1]) {
        f1 = this.refinePeakFreq(p.i, magsSm, binHz)
        break
      }
    }

    // Find F2 (second formant)
    let minF2Needed = F2_MIN
    if (f1) minF2Needed = Math.max(F2_MIN, f1 + F2_GAP_FROM_F1)
    
    let f2 = null
    for (const p of peaks) {
      const f = p.i * binHz
      if (f >= minF2Needed && f <= F2_MAX) {
        f2 = this.refinePeakFreq(p.i, magsSm, binHz)
        break
      }
    }
    
    // Fallback F2 search if not found
    if (!f2) {
      for (const p of peaks) {
        const f = p.i * binHz
        if (f >= F2_MIN) {
          f2 = this.refinePeakFreq(p.i, magsSm, binHz)
          break
        }
      }
    }

    // Use previous values if no formants found
    if (!f1) f1 = this.prevF1 ?? 0
    if (!f2) f2 = this.prevF2 ?? 0

    // Apply median filtering
    const mf1 = this.pushAndMedian(this.ringF1, f1)
    const mf2 = this.pushAndMedian(this.ringF2, f2)

    // Apply smoothing
    if (this.prevF1 == null) this.prevF1 = mf1
    if (this.prevF2 == null) this.prevF2 = mf2
    
    const sF1 = ALPHA * mf1 + (1 - ALPHA) * this.prevF1
    const sF2 = ALPHA * mf2 + (1 - ALPHA) * this.prevF2
    
    this.prevF1 = sF1
    this.prevF2 = sF2
    this.currentF1 = sF1
    this.currentF2 = sF2

    // Update trail
    const now = performance.now()
    this.maybeAddTrailPoint(now)
    this.expireTrail(now)

    return {
      F1: sF1,
      F2: sF2,
      audioLevel: rms,
      gateOpen: true,
      trail: this.trail
    }
  }

  getAudioContextState() {
    return this.audioContext ? this.audioContext.state : 'closed'
  }

  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }
}

// Export singleton instance
export const formantAnalyzer = new FormantAnalyzer()

// Legacy compatibility functions
export async function initializeAudioContext() {
  return await formantAnalyzer.initialize()
}

export function getCurrentFormantsWithLevel() {
  return formantAnalyzer.getCurrentFormantsWithLevel()
}

export function getAudioContextState() {
  return formantAnalyzer.getAudioContextState()
}

export async function resumeAudioContext() {
  return await formantAnalyzer.resumeAudioContext()
}

export function cleanup() {
  formantAnalyzer.cleanup()
}