# PostHog Testing Guide

## Production Testing

After adding PostHog environment variables to Vercel:

### 1. Trigger a New Deployment

Environment variables are only available after a new deployment. You can:
- Push a commit to trigger automatic deployment
- Or manually trigger a redeploy in Vercel dashboard

### 2. Test PostHog Integration

1. **Visit the test page:**
   - Go to: `https://fantasyladder.app/admin/posthog-test`
   - Requires authentication (login first)

2. **Check status:**
   - Verify PostHog Key is present ✅
   - Verify PostHog is initialized ✅
   - Note the PostHog Host (should be `https://us.i.posthog.com`)

3. **Send test events:**
   - Click "Send Test Event (via track function)"
   - Click "Send Direct PostHog Event"
   - Check the result message

4. **Verify in PostHog Dashboard:**
   - Go to: https://us.i.posthog.com
   - Navigate to: Activity → Live events
   - You should see events appearing within a few seconds

### 3. Check Browser Console

Open DevTools → Console and look for:
- `✅ PostHog loaded and ready`
- `✅ PostHog event tracked: test_event_...`

### 4. Check Network Tab

Open DevTools → Network tab and filter for "posthog":
- You should see requests to `https://us.i.posthog.com/batch/`
- Status should be 200 OK

## Troubleshooting

### PostHog Not Initializing

- **Check environment variables:** Verify `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` are set in Vercel
- **Redeploy:** Environment variables require a new deployment
- **Check browser console:** Look for error messages
- **Verify key format:** Should start with `phc_`

### Events Not Appearing in PostHog

- **Wait a few seconds:** Events may take 5-10 seconds to appear
- **Check PostHog project:** Make sure you're looking at the correct project
- **Check network requests:** Verify requests are being sent (Network tab)
- **Check consent:** If consent banner is shown, user must accept

### Test Page Not Accessible

- **Login required:** Make sure you're logged in
- **Check URL:** Should be `/admin/posthog-test`
- **Check permissions:** Page is accessible to all authenticated users

## API Endpoint

You can also check PostHog configuration via API:
```
GET /api/test-posthog
```

Returns JSON with PostHog configuration status.

