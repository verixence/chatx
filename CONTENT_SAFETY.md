# Content Safety & Moderation System

ChatX includes a comprehensive content safety and moderation system designed specifically for educational platforms serving students aged 10-17.

## Overview

The safety system is built around **educational guardrails** rather than reactive blocking. It focuses on:
- Encouraging educational content
- Preventing harmful or inappropriate content
- Maintaining a safe learning environment
- Providing clear, helpful feedback to students

## Architecture

### Core Components

1. **Input Moderation** (`lib/safety/moderation.ts`)
   - Validates user messages before processing
   - Checks for educational context
   - Blocks clearly harmful patterns
   - Sanitizes input to prevent injection attacks

2. **Output Moderation** (`lib/safety/moderation.ts`)
   - Validates AI-generated responses
   - Ensures age-appropriate content
   - Sanitizes output to prevent XSS attacks

3. **Safety Logging** (`lib/safety/logging.ts`)
   - Logs all safety events for audit trails
   - Tracks patterns for improvement
   - Enables monitoring and analytics

4. **Educational Guardrails** (built into AI prompts)
   - Prompts include safety guidelines
   - Focus on educational content
   - Age-appropriate responses (10-17 years)

## Integration Points

### Chat Interface
- **Input**: User messages are moderated before being sent to AI
- **Output**: AI responses are moderated before being shown to users
- **Location**: `app/api/chat/route.ts`

### Content Summaries
- AI-generated summaries are moderated for inappropriate content
- **Location**: `app/api/process/route.ts`

### Quiz Generation
- Quiz questions are generated with educational guardrails in prompts
- **Location**: `app/api/quiz/generate/route.ts`

### Flashcard Generation
- Flashcards are generated with educational guardrails in prompts
- **Location**: `app/api/flashcards/generate/route.ts`

## Safety Rules

### Blocked Patterns (High Confidence)
- Instructions for harmful activities (violence, self-harm, etc.)
- Explicit inappropriate content requests
- Recruiting/cult-like language

### Educational Context Required
The system encourages questions about:
- Learning materials and content
- Academic subjects (math, science, history, etc.)
- Educational concepts and explanations
- Study-related queries

### Non-Educational Flags
These patterns trigger warnings if not in educational context:
- Explicit content keywords
- Violence-related terms
- Drugs/alcohol references

## User Experience

### When Content is Blocked
Students receive clear, helpful error messages:
- "Please ask questions related to your learning materials."
- "This question doesn't seem related to your learning materials."
- Focused on redirecting to educational content rather than punitive language

### Logging & Monitoring
All safety events are logged with:
- Event type (input_blocked, output_blocked, etc.)
- User ID (for tracking patterns)
- Severity level (low, medium, high)
- Timestamp
- Reason (for debugging and improvement)

## Future Enhancements

1. **Database-backed Logging**
   - Store safety events in database for analytics
   - Build admin dashboard for monitoring
   - Track patterns over time

2. **Advanced Moderation**
   - Integration with external moderation APIs (e.g., OpenAI Moderation API)
   - Machine learning-based pattern detection
   - Custom rules for specific educational contexts

3. **Parent/Educator Tools**
   - Safety reports for parents/teachers
   - Customizable filtering levels
   - Activity monitoring dashboard

4. **Content Filtering**
   - Filter uploaded content (PDFs, text) for inappropriate material
   - YouTube video content validation
   - Educational content scoring

## Compliance

This system helps ensure compliance with:
- COPPA (Children's Online Privacy Protection Act) - for users under 13
- FERPA (Family Educational Rights and Privacy Act) - for educational records
- School district content policies
- General child safety best practices

## Maintenance

- Regularly review blocked patterns based on new threats
- Update educational patterns as curriculum changes
- Monitor false positive rates and adjust rules
- Review safety logs for patterns and improvements

## Testing

To test the safety system:

1. **Input Moderation**:
   - Try asking off-topic questions → should be redirected
   - Try harmful patterns → should be blocked with clear message

2. **Output Moderation**:
   - Review AI responses for appropriateness
   - Check that educational focus is maintained

3. **Logging**:
   - Check console logs for safety events
   - Verify events are logged with proper metadata

