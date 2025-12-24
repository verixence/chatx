# YouTube API Setup Guide

This guide will help you get a YouTube API key for fetching video transcripts in LearnChat.

## Why Do We Need YouTube API?

The YouTube API allows us to:
- Fetch video metadata
- Get video transcripts (though we primarily use `youtube-transcript` library which doesn't require API)
- Verify video URLs
- Get video information (title, description, etc.)

**Note**: For basic transcript fetching, the `youtube-transcript` library works without an API key. However, having an API key is useful for:
- Getting video metadata (title, description, thumbnail)
- Verifying video accessibility
- Better error handling

## Step-by-Step Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **New Project**
4. Enter project name: `LearnChat` (or your preferred name)
5. Click **Create**
6. Wait for the project to be created and select it

### Step 2: Enable YouTube Data API v3

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "YouTube Data API v3"
3. Click on **YouTube Data API v3**
4. Click **Enable**
5. Wait for the API to be enabled

### Step 3: Create API Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. A popup will show your API key - **copy it immediately** (you can't see it again)
4. Click **Restrict Key** (recommended for security)

### Step 4: Restrict API Key (Recommended)

1. Under **API restrictions**, select **Restrict key**
2. Choose **YouTube Data API v3** from the dropdown
3. Under **Application restrictions**:
   - For development: Select **None** (or **HTTP referrers** and add `localhost:3000`)
   - For production: Use **HTTP referrers** and add your domain
4. Click **Save**

### Step 5: Add to Environment Variables

Add your API key to `.env`:

```env
YOUTUBE_API_KEY="your-api-key-here"
```

## Usage in LearnChat

The YouTube API key is used in:
- `lib/ingestion/youtube.ts` - For fetching video metadata
- `app/api/ingest/route.ts` - For validating YouTube URLs

## Free Tier Limits

Google provides:
- **10,000 units per day** (free tier)
- Each API call costs different units:
  - Video list: 1 unit
  - Video details: 1 unit
  - Search: 100 units

For LearnChat, we primarily use the `youtube-transcript` library which doesn't count against API quotas.

## Troubleshooting

### "API key not valid" error
- Verify the API key is correct
- Check that YouTube Data API v3 is enabled
- Ensure API key restrictions allow your domain/IP

### "Quota exceeded" error
- You've exceeded the free tier limit
- Wait 24 hours or upgrade to a paid plan
- Consider using `youtube-transcript` library more (doesn't use API quota)

### "Access denied" error
- Check API key restrictions
- Verify the API is enabled for your project

## Alternative: Using youtube-transcript Library

The `youtube-transcript` library (already in dependencies) works without an API key for most videos. It:
- ✅ Doesn't require API key
- ✅ No quota limits
- ✅ Works for most public videos
- ❌ Doesn't provide video metadata
- ❌ May not work for some restricted videos

For LearnChat MVP, you can skip the YouTube API key if you only need transcripts.

## Resources

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [API Quota Information](https://developers.google.com/youtube/v3/getting-started#quota)
- [youtube-transcript Library](https://www.npmjs.com/package/youtube-transcript)

