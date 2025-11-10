# Migrate Tracking From Netlify Blobs to a New Neon.tech Database

This guide shows how to take the existing tracking implemented with Netlify Blobs-style persistence and migrate it to a proper Neon PostgreSQL setup using a Netlify Function API, mirroring how this project now does Neon integration.

The end result:
- A new Neon database (separate from any existing one)
- A serverless API that talks to Neon via PostgreSQL
- A typed frontend service and React hook to send/read tracking data
- URLs and payloads compatible with your current app flow

## Overview

- Server: Netlify Function at [`/.netlify/functions/neon-tracking`](netlify/functions/neon-tracking.js:1) using `pg` to connect to Neon
- DB: A Neon project with `user_progress` table (created/initialized automatically)
- Client: TypeScript service [`neonService`](src/services/neonService.ts:1) + React hook [`useNeonTracking`](src/hooks/useNeonTracking.ts:26)
- Data captured: chatId, nativeLanguage, targetLanguage, steps visited, completion percentage, completion status

If you only used Blobs to persist onboarding progress, this migration provides a robust, queryable data store with analytics endpoints.

## 1) Provision a New Neon Database

1. Create a new project at https://neon.tech
2. In the project dashboard, click “Connect” and copy the pooled connection string:
   ```
   postgresql://username:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require
   ```
3. Keep this string safe; it will be used as an environment variable.

## 2) Configure Environment Variables

Add to your local `.env` and to your Netlify site environment:

```
NEON_DATABASE_URL="postgresql://username:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require"
```

The function also supports fallbacks:
- `NETLIFY_DATABASE_URL`
- `DATABASE_URL`

But standardize on `NEON_DATABASE_URL` for clarity.

Where it is read:
- [`getDatabaseClient()`](netlify/functions/neon-tracking.js:5)

## 3) Serverless API Setup (Netlify Function)

Use our existing function as a template and deploy it with your new Neon connection string:

- File: [`netlify/functions/neon-tracking.js`](netlify/functions/neon-tracking.js:1)

Key features:
- Table auto-creation and schema migration on cold start:
  - [`initializeDatabase()`](netlify/functions/neon-tracking.js:23)
- Endpoints:
  - `POST /.netlify/functions/neon-tracking/user` — create/update user
  - `GET /.netlify/functions/neon-tracking/user/:chatId` — fetch user
  - `PUT /.netlify/functions/neon-tracking/step` — update a user’s step and percentages
  - `PUT /.netlify/functions/neon-tracking/complete` — mark completed
  - `GET /.netlify/functions/neon-tracking/stats` — aggregated stats
  - `POST /.netlify/functions/neon-tracking/test` — DB connectivity test

CORS, error handling, and index creation are built-in.

If you need a new function name, duplicate the file and adjust the base path in the client service accordingly.

## 4) Database Schema

The function initializes and migrates the table as needed. For manual bootstrap, you can run:

```sql
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  chat_id VARCHAR(255) UNIQUE NOT NULL,
  native_language VARCHAR(100) NOT NULL,
  target_language VARCHAR(100) NOT NULL,
  current_step INTEGER DEFAULT 0,
  steps_visited INTEGER[] DEFAULT '{}'::int[],
  steps_not_visited INTEGER[] DEFAULT '{}'::int[],
  is_completed BOOLEAN DEFAULT FALSE,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  completion_percentage DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_progress_chat_id ON user_progress(chat_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(is_completed);
```

## 5) Client Integration

Use the provided typed client and hook (update base URL if you rename the function).

- Service: [`neonService`](src/services/neonService.ts:6)
  - Base URL: [`'/.netlify/functions/neon-tracking'`](src/services/neonService.ts:11)
  - Methods:
    - [`upsertUser(chatId, nativeLanguage, targetLanguage)`](src/services/neonService.ts:48)
    - [`getUser(chatId)`](src/services/neonService.ts:72)
    - [`updateStep(chatId, step, nativeLanguage?, targetLanguage?)`](src/services/neonService.ts:95)
    - [`completeOnboarding(chatId)`](src/services/neonService.ts:121)
    - [`getStats()`](src/services/neonService.ts:139)
    - [`testConnection()`](src/services/neonService.ts:154)

- Hook: [`useNeonTracking`](src/hooks/useNeonTracking.ts:26)
  - `initializeUser(chatId, nativeLanguage, targetLanguage)`
  - `updateCurrentStep(step)`
  - `completeOnboarding()`
  - `refreshStats()`
  - `testConnection()`

