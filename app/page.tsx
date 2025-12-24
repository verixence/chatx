'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MarketingPage from './(marketing)/page'

export default function HomePage() {
  // Show marketing page for non-authenticated users
  // Dashboard will handle authenticated redirects
  return <MarketingPage />
}
