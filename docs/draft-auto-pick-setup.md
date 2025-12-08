# Draft Auto-Pick Setup Guide

## Overview

The draft auto-pick system automatically processes expired draft picks when the timer runs out. This ensures drafts continue smoothly even if a team owner doesn't make their pick in time.

## How It Works

1. When a draft pick timer expires (`pick_due_at` is in the past), the pick is considered expired
2. A background job calls `/api/draft/check-expired-picks` every 10 seconds
3. The endpoint finds all expired picks and processes them:
   - Checks if the team has players in their queue
   - If queue exists, picks the highest priority available player
   - If no queue or all queued players are drafted, picks a random available player
   - Creates roster entry and transaction record
   - Advances to the next pick

## Configuration

### Vercel Cron Job

The auto-pick job is configured in `web/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/draft/check-expired-picks",
      "schedule": "* * * * *"
    }
  ]
}
```

**Schedule**: `* * * * *` means every minute
- This ensures picks are processed within 1 minute of expiration
- Vercel Cron uses standard 5-field format (minute, hour, day, month, weekday)
- For more frequent checks, consider using Supabase Edge Functions with pg_cron (see Alternative Setup Options below)

### Environment Variables

Optional: Add a secret token for security:

```bash
DRAFT_AUTO_PICK_SECRET=your-secret-token-here
```

If set, the endpoint will require this token in the Authorization header:
```
Authorization: Bearer your-secret-token-here
```

**Note**: Vercel Cron jobs automatically include authentication, so this is optional but recommended for additional security.

## Manual Testing

You can manually trigger the auto-pick check:

```bash
# GET request
curl https://your-app.vercel.app/api/draft/check-expired-picks

# POST request (same functionality)
curl -X POST https://your-app.vercel.app/api/draft/check-expired-picks
```

If `DRAFT_AUTO_PICK_SECRET` is set:
```bash
curl -H "Authorization: Bearer your-secret-token-here" \
  https://your-app.vercel.app/api/draft/check-expired-picks
```

## Monitoring

### Check Cron Job Status

1. Go to Vercel Dashboard → Your Project → **Crons**
2. View execution history and logs
3. Check for any errors or failures

### Monitor Draft Progress

- Check `draft_audit_log` table for `auto_pick_triggered` actions
- Review draft picks to see which were auto-picked (check `picked_at` vs `pick_due_at`)
- Monitor draft completion rates

## Troubleshooting

### Cron Job Not Running

1. **Check Vercel Cron Configuration**
   - Verify `vercel.json` is in the correct location (root of `web` directory)
   - Ensure the path matches: `/api/draft/check-expired-picks`
   - Check schedule syntax is correct

2. **Check Deployment**
   - Ensure the latest code is deployed
   - Verify the API route exists in the deployment

3. **Check Logs**
   - View Vercel function logs for errors
   - Check Supabase logs for database errors

### Auto-Picks Not Processing

1. **Check Draft Status**
   - Draft must be `in_progress` (not `paused` or `completed`)
   - Verify `pick_due_at` timestamps are set correctly

2. **Check Timer Settings**
   - Verify `draft_settings.timer_seconds` is set
   - Check that `pick_due_at` is being set when draft starts

3. **Check Queue Logic**
   - If queue exists but no pick is made, verify players aren't already drafted
   - Check that queue priority is set correctly

### Performance Considerations

- **Frequency**: Every minute provides a good balance between responsiveness and resource usage
- **Database Load**: The query is optimized with indexes on `pick_due_at` and `draft_status`
- **Concurrent Drafts**: The system handles multiple drafts simultaneously
- **Timer Precision**: With 90-second timers, picks will be processed within 1-2 minutes of expiration

## Alternative Setup Options

### Option 1: Supabase Edge Function (Recommended for Production)

Instead of Vercel Cron, you can use Supabase Edge Functions with pg_cron:

```sql
-- Create a function that calls the API
CREATE OR REPLACE FUNCTION check_expired_draft_picks()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Call the API endpoint via http extension
  PERFORM net.http_post(
    url := 'https://your-app.vercel.app/api/draft/check-expired-picks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.draft_auto_pick_secret', true)
    )
  );
END;
$$;

-- Schedule it to run every 10 seconds
SELECT cron.schedule(
  'check-expired-draft-picks',
  '*/10 * * * * *',
  $$SELECT check_expired_draft_picks()$$
);
```

### Option 2: External Cron Service

Use services like:
- [Cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [GitHub Actions](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)

Configure to call:
```
https://your-app.vercel.app/api/draft/check-expired-picks
```

## Security Best Practices

1. **Use Secret Token**: Set `DRAFT_AUTO_PICK_SECRET` environment variable
2. **Rate Limiting**: The endpoint already has rate limiting built-in
3. **Audit Logging**: All auto-picks are logged in `draft_audit_log`
4. **RLS Policies**: Database access is protected by Row Level Security

## Future Enhancements

- [ ] Webhook notifications when auto-pick is triggered
- [ ] Configurable auto-pick strategy (best available, position needs, etc.)
- [ ] Auto-pick analytics dashboard
- [ ] Email/SMS notifications before auto-pick triggers

