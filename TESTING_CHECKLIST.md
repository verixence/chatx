# Testing Checklist for LearnChat

## Pre-Testing Requirements

### 1. Environment Variables ✅
- [ ] All required variables are set in `.env.local`
- [ ] Supabase credentials are valid
- [ ] OpenAI API key is valid
- [ ] NextAuth secret is generated

### 2. Database Setup
- [ ] Supabase project is created
- [ ] Database migration has been run (`001_initial_schema.sql`)
- [ ] Storage bucket `learnchat-files` exists (or will be auto-created)

## Testing Steps

### Phase 1: Basic App Launch

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Verify Server Starts**
   - Open http://localhost:3000
   - Should see landing page with "LearnChat" branding
   - No console errors

### Phase 2: Authentication

3. **Test Sign Up**
   - Click "Get Started" or navigate to `/signup`
   - Create a new account with email/password
   - Verify account is created in Supabase `users` table

4. **Test Login**
   - Log out (if logged in)
   - Navigate to `/login`
   - Login with created credentials
   - Should redirect to dashboard

### Phase 3: Workspace Management

5. **Create Workspace**
   - Navigate to dashboard
   - Click "New Workspace" or navigate to `/workspace/new`
   - Fill in workspace name and description
   - Create workspace
   - Verify workspace appears in dashboard

6. **View Workspace**
   - Click on created workspace
   - Should see workspace overview page
   - Verify workspace details are displayed

### Phase 4: Content Ingestion

7. **Test Text Content Upload**
   - In workspace, click "Add content" or upload button
   - Select "Text" type
   - Paste some text content
   - Submit
   - Verify content appears in workspace
   - Status should change from "processing" to "complete"

8. **Test PDF Upload**
   - Upload a PDF file
   - Verify file is processed
   - Check that text is extracted
   - Verify chunks are created

9. **Test YouTube URL**
   - Paste a YouTube URL (with captions)
   - Verify transcript is fetched
   - Check that transcript is processed
   - Verify chunks are created with timestamps

### Phase 5: Content Processing

10. **Process Content**
    - Click on a content item
    - Click "Process" button (if available)
    - Wait for summary generation
    - Verify summary appears with structured sections:
      - Overview
      - Key Takeaways
      - Important Concepts
      - Questions to Think About

### Phase 6: AI Features

11. **Test Chat**
    - Navigate to chat interface
    - Ask a question about the content
    - Verify AI response with citations
    - Check that chat history is saved

12. **Test Quiz Generation**
    - Navigate to quiz section
    - Click "Generate Quiz"
    - Verify quiz questions are generated
    - Take the quiz
    - Submit answers
    - Verify score is calculated

13. **Test Flashcard Generation**
    - Navigate to flashcards section
    - Click "Generate Flashcards"
    - Verify flashcards are created
    - Review flashcards
    - Mark as correct/incorrect
    - Verify spaced repetition scheduling

### Phase 7: Advanced Features

14. **Test Workspace Sharing**
    - Generate share link for workspace
    - Test accessing shared workspace
    - Verify access controls work

15. **Test Settings**
    - Navigate to settings
    - Change AI provider preference
    - Verify settings are saved
    - Test with different providers (if keys are available)

## Common Issues & Solutions

### Issue: "Missing Supabase environment variables"
**Solution**: Check that all Supabase variables are set in `.env.local`

### Issue: "Failed to fetch transcript"
**Solution**: 
- For YouTube: Try a video with captions enabled
- Check if SUPADATA_API_KEY is set (optional but recommended)
- Verify ASSEMBLYAI_API_KEY if using ASR fallback

### Issue: "OpenAI API error"
**Solution**:
- Verify OPENAI_API_KEY is valid
- Check API key has credits/quota
- Verify API key has access to GPT-4o

### Issue: "Database connection error"
**Solution**:
- Verify Supabase project is active
- Check SUPABASE_URL is correct
- Verify SUPABASE_SERVICE_ROLE_KEY is correct

### Issue: "NextAuth error"
**Solution**:
- Verify NEXTAUTH_SECRET is set (should be 32+ characters)
- Check NEXTAUTH_URL matches your app URL
- Clear browser cookies and try again

## Quick Test Commands

```bash
# Check environment variables
grep -E "^SUPABASE_URL=|^OPENAI_API_KEY=" .env.local

# Start dev server
npm run dev

# Check if server is running
curl http://localhost:3000

# Check database connection (if Supabase CLI is installed)
supabase db ping
```

## Success Criteria

✅ All authentication flows work  
✅ Content ingestion works for all types (text, PDF, YouTube)  
✅ AI processing generates summaries  
✅ Chat interface responds with citations  
✅ Quiz and flashcard generation works  
✅ No console errors  
✅ No server crashes  

## Next Steps After Testing

1. Fix any issues found
2. Test with production-like data
3. Test performance with larger content
4. Set up production environment variables
5. Deploy to production

---

**Last Updated**: January 2025

