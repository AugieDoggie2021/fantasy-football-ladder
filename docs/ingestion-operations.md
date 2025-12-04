# Ingestion Operations Guide

This guide covers how to deploy, invoke, and test the external stats ingestion edge functions (`sync_external_players` and `sync_external_week_stats`).

## Prerequisites

- Access to your Supabase project dashboard
- Environment variables configured in Supabase:
  - `EXTERNAL_STATS_API_BASE_URL`
  - `EXTERNAL_STATS_API_KEY`
  - `INGESTION_SHARED_SECRET`
  - `SUPABASE_URL` (auto-provided)
  - `SUPABASE_SERVICE_ROLE_KEY` (auto-provided)

## Deployment Methods

You can deploy edge functions using either:
1. **Dashboard UI** (Recommended if CLI is unavailable) - See Section 1
2. **Supabase CLI** (Alternative) - See Section 2

---

## 1. Dashboard UI Deployment (No CLI Required)

This method allows you to deploy functions directly through the Supabase web interface without needing the CLI.

### Step 1: Configure Environment Variables

Before deploying, set up the required secrets:

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Add the following secrets (click **Add new secret** for each):
   - **Name**: `EXTERNAL_STATS_API_BASE_URL`
     - **Value**: `https://api.sportsdata.io/v3/nfl` (or your custom base URL)
   - **Name**: `EXTERNAL_STATS_API_KEY`
     - **Value**: Your SportsData.io API key
   - **Name**: `INGESTION_SHARED_SECRET`
     - **Value**: A secure random string (generate one and save it securely)

**Important:** Save the `INGESTION_SHARED_SECRET` value - you'll need it to invoke the functions and set it in Vercel.

### Step 2: Deploy sync_external_players

