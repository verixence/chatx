/**
 * Content Safety & Moderation Module for ChatX
 * 
 * Educational platform safety layer designed for students aged 10-17.
 * Focuses on educational content guardrails rather than reactive blocking.
 */

export type ModerationResult = {
  allowed: boolean
  reason?: string
  severity?: 'low' | 'medium' | 'high'
  sanitized?: string
}

export type SafetyCheck = {
  category: string
  passed: boolean
  details?: string
}

/**
 * Educational content categories we want to encourage
 */
const EDUCATIONAL_PATTERNS = [
  // Learning-related keywords
  /\b(learn|study|explain|understand|question|answer|practice|review|notes|summary|quiz|flashcard|homework|assignment|lesson|chapter|subject|topic|concept)\b/gi,
  
  // Academic subjects
  /\b(math|science|history|english|literature|grammar|writing|reading|chemistry|physics|biology|geography|art|music|language|spanish|french|algebra|geometry|calculus)\b/gi,
  
  // Educational contexts
  /\b(how|why|what|when|where|define|describe|compare|analyze|examples|problem|solution|theorem|formula|equation)\b/gi,
]

/**
 * Patterns that suggest content may not be educational
 * These are flags, not automatic blocks - context matters
 */
const NON_EDUCATIONAL_FLAGS = [
  // Explicit inappropriate content
  /\b(sex|porn|nsfw|adult|xxx|explicit)\b/gi,
  
  // Violence/self-harm
  /\b(kill|suicide|self.?harm|violence|weapon|gun|murder)\b/gi,
  
  // Drugs/alcohol
  /\b(drug|marijuana|cannabis|cocaine|alcohol|drunk|high|stoned)\b/gi,
]

/**
 * Patterns that should be blocked (high confidence, harmful)
 */
const BLOCKED_PATTERNS = [
  /\b(how to (kill|harm|hurt|make (a bomb|drugs|weapons)))\b/gi,
  /\b(suicide (methods|instructions|guide|how))\b/gi,
  /\b(join (my|cult|gang|group) for|recruit|indoctrinate)\b/gi,
]

/**
 * Educational prompt guardrails
 */
export const EDUCATIONAL_GUARDRAILS = `
EDUCATIONAL SAFETY GUIDELINES:
1. Stay focused on educational content - answer questions about learning materials only
2. Do not provide instructions for harmful, illegal, or dangerous activities
3. Do not share personal information or create inappropriate content
4. Keep responses age-appropriate for students (10-17 years old)
5. Redirect off-topic questions back to the learning materials
6. If asked about inappropriate topics, politely decline and refocus on education
7. Do not roleplay or pretend to be anyone other than an educational tutor
8. Do not generate content that could be used for cheating or academic dishonesty
`

/**
 * Check if user input is safe and educational
 */
export function moderateUserInput(input: string): ModerationResult {
  if (!input || input.trim().length === 0) {
    return { allowed: false, reason: 'Empty input', severity: 'low' }
  }

  const normalized = input.toLowerCase().trim()

  // Block clearly harmful patterns (high confidence)
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(input)) {
      return {
        allowed: false,
        reason: 'This question appears to be about harmful content. Please ask questions related to your learning materials.',
        severity: 'high',
      }
    }
  }

  // Check for educational context
  const hasEducationalContext = EDUCATIONAL_PATTERNS.some(pattern => pattern.test(input))
  
  // Check for non-educational flags
  const hasNonEducationalFlags = NON_EDUCATIONAL_FLAGS.some(pattern => pattern.test(input))

  // If it has non-educational flags but no educational context, flag it
  if (hasNonEducationalFlags && !hasEducationalContext) {
    return {
      allowed: false,
      reason: 'Please ask questions related to your learning materials. This platform is designed to help with your studies.',
      severity: 'medium',
    }
  }

  // Sanitize input (remove potential injection attempts, but preserve educational content)
  const sanitized = sanitizeInput(input)

  return {
    allowed: true,
    sanitized,
    severity: 'low',
  }
}

/**
 * Check if AI output is safe and appropriate
 */
export function moderateAIOutput(output: string): ModerationResult {
  if (!output || output.trim().length === 0) {
    return { allowed: false, reason: 'Empty output', severity: 'low' }
  }

  // Check for blocked patterns in output
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(output)) {
      return {
        allowed: false,
        reason: 'Content moderation: Response contained inappropriate content',
        severity: 'high',
      }
    }
  }

  // Check for explicit inappropriate content
  const hasExplicitContent = NON_EDUCATIONAL_FLAGS.some(pattern => pattern.test(output))
  if (hasExplicitContent) {
    // Check if it's in an educational context (e.g., discussing literature, health education)
    const hasEducationalContext = EDUCATIONAL_PATTERNS.some(pattern => pattern.test(output))
    
    if (!hasEducationalContext) {
      return {
        allowed: false,
        reason: 'Content moderation: Response contained inappropriate content for educational platform',
        severity: 'high',
      }
    }
  }

  // Sanitize output
  const sanitized = sanitizeOutput(output)

  return {
    allowed: true,
    sanitized,
    severity: 'low',
  }
}

/**
 * Sanitize user input while preserving educational content
 */
function sanitizeInput(input: string): string {
  let sanitized = input
  
  // Remove potential prompt injection attempts
  // Common patterns: "ignore previous instructions", "you are now", "system:"
  const injectionPatterns = [
    /ignore\s+(previous|all\s+)?instructions?/gi,
    /you\s+are\s+now/gi,
    /system\s*:/gi,
    /<\|(system|assistant|user)\|>/gi,
  ]
  
  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[removed]')
  }

  // Trim excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim()

  return sanitized
}

/**
 * Sanitize AI output
 */
function sanitizeOutput(output: string): string {
  let sanitized = output

  // Remove potential code injection or XSS attempts
  // But preserve markdown and educational formatting
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gis,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
  ]

  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '[removed]')
  }

  return sanitized
}

/**
 * Comprehensive safety check for educational content
 */
export function performSafetyCheck(input: string, output?: string): SafetyCheck[] {
  const checks: SafetyCheck[] = []

  // Input checks
  const inputModeration = moderateUserInput(input)
  checks.push({
    category: 'user_input',
    passed: inputModeration.allowed,
    details: inputModeration.allowed ? undefined : inputModeration.reason,
  })

  // Output checks (if provided)
  if (output) {
    const outputModeration = moderateAIOutput(output)
    checks.push({
      category: 'ai_output',
      passed: outputModeration.allowed,
      details: outputModeration.allowed ? undefined : outputModeration.reason,
    })
  }

  return checks
}

/**
 * Create a safe educational prompt suffix
 */
export function getEducationalPromptSuffix(): string {
  return EDUCATIONAL_GUARDRAILS
}

/**
 * Check if content is educational in nature
 */
export function isEducationalContent(content: string): boolean {
  if (!content || content.trim().length === 0) return false
  
  return EDUCATIONAL_PATTERNS.some(pattern => pattern.test(content))
}

/**
 * Get user-friendly error message for blocked content
 */
export function getSafeErrorMessage(severity: 'low' | 'medium' | 'high' = 'medium'): string {
  const messages = {
    low: "Please try rephrasing your question to focus on your learning materials.",
    medium: "This question doesn't seem related to your learning materials. Please ask questions about the content you're studying.",
    high: "I can't help with that question. Please ask questions related to your learning materials. If you need help, try asking about concepts, definitions, or explanations from your content.",
  }
  
  return messages[severity]
}

