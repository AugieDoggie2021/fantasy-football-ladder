import { LandingLayout } from '@/components/layout'
import { HeroSection, FeatureGrid, HowItWorks, CallToAction } from '@/components/landing'

// Force dynamic rendering to avoid static generation timeouts with client components
export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <LandingLayout>
      <HeroSection />
      <FeatureGrid />
      <HowItWorks />
      <CallToAction />
    </LandingLayout>
  )
}