# Fantasy Football Ladder - Web Application

Next.js application for the Fantasy Football Ladder platform.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Data Fetching**: React Query (@tanstack/react-query)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase project created
- Environment variables configured

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file in the `web/` directory with your Supabase credentials:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_ENV=dev
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: Service Role Key (server-only, never exposed to client)
# Only needed for admin operations that bypass RLS
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Get your Supabase credentials from:
- **Project URL & Keys**: Supabase Dashboard → Project Settings → API
- **Service Role Key**: Same location, but keep this secret (server-only use)

4. Run database migrations (see `/supabase` directory):
```bash
# Using Supabase CLI
supabase db push
```

5. Start development server:
```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
web/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Protected dashboard route
│   ├── login/             # Authentication page
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Home page (redirects)
├── components/            # React components
│   ├── environment-banner.tsx
│   ├── logout-button.tsx
│   └── query-provider.tsx
├── lib/
│   ├── config/
│   │   └── feature-flags.ts
│   ├── hooks/
│   │   └── use-impersonation.ts
│   └── supabase/
│       ├── client.ts      # Browser Supabase client
│       └── server.ts      # Server Supabase client
└── middleware.ts          # Auth middleware for route protection
```

## Environment Variables

Create a `.env.local` file in the `web/` directory with the following variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Your Supabase project URL (from Supabase Dashboard → Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous key (public, safe for client-side use) |
| `NEXT_PUBLIC_APP_ENV` | ✅ Yes | Application environment: `dev`, `staging`, or `prod` |
| `NEXT_PUBLIC_SITE_URL` | ✅ Yes | Site URL for auth redirects (e.g., `http://localhost:3000` for dev, `https://your-app.vercel.app` for prod) |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ Optional | Service role key for admin operations (server-only, never expose to client) |

**Security Notes:**
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security - use only in server-side code
- For iOS app: Use the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` values (safe for mobile bundles)

## Development Notes

- Authentication is handled via Supabase Auth
- Protected routes are enforced via middleware
- Server components use `lib/supabase/server.ts`
- Client components use `lib/supabase/client.ts`
- Feature flags are configured in `lib/config/feature-flags.ts`
- Environment banner shows in dev/staging (hidden in prod)

## Build Performance

For faster Vercel builds, see [`docs/build-performance.md`](../docs/build-performance.md).

**Dependency caching is already enabled:** `package-lock.json` is committed to the repository, so Vercel can cache dependency installations for faster builds.

When dependencies change, remember to commit the updated lockfile:
```bash
cd web
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
git push
```

## Next Steps

See `/ROADMAP.md` for Phase 2+ development milestones.

