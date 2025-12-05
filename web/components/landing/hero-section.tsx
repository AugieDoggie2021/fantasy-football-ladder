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
              <span className="text-kelly-neon">Promoted.</span>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Fantasy Football Ladder brings promotion and relegation to your leagues — multi-tier competition, automatic movement up and down, and a season that never feels flat.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-slate-950 bg-kelly-base hover:bg-kelly-soft rounded-xl transition-all hover:scale-105 shadow-lg shadow-kelly-base/25"
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
              <div className="aspect-[9/16] bg-gradient-to-br from-kelly-base/20 to-slate-800/50 rounded-xl flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-4 bg-kelly-base/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-kelly-neon"
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