Example usage in a component:
```tsx
import { useEffect } from 'react';
import { useNeonTracking } from '../hooks/useNeonTracking';

function OnboardingFlow({ chatId, native, target }: { chatId: string; native: string; target: string }) {
  const { initializeUser, updateCurrentStep, completeOnboarding, user, stats, isLoading, error } = useNeonTracking();

  useEffect(() => {
    initializeUser(chatId, native, target);
  }, [chatId, native, target, initializeUser]);

  // on step event:
  // await updateCurrentStep(2);

  // on complete:
  // await completeOnboarding();

  return null;
}
```

If your app already extracts URL params via [`getAllURLParams()`](src/utils/urlParams.ts:25), pass them directly:
```ts
import { getAllURLParams } from '../utils/urlParams';
const { native, target, chatID } = getAllURLParams();
initializeUser(chatID!, native!, target!);
```

## 6) Routing the Frontend to the New DB

If you used Blobs previously, replace any Blobs-specific service calls with the neonService equivalents. For example:

- Create/update user on first load:
  - [`neonService.upsertUser(...)`](src/services/neonService.ts:48)
- Update a step as the user proceeds:
  - [`neonService.updateStep(...)`](src/services/neonService.ts:95)
- Mark onboarding complete:
  - [`neonService.completeOnboarding(...)`](src/services/neonService.ts:121)

The hook already orchestrates these patterns.

## 7) Deploy

- Ensure `NEON_DATABASE_URL` is set in Netlify Site Settings → Environment variables
- Deploy your site; Netlify will build and ship the function
- Confirm the function URL is reachable at `/.netlify/functions/neon-tracking`

Optional: If using a custom function name, change base URL in the service:
- [`new NeonService().baseUrl`](src/services/neonService.ts:11)

## 8) Validation and Testing

- Connectivity test:
  - `POST /.netlify/functions/neon-tracking/test`
  - Client method: [`neonService.testConnection()`](src/services/neonService.ts:154)

- Create/Update user:
  ```
  POST /.netlify/functions/neon-tracking/user
  {
    "chatId": "test-123",
    "nativeLanguage": "English",
    "targetLanguage": "Spanish"
  }
  ```

- Get user:
  ```
  GET /.netlify/functions/neon-tracking/user/test-123
  ```

- Update step:
  ```
  PUT /.netlify/functions/neon-tracking/step
  {
    "chatId": "test-123",
    "step": 2
  }
  ```

- Complete:
  ```
  PUT /.netlify/functions/neon-tracking/complete
  {
    "chatId": "test-123"
  }
  ```

- Stats:
  ```
  GET /.netlify/functions/neon-tracking/stats
  ```

## 9) Production Considerations

- Pooling: Use the pooled connection string (recommended by Neon)
- SSL: Ensure `?sslmode=require` in the URL
- Secrets: Only store DB connection strings in server-side env vars
- Indexes: Provided for chat_id and completion for performance
- Data types: Steps are `INTEGER[]` for fast containment, not JSONB
- Idempotency: `POST /user` uses UPSERT by `chat_id`

## 10) Migration Checklist

- [ ] Create new Neon project and copy pooled connection string
- [ ] Set `NEON_DATABASE_URL` in Netlify env vars
- [ ] Deploy `netlify/functions/neon-tracking.js`
- [ ] Switch client to [`neonService`](src/services/neonService.ts:6) and/or [`useNeonTracking`](src/hooks/useNeonTracking.ts:26)
- [ ] Replace prior Blobs calls with Neon API calls
- [ ] Verify via `/test`, then run `/user`, `/step`, `/complete`, and `/stats`
- [ ] Monitor Netlify Function logs for DB operations

## Appendix: Switching Function Name or Path

If you create a new function file, e.g. `netlify/functions/neon-tracking-new.js`, adjust the client base URL:
- Update [`this.baseUrl`](src/services/neonService.ts:11) to `/.netlify/functions/neon-tracking-new`
- Or inject via constructor/env if you want multi-environment flexibility

## Troubleshooting

- 500 errors on function calls:
  - Verify `NEON_DATABASE_URL` is set and correct
  - Check that `sslmode=require` is included
  - Inspect Netlify Function logs for detailed errors

- Table not created:
  - Ensure first request reaches the function; auto-init occurs on first connection
  - Manually run the schema SQL if needed

- CORS:
  - The function includes permissive CORS headers by default
  - If you lock down origins, update headers in the function

This guide mirrors the working Neon integration in this project and adapts it to a new Neon instance, enabling a safe migration path away from Blob-based persistence.