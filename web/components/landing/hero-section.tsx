'use client'

import Link from 'next/link'

export function HeroSection() {
  const scrollToSection = (id: string) => {
    if (typeof window === 'undefined') return
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section className="relative overflow-hidden py-20 sm:py-32 lg:py-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Fantasy Football,
              <br />
              <span className="text-brand-primary-500">Promoted.</span>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Fantasy Football Ladder brings promotion and relegation to your leagues — multi-tier competition, automatic movement up and down, and a season that never feels flat.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-brand-primary-500 hover:bg-brand-primary-600 rounded-xl transition-all hover:scale-105 shadow-lg shadow-brand-primary-500/25"
              >
                Start Playing
              </Link>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all border border-slate-700 backdrop-blur-sm"
              >
                How Ladder Leagues Work
              </button>
            </div>

            {/* Tertiary Link */}
            <div className="mt-6 text-center lg:text-left">
              <Link
                href="/login"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Already have an account? Log in
              </Link>
            </div>
          </div>

          {/* Right: Placeholder for App Preview */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 backdrop-blur-sm border border-slate-700/50 shadow-2xl">
              <div className="aspect-[9/16] bg-gradient-to-br from-brand-primary-50 to-brand-navy-100 rounded-xl flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-4 bg-brand-primary-500/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-brand-primary-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400">App preview coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
