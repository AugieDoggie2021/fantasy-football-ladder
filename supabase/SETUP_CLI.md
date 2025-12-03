# Supabase CLI Setup for Windows

## Quick Setup

The Supabase CLI can be run via `npx` without global installation. However, due to PowerShell execution policy restrictions, you may need to run commands manually.

## Option 1: Run Commands Manually (Recommended)

Open PowerShell or Command Prompt and run:

```powershell
# Navigate to the supabase directory
cd "C:\Users\t.horne\Desktop\Fantasy Football v2\supabase"

# Run Supabase commands via npx
npx --yes supabase --version
npx --yes supabase db push
```

## Option 2: Install Supabase CLI Globally

If you want to install it globally (requires admin or execution policy change):

```powershell
# Temporarily allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install Supabase CLI globally
npm install -g supabase

# Verify installation
supabase --version
```

## Option 3: Use the Helper Script

A helper script `run-supabase.ps1` has been created. You can use it like:

```powershell
.\run-supabase.ps1 "db push"
.\run-supabase.ps1 "status"
.\run-supabase.ps1 "--version"
```

## Linking to Remote Project

Before running `db push`, you need to link to your Supabase project:

```bash
npx --yes supabase link --project-ref your-project-ref
```

Find your project ref in the Supabase dashboard URL: `https://supabase.com/dashboard/project/{project-ref}`

## Running Migrations

Once linked, you can push all migrations:

```bash
npx --yes supabase db push
```

Or apply migrations individually:

```bash
npx --yes supabase migration up
```

## Troubleshooting

If you get "relation does not exist" errors, make sure you've run migrations in order:
1. `20241202000000_create_users_table.sql`
2. `20241202000001_create_seasons_leagues_tables.sql`
3. `20241202000002_create_players_rosters_transactions_draft.sql`
4. `20241202000003_create_matchups_scoring_tables.sql`
5. `20241202000004_create_promotion_results.sql`
6. `20241202000005_add_external_stats_support.sql`

