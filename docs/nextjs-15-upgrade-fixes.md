# Next.js 15 Upgrade - Required Fixes

**Upgrade**: 14.2.5 → 15.5.7 (CVE-2025-55182 security fix)

## Breaking Changes to Address

### 1. Route Handler Request APIs (Critical)
Next.js 15 makes request APIs async. The `request.url` property needs to be accessed asynchronously.

**Files affected:**
- `web/app/auth/callback/route.ts` - Uses `request.url` directly

**Fix Required:**
```typescript
// OLD (Next.js 14)
const requestUrl = new URL(request.url)

// NEW (Next.js 15)
const requestUrl = new URL(await request.url)
```

### 2. Middleware Cookie Handling
Middleware cookie handling patterns may need updates. Current implementation should work, but needs verification.

**Files affected:**
- `web/middleware.ts`

### 3. Server Components and Cookies
The `cookies()` function from 'next/headers' is already async, which is correct.

**Files affected:**
- `web/lib/supabase/server.ts` - Already uses `await cookies()`

### 4. Route Handlers Without Request Parameter
Route handlers that don't use the request object should continue to work.

**Files affected:**
- `web/app/api/seasons/route.ts`
- `web/app/api/seed-demo/route.ts`
- Other API routes

## Testing Checklist

After upgrade, test:
- [ ] Authentication flow (OAuth callback)
- [ ] Server Actions (all 'use server' files)
- [ ] API routes
- [ ] Middleware redirects
- [ ] Cookie handling
- [ ] Build process
- [ ] TypeScript compilation

## Status

- ✅ Package.json updated to Next.js 15.5.7
- ✅ Route handlers updated for async request APIs:
  - ✅ `web/app/auth/callback/route.ts` - Fixed `request.url`
  - ✅ `web/app/api/leagues/[id]/scores/route.ts` - Fixed `request.nextUrl`
  - ✅ `web/app/api/leagues/[id]/scores/summary/route.ts` - Fixed `request.nextUrl`
  - ✅ `web/app/api/player-scores/route.ts` - Fixed `request.nextUrl`
- ✅ Middleware checked - no changes needed (uses request.nextUrl which should work)
- ⏳ Waiting for npm install
- ⏳ Testing pending

