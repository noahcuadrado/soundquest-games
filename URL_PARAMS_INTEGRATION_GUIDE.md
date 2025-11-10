# URL Parameters Integration Guide

This guide explains how the project reads target language, native language, and chatID from the URL, and how to migrate this functionality into another project.

## What it does

- Parses URL query parameters from `window.location.search`
- Supports multiple variants for `chatID` (`chatID`, `chatId`, `chatid`, `id`)
- Handles complex language names (e.g., "Mandarin Chinese and American English")
- Normalizes and exposes language tokens via a React Context
- Triggers local phoneme analysis using CSV data files

Example URL:
```
https://your-app.example.com/?native=American%20English%20and%20Spanish&target=Mandarin%20Chinese&chatID=12345
```

## Files to copy

1) Core parsing utilities
- [`src/utils/urlParams.ts`](src/utils/urlParams.ts)

2) React provider that consumes the utilities and exposes values
- [`src/contexts/LanguageContext.tsx`](src/contexts/LanguageContext.tsx)

3) Local analysis service (if you want the phoneme analysis flow)
- [`src/services/phonemeService.ts`](src/services/phonemeService.ts)
- Data files referenced by the service:
  - [`public/data/InventoryID-LanguageCodes.csv`](public/data/InventoryID-LanguageCodes.csv)
  - [`public/data/phoible.csv`](public/data/phoible.csv)

If you only need URL parsing (native/target/chatID) and not phoneme analysis, you only need items (1) and (optionally) (2).

## How it works

A) URL parsing utilities
- [`getAllURLParams()`](src/utils/urlParams.ts:25) extracts `native`, `target`, and `chatID` (with multiple naming variants).
- [`getLanguageTokensFromURL()`](src/utils/urlParams.ts:46) extracts raw `native` and `target`.
- [`parseLanguageString(languageStr)`](src/utils/urlParams.ts:76) splits complex strings by " and " while preserving multi-word names.
- [`getBestLanguageChoice(languageStr)`](src/utils/urlParams.ts:107) selects the primary language from a multi-language string.
- [`getNormalizedLanguageTokens()`](src/utils/urlParams.ts:118) normalizes to lowercase, trimmed tokens suitable for downstream usage.
- [`getDetailedLanguageTokens()`](src/utils/urlParams.ts:134) returns raw, parsed, and normalized views for debugging.

B) React context
- [`LanguageProvider`](src/contexts/LanguageContext.tsx:20) reads URL tokens on mount using [`getDetailedLanguageTokens()`](src/utils/urlParams.ts:134).
- It stores `languages` in React state, exposes `isLoading`, and listens to `popstate` for URL changes.
- It can optionally trigger phoneme analysis when both languages are present.

C) Local phoneme analysis (optional)
- [`phonemeService`](src/services/phonemeService.ts:1) loads local CSVs using fetch (from `/public/data`), and computes overlap.
- This is independent of URL parsing, but the context uses URL tokens to decide when to analyze.

## Minimal integration steps (URL parsing only)

1) Copy the utility
- Add the file [`src/utils/urlParams.ts`](src/utils/urlParams.ts) to your project.

2) Use it wherever you need the values
```ts
import { getAllURLParams, getNormalizedLanguageTokens } from '../utils/urlParams';

const { native, target, chatID } = getAllURLParams();
const normalized = getNormalizedLanguageTokens();
// normalized.native, normalized.target are lowercase, trimmed strings
```

3) If your project uses routing that changes the query string client-side, listen for changes
```ts
window.addEventListener('popstate', () => {
  const { native, target, chatID } = getAllURLParams();
  // update your state accordingly
});
```

## Recommended integration (React apps)

1) Copy files
- [`src/utils/urlParams.ts`](src/utils/urlParams.ts)
- [`src/contexts/LanguageContext.tsx`](src/contexts/LanguageContext.tsx)

2) Wrap your app with the provider
```tsx
// src/main.tsx or src/App.tsx
import { LanguageProvider } from './contexts/LanguageContext';

export function AppRoot() {
  return (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}
```

3) Consume the context wherever needed
```tsx
import { useLanguage } from '../contexts/LanguageContext';

function MyComponent() {
  const { languages, isLoading } = useLanguage();

  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      Native: {languages.native ?? 'n/a'} | Target: {languages.target ?? 'n/a'}
    </div>
  );
}
```

## Full URL parameter reference

- native
  - Example: `native=American%20English%20and%20Spanish`
- target
  - Example: `target=Mandarin%20Chinese`
- chatID (variants supported)
  - `chatID`, `chatId`, `chatid`, `id`
  - Example: `chatID=12345` or `id=abc-xyz`

Access with:
```ts
import { getAllURLParams } from '../utils/urlParams';

const { native, target, chatID } = getAllURLParams();
```

## Notes and caveats

- These utilities rely on `window.location.search`, so they run in the browser. For SSR or Node-side parsing, use a server-compatible query parser or guard against `window` access.
- If your app uses a custom router that manipulates history without full reloads, keep the `popstate` listener or re-run parsing on route changes.
- The language parsing splits on `\s+and\s+` to support rich multi-word names. The first item is treated as primary.
- Normalization is lowercase/trim; keep the raw values if you need original casing.

## Optional: enabling local phoneme analysis

If you want the analysis flow as implemented:

- Copy [`src/services/phonemeService.ts`](src/services/phonemeService.ts)
- Place CSVs in your public folder:
  - [`public/data/InventoryID-LanguageCodes.csv`](public/data/InventoryID-LanguageCodes.csv)
  - [`public/data/phoible.csv`](public/data/phoible.csv)
- Ensure your bundler serves `/public` at the root so `fetch('/data/...')` works at runtime.
- From the `LanguageContext`, call `analyzePhonemes()` when both raw language strings are available (already wired in the provided context).

Usage example:
```ts
import { analyzePhonemeOverlap } from '../services/phonemeService';

const result = await analyzePhonemeOverlap('American English and Spanish', 'Mandarin Chinese');
if (result.success) {
  // use result.analysis
}
```

## Testing quick checklist

- Load `/?native=English&target=Spanish` and verify the context shows native/target.
- Change the query to `/?native=English&target=Spanish&chatId=999` and verify `chatID` is picked up.
- Try multiple languages: `/?native=Mandarin%20Chinese%20and%20American%20English&target=Portuguese`.
- If using phoneme analysis, open devtools and confirm both CSVs are fetched and the console shows analysis logs.

## Troubleshooting

- Values are always null
  - Ensure you're in a browser context and `window.location.search` contains the expected parameters.
  - For SPA routers, ensure query params are preserved during navigation.

- `chatID` missing
  - Use one of the accepted variants: `chatID`, `chatId`, `chatid`, or `id`.

- CSV fetch fails (for analysis)
  - Confirm files are in `public/data/`.
  - Confirm your dev server serves `public` at the root (`/data/...`).
  - Check for CORS or path issues in production hosting.

## License and attribution

The URL parsing utilities are generic and can be freely reused in your other projects. The phoneme analysis depends on PHOIBLE data; ensure you comply with PHOIBLE's licensing when redistributing the CSVs.
