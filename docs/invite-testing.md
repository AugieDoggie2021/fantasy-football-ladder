# League Invite Testing Guide

This guide explains how to test the league invitation system, including email sending and invite acceptance flows.

## Overview

The invite system supports two methods:
1. **Email Invites**: Send invitations directly via email
2. **Link Invites**: Generate shareable links that can be copied and shared

## Local Development Testing

### Prerequisites

- Supabase local instance running (`supabase start`)
- Inbucket running (typically on `http://localhost:54324`)
- Next.js dev server running

### Testing Email Invites

1. **Start Supabase Local Environment**
   ```bash
   supabase start
   ```
   This will start Inbucket automatically for email capture.

2. **Access Inbucket**
   - Open `http://localhost:54324` in your browser
   - This is where all emails sent in development will appear

3. **Test Email Sending**
   - Log in as a league commissioner
   - Navigate to a league detail page (`/leagues/[id]`)
   - Scroll to the "Invite Players" section
   - Enter an email address (e.g., `test@example.com`)
   - Click "Send via Email"
   - Check Inbucket for the email

4. **Verify Email Content**
   - Open the email in Inbucket
   - Verify the league name, commissioner name, and invite link are correct
   - Click the "Join League" button or copy the invite link

5. **Test Invite Acceptance**
   - Click the invite link (or navigate to `/join/league/[token]`)
   - If not logged in, you'll be redirected to login first
   - After logging in, you should see the league details
   - Enter a team name and click "Join League"
   - Verify you're redirected to the league page

### Testing Link Invites

1. **Generate Invite Link**
   - As a commissioner, go to the "Invite Players" section
   - Click "Generate Invite Link"
   - Copy the generated URL

2. **Share and Test**
   - Share the link with another user (or use incognito mode)
   - Open the link in a browser
   - Follow the same acceptance flow as email invites

### Testing Invite Management

1. **View Sent Invites**
   - As a commissioner, scroll down to see the "Sent Invites" list
   - Verify all invites are displayed with correct status

2. **Test Revoke**
   - Find a pending invite
   - Click "Revoke"
   - Verify the invite status changes to "revoked"
   - Try to use the revoked invite link - it should show an error

3. **Test Resend**
   - Find a pending invite with an email address
   - Click "Resend"
   - Check Inbucket for the resent email
   - Verify the email_sent_count increments

## Production Testing

### Prerequisites

- Resend API key configured
- Domain verified in Resend (fantasyladder.app)
- Production deployment on Vercel
- Valid email addresses for testing

### Resend Configuration

