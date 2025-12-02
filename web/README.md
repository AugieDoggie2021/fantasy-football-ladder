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

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Configure `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_ENV=dev
```

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

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NEXT_PUBLIC_APP_ENV` - Environment: `dev`, `staging`, or `prod`

## Development Notes

- Authentication is handled via Supabase Auth
- Protected routes are enforced via middleware
- Server components use `lib/supabase/server.ts`
- Client components use `lib/supabase/client.ts`
- Feature flags are configured in `lib/config/feature-flags.ts`
- Environment banner shows in dev/staging (hidden in prod)

## Next Steps

See `/ROADMAP.md` for Phase 2+ development milestones.

