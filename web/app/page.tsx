import { LandingLayout } from '@/components/layout'
import { HeroSection, FeatureGrid, HowItWorks, CallToAction } from '@/components/landing'
import { AuthRedirectCheck } from '@/components/landing/auth-redirect-check'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Force dynamic rendering to avoid static generation timeouts with client components
export const dynamic = 'force-dynamic'

export default async function Home() {
  // Check if user is authenticated - if so, redirect to dashboard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is authenticated, always redirect to dashboard (never show landing page)
  if (user) {
    redirect('/dashboard')
  }
  
  // Note: If there's an OAuth code in the URL, it means Supabase redirected here
  // instead of /auth/callback. The client-side AuthRedirectCheck will handle this.

  return (
    <LandingLayout>
      <AuthRedirectCheck />
      <HeroSection />
      <FeatureGrid />
      <HowItWorks />
      <CallToAction />
    </LandingLayout>
  )
}