# Admin Dashboard Files List

This document lists all the files that make up the admin dashboard system and need to be copied to deploy it to another branch.

## Core Admin Dashboard Files

### 1. HTML Interfaces (2 files)
```
admin-dashboard.html                    # Main lesson management interface
admin-phoneme-dashboard.html           # Phoneme-specific lesson management
```

### 2. Server Scripts (4 files)
```
scripts/local-admin-server.mjs         # Admin server for generated_lessons schema
scripts/local-phoneme-admin-server.mjs # Admin server for phoneme_lessons schema
scripts/review-lessons.mjs             # Review logic for generated_lessons
scripts/review-phoneme-lessons.mjs     # Review logic for phoneme_lessons
```

### 3. Core Services (2 files)
```
src/services/unifiedLessonRegenerationService.js  # GPT-5 regeneration service
src/services/adminDashboardIntegration.js         # Schema normalization layer
```

### 4. Utility Services (2 files)
```
src/utils/secureApiManager.js          # API key management and rate limiting
src/utils/inputValidation.js           # Input validation and sanitization
```

### 5. Documentation (3 files)
```
LESSON_REGENERATION_SYSTEM.md          # Complete system documentation
ADMIN_DASHBOARD_DEPLOYMENT.md          # Deployment guide
examples/lesson-regeneration-example.js # Usage examples
```

### 6. Deployment Scripts (2 files)
```
deploy-admin-dashboard.sh              # Unix/Linux deployment script
deploy-admin-dashboard.bat             # Windows deployment script
```

## Total: 16 Files

## File Dependencies

The admin dashboard files are designed to be **self-contained** with minimal dependencies:

- **No Vue.js dependencies** - Pure HTML/JavaScript interfaces
- **No branch-specific code** - Works with both schemas
- **Isolated functionality** - Doesn't modify existing application code
- **Portable services** - All dependencies are included

## Schema Compatibility

The system automatically detects and works with both:

1. **generated_lessons schema** (main branch)
   - Uses `scripts/local-admin-server.mjs`
   - Uses `scripts/review-lessons.mjs`

2. **phoneme_lessons schema** (versions/full-lessons branch)
   - Uses `scripts/local-phoneme-admin-server.mjs`
   - Uses `scripts/review-phoneme-lessons.mjs`

## Environment Requirements

Both branches need these environment variables in `.env.local`:

```bash
# Required
VITE_OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_neon_database_url

# Optional (with defaults)
OPENAI_ORG=your_org_id
OPENAI_PROJECT=your_project_id
REVIEW_MODEL=gpt-5
REGEN_MODEL=gpt-5
REVIEW_REASONING_EFFORT=low
REVIEW_MAX_TOKENS=3500
REGEN_MAX_TOKENS=4500
```

## Package.json Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "admin:dashboard": "node scripts/local-admin-server.mjs",
    "admin:phoneme": "node scripts/local-phoneme-admin-server.mjs",
    "admin:review": "node scripts/review-lessons.mjs",
    "admin:review-phoneme": "node scripts/review-phoneme-lessons.mjs"
  }
}
```

## Quick Deployment

### Windows:
```cmd
deploy-admin-dashboard.bat C:\path\to\target\branch
```

### Unix/Linux/Mac:
```bash
./deploy-admin-dashboard.sh /path/to/target/branch
```

### Manual Copy:
```bash
# Copy all files listed above to the target branch
# Maintain directory structure (scripts/, src/services/, src/utils/, examples/)
```

## Testing Deployment

After copying files:

1. Configure `.env.local` with API keys
2. Install dependencies: `npm install`
3. Test the appropriate server:
   - Generated lessons: `npm run admin:dashboard`
   - Phoneme lessons: `npm run admin:phoneme`
4. Open browser to `http://localhost:3001`

## Safety Features

- **Automatic backups** - Existing files are backed up before overwriting
- **Schema validation** - Prevents data corruption
- **Error handling** - Graceful fallbacks
- **Rate limiting** - API usage protection
- **Input sanitization** - Security protection

## Rollback

To remove admin dashboard:
```bash
# Delete the 16 files listed above
# Remove admin scripts from package.json
# Remove admin environment variables from .env.local
```

The rest of your application will remain completely unaffected.