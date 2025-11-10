# Quick Start Guide

## Setup (5 minutes)

### 1. Add API Keys

Edit `sondquest-onboarding/.env.local`:

```env
VITE_LLM_PROVIDER=openai
VITE_OPENAI_API_KEY=sk-your-actual-key-here
VITE_STRIPE_PAYMENT_LINK=https://your-stripe-link
```

### 2. Start Dev Server

```bash
cd sondquest-onboarding
npm run dev
```

### 3. Test Flow

1. Open http://localhost:5173
2. Select languages (e.g., English → Portuguese)
3. Click "Generate My Lesson"
4. Review the AI-generated lesson
5. Click "Start Practice Session"
6. Allow microphone access
7. Click "Start Recording" and speak a vowel
8. Watch your sound appear on the chart
9. Complete the session

## Testing Mode: Bypass Pre-generated Lessons

To test LLM API integration directly (skip pre-generated lessons):

**Edit `.env.local`:**
```env
VITE_USE_PREGENERATED_LESSONS=false
```

Now ALL language pairs will call the LLM API, even pre-generated ones. Useful for:
- Testing API integration
- Generating new lesson variations
- Debugging LLM responses

**To re-enable pre-generated lessons:**
```env
# Comment out or set to true
# VITE_USE_PREGENERATED_LESSONS=true
```

## Switching LLM Providers

### To OpenRouter:

```env
VITE_LLM_PROVIDER=openrouter
VITE_OPENROUTER_API_KEY=sk-or-your-key
```

### Runtime Switch (Console):

```javascript
// Import service in browser dev tools
llmService.switchProvider('openrouter', 'sk-or-key')
```

## Troubleshooting

### Lesson generation fails
- Check API key is valid
- Verify provider is set correctly
- Check browser console for errors

### Microphone not working
- Grant browser microphone permission
- Use HTTPS in production
- Check browser supports Web Audio API

### No formants detected
- Speak louder/clearer
- Hold vowel sounds longer
- Check microphone input levels

## Project Files

```
sondquest-onboarding/
├── .env.local          ← Add your keys here
├── src/
│   ├── App.vue         ← Main flow controller
│   ├── components/     ← UI components
│   ├── services/       ← LLM & audio processing
│   └── stores/         ← State management
└── README.md           ← Full documentation
```

## Next Steps

- Add real API keys to `.env.local`
- Test with different language pairs
- Customize Stripe payment link
- Deploy to production with HTTPS