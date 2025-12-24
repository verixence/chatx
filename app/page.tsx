import MarketingPage from './(marketing)/page'

// Prevent static generation to avoid clientModules error
export const dynamic = 'force-dynamic'

export default function HomePage() {
  // Show marketing page for non-authenticated users
  // Dashboard will handle authenticated redirects
  return <MarketingPage />
}
