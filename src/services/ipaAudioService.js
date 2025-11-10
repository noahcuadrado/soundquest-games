// IPA Audio Service - Fetches authentic IPA sounds from Wikimedia Commons

// Map IPA symbols to their Wikipedia file titles
// Complete IPA vowel chart coverage
const ipaToWikipediaTitle = {
  // Close vowels (high) - with and without slashes
  '/i/': 'Close front unrounded vowel',
  'i': 'Close front unrounded vowel',
  '/y/': 'Close front rounded vowel',
  'y': 'Close front rounded vowel',
  '/ɨ/': 'Close central unrounded vowel',
  'ɨ': 'Close central unrounded vowel',
  '/ʉ/': 'Close central rounded vowel',
  'ʉ': 'Close central rounded vowel',
  '/ɯ/': 'Close back unrounded vowel',
  'ɯ': 'Close back unrounded vowel',
  '/u/': 'Close back rounded vowel',
  'u': 'Close back rounded vowel',
  
  // Near-close vowels
  '/ɪ/': 'Near-close near-front unrounded vowel',
  'ɪ': 'Near-close near-front unrounded vowel',
  '/ʏ/': 'Near-close near-front rounded vowel',
  'ʏ': 'Near-close near-front rounded vowel',
  '/ʊ/': 'Near-close near-back rounded vowel',
  'ʊ': 'Near-close near-back rounded vowel',
  
  // Close-mid vowels
  '/e/': 'Close-mid front unrounded vowel',
  'e': 'Close-mid front unrounded vowel',
  'e̞': 'Close-mid front unrounded vowel', // Spanish mid-front vowel
  '/ø/': 'Close-mid front rounded vowel',
  'ø': 'Close-mid front rounded vowel',
  'ø̞': 'Close-mid front rounded vowel', // Lowered variant
  '/ɘ/': 'Close-mid central unrounded vowel',
  'ɘ': 'Close-mid central unrounded vowel',
  '/ɵ/': 'Close-mid central rounded vowel',
  'ɵ': 'Close-mid central rounded vowel',
  '/ɤ/': 'Close-mid back unrounded vowel',
  'ɤ': 'Close-mid back unrounded vowel',
  '/o/': 'Close-mid back rounded vowel',
  'o': 'Close-mid back rounded vowel',
  
  // Mid vowels
  '/ə/': 'Mid-central vowel',
  'ə': 'Mid-central vowel',
  
  // Open-mid vowels
  '/ɛ/': 'Open-mid front unrounded vowel',
  'ɛ': 'Open-mid front unrounded vowel',
  'ɛː': 'Open-mid front unrounded vowel', // Long variant
  '/œ/': 'Open-mid front rounded vowel',
  'œ': 'Open-mid front rounded vowel',
  'œ̃': 'Open-mid front rounded vowel', // Nasal variant
  '/ɜ/': 'Open-mid central unrounded vowel',
  'ɜ': 'Open-mid central unrounded vowel',
  '/ɞ/': 'Open-mid central rounded vowel',
  'ɞ': 'Open-mid central rounded vowel',
  '/ʌ/': 'Open-mid back unrounded vowel',
  'ʌ': 'Open-mid back unrounded vowel',
  '/ɔ/': 'Open-mid back rounded vowel',
  'ɔ': 'Open-mid back rounded vowel',
  
  // Near-open vowels
  '/æ/': 'Near-open front unrounded vowel',
  'æ': 'Near-open front unrounded vowel',
  'æ̃': 'Near-open front unrounded vowel', // Nasal variant
  '/ɐ/': 'Near-open central vowel',
  'ɐ': 'Near-open central vowel',
  
  // Open vowels (low)
  '/a/': 'Open front unrounded vowel',
  'a': 'Open front unrounded vowel',
  'a̟': 'Open front unrounded vowel', // Advanced variant
  '/ɶ/': 'Open front rounded vowel',
  'ɶ': 'Open front rounded vowel',
  '/ɑ/': 'Open back unrounded vowel',
  'ɑ': 'Open back unrounded vowel',
  '/ɒ/': 'Open back rounded vowel',
  'ɒ': 'Open back rounded vowel',
  'ɒ̃': 'Open back rounded vowel', // Nasal variant
  
  // Nasal vowels
  'ĩ': 'Close front unrounded vowel', // Nasal i
  'ũ': 'Close back rounded vowel', // Nasal u
  'ẽ': 'Close-mid front unrounded vowel', // Nasal e
  'õ': 'Close-mid back rounded vowel', // Nasal o
  'ã': 'Open front unrounded vowel', // Nasal a
  
  // Common diphthongs and additional vowels
  '/eɪ/': 'Close-mid front unrounded vowel',
  '/aɪ/': 'Open front unrounded vowel',
  '/ɔɪ/': 'Open-mid back rounded vowel',
  '/aʊ/': 'Open back unrounded vowel',
  '/oʊ/': 'Close-mid back rounded vowel'
}

