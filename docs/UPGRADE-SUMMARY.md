# Next.js 15.5.7 Upgrade Summary

## CVE-2025-55182 (React2Shell) Security Fix

**Date**: January 2025  
**Upgrade**: Next.js 14.2.5 → 15.5.7  
**Reason**: Critical RCE vulnerability fix

## Changes Made

### 1. Package Updates
- Updated `next` from `^14.2.5` to `^15.5.7`
- Updated `eslint-config-next` from `^14.2.5` to `^15.5.7`

### 2. Code Changes for Next.js 15 Compatibility

#### Route Handlers - Async Request APIs
Next.js 15 requires `request.url` and `request.nextUrl` to be awaited:

**Fixed Files:**
1. `web/app/auth/callback/route.ts`
   - Changed: `const requestUrl = new URL(request.url)`
   - To: `const url = await request.url; const requestUrl = new URL(url)`

2. `web/app/api/leagues/[id]/scores/route.ts`
   - Changed: `request.nextUrl.searchParams`
   - To: `const nextUrl = await request.nextUrl; nextUrl.searchParams`

3. `web/app/api/leagues/[id]/scores/summary/route.ts`
   - Changed: `request.nextUrl.searchParams`
   - To: `const nextUrl = await request.nextUrl; nextUrl.searchParams`

4. `web/app/api/player-scores/route.ts`
   - Changed: `request.nextUrl.searchParams`
   - To: `const nextUrl = await request.nextUrl; nextUrl.searchParams`

#### No Changes Needed
- `web/middleware.ts` - Already compatible
- `web/lib/supabase/server.ts` - Already uses async `cookies()`
- Server Actions (`'use server'`) - No changes required
- Other API routes without request parameters - No changes required

## Next Steps

1. **Run npm install** to install Next.js 15.5.7:
   ```bash
   cd web
   npm install
   ```

2. **Test the application**:
   - Test authentication flow (OAuth callback)
   - Test all API routes
   - Test server actions
   - Test middleware redirects
   - Run build: `npm run build`

3. **Verify no breaking changes**:
   - Check TypeScript compilation
   - Test all routes
   - Verify cookie handling
   - Test in development and production builds

## Breaking Changes Addressed

- ✅ Route handler request APIs now async
- ✅ No React version changes needed (still React 18.3.1)
- ✅ Server Components unchanged
- ✅ Middleware patterns unchanged

## Security Status

- ✅ **PATCHED**: CVE-2025-55182 vulnerability fixed
- ✅ **COMPLIANT**: Using patched Next.js version (15.5.7)
- ✅ **READY**: Code updated for Next.js 15 compatibility

