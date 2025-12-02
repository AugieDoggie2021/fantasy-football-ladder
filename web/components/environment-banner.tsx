/**
 * Environment Banner Component
 * 
 * Displays a banner at the top of the app indicating which environment
 * the application is running in (dev/staging/prod).
 * 
 * This helps prevent confusion during testing and ensures users know
 * which environment they're interacting with.
 */

'use client'

const getEnvironmentColor = (env: string) => {
  switch (env) {
    case 'dev':
      return 'bg-yellow-500 text-yellow-900'
    case 'staging':
      return 'bg-blue-500 text-blue-900'
    case 'prod':
      return 'bg-green-500 text-green-900'
    default:
      return 'bg-gray-500 text-gray-900'
  }
}

export function EnvironmentBanner() {
  const env = process.env.NEXT_PUBLIC_APP_ENV || 'dev'
  
  // Don't show banner in production
  if (env === 'prod') {
    return null
  }

  return (
    <div className={`${getEnvironmentColor(env)} py-2 text-center text-sm font-semibold`}>
      Running in <span className="uppercase font-bold">{env}</span> environment
    </div>
  )
}

