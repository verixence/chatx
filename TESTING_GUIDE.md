# Testing Guide for LearnChat

This guide will help you test all features of the LearnChat application systematically.

## Prerequisites Checklist

Before testing, ensure you have:

- ✅ **Environment Variables Set Up**
  - `.env.local` file exists with all required variables
  - `SUPABASE_URL` - Your Supabase project URL
  - `SUPABASE_ANON_KEY` - Your Supabase anon key
  - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Same as SUPABASE_ANON_KEY
  - `NEXTAUTH_SECRET` - Generated secret key
  - `NEXTAUTH_URL` - `http://localhost:3000` (or your port)
  - `AI_PROVIDER` - `openai` or `grok`
  - `OPENAI_API_KEY` - Your OpenAI API key (if using OpenAI)
  - `GROK_API_KEY` - Your Grok API key (if using Grok) 

- ✅ **Database Migration Applied**
  - All tables created in Supabase
  - Check Supabase Dashboard → Table Editor to verify

- ✅ **Development Server Running**
  ```bash
  npm run dev
  ```
  - Server should be running on `http://localhost:3000` (or your configured port)

---

## Test Scenarios

### 1. Authentication Flow

#### Test 1.1: User Registration
**Steps:**
1. Navigate to `http://localhost:3000/signup`
2. Fill in the form:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123` (min 8 characters)
3. Click "Sign up"

**Expected Results:**
- ✅ User is created successfully
- ✅ Redirected to login page with success message
- ✅ User appears in Supabase `users` table

**Verify in Supabase:**
- Go to Supabase Dashboard → Table Editor → `users`
- Check that new user record exists

#### Test 1.2: User Login
**Steps:**
1. Navigate to `http://localhost:3000/login`
2. Enter credentials from Test 1.1
3. Click "Sign in"

**Expected Results:**
- ✅ Successful login
- ✅ Redirected to `/dashboard`
- ✅ User email displayed in navigation bar

#### Test 1.3: Invalid Login
**Steps:**
1. Try logging in with wrong password
2. Try logging in with non-existent email

**Expected Results:**
- ✅ Error message displayed: "Invalid email or password"
- ✅ User stays on login page

#### Test 1.4: Session Persistence
**Steps:**
1. After logging in, refresh the page
2. Close and reopen the browser
3. Navigate to different pages

**Expected Results:**
- ✅ User remains logged in
- ✅ Session persists across page refreshes
- ✅ Protected routes remain accessible

---

### 2. Workspace Management

#### Test 2.1: Create Workspace
**Steps:**
1. Log in to the application
2. Click "New Workspace" button in navigation
3. Fill in:
   - Name: `My First Workspace`
   - Description: `Testing workspace creation`
4. Click "Create Workspace"

**Expected Results:**
- ✅ Workspace created successfully
- ✅ Workspace appears in dashboard
- ✅ Workspace visible in Supabase `workspaces` table

**Verify in Supabase:**
- Check `workspaces` table for new record
- Verify `user_id` matches logged-in user

#### Test 2.2: View Workspace
**Steps:**
1. Click on a workspace from the dashboard
2. Navigate to workspace detail page

**Expected Results:**
- ✅ Workspace name and description displayed
- ✅ Content upload area visible
- ✅ Navigation tabs visible (Summary, Chat, Quiz, Flashcards)

#### Test 2.3: Create Multiple Workspaces
**Steps:**
1. Create 3-4 different workspaces with different names
2. Check dashboard

**Expected Results:**
- ✅ All workspaces appear on dashboard
- ✅ Workspaces sorted by most recent first
- ✅ Workspace counts (contents, quizzes, flashcards) displayed

---

### 3. Content Ingestion

#### Test 3.1: Upload Text Content
**Steps:**
1. Open a workspace
2. Click "Add Content" or "Upload"
3. Select "Text" option
4. Paste some text (e.g., a paragraph about a topic)
5. Submit

**Expected Results:**
- ✅ Content uploaded successfully
- ✅ Content appears in workspace
- ✅ Status shows "processing" then "complete"
- ✅ Content visible in Supabase `contents` table

**Verify in Supabase:**
- Check `contents` table for new record
- Verify `extracted_text` field contains the text
- Check `processed_contents` table for chunks

#### Test 3.2: Upload PDF
**Steps:**
1. In a workspace, select "PDF" upload option
2. Choose a PDF file (small test file recommended)
3. Upload

**Expected Results:**
- ✅ PDF uploaded to Supabase Storage
- ✅ Text extracted from PDF
- ✅ Content record created
- ✅ Processing completes successfully

**Verify:**
- Check Supabase Storage → `learnchat-files` bucket
- Check `contents` table for PDF record
- Verify `extracted_text` contains PDF content

#### Test 3.3: Upload YouTube Video
**Prerequisites:**
- YouTube API key configured (optional, see `YOUTUBE_API_SETUP.md`)

