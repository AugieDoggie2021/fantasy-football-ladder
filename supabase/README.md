# Supabase Backend

This directory contains Supabase migrations, edge functions, and configuration.

## Structure

```
supabase/
├── migrations/           # Database migrations (SQL)
├── functions/            # Edge functions (Deno)
│   └── run_promotion/   # Promotion/relegation logic (Phase 5)
└── config.toml          # Supabase CLI configuration
```

## Migrations

Migrations are applied in chronological order based on filename timestamps.

### Current Migrations

- `20241202000000_create_users_table.sql` - Creates users table extension with RLS policies

## Edge Functions

Edge functions run on Deno runtime and handle server-side logic.

### Current Functions

- `run_promotion` - Promotion/relegation engine (Phase 5 - placeholder)

## Local Development

### Prerequisites

Install Supabase CLI:
```bash
npm install -g supabase
```

### Setup

1. Link to your Supabase project:
```bash
supabase link --project-ref your-project-ref
```

2. Start local Supabase:
```bash
supabase start
```

3. Apply migrations:
```bash
supabase db push
```

4. Deploy edge functions:
```bash
supabase functions deploy run_promotion
```

## Environment Variables

Edge functions require:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)

These are automatically available when deployed via Supabase CLI.

