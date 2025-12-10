'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-nav text-white border-b border-brand-navy-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-3 text-lg font-display font-semibold hover:opacity-90 transition-opacity"
            aria-label="Fantasy Football Ladder Home"
          >
            <Image
              src="/assets/brand/ffl-icon.svg"
              alt="Fantasy Football Ladder"
              width={32}
              height={32}
            />
            <span>Fantasy Football Ladder</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm font-sans text-foreground/80 hover:text-foreground transition-colors"
              aria-label="Scroll to How It Works section"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm font-sans text-foreground/80 hover:text-foreground transition-colors"
              aria-label="Scroll to Features section"
            >
              Features
            </button>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-sans font-semibold text-foreground bg-brand-primary-500 hover:bg-brand-primary-600 rounded-md transition-colors shadow-sm"
              aria-label="Sign in to your account"
            >
              Login
            </Link>
          </div>

          {/* Mobile menu button - simplified for now */}
          <div className="md:hidden">
            <Link
              href="/login"
              className="px-3 py-2 text-sm font-sans font-semibold text-foreground bg-brand-primary-500 hover:bg-brand-primary-600 rounded-md transition-colors shadow-sm"
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
