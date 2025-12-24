// Test YouTube API key access and restrictions
const apiKey = process.env.YOUTUBE_API_KEY || 'AIzaSyAETIGbBvCE1tJ_-3A_UbDxxibTbvK9J74';
const testVideoId = 'czpweFYym9g'; // Khan Academy video

async function testYouTubeAPI() {
  console.log('Testing YouTube Data API v3 access...\n');
  console.log(`API Key (first 20 chars): ${apiKey.substring(0, 20)}...`);
  console.log(`Test Video ID: ${testVideoId}\n`);

  // Test 1: Check if API key works for basic video info
  console.log('Test 1: Fetching video details...');
  try {
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${testVideoId}&key=${apiKey}`
    );
    
    const videoData = await videoResponse.json();
    
    if (!videoResponse.ok) {
      console.error('❌ API Error:', videoData);
      if (videoData.error) {
        console.error('Error Code:', videoData.error.code);
        console.error('Error Message:', videoData.error.message);
        if (videoData.error.errors) {
          videoData.error.errors.forEach(err => {
            console.error(`  - ${err.domain}: ${err.reason} - ${err.message}`);
          });
        }
      }
      return;
    }
    
    if (videoData.items && videoData.items.length > 0) {
      console.log('✅ Video found:', videoData.items[0].snippet.title);
      console.log('   Channel:', videoData.items[0].snippet.channelTitle);
    } else {
      console.log('⚠️  Video not found');
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }

  // Test 2: Check caption tracks (requires OAuth, but let's see the error)
  console.log('\nTest 2: Checking caption tracks...');
  try {
    const captionsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${testVideoId}&key=${apiKey}`
    );
    
    const captionsData = await captionsResponse.json();
    
    console.log('Response Status:', captionsResponse.status, captionsResponse.statusText);
    
    if (!captionsResponse.ok) {
      if (captionsData.error) {
        console.log('❌ Error Code:', captionsData.error.code);
        console.log('❌ Error Message:', captionsData.error.message);
        if (captionsData.error.errors) {
          captionsData.error.errors.forEach(err => {
            console.log(`  - ${err.domain}: ${err.reason} - ${err.message}`);
            if (err.reason === 'insufficientPermissions' || err.reason === 'forbidden') {
              console.log('    ⚠️  This endpoint requires OAuth authentication, not just API key');
            }
          });
        }
      }
    } else {
      console.log('✅ Caption tracks found:', captionsData.items?.length || 0);
      if (captionsData.items && captionsData.items.length > 0) {
        console.log('   First track:', captionsData.items[0].snippet);
        
        // Test 2b: Try to download a caption track
        console.log('\nTest 2b: Attempting to download caption track...');
        const trackId = captionsData.items[0].id;
        const downloadResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/captions/${trackId}?key=${apiKey}`,
          {
            headers: {
              'Accept': 'text/xml'
            }
          }
        );
        
        console.log('Download Status:', downloadResponse.status, downloadResponse.statusText);
        if (!downloadResponse.ok) {
          const downloadError = await downloadResponse.json().catch(() => ({ error: 'Could not parse error' }));
          console.log('❌ Download Error:', downloadError);
        } else {
          const captionText = await downloadResponse.text();
          console.log('✅ Caption downloaded! Length:', captionText.length, 'characters');
          console.log('   Preview (first 200 chars):', captionText.substring(0, 200));
        }
      }
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }

  // Test 3: Check API quota
  console.log('\nTest 3: API Quota Information');
  console.log('Note: YouTube Data API v3 has daily quotas:');
  console.log('  - Free tier: 10,000 units per day');
  console.log('  - Video list: 1 unit per request');
  console.log('  - Captions.list: Requires OAuth (not available with API key only)');
}

testYouTubeAPI();

