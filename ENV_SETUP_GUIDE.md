# Environment Variables Setup Guide

## Quick Setup

1. **Copy the example file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** and fill in your actual values (see below)

3. **Generate NextAuth secret**:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output to `NEXTAUTH_SECRET` in `.env.local`

## Required Variables

### 1. Supabase (Database)
Get these from: https://app.supabase.com → Your Project → Settings → API

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Authentication
```env
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=http://localhost:3000
```

### 3. AI Provider (OpenAI - Required)
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key-here
```

Get from: https://platform.openai.com/api-keys

## Optional Variables

### Google OAuth (for Google sign-in)
```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

Get from: https://console.cloud.google.com → APIs & Services → Credentials

### Alternative AI Providers
```env
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here  # For Claude
GROK_API_KEY=xai-your-grok-api-key-here               # For Grok
```

### YouTube & Transcript Services
```env
YOUTUBE_API_KEY=your-youtube-api-key-here      # For video metadata
SUPADATA_API_KEY=your-supadata-api-key-here    # Primary transcript method
ASSEMBLYAI_API_KEY=your-assemblyai-api-key-here # ASR fallback
```

## Verification

After setting up your `.env.local` file, verify it's not tracked by git:

```bash
git check-ignore .env.local
```

Should output: `.env.local` (meaning it's ignored)

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Supabase service role key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anon key (client-side) |
| `NEXTAUTH_SECRET` | ✅ Yes | NextAuth.js secret (generate with openssl) |
| `NEXTAUTH_URL` | ✅ Yes | App URL (http://localhost:3000 for local) |
| `OPENAI_API_KEY` | ✅ Yes | OpenAI API key for AI features |
| `AI_PROVIDER` | No | Default AI provider (default: openai) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `ANTHROPIC_API_KEY` | No | Anthropic API key (for Claude) |
| `GROK_API_KEY` | No | Grok API key (for Grok) |
| `YOUTUBE_API_KEY` | No | YouTube Data API key |
| `SUPADATA_API_KEY` | No | Supadata.ai API key (transcript service) |
| `ASSEMBLYAI_API_KEY` | No | AssemblyAI API key (ASR fallback) |

## Troubleshooting

### Missing Supabase variables error
Make sure all Supabase variables are set and correct. Check:
- `SUPABASE_URL` should start with `https://`
- `SUPABASE_SERVICE_ROLE_KEY` should be the service_role key (not anon key)
- Both anon key variables should match

### NextAuth errors
- Make sure `NEXTAUTH_SECRET` is at least 32 characters
- `NEXTAUTH_URL` should match your actual app URL
- For production, use `https://yourdomain.com`

### AI provider errors
- Verify your OpenAI API key is valid and has credits
- Check that `AI_PROVIDER` matches the provider you want to use
- Ensure the corresponding API key is set for your chosen provider
