# Supabase API Keys Update

Your Supabase API keys need to be updated. Here are the correct values:

## Correct Supabase Configuration

### Supabase URL
```
SUPABASE_URL=https://lcadhutftnaxckcmdzvg.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://lcadhutftnaxckcmdzvg.supabase.co
```

### Anon Key (Public Key)
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjYWRodXRmdG5heGNrY21kenZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNDA4MzQsImV4cCI6MjA4MTkxNjgzNH0.H7n2J9kBpd7Cl0OypaXCmSrpI6Dm9NrAnSSrloTFaPc
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjYWRodXRmdG5heGNrY21kenZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNDA4MzQsImV4cCI6MjA4MTkxNjgzNH0.H7n2J9kBpd7Cl0OypaXCmSrpI6Dm9NrAnSSrloTFaPc
```

### Service Role Key (SECRET - Get from Supabase Dashboard)

1. Go to: https://app.supabase.com/project/lcadhutftnaxckcmdzvg/settings/api
2. Scroll down to "Project API keys"
3. Copy the **service_role** key (starts with `eyJ...`)
4. Update `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local` file

⚠️ **Important**: The service_role key has admin access - never commit it to git or expose it publicly!

## Quick Update Steps

1. Open your `.env.local` file
2. Update these values:
   - `SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (get from dashboard)
3. Restart your dev server: `npm run dev`

