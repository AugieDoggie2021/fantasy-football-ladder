'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function SiteHeader() {
  const pathname = usePathname()

  const scrollToSection = (id: string) => {
    if (pathname === '/') {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      // If we're not on the landing page, navigate there first
      window.location.href = `/#${id}`
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Wordmark */}
          <Link
            href="/"
            className="text-xl font-bold text-white hover:text-kelly-neon transition-colors"
            aria-label="Fantasy Football Ladder Home"
          >
            Fantasy Football Ladder
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm text-slate-300 hover:text-white transition-colors"
              aria-label="Scroll to How It Works section"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm text-slate-300 hover:text-white transition-colors"
              aria-label="Scroll to Features section"
            >
              Features
            </button>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-kelly-base hover:bg-kelly-soft rounded-lg transition-colors"
              aria-label="Sign in to your account"
            >
              Login
            </Link>
          </div>

          {/* Mobile menu button - simplified for now */}
          <div className="md:hidden">
            <Link
              href="/login"
              className="px-3 py-2 text-sm font-medium text-white bg-kelly-base hover:bg-kelly-soft rounded-lg transition-colors"
              aria-label="Sign in to your account"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
