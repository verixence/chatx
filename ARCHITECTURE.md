# LearnChat - Complete Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Architecture Patterns](#architecture-patterns)
5. [Database Schema](#database-schema)
6. [API Routes](#api-routes)
7. [Authentication & Authorization](#authentication--authorization)
8. [Content Ingestion Flow](#content-ingestion-flow)
9. [AI Processing Pipeline](#ai-processing-pipeline)
10. [RAG Implementation](#rag-implementation)
11. [Components & UI](#components--ui)
12. [File Storage](#file-storage)
13. [Environment Variables](#environment-variables) 
14. [Deployment Architecture](#deployment-architecture) 

---
 
## Overview
  
LearnChat is an AI-powered learning platform that  transforms learning materials (YouTube videos, PDFs, text) into interactive study experiences. The platform provides: 

- **Content Ingestion**: Multi-format content processing (YouTube, PDF, Text)
- **AI Summarization**: Automatic content summarization with structured markdown
- **Interactive Chat**: RAG-powered AI tutor for contextual Q&A
- **Quiz Generation**: AI-generated quizzes with multiple formats
- **Flashcards**: Spaced repetition system using SM-2 algorithm       
- **Workspace Management**: Organized learning spaces with sharing capabilities
- **Progress Tracking**: Analytics and learning progress monitoring

### Key Design Principles

1. **YouTube-First Design**: Optimized for YouTube video learning flows
2. **RAG-Powered**: Retrieval-Augmented Generation for accurate, contextual responses
3. **Multi-Provider AI**: Support for OpenAI, Anthropic, and Grok
4. **Workspace-Based Organization**: Content organized in user workspaces
5. **Real-time Processing**: Asynchronous content processing pipeline

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **React**: 18.3.0
- **TypeScript**: 5.5.0 (strict mode enabled)
- **Styling**: Tailwind CSS 3.4.0 + shadcn/ui components
- **Icons**: Lucide React 0.427.0
- **Animations**: Framer Motion 11.3.0
- **State Management**: Zustand 4.5.0
- **Data Fetching**: TanStack React Query 5.56.0
- **Markdown Rendering**: react-markdown 9.0.1 + remark-gfm 4.0.0
- **Video Player**: react-player 2.16.0
- **Charts**: Recharts 2.12.0

### Backend
- **Runtime**: Node.js 18+
- **API Framework**: Next.js Route Handlers (API Routes)
- **Authentication**: NextAuth.js 4.24.7 (JWT strategy)
- **Database**: PostgreSQL via Supabase
- **ORM**: Direct Supabase client (no Prisma)

### AI & ML
- **AI Framework**: LangChain.js 0.3.0
- **LLM Providers**:
  - OpenAI (GPT-4o) - via @langchain/openai
  - Anthropic (Claude 3.5 Sonnet) - via @langchain/anthropic
  - Grok (Beta) - via OpenAI-compatible API
- **Embeddings**: OpenAI text-embedding-3-small
- **Vector Search**: Cosine similarity (in-memory) with Supabase PG Vector support
- **Transcription**: AssemblyAI 4.22.0 (ASR fallback)

### Data Processing
- **PDF Parsing**: pdf-parse 1.1.1 (direct import from lib/pdf-parse)
- **YouTube Transcripts**: 
  - youtube-transcript 1.2.1 (primary)
  - youtube-transcript-api 3.0.6 (fallback)
  - Direct scraping fallbacks

### Storage
- **File Storage**: Supabase Storage (learnchat-files bucket)
- **Database**: Supabase PostgreSQL

### Utilities
- **Date Handling**: date-fns 3.6.0
- **Validation**: Zod 3.23.0
- **Password Hashing**: bcryptjs 2.4.3
- **Class Utilities**: clsx 2.1.1, tailwind-merge 2.4.0, class-variance-authority 0.7.0

---

## Project Structure

```
LearnChat/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication route group
│   │   ├── login/
│   │   │   └── page.tsx         # Login page
│   │   └── signup/
│   │       └── page.tsx         # Signup page
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── layout.tsx           # Dashboard layout with auth check
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Main dashboard
│   │   ├── explore/
│   │   │   └── page.tsx         # Explore workspaces
│   │   ├── settings/
│   │   │   └── page.tsx         # User settings
│   │   └── workspace/
│   │       ├── [id]/
│   │       │   ├── page.tsx     # Workspace overview
│   │       │   ├── chat/
│   │       │   │   └── page.tsx # Chat interface
│   │       │   ├── content/
│   │       │   │   └── [contentId]/
│   │       │   │       ├── page.tsx
│   │       │   │       ├── ContentDetailClient.tsx
│   │       │   │       └── ProcessButton.tsx
│   │       │   ├── flashcards/
│   │       │   │   └── page.tsx # Flashcard review
│   │       │   └── quiz/
│   │       │       └── page.tsx # Quiz interface
│   │       └── new/
│   │           └── page.tsx     # Create workspace
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   │   └── route.ts     # NextAuth handler
│   │   │   └── signup/
│   │   │       └── route.ts     # User registration
│   │   ├── analytics/
│   │   │   └── route.ts         # Analytics endpoints
│   │   ├── chat/
│   │   │   ├── route.ts         # Chat message handling
│   │   │   └── sessions/
│   │   │       └── route.ts     # Chat session management
│   │   ├── flashcards/
│   │   │   ├── generate/
│   │   │   │   └── route.ts     # Generate flashcards
│   │   │   └── [id]/review/
│   │   │       └── route.ts     # Flashcard review
│   │   ├── ingest/
│   │   │   ├── route.ts         # Content ingestion
│   │   │   └── test/
│   │   │       └── route.ts     # Test ingestion
│   │   ├── process/
│   │   │   └── route.ts         # AI content processing
│   │   ├── quiz/
│   │   │   ├── generate/
│   │   │   │   └── route.ts     # Generate quizzes
│   │   │   └── [id]/
│   │   │       └── route.ts     # Quiz submission
│   │   ├── settings/
│   │   │   └── route.ts         # User settings API
│   │   └── workspace/
│   │       ├── route.ts         # Workspace CRUD
│   │       ├── [id]/
│   │       │   └── route.ts     # Workspace operations
│   │       └── [id]/share/
│   │           └── route.ts     # Workspace sharing
│   ├── youtube-summarizer/
│   │   └── page.tsx             # YouTube summarizer page
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
│
├── components/                   # React components
│   ├── chat/
│   │   └── ChatInterface.tsx    # Chat UI component
│   ├── flashcards/
│   │   └── FlashcardsInterface.tsx
│   ├── layout/
│   │   └── DashboardNav.tsx     # Navigation component
│   ├── providers/
│   │   └── SessionProvider.tsx  # NextAuth session provider
│   ├── quiz/
│   │   └── QuizInterface.tsx    # Quiz UI component
│   ├── settings/
│   │   └── SettingsInterface.tsx
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   └── textarea.tsx
│   └── workspace/
│       ├── ContentUpload.tsx    # Content upload UI
│       ├── ShareWorkspace.tsx   # Sharing interface
│       └── WorkspaceView.tsx    # Workspace display
│
├── lib/                         # Utility libraries
│   ├── ai/
│   │   ├── chains.ts           # LangChain prompt chains
│   │   ├── embeddings.ts       # Embedding generation
│   │   ├── providers.ts        # AI provider abstraction
│   │   └── rag.ts              # RAG implementation
│   ├── auth/
│   │   └── config.ts           # NextAuth configuration
│   ├── db/
│   │   ├── queries.ts          # Database query functions
│   │   ├── supabase-browser.ts # Browser client (if exists)
│   │   └── supabase.ts         # Supabase client & types
│   ├── flashcards/
│   │   └── spaced-repetition.ts # SM-2 algorithm
│   ├── ingestion/
│   │   ├── pdf.ts              # PDF extraction
│   │   ├── text.ts             # Text chunking
│   │   └── youtube.ts          # YouTube transcript fetching
│   ├── storage/
│   │   └── supabase.ts         # File storage utilities
│   └── utils/
│       └── cn.ts               # className utility
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql # Database schema
│
├── types/
│   └── next-auth.d.ts          # NextAuth type extensions
│
├── middleware.ts                # Next.js middleware (route protection)
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies

```

---

## Architecture Patterns

### 1. Next.js App Router
- **File-based Routing**: Routes defined by folder structure
- **Route Groups**: `(auth)` and `(dashboard)` for organization without affecting URLs
- **Server Components**: Default rendering on server
- **API Routes**: Route handlers in `app/api/` directory

### 2. Server-Side Authentication
- **Middleware Protection**: `middleware.ts` protects `/dashboard` and `/workspace` routes
- **Server Session**: `getServerSession()` in API routes and layouts
- **JWT Strategy**: Stateless authentication via NextAuth

### 3. Component Architecture
- **Client Components**: Marked with `"use client"` for interactivity
- **Server Components**: Default for data fetching and initial render
- **Composition**: Small, reusable UI components from shadcn/ui

### 4. Data Layer
- **Supabase Client**: Direct database queries (no ORM)
- **Query Functions**: Centralized in `lib/db/queries.ts`
- **Type Safety**: TypeScript interfaces for all database entities

### 5. AI Processing
- **Chain Pattern**: LangChain RunnableSequence for AI operations
- **Provider Abstraction**: Unified interface for multiple AI providers
- **Async Processing**: Content processed asynchronously after ingestion

---

## Database Schema

### Core Tables

#### `users`
- **id**: UUID (PK)
- **email**: TEXT (UNIQUE, NOT NULL)
- **name**: TEXT (nullable)
- **image**: TEXT (nullable)
- **subscription**: TEXT (default: 'free', CHECK: 'free' | 'pro')
- **usage_limits**: JSONB (default: `{uploadsToday: 0, uploadsLimit: 3, lastReset: null}`)
- **ai_provider**: TEXT (default: 'openai', CHECK: 'openai' | 'grok' | 'anthropic')
- **created_at**: TIMESTAMPTZ
- **updated_at**: TIMESTAMPTZ

**Usage Limits Structure**:
```json
{
  "uploadsToday": 0,
  "uploadsLimit": 3,
  "lastReset": null,
  "asrMonth": "2025-1",
  "asrUsage": 0,
  "asrLimit": 5
}
```

#### `workspaces`
- **id**: UUID (PK)
- **user_id**: UUID (FK → users.id, ON DELETE CASCADE)
- **name**: TEXT (NOT NULL)
- **description**: TEXT (nullable)
- **tags**: TEXT[] (default: '{}')
- **shared**: BOOLEAN (default: FALSE)
- **share_token**: TEXT (UNIQUE, nullable)
- **created_at**: TIMESTAMPTZ
- **updated_at**: TIMESTAMPTZ

**Indexes**: `idx_workspaces_user_id`

#### `contents`
- **id**: UUID (PK)
- **workspace_id**: UUID (FK → workspaces.id, ON DELETE CASCADE)
- **type**: TEXT (CHECK: 'pdf' | 'youtube' | 'audio' | 'video' | 'text')
- **raw_url**: TEXT (nullable)
- **extracted_text**: TEXT (nullable)
- **metadata**: JSONB (nullable)
- **status**: TEXT (default: 'processing', CHECK: 'processing' | 'complete' | 'error')
- **file_size**: INTEGER (nullable)
- **created_at**: TIMESTAMPTZ
- **updated_at**: TIMESTAMPTZ

**Indexes**: 
- `idx_contents_workspace_id`
- `idx_contents_status`

**Metadata Structure (YouTube)**:
```json
{
  "videoId": "dQw4w9WgXcQ",
  "totalDuration": 212000,
  "transcriptSource": "captions" | "asr" | "assemblyai"
}
```

**Metadata Structure (PDF)**:
```json
{
  "pages": 10,
  "info": { /* PDF metadata */ }
}
```

#### `processed_contents`
- **id**: UUID (PK)
- **content_id**: UUID (FK → contents.id, UNIQUE, ON DELETE CASCADE)
- **chunks**: JSONB (NOT NULL, default: '[]')
- **embeddings**: JSONB (nullable)
- **summary**: TEXT (nullable) - Markdown format
- **transcript**: TEXT (nullable)
- **graph_json**: JSONB (nullable)
- **created_at**: TIMESTAMPTZ
- **updated_at**: TIMESTAMPTZ

**Chunks Structure**:
```json
[
  {
    "text": "Chunk text content...",
    "metadata": {
      "timestamp": "03:15" | "page": 2 | "index": 0
    }
  }
]
```

**Embeddings Structure**: 2D array of numbers (1536 dimensions for text-embedding-3-small)

#### `chat_sessions`
- **id**: UUID (PK)
- **workspace_id**: UUID (FK → workspaces.id, ON DELETE CASCADE)
- **user_id**: UUID (FK → users.id, ON DELETE CASCADE)
- **messages**: JSONB (default: '[]')
- **created_at**: TIMESTAMPTZ
- **updated_at**: TIMESTAMPTZ

**Indexes**:
- `idx_chat_sessions_workspace_id`
- `idx_chat_sessions_user_id`

**Messages Structure**:
```json
[
  {
    "role": "user" | "assistant",
    "content": "Message text",
    "references": [...], // For assistant messages
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
]
```

#### `quizzes`
- **id**: UUID (PK)
- **workspace_id**: UUID (FK → workspaces.id, ON DELETE CASCADE)
- **content_id**: UUID (FK → contents.id, ON DELETE SET NULL, nullable)
- **questions**: JSONB (NOT NULL, default: '[]')
- **difficulty**: TEXT (default: 'medium', CHECK: 'easy' | 'medium' | 'hard')
- **created_at**: TIMESTAMPTZ
- **updated_at**: TIMESTAMPTZ

**Indexes**: `idx_quizzes_workspace_id`

**Questions Structure**:
```json
[
  {
    "question": "What is...?",
    "type": "multiple_choice" | "short_answer",
    "options": ["Option 1", "Option 2", ...], // Empty for short_answer
    "correctAnswer": "Correct answer text",
    "explanation": "Explanation text"
  }
]
```

#### `quiz_attempts`
- **id**: UUID (PK)
- **quiz_id**: UUID (FK → quizzes.id, ON DELETE CASCADE)
- **user_id**: UUID (FK → users.id, ON DELETE CASCADE)
- **answers**: JSONB (NOT NULL, default: '[]')
- **score**: DOUBLE PRECISION (NOT NULL)
- **completed_at**: TIMESTAMPTZ

**Indexes**:
- `idx_quiz_attempts_quiz_id`
- `idx_quiz_attempts_user_id`

#### `flashcards`
- **id**: UUID (PK)
- **workspace_id**: UUID (FK → workspaces.id, ON DELETE CASCADE)
- **content_id**: UUID (FK → contents.id, ON DELETE SET NULL, nullable)
- **question**: TEXT (NOT NULL)
- **answer**: TEXT (NOT NULL)
- **difficulty**: DOUBLE PRECISION (default: 2.5) - SM-2 ease factor
- **next_review**: TIMESTAMPTZ (default: NOW())
- **created_at**: TIMESTAMPTZ
- **updated_at**: TIMESTAMPTZ

**Indexes**:
- `idx_flashcards_workspace_id`
- `idx_flashcards_next_review`

#### `flashcard_reviews`
- **id**: UUID (PK)
- **flashcard_id**: UUID (FK → flashcards.id, ON DELETE CASCADE)
- **user_id**: UUID (FK → users.id, ON DELETE CASCADE)
- **result**: TEXT (CHECK: 'correct' | 'incorrect')
- **reviewed_at**: TIMESTAMPTZ

**Indexes**:
- `idx_flashcard_reviews_flashcard_id`
- `idx_flashcard_reviews_user_id`

#### `user_progress`
- **id**: UUID (PK)
- **user_id**: UUID (FK → users.id, ON DELETE CASCADE)
- **workspace_id**: UUID (FK → workspaces.id, ON DELETE CASCADE)
- **mastery_map**: JSONB (default: '{}')
- **streaks**: INTEGER (default: 0)
- **total_time**: INTEGER (default: 0) - in seconds
- **last_active**: TIMESTAMPTZ (default: NOW())
- **created_at**: TIMESTAMPTZ
- **updated_at**: TIMESTAMPTZ

**UNIQUE Constraint**: `(user_id, workspace_id)`

**Indexes**:
- `idx_user_progress_user_id`

### Database Features

1. **UUID Extension**: `uuid-ossp` for UUID generation
2. **Auto-update Timestamps**: Trigger function `update_updated_at_column()` on all tables
3. **Cascade Deletes**: Related records automatically deleted when parent is deleted
4. **JSONB Fields**: Flexible storage for chunks, embeddings, metadata, messages
5. **Indexes**: Optimized queries on foreign keys and frequently filtered columns

---

## API Routes

### Authentication

#### `POST /api/auth/signup`
- **Purpose**: User registration
- **Request Body**: `{ email, password, name? }`
- **Response**: `{ user, session }`
- **Details**: Creates user with hashed password (bcryptjs)

#### `GET/POST /api/auth/[...nextauth]`
- **Purpose**: NextAuth.js handler
- **Providers**: Credentials, Google OAuth (conditional)
- **Strategy**: JWT
- **Callbacks**: Custom sign-in, JWT, session callbacks

### Content Management

#### `POST /api/ingest`
- **Purpose**: Ingest content (PDF, YouTube, Text)
- **Auth**: Required
- **Request**: FormData
  - `type`: 'pdf' | 'youtube' | 'text'
  - `workspaceId`: string
  - `file`: File (for PDF)
  - `storagePath`: string (for large PDFs)
  - `url`: string (for YouTube)
  - `text`: string (for text)
- **Flow**:
  1. Extract text based on type
  2. Chunk content (with timestamps for YouTube)
  3. Create `contents` record
  4. Create `processed_contents` with chunks
  5. Set status to 'processing' → 'complete'
- **Features**:
  - YouTube transcript caching (reuse existing transcripts)
  - ASR fallback with usage tracking
  - PDF direct import (bypasses problematic index.js)
  - Text chunking with sentence boundary detection

#### `POST /api/process`
- **Purpose**: AI process content (generate summary + embeddings)
- **Auth**: Required
- **Request Body**: `{ contentId: string }`
- **Flow**:
  1. Fetch content and processed_content
  2. Reconstruct text if missing (from chunks or re-extract)
  3. Generate summary using user's AI provider preference
  4. Generate embeddings for chunks
  5. Update `processed_contents` with summary and embeddings
- **Error Handling**: Graceful degradation if embeddings fail

### Chat

#### `POST /api/chat`
- **Purpose**: Send chat message and get AI response
- **Auth**: Required
- **Request Body**: 
  ```json
  {
    "workspaceId": "uuid",
    "message": "user question",
    "chatSessionId": "uuid?",
    "contentId": "uuid?" // Optional: focus on specific content
  }
  ```
- **Flow**:
  1. Get workspace and verify access
  2. Fetch relevant content (all or specific contentId)
  3. Gather all chunks and embeddings
  4. Perform semantic search (vector or keyword fallback)
  5. Generate RAG response with citations
  6. Save/update chat session
- **Response**: 
  ```json
  {
    "answer": "AI response with citations",
    "references": [...],
    "chatSessionId": "uuid"
  }
  ```

#### `GET /api/chat/sessions`
- **Purpose**: Get chat sessions for workspace
- **Auth**: Required
- **Query Params**: `workspaceId`, `userId`

### Quiz

#### `POST /api/quiz/generate`
- **Purpose**: Generate quiz from content
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "workspaceId": "uuid",
    "contentId": "uuid?",
    "difficulty": "easy" | "medium" | "hard",
    "numQuestions": 5
  }
  ```
- **Flow**:
  1. Verify workspace access
  2. Get content text (specific or all workspace content)
  3. Generate questions using AI chain
  4. Create quiz record
- **Response**: `{ quiz: Quiz }`

#### `POST /api/quiz/[id]`
- **Purpose**: Submit quiz attempt
- **Auth**: Required
- **Request Body**: `{ answers: any[], score: number }`
- **Response**: `{ attempt: QuizAttempt }`

### Flashcards

#### `POST /api/flashcards/generate`
- **Purpose**: Generate flashcards from content
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "workspaceId": "uuid",
    "contentId": "uuid?",
    "numCards": 10
  }
  ```
- **Flow**: Similar to quiz generation
- **Response**: `{ flashcards: Flashcard[] }`

#### `POST /api/flashcards/[id]/review`
- **Purpose**: Record flashcard review
- **Auth**: Required
- **Request Body**: `{ result: 'correct' | 'incorrect' }`
- **Flow**:
  1. Get flashcard and previous review history
  2. Calculate next review using SM-2 algorithm
  3. Create review record
  4. Update flashcard difficulty and next_review
- **Response**: `{ flashcard: Flashcard, nextReview: Date }`

### Workspace

#### `GET /api/workspace`
- **Purpose**: List user's workspaces
- **Auth**: Required
- **Response**: `{ workspaces: Workspace[] }` (with counts)

#### `POST /api/workspace`
- **Purpose**: Create workspace
- **Auth**: Required
- **Request Body**: `{ name: string, description?: string, tags?: string[] }`
- **Response**: `{ workspace: Workspace }`

#### `GET /api/workspace/[id]`
- **Purpose**: Get workspace details
- **Auth**: Required (or shared workspace)
- **Response**: `{ workspace: Workspace, contents: Content[] }`

#### `POST /api/workspace/[id]/share`
- **Purpose**: Generate share token for workspace
- **Auth**: Required (workspace owner)
- **Response**: `{ shareToken: string, shareUrl: string }`

### Settings

#### `GET /api/settings`
- **Purpose**: Get user settings
- **Auth**: Required
- **Response**: `{ user: User }`

#### `POST /api/settings`
- **Purpose**: Update user settings
- **Auth**: Required
- **Request Body**: `{ ai_provider?: string, ... }`
- **Response**: `{ user: User }`

---

## Authentication & Authorization

### NextAuth.js Configuration

**Location**: `lib/auth/config.ts`

**Providers**:
1. **Credentials Provider**
   - Email/password authentication
   - Password hashing: bcryptjs (placeholder implementation)
   - Custom authorize function

2. **Google OAuth Provider** (Conditional)
   - Only enabled if `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
   - Auto-creates user if doesn't exist

**Session Strategy**: JWT (stateless)
- Stored in HTTP-only cookies
- Contains: `id`, `email`, `name`, `image`

**Callbacks**:
1. **signIn**: Creates user if OAuth and user doesn't exist
2. **jwt**: Adds user ID to token
3. **session**: Adds user ID to session object

### Route Protection

**Middleware**: `middleware.ts`
- Protects routes matching `/dashboard/:path*` and `/workspace/:path*`
- Uses `withAuth` from next-auth/middleware
- Redirects unauthenticated users

**Layout-Level Protection**: `app/(dashboard)/layout.tsx`
- Server-side session check
- Redirects to `/login` if no session

**API Route Protection**: All API routes use `getServerSession(authOptions)`
- Returns 401 if unauthorized
- Returns 403 if forbidden (wrong user/workspace access)

### Workspace Access Control

- **Owner Access**: User who created workspace (`workspace.user_id`)
- **Shared Workspaces**: If `workspace.shared === true`, any authenticated user can view
- **Private Workspaces**: Only owner can access

---

## Content Ingestion Flow

### 1. PDF Ingestion

**Endpoint**: `POST /api/ingest` (type: 'pdf')

**Flow**:
1. Receive file via FormData or `storagePath` reference
2. Download from Supabase Storage if using `storagePath`
3. Convert to Buffer
4. Extract text using `pdf-parse/lib/pdf-parse` (direct import to avoid test file issues)
5. Chunk text using sentence boundary detection (1000 chars, 200 overlap)
6. Create `contents` record with metadata (pages, info)
7. Create `processed_contents` with chunks (page metadata)
8. Set status to 'complete'

**Chunking Strategy**:
- Default chunk size: 1000 characters
- Overlap: 200 characters
- Breaks at sentence boundaries when possible
- Page numbers calculated from chunk index

### 2. YouTube Ingestion

**Endpoint**: `POST /api/ingest` (type: 'youtube')

**Flow**:
1. Extract video ID from URL using regex patterns
2. **Check Cache**: Look for existing content with same `raw_url`
   - If found and has chunks, reuse transcript and chunks
3. **Transcript Fetching** (if not cached):
   - **Method 1**: `youtube-transcript` package with language preferences (en, en-US, en-GB, asr)
   - **Method 2**: Direct `timedtext` endpoint
   - **Method 3**: Scrape from YouTube page HTML
   - **Method 4**: AssemblyAI ASR (if captions unavailable and user has quota)
4. **Transcript Processing**:
   - Convert to array of `{text, offset, duration}`
   - Join into full transcript text
5. **Chunking**: `chunkTranscriptWithTimestamps()`
   - Groups transcript items by timestamp
   - Default chunk size: 1000 characters
   - Preserves timestamp metadata
6. **ASR Usage Tracking** (if used):
   - Increment `usage_limits.asrUsage`
   - Monthly reset based on `asrMonth`
   - Limits: 5 for free, 1000 for pro
7. Create `contents` record
8. Create `processed_contents` with chunks
9. Set status to 'complete'

**Video ID Extraction Patterns**:
- `youtube.com/watch?v=VIDEO_ID`
- `youtu.be/VIDEO_ID`
- `youtube.com/embed/VIDEO_ID`

**Transcript Sources**:
- `captions`: From YouTube captions/subtitles
- `asr`: Automatic speech recognition captions
- `assemblyai`: External ASR service

### 3. Text Ingestion

**Endpoint**: `POST /api/ingest` (type: 'text')

**Flow**:
1. Receive text via FormData
2. Chunk using `chunkText()` function (same as PDF)
3. Create `contents` record
4. Create `processed_contents` with chunks
5. Set status to 'complete'

---

## AI Processing Pipeline

### Summarization

**Chain**: `createSummarizationChain()`

**Location**: `lib/ai/chains.ts`

**Process**:
1. Get user's AI provider preference
2. Initialize LLM with provider config
3. Create prompt template with structured sections:
   - Overview (2-3 sentences)
   - Key Takeaways (bullet list)
   - Important Concepts (flashcard-ready terms)
   - Questions to Think About (3-5 questions)
4. Generate markdown summary
5. Store in `processed_contents.summary` (plain markdown, not JSON)

**Provider Configuration**:
- **OpenAI**: GPT-4o, temperature 0.7
- **Anthropic**: Claude 3.5 Sonnet, temperature 0.7
- **Grok**: grok-beta, temperature 0.7, baseURL: `https://api.x.ai/v1`

### Embedding Generation

**Function**: `generateEmbeddings()`

**Location**: `lib/ai/embeddings.ts`

**Process**:
1. Initialize OpenAI embeddings (text-embedding-3-small)
2. Generate embeddings for all chunk texts
3. Store as 2D array in `processed_contents.embeddings`
4. Dimensions: 1536 per embedding

**Usage**: Vector similarity search for RAG

### Quiz Generation

**Chain**: `createQuizGenerationChain()`

**Parameters**:
- `content`: string (content text)
- `difficulty`: 'easy' | 'medium' | 'hard'
- `numQuestions`: number (default: 5)
- `provider`: AIProvider

**Output Format**: JSON array of question objects
```json
[
  {
    "question": "...",
    "type": "multiple_choice" | "short_answer",
    "options": [...],
    "correctAnswer": "...",
    "explanation": "..."
  }
]
```

**Error Handling**: Defensive JSON parsing with fallback extraction

### Flashcard Generation

**Chain**: `createFlashcardGenerationChain()`

**Parameters**:
- `content`: string
- `numCards`: number (default: 10)
- `provider`: AIProvider

**Output Format**: JSON array of flashcard pairs
```json
[
  {
    "question": "...",
    "answer": "..."
  }
]
```

**Storage**: Creates `flashcards` records with initial difficulty 2.5

---

## RAG Implementation

### Retrieval-Augmented Generation

**Location**: `lib/ai/rag.ts`

### Semantic Search

**Function**: `vectorSemanticSearch()`

**Process**:
1. **Check Embeddings**: If embeddings available and match chunk count
2. **Vector Search**:
   - Generate query embedding using OpenAI
   - Calculate cosine similarity for each chunk
   - Sort by similarity score
   - Return top K chunks (default: 5)
3. **Fallback**: If no embeddings, use keyword-based search

**Keyword Fallback** (`semanticSearch()`):
- Tokenizes query into words
- Counts word occurrences in chunks
- Scores by total matches
- Returns top K chunks

### RAG Chain

**Function**: `createRAGChain()`

**Process**:
1. Combine relevant chunks with metadata prefixes
   - Format: `[Timestamp: 03:15]` or `[Page 2]` or `[Section 1]`
2. Create prompt template:
   - System: "You are an AI tutor..."
   - Context: Combined chunk text
   - Query: User's question
   - Instructions: Include citations, be educational
3. Generate response using LLM
4. Extract references from chunks
5. Return `{ answer, references }`

**Citation Format**: Citations appear as `[Source: 03:15]` or `[Source: Page 2]` in answer text

---

## Components & UI

### Component Structure

#### Layout Components

**DashboardNav** (`components/layout/DashboardNav.tsx`)
- Navigation bar for dashboard
- User menu, workspace links
- Uses NextAuth session

#### Feature Components

**ChatInterface** (`components/chat/ChatInterface.tsx`)
- Chat UI with message history
- Message input and send button
- Citation display for references
- Timestamp linking (for YouTube content)

**QuizInterface** (`components/quiz/QuizInterface.tsx`)
- Quiz display (multiple choice / short answer)
- Answer submission
- Score calculation and display
- Explanation display

**FlashcardsInterface** (`components/flashcards/FlashcardsInterface.tsx`)
- Card flip animation
- Review interface (correct/incorrect)
- Next review scheduling
- Progress tracking

**WorkspaceView** (`components/workspace/WorkspaceView.tsx`)
- Workspace content list
- Content cards with metadata
- Upload interface integration
- Status indicators

**ContentUpload** (`components/workspace/ContentUpload.tsx`)
- File upload UI
- URL input (YouTube)
- Text input area
- Upload progress

**ShareWorkspace** (`components/workspace/ShareWorkspace.tsx`)
- Share token generation
- Shareable link display
- Access control toggle

**SettingsInterface** (`components/settings/SettingsInterface.tsx`)
- AI provider selection
- Subscription management
- Usage limits display

### UI Components (shadcn/ui)

Base components from shadcn/ui:
- `button.tsx`: Button variants (default, outline, ghost, etc.)
- `card.tsx`: Card container
- `dialog.tsx`: Modal dialogs
- `input.tsx`: Text input
- `label.tsx`: Form labels
- `select.tsx`: Dropdown selects
- `tabs.tsx`: Tab navigation
- `textarea.tsx`: Multi-line text input

**Styling**: Tailwind CSS with custom theme configuration

---

## File Storage

### Supabase Storage

**Bucket**: `learnchat-files`
- **Type**: Private (requires signed URLs)
- **Size Limit**: 100MB per file
- **Allowed Mime Types**:
  - `application/pdf`
  - `text/plain`
  - `video/mp4`
  - `audio/mpeg`
  - `audio/wav`

### Storage Functions

**Location**: `lib/storage/supabase.ts`

**Functions**:
1. `initializeBucket()`: Creates bucket if doesn't exist
2. `uploadFile()`: Uploads file to storage
   - Returns: `{ path, url }`
   - Supports File or Buffer
3. `getSignedUrl()`: Generates signed URL for private access
   - Default expiry: 1 hour
4. `deleteFile()`: Removes file from storage
5. `listFiles()`: Lists files in folder
6. `getFileMetadata()`: Gets file metadata

### Upload Flow

**Large Files (PDF)**:
1. Client uploads to `/api/ingest` with file
2. Optionally: Upload to Supabase Storage first, pass `storagePath`
3. Server downloads from storage if `storagePath` provided
4. Process file and delete from storage (optional cleanup)

**Small Files**:
- Direct upload via FormData
- Processed in memory

---

## Environment Variables

### Required Variables

```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key  # Optional for client-side

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000  # Production: https://yourdomain.com
GOOGLE_CLIENT_ID=your-google-client-id  # Optional
GOOGLE_CLIENT_SECRET=your-google-client-secret  # Optional

# AI Providers
OPENAI_API_KEY=sk-...  # Required
ANTHROPIC_API_KEY=sk-ant-...  # Optional
GROK_API_KEY=xai-...  # Optional

# YouTube
YOUTUBE_API_KEY=your-youtube-api-key  # Optional (for metadata)

# AssemblyAI (ASR fallback)
ASSEMBLYAI_API_KEY=your-assemblyai-key  # Optional
```

### Optional Variables

```env
# Default AI Provider
AI_PROVIDER=openai  # openai | grok | anthropic
```

### Environment-Specific Notes

- **Development**: Use `.env.local`
- **Production**: Set in deployment platform (Vercel, etc.)
- **NextAuth Secret**: Generate with `openssl rand -base64 32`
- **Google OAuth**: Required only if using Google sign-in

---

## Deployment Architecture

### Recommended Platform: Vercel

**Advantages**:
- Native Next.js support
- Automatic deployments
- Edge network
- Environment variable management
- Serverless functions

### Database: Supabase

**Setup**:
1. Create Supabase project
2. Run migration: `001_initial_schema.sql`
3. Configure storage bucket: `learnchat-files`
4. Get API keys from Supabase dashboard

### Build Process

```bash
npm install
npm run build
npm start
```

### Database Migrations

**Current Approach**: Single migration file
- Run via Supabase SQL Editor or CLI
- No migration tool (consider Supabase MCP for future)

### Environment Setup Checklist

1. ✅ Supabase project created
2. ✅ Database schema applied
3. ✅ Storage bucket created
4. ✅ Environment variables configured
5. ✅ NextAuth secret generated
6. ✅ AI API keys added
7. ✅ YouTube API key (optional)
8. ✅ AssemblyAI key (optional, for ASR)

### Scalability Considerations

**Current Limitations**:
- Embeddings stored in JSONB (not optimized for vector search)
- In-memory cosine similarity (not scalable for large datasets)
- No connection pooling configuration
- Single Supabase instance

**Recommended Improvements**:
1. **Vector Search**: Use Supabase PG Vector extension
2. **Caching**: Redis for transcript cache
3. **Queue System**: Bull/BullMQ for async processing
4. **CDN**: For static assets and file downloads
5. **Rate Limiting**: Implement per-user rate limits
6. **Monitoring**: Error tracking (Sentry), analytics

---

## Key Implementation Details

### YouTube Transcript Caching

**Purpose**: Avoid re-fetching transcripts for same video

**Implementation**:
- Checks `getYoutubeContentsByRawUrl()` before fetching
- Reuses `extracted_text` and `chunks` from existing content
- Significantly speeds up duplicate video ingestion

### Chunking Strategy

**Text/PDF**:
- Size: 1000 characters
- Overlap: 200 characters
- Boundary detection: Sentence endings preferred
- Metadata: Page numbers (calculated)

**YouTube**:
- Size: ~1000 characters (variable)
- Overlap: None (timestamp-based grouping)
- Boundary detection: Timestamp preservation
- Metadata: Timestamps (formatted as "MM:SS" or "H:MM:SS")

### Error Handling Patterns

1. **Graceful Degradation**:
   - Embeddings failure → Continue without embeddings
   - ASR failure → Return helpful error message
   - AI provider failure → Return 500 with details

2. **User-Friendly Messages**:
   - Specific error messages for common issues
   - Actionable guidance (e.g., "Try a different video with captions")

3. **Logging**:
   - Console logging for debugging
   - Error stack traces preserved
   - Request/response logging in API routes

### Type Safety

**Database Types**: Defined in `lib/db/supabase.ts`
- All tables have corresponding TypeScript interfaces
- Used throughout query functions
- JSONB fields typed as `any` (consider stricter typing)

**API Types**: Inferred from request/response shapes
- No formal API schema (consider OpenAPI/Swagger)

### Security Considerations

1. **Authentication**: JWT-based, HTTP-only cookies
2. **Authorization**: Server-side checks on all API routes
3. **File Upload**: Size limits, MIME type validation
4. **SQL Injection**: Supabase client handles parameterization
5. **XSS**: React's built-in escaping, markdown sanitization
6. **CSRF**: NextAuth handles CSRF tokens
7. **Rate Limiting**: Not implemented (recommended)

---

## Future Enhancements

### Planned Features

1. **Real Vector Search**: Migrate to Supabase PG Vector
2. **Audio/Video Transcription**: Full support for uploaded media
3. **Collaborative Features**: Real-time collaboration on workspaces
4. **Advanced Analytics**: Detailed learning progress tracking
5. **Mobile App**: React Native companion app
6. **Export Features**: PDF export of summaries, quiz results
7. **Integration**: Calendar sync, note-taking app integration

### Technical Debt

1. **Password Hashing**: Placeholder implementation needs proper bcrypt
2. **Error Handling**: More comprehensive error types
3. **Testing**: Unit and integration tests
4. **Documentation**: API documentation (OpenAPI)
5. **Migration Tool**: Proper database migration system
6. **Rate Limiting**: Implement per-endpoint limits
7. **Caching**: Add caching layer for frequent queries
8. **Monitoring**: Error tracking and performance monitoring

---

## Conclusion

LearnChat is a comprehensive AI-powered learning platform built with modern web technologies. The architecture emphasizes:

- **Flexibility**: Multi-provider AI support
- **Scalability**: Designed for growth (with identified improvements)
- **User Experience**: YouTube-first design, intuitive workflows
- **Data Integrity**: Strong database constraints and relationships
- **Developer Experience**: TypeScript, clear structure, reusable components

The codebase is well-organized with clear separation of concerns between API routes, business logic, data access, and UI components. Future enhancements should focus on performance optimization, vector search capabilities, and comprehensive testing.

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Maintained By**: LearnChat Development Team

