# Fixing Vercel GitHub Integration

This guide helps diagnose and fix issues where Vercel isn't automatically deploying on new GitHub commits.

## Common Causes

1. **GitHub webhook not configured or broken**
2. **Vercel project disconnected from GitHub**
3. **Wrong branch configured for production**
4. **GitHub permissions/access revoked**
5. **Vercel project settings misconfigured**

## Step-by-Step Fix

### Step 1: Verify Repository Connection

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Git**
4. Verify the repository is connected:
   - Should show: `AugieDoggie2021/fantasy-football-ladder`
   - If disconnected, click **"Connect Git Repository"** and reconnect

### Step 2: Check Production Branch

1. In Vercel project settings, go to **Settings** → **Git**
2. Verify **Production Branch** is set to:
   - `main` (most common)
   - OR `master` (if that's your default branch)
3. If incorrect, update it to match your GitHub default branch

### Step 3: Verify GitHub Webhook

1. Go to your GitHub repository: `https://github.com/AugieDoggie2021/fantasy-football-ladder`
2. Go to **Settings** → **Webhooks**
3. Look for a webhook from Vercel (should have `vercel.com` in the URL)
4. If missing or shows errors:
   - Go back to Vercel
   - Disconnect and reconnect the repository (this recreates the webhook)

### Step 4: Reconnect Repository (Recommended Fix)

This is the most reliable way to fix webhook issues:

1. **In Vercel Dashboard:**
   - Go to your project → **Settings** → **Git**
   - Click **"Disconnect"** (don't worry, this won't delete your deployments)
   
2. **Reconnect:**
   - Click **"Connect Git Repository"**
   - Select `AugieDoggie2021/fantasy-football-ladder`
   - Confirm the connection

3. **Verify Settings:**
   - **Root Directory**: `web` (important!)
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Step 5: Test the Integration

1. Make a small change to your repository (e.g., update README)
2. Commit and push to your production branch (`main` or `master`)
3. Check Vercel Dashboard → **Deployments**
4. A new deployment should start automatically within seconds

### Step 6: Check GitHub Permissions

1. Go to [GitHub Settings → Applications → Authorized OAuth Apps](https://github.com/settings/applications)
2. Find **Vercel** in the list
3. Verify it has access to your repository
4. If missing or revoked:
   - Reconnect the repository in Vercel (Step 4)
   - This will re-authorize Vercel

## Manual Deployment (Temporary Workaround)

If automatic deployments aren't working, you can manually trigger deployments:

### Option 1: Via Vercel Dashboard
1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Or click **"Deploy"** → **"Deploy Git Commit"**

### Option 2: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd web
vercel --prod
```

## Verify Webhook is Working

After reconnecting, test the webhook:

1. Make a commit and push to `main` branch
2. Check GitHub → **Settings** → **Webhooks**
3. Click on the Vercel webhook
4. Check **Recent Deliveries** tab
5. You should see recent deliveries with status `200 OK`

If you see `404` or `401` errors, the webhook is broken and needs to be recreated.

## Troubleshooting Specific Issues

### Issue: "No deployments triggered on push"

**Solution:**
- Verify you're pushing to the production branch (`main`/`master`)
- Check Vercel project settings → **Git** → **Production Branch**
- Reconnect the repository

### Issue: "Webhook shows 404 errors"

**Solution:**
- The webhook URL is invalid
- Disconnect and reconnect the repository in Vercel
- This will create a new webhook with the correct URL

### Issue: "Webhook shows 401 errors"

**Solution:**
- GitHub permissions revoked
- Re-authorize Vercel in GitHub Settings → Applications
- Or reconnect the repository in Vercel

### Issue: "Deployments trigger but fail"

**Solution:**
- This is a different issue (build configuration)
- Check build logs in Vercel
- Verify environment variables are set
- Ensure `Root Directory` is set to `web`

## Quick Checklist

- [ ] Repository connected in Vercel Settings → Git
- [ ] Production branch matches GitHub default branch
- [ ] Webhook exists in GitHub Settings → Webhooks
- [ ] Webhook shows recent successful deliveries
- [ ] Root Directory set to `web` in Vercel
- [ ] Vercel has GitHub permissions (Settings → Applications)

## Still Not Working?

If the above steps don't work:

1. **Check Vercel Status**: [status.vercel.com](https://status.vercel.com)
2. **Check GitHub Status**: [status.github.com](https://status.github.com)
3. **Contact Support**: Vercel support can check webhook logs on their end

## Prevention

To avoid this issue in the future:

- Don't manually delete webhooks from GitHub
- Don't revoke Vercel's GitHub access
- Keep Vercel project connected to the repository
- Use the same GitHub account for both Vercel and the repository


