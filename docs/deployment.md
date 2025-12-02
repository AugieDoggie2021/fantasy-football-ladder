# Deployment Guide

This guide covers deploying the Fantasy Football Ladder application to Vercel and configuring Supabase for production use.

## Prerequisites

- A [Vercel](https://vercel.com) account (free tier available)
- A [Supabase](https://supabase.com) project (free tier available)
- A [GitHub](https://github.com) account with the repository pushed

## Step 1: Supabase Project Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: Fantasy Football Ladder (or your preferred name)
   - **Database Password**: Choose a strong password (save this securely)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for development

### 1.2 Get API Credentials

1. Once your project is created, go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (safe for client-side use)
   - **service_role secret** key (keep this secret - server-only)

### 1.3 Apply Database Migrations

1. Install Supabase CLI (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. Link your local project to the remote Supabase project:
   ```bash
   cd supabase
   supabase link --project-ref your-project-ref
   ```
   Find your project ref in the Supabase dashboard URL: `https://supabase.com/dashboard/project/{project-ref}`

3. Push migrations:
   ```bash
   supabase db push
   ```

4. Deploy Edge Functions:
   ```bash
   supabase functions deploy
   ```

### 1.4 Configure Auth Providers

#### Email/Password Auth
- Already enabled by default
- Configure email templates in **Authentication** → **Email Templates**

#### Google OAuth (Optional but Recommended)

1. Go to **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. You'll need to create a Google OAuth application:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: Add your Supabase project's redirect URL:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
   - Copy the **Client ID** and **Client Secret** to Supabase

4. In Supabase, paste the Client ID and Client Secret, then click **Save**

### 1.5 Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add your production site URL to **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   ```
3. Set **Site URL** to:
   ```
   https://your-app.vercel.app
   ```

## Step 2: Vercel Deployment

### 2.1 Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository: `AugieDoggie2021/fantasy-football-ladder`
4. Vercel will auto-detect Next.js settings

### 2.2 Configure Build Settings

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `web` (important!)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 2.3 Set Environment Variables

In the Vercel project settings, go to **Settings** → **Environment Variables** and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (from Step 1.2) | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key (from Step 1.2) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (from Step 1.2) | Production, Preview, Development |
| `NEXT_PUBLIC_APP_ENV` | `prod` | Production<br>`staging` | Preview<br>`dev` | Development |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` | Production<br>`https://your-app-git-xxx.vercel.app` | Preview<br>`http://localhost:3000` | Development |

**Important Notes:**
- Select all environments (Production, Preview, Development) for each variable unless specified otherwise
- `SUPABASE_SERVICE_ROLE_KEY` should only be set in Production and Preview (never in Development if sharing)
- `NEXT_PUBLIC_SITE_URL` should match your actual deployment URL

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 2-3 minutes)
3. Once deployed, you'll get a URL like: `https://fantasy-football-ladder.vercel.app`

### 2.5 Update Supabase Redirect URLs

After deployment, update Supabase redirect URLs with your actual Vercel URL:
1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Update **Site URL** to your Vercel deployment URL
3. Add to **Redirect URLs**:
   - `https://your-app.vercel.app/auth/callback`
   - `https://your-app-git-*.vercel.app/auth/callback` (for preview deployments)

## Step 3: Post-Deployment Verification

### 3.1 Test Authentication

1. Visit your deployed app: `https://your-app.vercel.app`
2. You should be redirected to `/login`
3. Test sign up with email/password
4. Test Google OAuth (if configured)
5. Verify login redirects to `/dashboard`

### 3.2 Test Protected Routes

1. Try accessing `/dashboard` while logged out - should redirect to `/login`
2. Log in and verify you can access:
   - `/dashboard`
   - `/leagues`
   - `/seasons`
   - `/promotion-groups`

### 3.3 Verify Environment

- Check that the environment banner shows the correct environment (if enabled)
- Verify that dev-only features (like seed demo) are hidden in production

## Step 4: Ongoing Maintenance

### Updating the Application

1. Push changes to your GitHub repository
2. Vercel will automatically deploy on push to `main` branch
3. Preview deployments are created for pull requests

### Updating Database Migrations

1. Create new migration files in `supabase/migrations/`
2. Push to Supabase:
   ```bash
   cd supabase
   supabase db push
   ```

### Updating Edge Functions

1. Update function code in `supabase/functions/`
2. Deploy:
   ```bash
   supabase functions deploy function-name
   # Or deploy all:
   supabase functions deploy
   ```

### Updating Environment Variables

1. Go to Vercel Dashboard → **Settings** → **Environment Variables**
2. Update values as needed
3. Redeploy the application (or wait for next deployment)

## Troubleshooting

### Build Failures

- Check build logs in Vercel dashboard
- Verify all environment variables are set correctly
- Ensure `Root Directory` is set to `web`

### Authentication Issues

- Verify redirect URLs in Supabase match your Vercel deployment URL
- Check that `NEXT_PUBLIC_SITE_URL` matches your actual deployment
- Verify OAuth provider credentials are correct (if using Google)

### Database Connection Issues

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check that migrations have been applied: `supabase db push`
- Verify RLS policies are set correctly in Supabase dashboard

### Environment-Specific Issues

- Ensure `NEXT_PUBLIC_APP_ENV` is set correctly (`prod` for production)
- Check that dev-only features check this variable before enabling

## Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is only used server-side (never exposed to client)
- [ ] All environment variables are set in Vercel (not committed to git)
- [ ] Supabase RLS policies are enabled and tested
- [ ] OAuth redirect URLs are correctly configured
- [ ] Email confirmation is enabled (if required for your use case)
- [ ] Rate limiting is configured in Supabase (if needed)

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth)