1. In Supabase Dashboard, go to **Edge Functions**
2. Click **Create a new function**
3. Configure the function:
   - **Function name**: `sync_external_players`
   - **Use the template**: Leave unchecked (we'll paste our code)
4. Click **Create function**
5. In the code editor, delete any template code and paste the **entire contents** of `supabase/functions/sync_external_players/index.ts`
   - Open the file from your local repository: `supabase/functions/sync_external_players/index.ts`
   - Select all (Ctrl+A / Cmd+A) and copy (Ctrl+C / Cmd+C)
   - Paste into the Supabase editor (Ctrl+V / Cmd+V)
   - Make sure you copy the entire file from line 1 to the end
6. Click **Deploy** (or **Save** if it's already deployed)

### Step 3: Deploy sync_external_week_stats

1. In Supabase Dashboard, go to **Edge Functions**
2. Click **Create a new function**
3. Configure the function:
   - **Function name**: `sync_external_week_stats`
   - **Use the template**: Leave unchecked
4. Click **Create function**
5. In the code editor, delete any template code and paste the **entire contents** of `supabase/functions/sync_external_week_stats/index.ts`
   - Open the file from your local repository: `supabase/functions/sync_external_week_stats/index.ts`
   - Select all (Ctrl+A / Cmd+A) and copy (Ctrl+C / Cmd+C)
   - Paste into the Supabase editor (Ctrl+V / Cmd+V)
   - Make sure you copy the entire file from line 1 to the end
6. Click **Deploy** (or **Save** if it's already deployed)

### Step 4: Verify Deployment

1. In **Edge Functions**, you should see both functions listed:
   - `sync_external_players`
   - `sync_external_week_stats`
2. Click on each function to verify they're deployed and active
3. Check the function logs (if any) to ensure there are no deployment errors

### Updating Functions via Dashboard

To update a function after making code changes:

1. Go to **Edge Functions** → Select the function
2. Click **Edit** (or the function name to open the editor)
3. Paste the updated code
4. Click **Deploy** or **Save**

---

## 2. CLI Usage (Alternative Method)

### Linking to Supabase Project

If you haven't linked your local project to your remote Supabase project:

1. Find your project reference ID:
   - Go to your Supabase dashboard
   - The URL will be: `https://supabase.com/dashboard/project/{project-ref}`
   - Copy the `{project-ref}` value

2. Link the project:
   ```bash
   cd supabase
   supabase link --project-ref <your-project-ref>
   ```

3. Verify the link:
   - Check that `supabase/config.toml` now contains a `[project]` section with `project_ref`
   - Or run: `supabase projects list` to see linked projects

### Applying Database Migrations

Before deploying functions, ensure all migrations are applied:

```bash
cd supabase
supabase db push
```

This will apply any pending migrations to your remote database.

### Deploying Edge Functions

Deploy both ingestion functions:

```bash
cd supabase

# Deploy sync_external_players
supabase functions deploy sync_external_players

# Deploy sync_external_week_stats
supabase functions deploy sync_external_week_stats
```

**Note:** If you encounter errors about missing environment variables, set them via the Supabase dashboard:
1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Add each required secret:
   - `EXTERNAL_STATS_API_BASE_URL`
   - `EXTERNAL_STATS_API_KEY`
   - `INGESTION_SHARED_SECRET`

Alternatively, use the CLI:
```bash
supabase secrets set EXTERNAL_STATS_API_BASE_URL=https://api.sportsdata.io/v3/nfl
supabase secrets set EXTERNAL_STATS_API_KEY=your-api-key
supabase secrets set INGESTION_SHARED_SECRET=your-shared-secret
```

## 3. Invoking Functions from Supabase Dashboard

### sync_external_players

1. Navigate to **Edge Functions** in your Supabase dashboard
2. Click on `sync_external_players`
3. Click **Invoke Function**
4. In the **Headers** section, add:
   ```
   X-INGESTION-KEY: <your-INGESTION_SHARED_SECRET-value>
   ```
5. Leave the **Body** empty (or use `{}`)
6. Click **Invoke**

**Expected Success Response:**
```json
{
  "insertedCount": 1500,
  "updatedCount": 200
}
```

**What to Check:**
- Go to **Table Editor** → `players` table
- You should see rows with:
  - `external_source` = 'sportsdata'
  - `external_id` populated with player IDs
  - `full_name`, `position`, `nfl_team`, etc. populated

### sync_external_week_stats

1. Navigate to **Edge Functions** in your Supabase dashboard
2. Click on `sync_external_week_stats`
3. Click **Invoke Function**
4. In the **Headers** section, add:
   ```
   X-INGESTION-KEY: <your-INGESTION_SHARED_SECRET-value>
   ```
5. In the **Body** section, enter:
   ```json
   {
     "seasonYear": 2023,
     "week": 1,
     "mode": "live"
   }
   ```
6. Click **Invoke**

**Expected Success Response:**
```json
{
  "seasonYear": 2023,
  "week": 1,
  "mode": "live",
  "insertedCount": 450,
  "updatedCount": 50,
  "skippedCount": 10
}
```

**What to Check:**
- Go to **Table Editor** → `player_week_stats` table
- Filter by `season_year = 2023` and `nfl_week = 1`
- You should see rows with:
  - `external_source` = 'sportsdata'
  - `external_stat_key` populated (format: `{playerId}-{seasonYear}-{week}`)
  - `season_year` = 2023
  - `nfl_week` = 1
  - Stats fields populated (passing_yards, rushing_yards, etc.)
  - `league_id` and `league_week_id` will be NULL initially (linked later)

**Error Responses:**

- **401 Unauthorized**: Missing or invalid `X-INGESTION-KEY` header
  ```json
  { "error": "Invalid or missing X-INGESTION-KEY header" }
  ```

- **400 Bad Request**: Missing required fields or invalid week
  ```json
  { "error": "seasonYear and week are required" }
  ```
  or
  ```json
  { "error": "week must be between 1 and 18" }
  ```

- **500 Internal Server Error**: External API error or configuration issue
  ```json
  { "error": "External API error: 401 Unauthorized", "details": "..." }
  ```

## 4. Dev Panel Usage in Web App

The web application includes a dev panel for triggering ingestion functions directly from the UI.

### Accessing the Dev Panel

1. Navigate to `/dashboard` in your deployed app
2. The dev panel is visible when:
   - `NEXT_PUBLIC_APP_ENV=dev` is set in Vercel environment variables, OR
   - The authenticated user has `is_admin = true` in the `users` table

### Enabling Dev Mode in Production

To temporarily enable the dev panel in production for testing:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add or update:
   ```
   NEXT_PUBLIC_APP_ENV = dev
   ```
3. Redeploy the application (or wait for next deployment)

**Note:** Remember to remove or change this back to `prod` after testing.

### Using the Dev Panel

#### Sync External Players

1. In the **External Stats Ingestion (Dev)** section
2. Click **Sync External Players**
3. Wait for the sync to complete
4. View results:
   - **Inserted**: Number of new players added
   - **Updated**: Number of existing players updated

#### Sync Week Stats

1. In the **External Stats Ingestion (Dev)** section
2. Fill in the form:
   - **Season Year**: e.g., 2023
   - **Week**: 1-18
   - **Mode**: `live` or `replay`
3. Click **Sync Week Stats**
4. Wait for the sync to complete
5. View results:
   - **Season**: The season year synced
   - **Week**: The week synced
   - **Mode**: The mode used
   - **Inserted**: Number of new stat records added
   - **Updated**: Number of existing stat records updated
   - **Skipped**: Number of records skipped (e.g., player not found)

### How It Works

The dev panel calls Next.js server actions (`triggerExternalPlayersSync` and `triggerExternalWeekStatsSync`) which:
1. Verify authentication and authorization (dev mode or admin user)
2. Read `INGESTION_SHARED_SECRET` from Vercel environment variables
3. Call the Supabase edge functions with the appropriate headers and body
4. Return the results to the UI for display

**Important:** The `INGESTION_SHARED_SECRET` must be set in **both**:
- Supabase Edge Functions secrets (for the edge functions to validate)
- Vercel environment variables (for the Next.js server actions to use)

## 5. Troubleshooting

### Function Returns 401 Unauthorized

- Verify `INGESTION_SHARED_SECRET` is set in Supabase Edge Functions secrets
- Verify the `X-INGESTION-KEY` header matches the secret exactly (no extra spaces)
- Check Supabase dashboard → Edge Functions → Secrets

### Function Returns 500 with "External API error"

- Verify `EXTERNAL_STATS_API_KEY` is set correctly in Supabase Edge Functions secrets
- Verify `EXTERNAL_STATS_API_BASE_URL` is correct (defaults to `https://api.sportsdata.io/v3/nfl`)
- Check the SportsData.io API status and your subscription/rate limits
- Review function logs in Supabase dashboard → Edge Functions → Logs

### Players Not Appearing in Database

- Check function logs for errors
- Verify the SportsData.io API response format matches what the function expects
- Check that the `players` table has the required columns (`external_source`, `external_id`, etc.)
- Ensure migration `20241202000005_add_external_stats_support.sql` has been applied

### Stats Not Appearing in Database

- Verify players were synced first (stats require matching players)
- Check function logs for "Player not found" warnings (these are skipped)
- Verify the `player_week_stats` table schema includes `external_source`, `external_stat_key`, `season_year`, `nfl_week`
- Check that the season/year and week values are valid (e.g., week 1-18)

### Dev Panel Not Visible

- Verify `NEXT_PUBLIC_APP_ENV=dev` is set in Vercel, OR
- Set `is_admin = true` for your user in the `users` table:
  ```sql
  UPDATE users SET is_admin = true WHERE id = '<your-user-id>';
  ```
- Redeploy the application after changing environment variables

## 6. Function Details

### sync_external_players

- **Endpoint**: `https://{project-ref}.supabase.co/functions/v1/sync_external_players`
- **Method**: POST
- **Headers Required**: `X-INGESTION-KEY`
- **Body**: Empty or `{}`
- **What It Does**:
  - Fetches all players from SportsData.io `/Players` endpoint
  - Maps external player data to internal format
  - Upserts into `players` table using `external_source` + `external_id` as unique key
  - Returns counts of inserted and updated players

### sync_external_week_stats

- **Endpoint**: `https://{project-ref}.supabase.co/functions/v1/sync_external_week_stats`
- **Method**: POST
- **Headers Required**: `X-INGESTION-KEY`
- **Body**: `{ "seasonYear": number, "week": number, "mode": "live" | "replay" }`
- **What It Does**:
  - Fetches weekly stats from SportsData.io `/PlayerGameStatsByWeek/{seasonYear}/{week}` endpoint
  - Maps external stat data to internal format
  - Looks up players by `external_source` + `external_id`
  - Upserts into `player_week_stats` table using `external_source` + `external_stat_key` as unique key
  - Returns counts of inserted, updated, and skipped records
  - Skips stats for players that don't exist in the `players` table

## 7. Next Steps

After successfully syncing players and stats:

1. **Link Stats to Leagues**: Stats are synced with `league_id` and `league_week_id` as NULL. They need to be linked to specific league weeks when those are created.

2. **Calculate Scores**: Use the scoring system to calculate fantasy points from the synced stats.

3. **Automate Sync**: Consider setting up scheduled jobs (cron) to automatically sync stats during the NFL season.

