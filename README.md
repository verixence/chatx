# LearnChat - AI-Powered Learning Platform

LearnChat is an AI-driven learning workspace inspired by YouLearn.ai. It focuses on **YouTube-first study flows** (video → transcript → summary → chat → quizzes → flashcards) and also supports PDF/text content.

## Features 

- **YouTube Video Summarizer (YouLearn-style)**  
  - Instant transcript fetch for captioned videos (using `youtube-transcript` with fallbacks)  
  - ASR fallback via Whisper + `yt-dlp`/`ffmpeg` when captions are missing  
  - Two-column layout: player + chapters/transcript on the left, Summary/Chat/Quiz/Flashcards on the right  
  - Clickable timestamps in summaries, chat citations, and transcripts that seek in the player

- **Multi-Format Content Ingestion**: Upload YouTube links, PDFs, and raw text
- **AI-Powered Processing**: Automatic summarization, chunking, and knowledge extraction
- **Interactive Chat**: RAG-powered AI tutor that answers questions about your content
- **Quiz Generation**: AI-generated quizzes with multiple choice and short answer questions
- **Flashcards**: Spaced repetition algorithm for effective long-term learning
- **Workspaces**: Organize your learning materials in dedicated workspaces
- **Collaboration**: Share workspaces with others via shareable links
- **Progress Tracking**: Analytics dashboard to track your learning progress
- **Configurable AI Providers**: Choose between OpenAI and Grok for content processing

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Lucide icons
- **Backend**: Next.js Route Handlers (API Routes)
- **Database**: PostgreSQL (Supabase) with Prisma ORM
- **AI**: LangChain.js, OpenAI SDK (GPT‑4o + Whisper), Grok API
- **Vector Search**: Supabase PG Vector
- **Authentication**: NextAuth.js (credentials, OAuth-ready)
- **Billing**: Stripe

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (Supabase recommended)
- OpenAI API key (for GPT‑4o + Whisper)
- (Optional) Grok API key
- (Optional) Stripe account for billing
- For robust YouTube support:
  - `yt-dlp` installed on your system (e.g. `brew install yt-dlp` on macOS)
  - `ffmpeg` installed (e.g. `brew install ffmpeg` on macOS)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd LearnChat
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Copy the example:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add at minimum:

- **Database / Supabase**
  - `DATABASE_URL` (or Supabase `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` if you’re using Supabase)
- **Auth**
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
- **AI Providers**
  - `OPENAI_API_KEY`
  - (Optional) `GROK_API_KEY`
- **YouTube**
  - `YOUTUBE_API_KEY` (for metadata and caption-track listing – no OAuth needed)
- **Stripe (optional)**
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, etc.

See `YOUTUBE_API_SETUP.md`, `SUPABASE_SETUP.md`, and `SUPABASE_MCP_GUIDE.md` for provider-specific details.

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

### YouTube Summarizer Flow (local)

1. **Login** and create a workspace.
2. Click **“New Workspace”** or use an existing workspace.
3. Use **“Add content”** and paste a YouTube URL (captioned videos are instant).
4. Wait for ingestion + processing to complete, then click into the content row.
5. You’ll see the **YouTube player + Transcript** on the left and **Summary / Chat / Quizzes / Flashcards** on the right.

For detailed manual test cases (including known good/bad videos), see `TESTING_GUIDE.md` and `YOUTUBE_API_SETUP.md`.

## Project Structure

```
LearnChat/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── workspace/        # Workspace components
│   ├── chat/             # Chat interface
│   └── quiz/             # Quiz components
├── lib/                  # Utility libraries
│   ├── ai/               # AI processing (LangChain, RAG)
│   ├── db/               # Database client
│   ├── ingestion/        # Content ingestion logic
│   └── flashcards/      # Spaced repetition algorithm
├── prisma/               # Prisma schema
└── types/                # TypeScript type definitions
```

## Key Features Implementation

### Content Ingestion
- PDF extraction using pdf-parse
- YouTube transcript fetching
- Text chunking with overlap for better context

### AI Processing
- LangChain chains for summarization, quiz generation, and flashcard creation
- RAG (Retrieval-Augmented Generation) for context-aware chat
- Configurable AI providers (OpenAI/Grok)

### Spaced Repetition
- SM-2 algorithm implementation for flashcard scheduling
- Automatic review scheduling based on performance

### Workspace Management
- Create and organize workspaces
- Share workspaces with shareable links
- Content organization and tagging

## Environment Variables

See `.env.example` for all required environment variables.

## Database Schema

The application uses Prisma with the following main models:
- User: User accounts and preferences
- Workspace: Learning workspaces
- Content: Uploaded learning materials
- ProcessedContent: AI-processed content with chunks and embeddings
- ChatSession: Chat conversation history
- Quiz & QuizAttempt: Quiz generation and attempts
- Flashcard & FlashcardReview: Flashcards and review history
- UserProgress: Learning progress tracking

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/ingest` - Content ingestion
- `/api/process` - AI content processing
- `/api/chat` - Chat with AI tutor
- `/api/quiz/*` - Quiz generation and submission
- `/api/flashcards/*` - Flashcard generation and review
- `/api/workspace/*` - Workspace management
- `/api/billing/*` - Stripe billing integration

## Deployment

1. Set up a PostgreSQL database (e.g., Supabase, Railway, or Vercel Postgres)
2. Deploy to Vercel or your preferred platform
3. Configure environment variables
4. Run database migrations: `npx prisma db push`
5. Set up Stripe webhooks (if using billing)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

