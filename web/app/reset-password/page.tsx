'use client'

/**
 * Reset Password Page
 * 
 * Handles password reset after user clicks the link from their email.
 * 
 * TODO: Full implementation required:
 * - Extract the token/hash from URL query parameters
 * - Verify the token with Supabase
 * - Display password reset form
 * - Update password using supabase.auth.updateUser()
 * - Show success message and redirect to login
 * - Handle expired/invalid tokens with appropriate error messages
 * - Add password strength requirements
 * 
 * This page is currently a placeholder. Users clicking the reset link
 * from their email will be redirected here, but the functionality
 * needs to be implemented.
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    password?: string
    confirmPassword?: string
  }>({})

  useEffect(() => {
    // Check if we have the necessary tokens in the URL
    // TODO: Extract and verify token from URL query params
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const type = searchParams.get('type')

    if (type !== 'recovery') {
      setError('Invalid reset link. Please request a new password reset.')
    }
    // TODO: Use the tokens to verify and set up the session
  }, [searchParams])

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required'
    if (password.length < 6) {
      return 'Password must be at least 6 characters'
    }
    if (password.length > 72) {
      return 'Password must be less than 72 characters'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setValidationErrors({})

    const passwordError = validatePassword(password)
    if (password !== confirmPassword) {
      setValidationErrors({
        confirmPassword: 'Passwords do not match',
      })
      setLoading(false)
      return
    }

    if (passwordError) {
      setValidationErrors({ password: passwordError })
      setLoading(false)
      return
    }

    try {
      // TODO: Implement password reset
      // const { error } = await supabase.auth.updateUser({
      //   password: password
      // })
      
      // Placeholder implementation
      throw new Error('Password reset functionality not yet implemented')
      
      // if (error) throw error
      // setSuccess(true)
      // setTimeout(() => {
      //   router.push('/login')
      // }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your new password below
          </p>
        </div>

        {success ? (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Password reset successful
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p>Your password has been reset. Redirecting to login...</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Password reset functionality is not yet fully implemented.
                This is a placeholder page. Please contact support for password reset assistance.
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="sr-only">
                    New Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className={`appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${
                      validationErrors.password
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  {validationErrors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {validationErrors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="sr-only">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className={`appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${
                      validationErrors.confirmPassword
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {validationErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting...' : 'Reset password'}
                </button>
              </div>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  ← Back to login
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