1. **Get Resend API Key**
   - Log in to [Resend Dashboard](https://resend.com)
   - Navigate to API Keys section
   - Create a new API key or use an existing one
   - Copy the API key (starts with `re_`)

2. **Verify Domain in Resend**
   - In Resend Dashboard, go to Domains
   - Ensure `fantasyladder.app` is verified
   - Verify DNS records are correctly configured (SPF, DKIM, DMARC)

3. **Set Resend API Key in Supabase**
   - Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Add a new secret: `RESEND_API_KEY` with your Resend API key value
   - Or use CLI: `supabase secrets set RESEND_API_KEY=re_xxxxx`

4. **Deploy Edge Function**
   ```bash
   supabase functions deploy send_invite_email
   ```

5. **Test Email Delivery**
   - Use a real email address (not a test domain)
   - Send an invite via email from the league detail page
   - Check the recipient's inbox (and spam folder)
   - Verify email formatting and links work
   - Verify "from" address shows `Fantasy Football Ladder <invites@fantasyladder.app>`

### Production Testing Checklist

- [ ] Email invites are sent successfully
- [ ] Email formatting looks correct
- [ ] Invite links work correctly
- [ ] Invite expiration works (7 days default)
- [ ] Revoked invites cannot be used
- [ ] Resend functionality works
- [ ] Invite acceptance creates teams correctly
- [ ] Users cannot join the same league twice
- [ ] Full leagues reject new invites

## Common Issues

### Emails Not Appearing in Inbucket

**Problem**: Emails sent in development don't show up in Inbucket.

**Solutions**:
- Verify Inbucket is running: `supabase status`
- Check the Supabase Edge Function logs
- Verify the email service is configured correctly
- Check browser console for errors

### "Failed to send email" Error

**Problem**: Email sending fails with an error message.

**Solutions**:
- **Check Resend API Key**: Verify `RESEND_API_KEY` is set in Supabase Edge Function secrets
- **Verify Domain**: Ensure `fantasyladder.app` is verified in Resend dashboard
- **Check Edge Function**: Verify Edge Function is deployed (`supabase functions deploy send_invite_email`)
- **Check Logs**: Review Edge Function logs in Supabase Dashboard for detailed errors
- **Rate Limiting**: If you see rate limit errors, wait a few minutes and try again
- **API Key Issues**: Verify the API key is valid and has proper permissions in Resend

### Resend-Specific Errors

**"Email service authentication failed" (401)**
- The `RESEND_API_KEY` is invalid or expired
- Generate a new API key in Resend and update the Supabase secret

**"Email domain not verified"**
- The domain `fantasyladder.app` is not verified in Resend
- Check DNS records in Resend dashboard and verify all required records are set

**"Rate limit exceeded" (429)**
- Too many emails sent in a short time period
- Wait a few minutes before sending more emails
- Check your Resend plan limits

### Invite Link Returns "Invalid invite"

**Problem**: Clicking an invite link shows an error.

**Solutions**:
- Verify the invite hasn't expired (7 days default)
- Check the invite status (should be "pending")
- Verify the token matches the database
- Check if the invite was revoked

### User Already in League

**Problem**: User tries to accept invite but gets "already in league" error.

**Solutions**:
- This is expected behavior - users can only have one team per league
- Check if the user already has a team in the league
- Use a different user account for testing

## Environment Variables

### Next.js Application

Required environment variables for the Next.js app:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
INVITE_EXPIRATION_DAYS=7  # Optional, defaults to 7
```

### Supabase Edge Functions

Required secrets for the `send_invite_email` Edge Function:

```bash
# Set via Supabase CLI:
supabase secrets set RESEND_API_KEY=re_xxxxx

# Or via Supabase Dashboard:
# Project Settings → Edge Functions → Secrets
```

The `RESEND_API_KEY` must be set for production email sending to work.

## Edge Function Deployment

The email sending Edge Function must be deployed:

```bash
supabase functions deploy send_invite_email
```

## Database Migrations

Ensure all migrations are applied:

```bash
supabase db push
```

Or apply manually:
- `20250101000000_create_league_invites.sql`
- `20250101000001_add_invite_email_tracking.sql`

## Testing Checklist

### Email Functionality
- [ ] Email sends successfully (local: Inbucket, production: inbox)
- [ ] Email content is correct (league name, commissioner, link)
- [ ] Email links work correctly
- [ ] Email formatting looks professional

### Invite Management
- [ ] Invites are created with expiration dates
- [ ] Invite list displays correctly
- [ ] Revoke functionality works
- [ ] Resend functionality works
- [ ] Email tracking fields update correctly

### Invite Acceptance
- [ ] Unauthenticated users are redirected to login
- [ ] Authenticated users can accept invites
- [ ] Team creation works correctly
- [ ] Users are redirected to league page after acceptance
- [ ] Duplicate team creation is prevented
- [ ] Full leagues reject new invites

### Edge Cases
- [ ] Expired invites are rejected
- [ ] Revoked invites are rejected
- [ ] Already-accepted invites cannot be reused
- [ ] Invalid tokens show appropriate errors

## Next Steps

After testing:
1. Verify all functionality works in production
2. Monitor email delivery rates
3. Check for any spam folder issues
4. Gather user feedback on email content
5. Consider adding email templates customization

