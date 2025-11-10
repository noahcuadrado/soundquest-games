# How to Generate Pre-Generated Lessons

Use this prompt with ChatGPT or Claude to generate new lessons for the pool.

## Prompt Template

```
You are generating a lesson that teaches one target-language vowel that feels unfamiliar to a [NATIVE_LANGUAGE] speaker learning [TARGET_LANGUAGE].

Pick one vowel that is common in [TARGET_LANGUAGE] and distinct (or noticeably different) from [NATIVE_LANGUAGE].

Return the lesson in this EXACT JavaScript object format (ready to paste into lessonPool.js):

"[NATIVE_LANGUAGE]->[TARGET_LANGUAGE]": {
  display: `# The sound (/IPA_SYMBOL/)

[Brief description of the sound]

## How to shape it
- **Jaw:** [description]
- **Tongue:** [description]
- **Lips:** [description]

## Closest sound in [NATIVE_LANGUAGE]
"[sound]" like in **[word]**.

## Don't confuse it with
"[sound]" like in **[word]** [reason].

## Try these
- **[word1]** — [IPA]
- **[word2]** — [IPA]
- **[word3]** — [IPA]

## Quick practice
- [drill 1]
- [drill 2]`,
  data: {
    pair: { native: "[NATIVE_LANGUAGE]", target: "[TARGET_LANGUAGE]" },
    vowel: {
      ipa: "[IPA_SYMBOL]",
      targetVowelFormants: { F1: [number], F2: [number] }
    },
    closestNativeVowel: {
      ipa: "[IPA]",
      exampleWord: "[word]",
      formants: { F1: [number], F2: [number] }
    },
    commonMistakeVowel: {
      ipa: "[IPA]",
      exampleWord: "[word]"
    },
    examples: [
      { word: "[word1]", ipa: "[IPA1]" },
      { word: "[word2]", ipa: "[IPA2]" },
      { word: "[word3]", ipa: "[IPA3]" }
    ]
  }
}

Rules:
1. Use realistic formant values (F1: 200-1000 Hz, F2: 600-3000 Hz)
2. Keep descriptions friendly, no jargon
3. Include IPA in slashes /.../ and brackets [...]
4. Make practice drills actionable
5. Output ONLY the JavaScript object, no extra text
```

## Example Usage

### Generate for English → Japanese

```
You are generating a lesson that teaches one target-language vowel that feels unfamiliar to an English (US) speaker learning Japanese.

Pick one vowel that is common in Japanese and distinct (or noticeably different) from English (US).

[Use the template above...]
```

### Common Language Pairs to Generate

Priority pairs:
- English (US) → Japanese
- English (US) → Mandarin Chinese
- English (US) → Korean
- English (US) → Russian
- English (US) → Arabic
- English (US) → Italian
- Spanish (Spain) → English (US)
- French → English (US)
- German → English (US)

## Adding to lessonPool.js

1. Generate the lesson using the prompt
2. Copy the output
3. Open `src/data/lessonPool.js`
4. Paste into the `lessonPool` object before the closing brace
5. Add a comma after the previous entry
6. Test by selecting those languages in the app

## Formant Reference

Typical vowel formants (approximate):

| IPA | Example | F1 (Hz) | F2 (Hz) |
|-----|---------|---------|---------|
| i   | bee     | 300     | 2300    |
| e   | bay     | 500     | 2000    |
| ɛ   | bed     | 600     | 1800    |
| a   | father  | 800     | 1200    |
| ɔ   | thought | 700     | 900     |
| o   | boat    | 500     | 900     |
| u   | boot    | 300     | 800     |
| ə   | sofa    | 500     | 1500    |
| ɐ   | (PT)    | 600     | 1500    |
| y   | (FR tu) | 300     | 2100    |
| ø   | (FR peu)| 450     | 1700    |
| œ   | (FR peur)| 600    | 1600    |

These are averages for male speakers. Female formants are typically 10-20% higher.