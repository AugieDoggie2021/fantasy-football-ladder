# Supabase Backend

This directory contains Supabase migrations, edge functions, and configuration.

## Structure

```
supabase/
├── migrations/           # Database migrations (SQL)
├── functions/            # Edge functions (Deno)
│   ├── seed_demo/       # Demo data seeding (dev only)
│   ├── seed_test_users/ # Test user creation (dev only)
│   ├── reset_universe/  # Universe reset utility (dev only)
│   └── run_promotion/   # Promotion/relegation engine (Phase 5)
└── config.toml          # Supabase CLI configuration
```

## Prerequisites

**Required Supabase CLI Version:** v1.200.0 or higher

Install Supabase CLI:
```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

## Migrations

Migrations are applied in chronological order based on filename timestamps.

### Current Migrations

- `20241202000000_create_users_table.sql` - Creates users table extension with RLS policies
- `20241202000001_create_seasons_leagues_tables.sql` - Seasons, leagues, and promotion groups
- `20241202000002_create_players_rosters_transactions_draft.sql` - Players, rosters, and draft tables
- `20241202000003_create_matchups_scoring_tables.sql` - Matchups, scoring, and standings
- `20241202000004_create_promotion_results.sql` - Promotion/relegation results tracking

### Applying Migrations

#### Local Development

1. Start local Supabase instance:
```bash
supabase start
```

This starts:
- PostgreSQL database on port 54322
- Supabase API on port 54321
- Supabase Studio on port 54323
- Inbucket (email testing) on port 54324

2. Apply all migrations:
```bash
supabase db push
```

Or apply migrations individually:
```bash
supabase migration up
```

#### Production / Remote Project

1. Link to your Supabase project:
```bash
supabase link --project-ref your-project-ref
```
Find your project ref in the Supabase dashboard URL: `https://supabase.com/dashboard/project/{project-ref}`

2. Push migrations to remote:
```bash
supabase db push
```

## Edge Functions

Edge functions run on Deno runtime and handle server-side logic.

### Current Functions

- `seed_demo` - Development-only function that seeds demo data (season, leagues, teams, players)
- `seed_test_users` - Development-only function to create test users
- `reset_universe` - Development-only function to reset all data
- `run_promotion` - Promotion/relegation engine for season rollover

### Deploying Edge Functions

#### Deploy All Functions

Deploy all functions to your linked project:
```bash
supabase functions deploy
```

#### Deploy Individual Functions

```bash
# Deploy promotion function
supabase functions deploy run_promotion

# Deploy seed demo function
supabase functions deploy seed_demo

# Deploy seed test users function
supabase functions deploy seed_test_users

# Deploy reset universe function
supabase functions deploy reset_universe
```

#### Local Development

Test functions locally:
```bash
# Start Supabase locally first
supabase start

# Serve functions locally
supabase functions serve
```

Functions will be available at `http://localhost:54321/functions/v1/{function-name}`

### Environment Variables for Edge Functions

When deployed via Supabase CLI, these environment variables are automatically available:

- `SUPABASE_URL` - Supabase project URL (from linked project)
- `SUPABASE_ANON_KEY` - Supabase anonymous key (from linked project)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for privileged operations (from linked project)
- `ENVIRONMENT` - Environment indicator (set manually via Supabase dashboard or CLI)

To set custom environment variables (secrets):
```bash
supabase secrets set KEY=value
```

Or via Supabase dashboard: Project Settings → Edge Functions → Secrets

### Required Secrets for Email Sending

The `send_invite_email` Edge Function requires the following secret:

- `RESEND_API_KEY` - Resend API key for sending emails (starts with `re_`)

**Setting the Resend API Key:**
```bash
supabase secrets set RESEND_API_KEY=re_xxxxx
```

**Note**: The domain `fantasyladder.app` must be verified in Resend dashboard before emails can be sent.

## Local Development Workflow

1. **Start local Supabase:**
```bash
supabase start
```

2. **Apply migrations:**
```bash
supabase db push
```

3. **Serve edge functions locally (optional):**
```bash
supabase functions serve
```

4. **Access Supabase Studio:**
Open `http://localhost:54323` in your browser to access the database UI.

5. **View test emails:**
Open `http://localhost:54324` to access Inbucket for viewing auth emails.

## Production Deployment

### Step 1: Link Project
```bash
supabase link --project-ref your-project-ref
```

### Step 2: Push Migrations
```bash
supabase db push
```

### Step 3: Deploy Functions
```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific function (e.g., email function)
supabase functions deploy send_invite_email
```

**Important**: After deploying the `send_invite_email` function, ensure `RESEND_API_KEY` is set as a secret (see "Required Secrets for Email Sending" above).

### Step 4: Verify

- Check migrations in Supabase dashboard: Database → Migrations
- Test edge functions via API or dashboard: Edge Functions → Your Function → Invoke

## Troubleshooting

**Migration conflicts:**
```bash
# Check migration status
supabase migration list

# Reset local database (WARNING: deletes all data)
supabase db reset
```

**Function deployment issues:**
```bash
# Check function logs
supabase functions logs {function-name}

# View function status
supabase functions list
```

