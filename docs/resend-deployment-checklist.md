# Resend Email Integration - Deployment Checklist

This checklist guides you through deploying the Resend email integration for production email sending.

## Prerequisites

- ✅ Domain `fantasyladder.app` purchased and configured
- ✅ Resend account created
- ✅ Domain verified in Resend dashboard
- ✅ Resend API key obtained

## Deployment Steps

### 1. Set Resend API Key Secret

**Option A: Via Supabase CLI**
```bash
supabase secrets set RESEND_API_KEY=re_xxxxx
```

**Option B: Via Supabase Dashboard**
1. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Click "Add Secret"
3. Name: `RESEND_API_KEY`
4. Value: Your Resend API key (starts with `re_`)
5. Click "Save"

### 2. Verify Domain in Resend

**This step is REQUIRED before emails can be sent.**

1. Log in to [Resend Dashboard](https://resend.com)
2. Navigate to **Domains** (or go directly to https://resend.com/domains)
3. Click **"Add Domain"** if `fantasyladder.app` is not listed
4. Enter `fantasyladder.app` and click **"Add"**
5. Resend will provide DNS records that need to be added to your domain:
   - **SPF record** (TXT record)
   - **DKIM record** (TXT record)
   - **DMARC record** (TXT record) - optional but recommended
6. Add these DNS records to your domain registrar (where you purchased fantasyladder.app)
7. Wait for DNS propagation (can take 5 minutes to 48 hours)
8. Once verified, `fantasyladder.app` will show as **"Verified"** in Resend dashboard

**Note:** Until the domain is verified, emails will fail with "Email domain not verified" error.

### 3. Deploy Edge Function

```bash
supabase functions deploy send_invite_email
```

Verify deployment:
- Check Supabase Dashboard → Edge Functions → `send_invite_email`
- Status should show as "Active"

### 4. Test Email Sending

1. **Send Test Email**
   - Log in to your production app
   - Navigate to a league detail page as a commissioner
   - Go to "Invite Players" section
   - Enter a test email address
   - Click "Send via Email"

2. **Verify Email Delivery**
   - Check the recipient's inbox
   - Verify email appears (check spam folder if not in inbox)
   - Verify "from" address: `Fantasy Football Ladder <invites@fantasyladder.app>`
   - Verify email content is correct
   - Click the "Join League" button to verify link works

3. **Check Edge Function Logs**
   - Go to Supabase Dashboard → Edge Functions → `send_invite_email` → Logs
   - Verify no errors occurred
   - Look for success message: "Email sent successfully via Resend"

### 5. Verify Error Handling

Test error scenarios (optional but recommended):

1. **Invalid Email Address**
   - Try sending to an invalid email format
   - Verify appropriate error message is shown

2. **Rate Limiting** (if applicable)
   - Send multiple emails quickly
   - Verify rate limit errors are handled gracefully

## Troubleshooting

### Email Not Sending

**Check 1: API Key**
- Verify `RESEND_API_KEY` is set in Supabase secrets
- Verify the API key is valid in Resend dashboard
- Check Edge Function logs for authentication errors

**Check 2: Domain Verification**
- Verify `fantasyladder.app` is verified in Resend
- Check DNS records are correctly configured
- Wait for DNS propagation (can take up to 48 hours)

**Check 3: Edge Function**
- Verify function is deployed: `supabase functions deploy send_invite_email`
- Check function logs for errors
- Verify function is accessible

**Check 4: Email Address**
- Verify recipient email address is valid
- Check spam folder
- Try sending to a different email address

### Common Errors

**"Email service authentication failed"**
- The `RESEND_API_KEY` is invalid or expired
- Solution: Generate a new API key in Resend and update the Supabase secret

**"Email domain not verified"**
- The domain `fantasyladder.app` is not verified in Resend
- Solution: Verify the domain in Resend dashboard and ensure DNS records are correct

**"Rate limit exceeded"**
- Too many emails sent in a short time
- Solution: Wait a few minutes and try again, or upgrade your Resend plan

## Post-Deployment

After successful deployment:

- [ ] Test email sending works in production
- [ ] Verify email formatting looks correct
- [ ] Confirm invite links work properly
- [ ] Monitor Edge Function logs for any issues
- [ ] Set up monitoring/alerts for email failures (optional)

## Rollback Plan

If email sending fails:

1. **Temporary Fix**: The system will show an error message to users
2. **Check Logs**: Review Edge Function logs to identify the issue
3. **Fix Configuration**: Update API key or domain settings as needed
4. **Redeploy**: Run `supabase functions deploy send_invite_email` again

The invite system will continue to work with link-based invites even if email sending fails.