**Steps:**
1. Select "YouTube" option
2. Paste a YouTube URL (e.g., `https://www.youtube.com/watch?v=...`)
3. Submit

**Expected Results:**
- ✅ Video transcript fetched
- ✅ Content created with transcript
- ✅ Timestamps preserved in metadata

**Note:** If YouTube API is not configured, this will show an error message.

#### Test 3.4: Content Processing
**Steps:**
1. After uploading content, wait for processing
2. Check content status

**Expected Results:**
- ✅ Content status changes from "processing" to "complete"
- ✅ Summary generated (if AI processing works)
- ✅ Content chunks created in `processed_contents` table

**Verify in Supabase:**
- Check `processed_contents` table
- Verify `chunks` array contains text chunks
- Check `summary` field (if AI processing enabled)

---

### 4. AI Chat Feature

#### Test 4.1: Basic Chat
**Prerequisites:**
- At least one workspace with processed content

**Steps:**
1. Navigate to a workspace with content
2. Click on "Chat" tab
3. Type a question: "What is this content about?"
4. Submit

**Expected Results:**
- ✅ AI responds with relevant answer
- ✅ Response references the uploaded content
- ✅ Chat history maintained
- ✅ Chat session saved in database

**Verify in Supabase:**
- Check `chat_sessions` table
- Verify `messages` array contains conversation

#### Test 4.2: Multiple Questions
**Steps:**
1. Ask follow-up questions in the same chat
2. Reference previous questions

**Expected Results:**
- ✅ AI maintains context across messages
- ✅ Responses are relevant to conversation history
- ✅ All messages saved in chat session

#### Test 4.3: Chat with No Content
**Steps:**
1. Create a new workspace
2. Try to chat without uploading content

**Expected Results:**
- ✅ Helpful message: "I don't have any content to reference yet..."
- ✅ Suggestion to upload content first

---

### 5. Quiz Generation

#### Test 5.1: Generate Quiz
**Prerequisites:**
- Workspace with processed content

**Steps:**
1. Navigate to workspace
2. Click "Quiz" tab
3. Click "Generate Quiz"
4. Select difficulty (Easy/Medium/Hard)
5. Select number of questions (default: 5)
6. Click "Generate"

**Expected Results:**
- ✅ Quiz generated successfully
- ✅ Questions displayed
- ✅ Multiple choice or short answer questions
- ✅ Quiz saved in database

**Verify in Supabase:**
- Check `quizzes` table
- Verify `questions` array contains quiz questions
- Check question structure (question, options, correctAnswer, explanation)

#### Test 5.2: Take Quiz
**Steps:**
1. Select a generated quiz
2. Answer all questions
3. Submit quiz

**Expected Results:**
- ✅ Answers submitted successfully
- ✅ Score calculated and displayed
- ✅ Correct/incorrect feedback for each question
- ✅ Explanations shown
- ✅ Quiz attempt saved

**Verify in Supabase:**
- Check `quiz_attempts` table
- Verify `answers` array matches submitted answers
- Check `score` is calculated correctly

#### Test 5.3: Quiz History
**Steps:**
1. Take a quiz multiple times
2. Check quiz history

**Expected Results:**
- ✅ Previous attempts visible
- ✅ Scores displayed
- ✅ Can review past attempts

---

### 6. Flashcards Feature

#### Test 6.1: Generate Flashcards
**Prerequisites:**
- Workspace with processed content

**Steps:**
1. Navigate to workspace
2. Click "Flashcards" tab
3. Click "Generate Flashcards"
4. Select number of cards (default: 10)
5. Click "Generate"

**Expected Results:**
- ✅ Flashcards generated successfully
- ✅ Question-answer pairs displayed
- ✅ Flashcards saved in database

**Verify in Supabase:**
- Check `flashcards` table
- Verify `question` and `answer` fields populated
- Check `difficulty` and `next_review` fields set

#### Test 6.2: Review Flashcards
**Steps:**
1. Click "Start Review" or review due cards
2. See question, reveal answer
3. Mark as "Correct" or "Incorrect"

**Expected Results:**
- ✅ Next review date calculated
- ✅ Difficulty adjusted based on performance
- ✅ Review recorded in database
- ✅ Spaced repetition algorithm working

**Verify in Supabase:**
- Check `flashcard_reviews` table for review records
- Verify `next_review` date updated in `flashcards` table
- Check `difficulty` adjusted based on review result

#### Test 6.3: Spaced Repetition
**Steps:**
1. Review same flashcard multiple times
2. Mark some correct, some incorrect
3. Check next review dates

**Expected Results:**
- ✅ Correct answers → longer interval until next review
- ✅ Incorrect answers → shorter interval (review again soon)
- ✅ Difficulty adjusts based on performance

---

### 7. Dashboard & Analytics

#### Test 7.1: Dashboard Overview
**Steps:**
1. Log in and view dashboard
2. Check statistics cards

**Expected Results:**
- ✅ Total workspaces count displayed
- ✅ Uploads today / limit shown
- ✅ Total content count displayed
- ✅ Subscription status shown

