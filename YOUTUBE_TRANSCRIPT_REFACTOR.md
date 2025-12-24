# YouTube Transcript Ingestion Refactor

## Summary

Refactored the YouTube transcript ingestion system to be more reliable and resilient against bot detection. The new implementation uses a robust fallback chain with Supadata.ai as the primary method, followed by yt-dlp, and then existing fallback methods.

## Changes Made

### 1. New Files Created

#### `lib/ingestion/youtube-supadata.ts`
- **Purpose**: Primary method for fetching YouTube transcripts via Supadata.ai API
- **Features**:
  - Uses Supadata.ai API endpoint: `https://api.supadata.ai/v1/youtube/transcript`
  - Bearer token authentication with `SUPADATA_API_KEY` environment variable
  - 30-second request timeout
  - Flexible response parsing (handles multiple response formats)
  - Graceful fallback if API key is not configured
  - Normalizes timestamps to milliseconds

#### `lib/ingestion/youtube-ytdlp.ts`
- **Purpose**: Secondary fallback using yt-dlp (highly reliable)
- **Features**:
  - Uses `yt-dlp-wrap` npm package
  - Downloads subtitles in TTML format (preserves timestamps)
  - Supports multiple subtitle formats (TTML, VTT, SRT)
  - Automatic cleanup of temporary files
  - 60-second timeout for yt-dlp operations
  - Graceful error handling if yt-dlp is not available

### 2. Modified Files

#### `lib/ingestion/youtube.ts`
- **Refactored `fetchTranscriptWithFallbacks()` function**:
  - Now accepts optional `videoUrl` parameter for Supadata.ai
  - New fallback chain order:
    1. **Supadata.ai** (primary - most reliable, avoids bot detection)
    2. **yt-dlp** (secondary - highly reliable)
    3. **youtube-transcript package** (existing method)
    4. **timedtext endpoint** (existing method, with timeout)
    5. **Page scraping** (existing method, with timeout)
  - Returns empty array instead of throwing errors (allows ASR fallback)
  - All methods now use proper TypeScript types (`YouTubeTranscriptItem[]`)
  - Added timeout handling to fetch requests

- **Updated `getYouTubeTranscript()` function**:
  - Accepts `videoUrl` in options parameter
  - Updated metadata type to include "supadata" and "ytdlp" as possible sources
  - Passes videoUrl to fallback chain

#### `app/api/ingest/route.ts`
- Updated call to `getYouTubeTranscript()` to pass `videoUrl: url` parameter
- This allows Supadata.ai to use the full URL if needed

#### `app/api/process/route.ts`
- Updated call to `getYouTubeTranscript()` to pass `videoUrl: content.raw_url` parameter
- Maintains compatibility when re-processing YouTube content

### 3. Dependencies Added

- **yt-dlp-wrap**: Added to `package.json`
  - Wrapper for yt-dlp tool
  - Handles subtitle extraction reliably
  - Note: Requires yt-dlp to be installed on the system (or will download automatically if configured)

## Environment Variables

### New Required Variable (Optional)

```env
# Supadata.ai API Key (optional - falls back to other methods if not set)
SUPADATA_API_KEY=your_supadata_api_key_here
```

**Note**: This is optional. If not set, the system will automatically fall back to yt-dlp and other methods.

## Fallback Chain Details

### Priority Order

1. **Supadata.ai** (NEW - Primary)
   - Most reliable method
   - Avoids bot detection
   - Requires API key (optional)
   - Fast response time (~1-2 seconds)

2. **yt-dlp** (NEW - Secondary)
   - Highly reliable
   - System dependency (yt-dlp must be installed)
   - Slower (~10-30 seconds)
   - Works with most videos

3. **youtube-transcript package** (Existing)
   - Fast but frequently blocked
   - Multiple language attempts (en, en-US, en-GB, asr)

4. **timedtext endpoint** (Existing)
   - Direct API call
   - No authentication needed
   - Often blocked by YouTube

5. **Page scraping** (Existing)
   - Last resort before ASR
   - Parses HTML from YouTube page
   - Fragile and frequently breaks

6. **AssemblyAI ASR** (Final fallback)
   - Requires API key and quota
   - Slow but reliable
   - Consumes user quota

## Error Handling

- **Graceful Degradation**: Each method fails silently and moves to the next
- **Timeout Protection**: All external requests have timeouts (15-60 seconds)
- **User-Friendly Messages**: Clear error messages when all methods fail
- **Logging**: Detailed logging for debugging each method attempt

## Type Safety

- All transcript items use consistent `YouTubeTranscriptItem` interface
- Proper TypeScript types throughout
- No `any` types in public APIs

## Caching

- Existing cache mechanism preserved
- Checks for existing transcripts with same `raw_url` before fetching
- Reuses cached transcripts to avoid unnecessary API calls

## Performance Considerations

- **Supadata.ai**: Fastest method (~1-2 seconds)
- **yt-dlp**: Slower but reliable (~10-30 seconds)
- **Timeouts**: Prevent hanging on slow/failed requests
- **Parallel attempts**: Not implemented (sequential for simplicity and quota management)

## Testing Recommendations

1. **Test with Supadata.ai key**:
   - Verify successful transcript fetch
   - Test with various YouTube URLs and video IDs
   - Verify timestamp preservation

2. **Test without Supadata.ai key**:
   - Verify fallback to yt-dlp and other methods
   - Ensure no errors when key is missing

3. **Test yt-dlp availability**:
   - Verify works if yt-dlp is installed
   - Verify graceful failure if not installed

4. **Test full fallback chain**:
   - Disable Supadata.ai (no key)
   - Disable yt-dlp (simulate failure)
   - Verify existing methods still work
   - Verify ASR fallback works

## Known Limitations

1. **yt-dlp dependency**: Requires yt-dlp to be installed on the system or configured to auto-download
2. **Supadata.ai API**: Requires API key for production use (free tier may be available)
3. **Serverless environments**: yt-dlp may not work in serverless environments (Lambda, Vercel Edge) - will gracefully fall back

## Migration Notes

- **Backward Compatible**: All existing functionality preserved
- **No Database Changes**: No schema changes required
- **No API Contract Changes**: API endpoints remain the same
- **Environment Variables**: New optional variable added

## Future Improvements

1. **Parallel attempts**: Try multiple methods in parallel for faster results
2. **Caching**: Add Redis cache for transcripts across users
3. **Retry logic**: Add exponential backoff for transient failures
4. **Metrics**: Track success rates of each method
5. **Configuration**: Allow users to prefer specific methods

## Files Changed Summary

```
Created:
- lib/ingestion/youtube-supadata.ts (new)
- lib/ingestion/youtube-ytdlp.ts (new)

Modified:
- lib/ingestion/youtube.ts (refactored)
- app/api/ingest/route.ts (updated)
- app/api/process/route.ts (updated)
- package.json (added yt-dlp-wrap dependency)
```

## Deployment Checklist

- [ ] Add `SUPADATA_API_KEY` to environment variables (optional)
- [ ] Ensure yt-dlp is installed on server (or configure auto-download)
- [ ] Test transcript fetching with various YouTube videos
- [ ] Monitor logs for method success rates
- [ ] Verify ASR fallback still works correctly

---

**Date**: January 2025  
**Author**: AI Assistant  
**Status**: Complete and Ready for Testing

