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

  if (user) {
    redirect('/dashboard')
  }

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