#### Test 7.2: Workspace List
**Steps:**
1. View dashboard
2. Check workspace cards

**Expected Results:**
- ✅ All workspaces displayed
- ✅ Content, quiz, and flashcard counts shown
- ✅ Recent activity visible
- ✅ Clicking workspace navigates to workspace page

---

### 8. Settings

#### Test 8.1: View Settings
**Steps:**
1. Click "Settings" in navigation
2. View settings page

**Expected Results:**
- ✅ Current user information displayed
- ✅ AI provider selection available
- ✅ Subscription status shown

#### Test 8.2: Change AI Provider
**Steps:**
1. Go to Settings
2. Change AI provider (OpenAI/Grok/Anthropic)
3. Save

**Expected Results:**
- ✅ Setting saved successfully
- ✅ New provider used for subsequent AI operations
- ✅ Change reflected in database

**Verify in Supabase:**
- Check `users` table
- Verify `ai_provider` field updated

---

### 9. Error Handling & Edge Cases

#### Test 9.1: Invalid Inputs
**Steps:**
1. Try to create workspace with empty name
2. Try to upload invalid file type
3. Try to submit quiz without answers

**Expected Results:**
- ✅ Appropriate error messages displayed
- ✅ Form validation prevents invalid submissions
- ✅ User-friendly error messages

#### Test 9.2: Network Errors
**Steps:**
1. Disconnect internet
2. Try to perform actions

**Expected Results:**
- ✅ Error messages displayed
- ✅ Application doesn't crash
- ✅ Can retry after reconnecting

#### Test 9.3: Large Files
**Steps:**
1. Try to upload a very large PDF (>50MB)
2. Try to upload many files at once

**Expected Results:**
- ✅ File size limits enforced
- ✅ Appropriate error messages
- ✅ Application remains responsive

---

### 10. Performance Testing

#### Test 10.1: Page Load Times
**Steps:**
1. Open browser DevTools → Network tab
2. Navigate through different pages
3. Check load times

**Expected Results:**
- ✅ Pages load in < 2 seconds
- ✅ No excessive API calls
- ✅ Efficient data fetching

#### Test 10.2: Database Queries
**Steps:**
1. Monitor Supabase Dashboard → Logs
2. Perform various actions
3. Check query performance

**Expected Results:**
- ✅ Queries execute quickly
- ✅ No N+1 query problems
- ✅ Efficient database usage

---

## Quick Test Checklist

Use this checklist for a quick smoke test:

- [ ] **Authentication**
  - [ ] Can sign up new user
  - [ ] Can log in
  - [ ] Can log out
  - [ ] Session persists

- [ ] **Workspaces**
  - [ ] Can create workspace
  - [ ] Can view workspace
  - [ ] Can see workspace list

- [ ] **Content**
  - [ ] Can upload text
  - [ ] Can upload PDF (if configured)
  - [ ] Content processes successfully

- [ ] **AI Features**
  - [ ] Can chat with content
  - [ ] Can generate quiz
  - [ ] Can generate flashcards

- [ ] **Interactions**
  - [ ] Can take quiz
  - [ ] Can review flashcards
  - [ ] Progress tracked

---

## Troubleshooting Common Issues

### Issue: "Missing Supabase environment variables"
**Solution:**
- Check `.env.local` file exists
- Verify all Supabase variables are set
- Restart dev server after adding variables

### Issue: "Table doesn't exist"
**Solution:**
- Run database migration in Supabase SQL Editor
- Verify migration completed successfully
- Check Supabase Dashboard → Table Editor

### Issue: "Failed to create user"
**Solution:**
- Check Supabase connection
- Verify service role key is correct
- Check server console for detailed error logs

### Issue: "AI features not working"
**Solution:**
- Verify AI API keys are set correctly
- Check `AI_PROVIDER` matches your key
- Check API key has sufficient credits/quota

### Issue: "Upload fails"
**Solution:**
- Check Supabase Storage bucket exists
- Verify bucket permissions
- Check file size limits

---

## Testing with Different User Roles

### Free Tier User
- ✅ Limited to 3 uploads per day
- ✅ Basic features available
- ✅ Upgrade prompts shown

### Pro Tier User
- ✅ Unlimited uploads
- ✅ All features available
- ✅ No usage limits

---

## Automated Testing (Future)

Consider adding:
- Unit tests for utility functions
- Integration tests for API routes
- E2E tests with Playwright/Cypress
- Component tests with React Testing Library

---

## Next Steps After Testing

1. **Fix any bugs** found during testing
2. **Optimize performance** based on test results
3. **Add error handling** for edge cases
4. **Improve UX** based on testing experience
5. **Document** any issues or improvements needed

---

## Need Help?

- Check server console for detailed error logs
- Review Supabase Dashboard for database issues
- Check browser DevTools Console for client-side errors
- Review Network tab for API call issues

Happy Testing! 🚀

