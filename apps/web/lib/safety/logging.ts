/**
 * Safety Event Logging
 * 
 * Logs safety-related events for audit and monitoring purposes.
 * This helps track patterns and improve safety over time.
 */

export type SafetyEvent = {
  type: 'input_blocked' | 'output_blocked' | 'input_moderated' | 'output_moderated'
  userId: string
  workspaceId?: string
  contentId?: string
  severity: 'low' | 'medium' | 'high'
  reason?: string
  timestamp: string
  metadata?: Record<string, any>
}

/**
 * Log a safety event
 * 
 * In production, this should be sent to a monitoring/logging service.
 * For now, we'll use console logging with structured data.
 */
export function logSafetyEvent(event: Omit<SafetyEvent, 'timestamp'>): void {
  const fullEvent: SafetyEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  }

  // Log to console with structured format for easy parsing
  if (event.severity === 'high') {
    console.error('[Safety Event - HIGH]', JSON.stringify(fullEvent, null, 2))
  } else if (event.severity === 'medium') {
    console.warn('[Safety Event - MEDIUM]', JSON.stringify(fullEvent, null, 2))
  } else {
    console.log('[Safety Event - LOW]', JSON.stringify(fullEvent, null, 2))
  }

  // TODO: In production, send to monitoring service (e.g., Sentry, DataDog, CloudWatch)
  // Example:
  // await sendToMonitoringService(fullEvent)
}

/**
 * Get safety statistics for a user (for admin dashboard)
 */
export async function getSafetyStats(userId: string): Promise<{
  totalEvents: number
  blockedInputs: number
  blockedOutputs: number
  highSeverityEvents: number
  lastEventDate?: string
}> {
  // TODO: Implement database query to get safety stats
  // For now, return placeholder
  return {
    totalEvents: 0,
    blockedInputs: 0,
    blockedOutputs: 0,
    highSeverityEvents: 0,
  }
}

