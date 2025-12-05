'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

type AuthError = {
  type: 'email' | 'password' | 'auth' | 'network' | 'confirmation'
  message: string
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [validationErrors, setValidationErrors] = useState<{
    email?: string
    password?: string
  }>({})
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  // Check for OAuth/auth errors in URL params
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const errorMessage = searchParams.get('message')
    
    if (errorParam || errorMessage) {
      setError({
        type: 'auth',
        message: errorMessage || 'Authentication failed. Please try again.',
      })
      // Clean up URL
      router.replace('/login', { scroll: false })
    }
  }, [searchParams, router])

  // Client-side email validation
  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return null
  }

  // Client-side password validation
  const validatePassword = (password: string, isSignUp: boolean): string | null => {
    if (!password) return 'Password is required'
    if (isSignUp) {
      if (password.length < 6) {
        return 'Password must be at least 6 characters'
      }
      if (password.length > 72) {
        return 'Password must be less than 72 characters'
      }
    }
    return null
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (validationErrors.email) {
      const emailError = validateEmail(value)
      setValidationErrors((prev) => ({
        ...prev,
        email: emailError || undefined,
      }))
    }
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (validationErrors.password) {
      const passwordError = validatePassword(value, isSignUp)
      setValidationErrors((prev) => ({
        ...prev,
        password: passwordError || undefined,
      }))
    }
  }

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp)
    setError(null)
    setValidationErrors({})
    setShowEmailConfirmation(false)
  }

  // Convert Supabase auth errors to user-friendly messages
  const getErrorMessage = (error: any): AuthError => {
    const errorMessage = error.message || 'An error occurred'

    // Network errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return {
        type: 'network',
        message: 'Network error. Please check your connection and try again.',
      }
    }

    // Email confirmation errors
    if (errorMessage.includes('email_not_confirmed') || errorMessage.includes('Email not confirmed')) {
      return {
        type: 'confirmation',
        message: 'Please check your email and click the confirmation link before signing in.',
      }
    }

    // Invalid credentials
    if (
      errorMessage.includes('Invalid login credentials') ||
      errorMessage.includes('Invalid credentials') ||
      errorMessage.includes('invalid_grant')
    ) {
      return {
        type: 'auth',
        message: 'Invalid email or password. Please try again.',
      }
    }

    // Email already registered
    if (
      errorMessage.includes('already registered') ||
      errorMessage.includes('User already registered') ||
      errorMessage.includes('email_already_exists')
    ) {
      return {
        type: 'email',
        message: 'An account with this email already exists. Please sign in instead.',
      }
    }

    // Weak password
    if (errorMessage.includes('Password')) {
      return {
        type: 'password',
        message: errorMessage,
      }
    }

    // Generic auth error
    return {
      type: 'auth',
      message: errorMessage,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setShowEmailConfirmation(false)
    setValidationErrors({})

    // Validate inputs
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password, isSignUp)

    if (emailError || passwordError) {
      setValidationErrors({
        email: emailError || undefined,
        password: passwordError || undefined,
      })
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        // Get base URL safely
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
        const emailRedirectTo = `${baseUrl}/auth/callback`
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
          },
        })

        if (error) {
          throw error
        }

        // Check if email confirmation is required
        // If user is null or session is null, email confirmation is likely required
        if (!data.user || !data.session) {
          setShowEmailConfirmation(true)
          setLoading(false)
          return
        }

        // User is automatically signed in (email confirmation disabled)
        const redirectTo = searchParams.get('redirect') || '/dashboard'
        router.push(redirectTo)
        router.refresh()
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          throw error
        }

        const redirectTo = searchParams.get('redirect') || '/dashboard'
        router.push(redirectTo)
        router.refresh()
      }
    } catch (err: any) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleOAuth = async () => {
    setOauthLoading(true)
    setError(null)
    
    try {
      // Get base URL - ensure it's valid
      let baseUrl: string
      if (typeof window !== 'undefined') {
        baseUrl = window.location.origin
      } else {
        // Fallback for SSR (shouldn't happen in client component, but safety check)
        baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      }

      // Validate base URL
      if (!baseUrl || baseUrl === 'undefined' || !baseUrl.startsWith('http')) {
        throw new Error('Invalid site URL configuration')
      }

      // Preserve redirect parameter in OAuth callback
      const redirectTo = searchParams.get('redirect') || '/dashboard'
      
      // Construct callback URL safely
      let callbackUrl: string
      try {
        const url = new URL('/auth/callback', baseUrl)
        url.searchParams.set('redirect', redirectTo)
        callbackUrl = url.toString()
      } catch (urlError) {
        // Fallback: construct URL manually if URL constructor fails
        const separator = baseUrl.endsWith('/') ? '' : '/'
        callbackUrl = `${baseUrl}${separator}auth/callback?redirect=${encodeURIComponent(redirectTo)}`
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      })

      if (error) {
        throw error
      }
      // OAuth redirect will happen automatically
    } catch (err: any) {
      setError({
        type: 'auth',
        message: err.message || 'Failed to sign in with Google. Please try again.',
      })
      setOauthLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 sm:p-10 bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            {isSignUp ? 'Create an account' : 'Sign in to Fantasy Football Ladder'}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            {isSignUp
              ? 'Join the ladder and start competing'
              : 'Access your leagues, manage your team, and climb the ladder.'}
          </p>
        </div>

        {showEmailConfirmation && (
          <div className="rounded-lg bg-kelly-base/10 border border-kelly-base/30 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-kelly-neon"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-kelly-neon">
                  Check your email
                </h3>
                <div className="mt-2 text-sm text-slate-300">
                  <p>
                    We&apos;ve sent a confirmation link to <strong>{email}</strong>.
                    Please click the link in the email to verify your account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {/* Google OAuth Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleOAuth}
              disabled={loading || oauthLoading || showEmailConfirmation}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-600 rounded-lg shadow-sm bg-slate-700/50 text-sm font-medium text-white hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kelly-base focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading ? (
                'Connecting...'
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800/30 text-slate-400">
                Or continue with email
              </span>
            </div>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && !showEmailConfirmation && (
            <div
              className={`rounded-lg p-4 border ${
                error.type === 'network'
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-relegation-red/10 border-relegation-red/30'
              }`}
            >
              <p
                className={`text-sm ${
                  error.type === 'network'
                    ? 'text-yellow-300'
                    : 'text-relegation-red-neon'
                }`}
              >
                {error.message}
              </p>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-slate-400 text-white bg-slate-700/50 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-kelly-base focus:border-kelly-base focus:z-10 sm:text-sm ${
                  validationErrors.email
                    ? 'border-relegation-red'
                    : 'border-slate-600'
                }`}
                placeholder="Email address"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={loading || showEmailConfirmation}
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-relegation-red">
                  {validationErrors.email}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-slate-400 text-white bg-slate-700/50 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-kelly-base focus:border-kelly-base focus:z-10 sm:text-sm ${
                  validationErrors.password
                    ? 'border-relegation-red'
                    : 'border-slate-600'
                }`}
                placeholder="Password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                disabled={loading || showEmailConfirmation}
              />
              {validationErrors.password && (
                <p className="mt-1 text-sm text-relegation-red">
                  {validationErrors.password}
                </p>
              )}
              {isSignUp && !validationErrors.password && (
                <p className="mt-1 text-xs text-slate-400">
                  Must be at least 6 characters
                </p>
              )}
            </div>
          </div>

          {!isSignUp && (
            <div className="flex items-center justify-end">
              <div className="text-sm">
                <a
                  href="/forgot-password"
                  className="font-medium text-kelly-neon hover:text-kelly-base transition-colors"
                >
                  Forgot your password?
                </a>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || showEmailConfirmation}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-slate-950 bg-kelly-base hover:bg-kelly-soft transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kelly-base focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Sign up' : 'Sign in'}
            </button>
          </div>

          <div className="text-center space-y-3">
            <button
              type="button"
              onClick={handleToggleMode}
              className="text-sm text-kelly-neon hover:text-kelly-base transition-colors"
              disabled={loading || oauthLoading || showEmailConfirmation}
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
            <div>
              <Link
                href="/"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← Learn more about Fantasy Football Ladder
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 p-8 sm:p-10 bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl">
          <div className="text-center text-slate-400">Loading...</div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
