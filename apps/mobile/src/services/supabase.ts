/**
 * Supabase Client
 * For direct database queries and storage operations
 */

import { createClient } from '@supabase/supabase-js'
import { ENV } from '../config/env'

if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not configured')
}

export const supabase = createClient(
  ENV.SUPABASE_URL || '',
  ENV.SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false, // We handle session ourselves
    },
  }
)

export default supabase
