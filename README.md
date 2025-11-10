# SondQuest Interactive Onboarding

Vue 3 app for teaching language learners their first new vowel sound through interactive phonetic visualization and real-time audio analysis.

## Features

- **Language Pair Selection** - Choose native and target languages
- **Smart Lesson Delivery** - Pre-generated lessons with LLM fallback
- **Real-time Audio Analysis** - Web Audio API with formant extraction (F1/F2)
- **Interactive Vowel Chart** - Canvas-based visualization with live plotting
- **Progress Tracking** - 5-step onboarding flow with visual indicators
- **Payment Integration** - Stripe redirect for premium access

## Tech Stack

- Vue 3 (Composition API)
- Vite
- Pinia (state management)
- Axios (HTTP client)
- Web Audio API
- Canvas API
- OpenAI/OpenRouter APIs

## Setup

### 1. Install Dependencies

```bash
cd sondquest-onboarding
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# OpenRouter API Key (required for lesson generation)
VITE_OPENROUTER_API_KEY=sk-or-your-openrouter-key-here

# Stripe payment link
VITE_STRIPE_PAYMENT_LINK=https://buy.stripe.com/your-link
```

**Note:** The app uses OpenRouter exclusively with the free `x-ai/grok-2-1212:free` model for lesson generation fallback.

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:5173

## Lesson System

The app uses a **hybrid approach**:

1. **Pre-generated Lessons** (instant, no API cost)
   - Currently available for:
     - English (US) → Portuguese (European)
     - English (US) → Spanish (Spain)
     - English (US) → French
     - English (US) → German
   
2. **LLM Fallback** (for uncached pairs)
   - Automatically calls OpenRouter if no pre-generated lesson exists
   - Uses free `x-ai/grok-2-1212:free` model (no API costs!)
   - Requires OpenRouter API key configuration

### Adding More Pre-generated Lessons

See [`GENERATE_LESSONS.md`](GENERATE_LESSONS.md) for instructions on generating and adding new lessons to the pool.

## LLM Configuration

The app uses **OpenRouter** exclusively for lesson generation fallback. OpenRouter provides free access to the `x-ai/grok-2-1212:free` model, so there are no API costs for generating lessons!

**Required:**
- OpenRouter API key in `.env.local`

**No configuration needed:**
- Provider is hardcoded to OpenRouter
- Model is set to `x-ai/grok-2-1212:free`
- No additional setup required

## Project Structure

```
src/
├── components/
│   ├── LanguageSelector.vue    # Step 1: Language input
│   ├── LessonCard.vue           # Step 2: Display lesson
│   ├── VowelVisualizer.vue      # Step 3: Audio practice
│   ├── SuccessMessage.vue       # Step 4: Completion
│   └── PaymentPrompt.vue        # Step 5: Upgrade CTA
├── composables/
│   ├── useAudioCapture.js       # Microphone access
│   └── useLessonGenerator.js    # LLM integration
├── services/
│   ├── llmService.js             # OpenRouter integration
│   └── formantAnalyzer.js       # Audio processing
├── stores/
│   └── onboarding.js            # Pinia store
├── App.vue                      # Main component
├── main.js                      # App entry
└── style.css                    # Global styles
```

## User Flow

1. **Language Selection** → User picks native/target languages
2. **Lesson Generation** → AI generates personalized vowel lesson
3. **Live Practice** → User speaks, app visualizes formants
4. **Success Message** → Celebration screen
5. **Payment Prompt** → Stripe checkout for full access

## Audio Analysis

The app uses Web Audio API to:
- Capture microphone input
- Extract formants (F1/F2) via FFT + peak detection
- Plot user's sound vs target vowel in real-time
- Display on vowel chart (F2 horizontal, F1 vertical)

## Lesson Format

AI returns two blocks:
1. **DISPLAY** (Markdown) - User-friendly lesson text
2. **DATA** (JSON) - Structured data with formants

Example response:
```markdown
# The sound (/ɐ/)
## How to shape it
- Jaw: Relaxed
- Tongue: Mid-height
- Lips: Neutral
...
```

```json
{
  "vowel": {
    "ipa": "ɐ",
    "targetVowelFormants": { "F1": 600, "F2": 1500 }
  },
  "closestNativeVowel": {
    "ipa": "ə",
    "formants": { "F1": 500, "F2": 1500 }
  }
}
```

## Build for Production

```bash
npm run build
```

Output in `dist/` folder.

## Browser Requirements

- Modern browser with Web Audio API support
- Microphone access permission
- HTTPS (for production microphone access)

## Development Notes

### Testing Without API Key

The app will show error messages if the OpenRouter API key is missing. Add your OpenRouter API key to `.env.local` to test lesson generation for uncached language pairs.

### Microphone Permission

The browser will prompt for microphone access when starting practice. Grant permission to enable audio visualization.

### Formant Visualization

- Target vowel (green) = Goal sound
- Closest native (blue) = Reference point
- User sound (red) = Live input

## License

MIT

## Support

For issues or questions, contact the SondQuest team.
