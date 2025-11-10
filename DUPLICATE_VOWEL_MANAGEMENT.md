# Duplicate Vowel Management System

## Overview

The Duplicate Vowel Management System is a new feature for the admin dashboard that allows administrators to identify and regenerate lessons with duplicate vowel sounds. This system uses the main app's lesson generation prompts to ensure consistency and quality.

## Features

### 🔍 Duplicate Detection
- **Automatic Scanning**: Scans the entire `generated_lessons` database for duplicate vowel sounds
- **Language Pair Grouping**: Groups duplicates by language pair (e.g., English → Spanish)
- **Smart Identification**: Uses IPA symbols from lesson data to identify true duplicates
- **Caching**: Results are cached for 5 minutes to improve performance

### 🔄 Single Lesson Regeneration
- **Targeted Regeneration**: Regenerate individual lessons with duplicate vowels
- **Collision Avoidance**: Ensures new lessons don't create additional duplicates
- **Retry Logic**: Automatically retries if generated lesson conflicts with existing vowels
- **Preview Mode**: Shows preview of new lesson before applying changes

### 🎯 Integration with Main App
- **Consistent Prompts**: Uses the same lesson generation system as the main application
- **GPT-5 Integration**: Leverages GPT-5 with web search for high-quality lesson generation
- **Data Validation**: Applies the same validation rules as the main app
- **Schema Compatibility**: Ensures generated lessons work with VowelVisualizer component

## Usage

### Access the Feature
1. Start the admin server: `npm run admin-server`
2. Open the admin dashboard in your browser
3. Navigate to the "Duplicate Vowel Management" section

### Scan for Duplicates
1. Click **"Scan for Duplicates"** button
2. The system will analyze all lessons in the database
3. Results show:
   - Number of duplicate groups found
   - Total number of duplicate lessons
   - Table with detailed breakdown

### Regenerate a Duplicate Lesson
1. In the duplicates table, find a lesson marked as "Duplicate"
2. Click the **"Regenerate"** button for that lesson
3. Review the preview showing:
   - Original lesson content and vowel
   - New lesson content and vowel
   - Complete lesson data structure
4. Click **"Apply Regeneration"** to replace the lesson in the database
5. Or click **"Cancel"** to discard the changes

### Clear Cache
- Click **"Clear Cache"** to force a fresh scan on next duplicate detection

## API Endpoints

### GET `/api/duplicate-vowels`
Scans for and returns duplicate vowel lessons.

**Response:**
```json
{
  "duplicates": [
    {
      "nativeLanguage": "English",
      "targetLanguage": "Spanish", 
      "vowelIpa": "/a/",
      "duplicateCount": 3,
      "lessons": [
        {
          "id": 123,
          "nativeLanguage": "English",
          "targetLanguage": "Spanish",
          "lessonData": {...},
          "lessonDisplay": "...",
          "createdAt": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

### POST `/api/regenerate-duplicate`
Regenerates a single lesson with duplicate vowel.

**Request:**
```json
{
  "lessonId": 123,
  "dryRun": true
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "originalLesson": {...},
    "newLesson": {
      "display": "...",
      "data": {...}
    },
    "originalVowel": "/a/",
    "newVowel": "/e/",
    "regeneratedAt": "2024-01-01T00:00:00Z",
    "replaced": false
  }
}
```

### POST `/api/clear-duplicate-cache`
Clears the duplicate vowel detection cache.

**Response:**
```json
{
  "success": true,
  "message": "Duplicate vowel cache cleared"
}
```

## Technical Implementation

### Architecture
- **Frontend Service**: `src/services/duplicateVowelManager.js` (for potential future frontend integration)
- **Backend Service**: `scripts/lib/duplicate-vowel-manager.mjs` (Node.js compatible)
- **Admin Server Integration**: `scripts/local-admin-server.mjs` (API endpoints)
- **UI Components**: Integrated into `admin-dashboard.html`

### Database Operations
- **Read Operations**: Scans `generated_lessons` table for duplicates
- **Write Operations**: Updates lessons in place (preserves lesson ID)
- **Indexing**: Uses language pair and vowel IPA for efficient grouping

### Lesson Generation
- **Prompt System**: Uses the same `PROMPT_TEMPLATE` as the main app
- **GPT-5 Integration**: Leverages GPT-5 with web search capabilities
- **Validation**: Applies `validateAndFixLessonData` for consistency
- **Collision Detection**: Checks existing vowels to prevent new duplicates

### Error Handling
- **Retry Logic**: Up to 3 retries for vowel conflicts
- **Graceful Degradation**: Continues operation even if some lessons fail
- **Detailed Logging**: Comprehensive logging for debugging
- **User Feedback**: Clear error messages in the UI

## Best Practices

### When to Use
- **After Bulk Imports**: When importing lessons from external sources
- **Database Maintenance**: Regular cleanup of duplicate content
- **Quality Assurance**: Before deploying lessons to production
- **Content Review**: When reviewing lesson quality and uniqueness

### Workflow Recommendations
1. **Regular Scanning**: Run duplicate scans weekly or after major changes
2. **Preview First**: Always preview regenerated lessons before applying
3. **Batch Processing**: Handle multiple duplicates in a systematic way
4. **Backup Strategy**: Consider backing up lessons before bulk regeneration
5. **Quality Review**: Manually review regenerated lessons for quality

### Performance Considerations
- **Caching**: Results are cached for 5 minutes to reduce database load
- **Batch Operations**: Process duplicates in reasonable batches
- **Database Connections**: Properly managed database connections
- **Memory Usage**: Efficient memory usage for large lesson sets

## Troubleshooting

### Common Issues

**No Duplicates Found**
- Verify lessons exist in the database
- Check that lessons have valid vowel IPA data
- Clear cache and try again

**Regeneration Fails**
- Check OpenAI API key configuration
- Verify database connectivity
- Review error logs for specific issues

**Generated Lesson Still Duplicate**
- System will retry up to 3 times automatically
- May indicate limited vowel space for language pair
- Consider manual intervention for edge cases

### Debugging
- Check browser console for frontend errors
- Review admin server logs for backend issues
- Use database queries to verify lesson data integrity
- Test API endpoints directly if needed

## Future Enhancements

### Planned Features
- **Bulk Regeneration**: Process multiple duplicates simultaneously
- **Advanced Filtering**: Filter duplicates by language pair or date
- **Export/Import**: Export duplicate reports and import fixes
- **Automated Scheduling**: Scheduled duplicate detection and cleanup
- **Quality Metrics**: Track regeneration success rates and quality scores

### Integration Opportunities
- **Main App Integration**: Duplicate detection during lesson creation
- **CI/CD Pipeline**: Automated duplicate checking in deployment pipeline
- **Analytics Dashboard**: Duplicate trends and statistics
- **Content Management**: Integration with broader content management workflows

## Security Considerations

- **Input Validation**: All lesson IDs and parameters are validated
- **Database Security**: Uses parameterized queries to prevent SQL injection
- **Access Control**: Admin dashboard requires appropriate access
- **Data Integrity**: Maintains referential integrity during updates
- **Audit Trail**: Logs all regeneration operations for accountability

## Support

For issues or questions about the Duplicate Vowel Management System:

1. Check this documentation first
2. Review the admin server logs
3. Test API endpoints directly
4. Check database connectivity and data integrity
5. Verify OpenAI API configuration

The system is designed to be robust and self-healing, with comprehensive error handling and retry logic to ensure reliable operation.