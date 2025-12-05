# Authentication Flow Fix Summary

## Problem Description

After Google OAuth login, users were experiencing:
1. A second sign-in screen appearing
2. Being redirected back to `/` (landing page) instead of `/dashboard`
3. Appearing as not logged in (no access to protected routes)

## Root Causes Identified

1. **Auth Callback Route Cookie Handling**: The callback route wasn't properly setting cookies for route handlers in Next.js App Router
2. **OAuth Redirect Parameter Loss**: The redirect parameter wasn't being preserved through the OAuth flow
3. **Session Detection Issues**: Potential timing issues with session detection after OAuth callback

## Files Modified

### 1. `web/app/auth/callback/route.ts`

**Changes:**
- Fixed cookie handling to work properly in route handlers (using direct request/response cookie access)
- Added support for both `redirect_to` (OAuth standard) and `redirect` (custom) parameters
- Added dev-only logging for debugging session issues
- Ensured cookies are set on the response before redirect

**Key Fix:**
- Changed from using `createClient()` (which uses `cookies()` from 'next/headers') to direct cookie handling pattern suitable for route handlers
- This ensures cookies are properly set when exchanging OAuth code for session

### 2. `web/app/login/page.tsx`

**Changes:**
- Updated OAuth redirect to preserve the `redirect` parameter through the OAuth flow
- The redirect parameter is now passed through: Login → OAuth → Callback → Dashboard

**Key Fix:**
```typescript
const redirectTo = searchParams.get('redirect') || '/dashboard'
const callbackUrl = new URL('/auth/callback', siteUrl)
callbackUrl.searchParams.set('redirect', redirectTo)
```

### 3. `web/middleware.ts`

**Changes:**
- Added dev-only logging for auth callback route debugging
- Middleware already had correct logic for:
  - Redirecting authenticated users away from `/login`
  - Protecting routes that require authentication
  - Refreshing sessions

**Note:** The middleware logic was already correct. The issue was primarily in cookie handling.

### 4. `web/app/dashboard/page.tsx`

**Changes:**
- Added dev-only logging to help debug session detection issues

## Expected Flow After Fix

1. User clicks "Start Playing" on landing page → `/login`
2. User clicks "Continue with Google" → OAuth flow starts
   - Redirect parameter is preserved: `/auth/callback?redirect=/dashboard`
3. Google OAuth completes → Redirects to `/auth/callback?code=...&redirect=/dashboard`
4. Callback route:
   - Exchanges code for session
   - Sets cookies properly on response
   - Redirects to `/dashboard` (or preserved redirect parameter)
5. Middleware detects authenticated user → Allows access
6. User lands on `/dashboard` as authenticated user

## Testing Checklist

- [ ] OAuth login redirects to `/dashboard` after completion
- [ ] Session persists after OAuth (user can access protected routes)
- [ ] Redirect parameter is preserved through OAuth flow
- [ ] Middleware redirects authenticated users away from `/login`
- [ ] Protected routes properly redirect unauthenticated users to `/login`
- [ ] No second sign-in screen appears

## Dev-Only Logging

All logging is gated by `NEXT_PUBLIC_APP_ENV === 'dev'` to avoid production noise:
- `[Auth Callback]` - OAuth callback route logs
- `[Middleware]` - Middleware session detection logs
- `[Dashboard]` - Dashboard page user check logs

## Next Steps

1. **Test the fixes in production** after disabling Vercel Authentication
2. **Monitor logs** (if in dev environment) to verify session creation
3. **Check browser cookies** to ensure Supabase session cookies are being set
4. **Verify redirect flow** from landing page → login → OAuth → dashboard

## Potential Remaining Issues

1. **Vercel Authentication**: If still enabled, it may interfere with Supabase auth. User mentioned they will disable this manually.
2. **Cookie Domain/Path Issues**: If cookies aren't being set, check:
   - Cookie domain matches your production domain
   - Cookie path is `/`
   - SameSite settings (should be `lax` for OAuth)
3. **Session Refresh**: Middleware should handle this, but verify session refresh is working

## Technical Notes

- Route handlers in Next.js App Router require direct cookie access via request/response objects
- Server components can use `cookies()` from 'next/headers', but route handlers cannot
- OAuth callback must set cookies on the response object before redirecting
- The middleware pattern for Supabase SSR is correct and doesn't need changes

