import dynamicImport from 'next/dynamic'

// Dynamically import the marketing page to avoid client reference manifest issues
const MarketingPage = dynamicImport(() => import('./(marketing)/page'), {
  ssr: true,
})

// Prevent static generation to avoid clientModules error
export const dynamic = 'force-dynamic'

export default function HomePage() {
  // Show marketing page for non-authenticated users
  // Dashboard will handle authenticated redirects
  return <MarketingPage />
}

