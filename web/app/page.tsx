import { LandingLayout } from '@/components/layout'
import { HeroSection, FeatureGrid, HowItWorks, CallToAction } from '@/components/landing'

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