import Link from 'next/link'

export function CallToAction() {
  return (
    <section className="py-20 sm:py-32 bg-slate-900/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
          Ready to climb the ladder?
        </h2>
        <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
          Join Fantasy Football Ladder and experience fantasy football with promotion and relegation.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-brand-primary-500 hover:bg-brand-primary-600 rounded-xl transition-all hover:scale-105 shadow-lg shadow-brand-primary-500/25"
        >
          Sign in or create an account
        </Link>
      </div>
    </section>
  )
}
