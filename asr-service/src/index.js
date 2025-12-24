const express = require("express")
const { OpenAI } = require("openai")
const YtDlpWrap = require("yt-dlp-wrap").default
const fs = require("fs")
const os = require("os")
const path = require("path")

const app = express()
app.use(express.json())

// OPENAI_API_KEY must be set in this service's environment
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Lazily ensure we have a yt-dlp binary available, even on hosts like Render
// where it's not preinstalled.
let ytDlpBinaryPath = null

async function ensureYtDlpBinary() {
  if (ytDlpBinaryPath && fs.existsSync(ytDlpBinaryPath)) {
    return ytDlpBinaryPath
  }

  const binDir = path.join(os.tmpdir(), "learnchat-yt-dlp")
  try {
    fs.mkdirSync(binDir, { recursive: true })
  } catch {
    // ignore
  }

  const targetPath = path.join(
    binDir,
    process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp"
  )

  if (!fs.existsSync(targetPath)) {
    console.log("[ASR service] yt-dlp binary not found, downloading from GitHub...")
    await YtDlpWrap.downloadFromGithub(targetPath)
    console.log("[ASR service] yt-dlp binary downloaded to", targetPath)
  }

  ytDlpBinaryPath = targetPath
  return ytDlpBinaryPath
}

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "learnchat-asr-service" })
})

app.post("/transcribe", async (req, res) => {
  try {
    const { videoUrl } = req.body || {}
    if (!videoUrl || typeof videoUrl !== "string") {
      return res.status(400).json({ error: "videoUrl is required" })
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "learnchat-asr-"))
    const outPath = path.join(tmpDir, "audio.%(ext)s")

    // 1) Ensure we have yt-dlp and download audio
    const binaryPath = await ensureYtDlpBinary()
    const ytDlp = new YtDlpWrap(binaryPath)

    await ytDlp.execPromise([
      videoUrl,
      "--extract-audio",
      "--audio-format",
      "mp3",
      "-o",
      outPath,
    ])

    const files = fs.readdirSync(tmpDir)
    const audioFile = files.find((f) => f.startsWith("audio."))
    if (!audioFile) {
      throw new Error("Audio file not found after yt-dlp run")
    }

    const fullPath = path.join(tmpDir, audioFile)

    // 2) Call Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(fullPath),
      model: "whisper-1",
      response_format: "verbose_json",
    })

    // Clean up temp dir
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch {
      // ignore cleanup errors
    }

    const items = (transcription.segments || []).map((s) => ({
      text: s.text || "",
      offset: Math.round((s.start || 0) * 1000),
      duration: Math.round(
        ((s.end ?? s.start ?? 0) - (s.start || 0)) * 1000
      ),
    }))

    return res.json({
      transcript: transcription.text || "",
      items,
    })
  } catch (err) {
    console.error("ASR error", err)
    return res.status(500).json({
      error: "ASR failed",
      detail: err?.message || String(err),
    })
  }
})

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`learnchat-asr-service listening on port ${port}`)
})


