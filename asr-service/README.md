# LearnChat ASR Service

Small Node.js service that powers LearnChat's Automatic Speech Recognition (ASR) fallback
for YouTube videos (when captions are missing or inaccessible).

It:

- Downloads audio from a YouTube URL using **yt-dlp**
- Transcribes the audio using **OpenAI Whisper (`whisper-1`)**
- Returns a JSON payload with:
  - `transcript`: full text
  - `items`: array of `{ text, offset, duration }` segments in **milliseconds**

## Local setup

From the project root:

```bash
cd asr-service
npm install
```

You must also have:

- `yt-dlp` installed on your machine
- `ffmpeg` installed

On macOS with Homebrew:

```bash
brew install yt-dlp ffmpeg
```

Then create a `.env` file (or export in your shell) with:

```bash
export OPENAI_API_KEY=your_openai_key_here
```

Run the service:

```bash
cd asr-service
npm start
```

The service will listen on `http://localhost:4000`.

- Health check: `GET /`
- Transcription: `POST /transcribe` with JSON body:

```json
{
  "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

Response (shape expected by the main LearnChat app):

```json
{
  "transcript": "full text...",
  "items": [
    {
      "text": "segment text",
      "offset": 1234,
      "duration": 2000
    }
  ]
}
```

## Deploying separately (Render / Fly / VM)

1. Push this folder as its own repo (or point your platform at `asr-service/`).
2. Ensure the build step installs **yt-dlp** and **ffmpeg** (platform-specific).
3. Set environment variable:

   - `OPENAI_API_KEY=your_openai_key_here`

4. Once deployed, you'll get a URL like:

   - `https://learnchat-asr-service.onrender.com`

   The full transcription endpoint is:

   - `https://learnchat-asr-service.onrender.com/transcribe`

5. In your **Vercel LearnChat** project, set:

   - `ASR_SERVICE_URL` to that `/transcribe` URL.

The main app's `lib/ingestion/youtube.ts` is already wired to:

- Use caption-based transcripts first (fast path)
- Call `ASR_SERVICE_URL` when captions are missing
- Fall back to local ASR only when `ASR_SERVICE_URL` is not set (e.g. on your dev machine)