// Cache for audio URLs to avoid repeated API calls
const audioUrlCache = new Map()

/**
 * Fetch IPA audio URL from Wikimedia Commons API
 * @param {string} ipaSymbol - IPA symbol like '/i/'
 * @returns {Promise<string|null>} - Audio URL or null if not found
 */
export async function getIPAAudioUrl(ipaSymbol) {
  // Check cache first
  if (audioUrlCache.has(ipaSymbol)) {
    return audioUrlCache.get(ipaSymbol)
  }
  
  const title = ipaToWikipediaTitle[ipaSymbol]
  if (!title) {
    // Use debug level since this is expected when using database phonemes
    console.debug('No Wikipedia title mapping for IPA symbol:', ipaSymbol)
    return null
  }
  
  try {
    // Use MediaWiki API to get file info
    const apiUrl = 'https://commons.wikimedia.org/w/api.php'
    const params = new URLSearchParams({
      action: 'query',
      titles: `File:${title}.ogg`,
      prop: 'imageinfo',
      iiprop: 'url',
      format: 'json',
      origin: '*' // Enable CORS
    })
    
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    // Extract URL from response
    const pages = data.query?.pages
    if (pages) {
      const pageId = Object.keys(pages)[0]
      const audioUrl = pages[pageId]?.imageinfo?.[0]?.url
      
      if (audioUrl) {
        // Cache the URL
        audioUrlCache.set(ipaSymbol, audioUrl)
        return audioUrl
      }
    }
    
    console.warn('No audio URL found for:', ipaSymbol, title)
    return null
  } catch (error) {
    console.error('Failed to fetch IPA audio from MediaWiki API:', error)
    return null
  }
}

/**
 * Play IPA audio for a given symbol with database URL support
 * @param {string} ipaSymbol - IPA symbol like '/i/'
 * @param {string|null} databaseAudioUrl - Audio URL from database (optional)
 * @param {Function} onEnd - Optional callback when audio finishes
 * @param {Function} onError - Optional callback on error
 */
export async function playIPASound(ipaSymbol, databaseAudioUrl = null, onEnd, onError) {
  let audioUrl = databaseAudioUrl
  
  // If no database URL provided or it fails, fallback to Wikipedia
  if (!audioUrl) {
    audioUrl = await getIPAAudioUrl(ipaSymbol)
  }
  
  if (audioUrl) {
    const audio = new Audio(audioUrl)
    audio.volume = 0.7
    
    if (onEnd) {
      audio.onended = onEnd
    }
    
    audio.onerror = async () => {
      // If database URL failed, try Wikipedia fallback
      if (databaseAudioUrl && audioUrl === databaseAudioUrl) {
        console.warn('Database audio URL failed, trying Wikipedia fallback for:', ipaSymbol)
        const fallbackUrl = await getIPAAudioUrl(ipaSymbol)
        if (fallbackUrl) {
          const fallbackAudio = new Audio(fallbackUrl)
          fallbackAudio.volume = 0.7
          if (onEnd) fallbackAudio.onended = onEnd
          fallbackAudio.onerror = () => {
            if (onError) onError()
            console.error('Both database and Wikipedia audio failed for:', ipaSymbol)
          }
          try {
            await fallbackAudio.play()
            return
          } catch (err) {
            console.error('Fallback audio playback error:', err)
          }
        }
      }
      
      if (onError) onError()
      console.error('Failed to play IPA audio for:', ipaSymbol)
    }
    
    try {
      await audio.play()
    } catch (err) {
      console.error('Audio playback error:', err)
      // Try fallback if this was a database URL
      if (databaseAudioUrl && audioUrl === databaseAudioUrl) {
        console.warn('Database audio playback failed, trying Wikipedia fallback for:', ipaSymbol)
        const fallbackUrl = await getIPAAudioUrl(ipaSymbol)
        if (fallbackUrl) {
          const fallbackAudio = new Audio(fallbackUrl)
          fallbackAudio.volume = 0.7
          if (onEnd) fallbackAudio.onended = onEnd
          fallbackAudio.onerror = () => {
            if (onError) onError()
            console.error('Fallback audio also failed for:', ipaSymbol)
          }
          try {
            await fallbackAudio.play()
            return
          } catch (fallbackErr) {
            console.error('Fallback audio playback error:', fallbackErr)
          }
        }
      }
      if (onError) onError()
    }
  } else {
    if (onError) onError()
  }
}

/**
 * Preload IPA audio files for given symbols
 * @param {string[]} ipaSymbols - Array of IPA symbols to preload
 */
export async function preloadIPAAudio(ipaSymbols) {
  const promises = ipaSymbols.map(symbol => getIPAAudioUrl(symbol))
  await Promise.all(promises)
  console.log('Preloaded IPA audio for', ipaSymbols.length, 'symbols')
}

// Export service object for components that expect it
export const ipaAudioService = {
  playSound: playIPASound,
  preloadAudio: preloadIPAAudio,
  getAudioUrl: getIPAAudioUrl
}