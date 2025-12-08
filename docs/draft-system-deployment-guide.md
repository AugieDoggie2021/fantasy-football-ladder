# Draft System - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the draft system to staging and production environments.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Migrations](#database-migrations)
3. [Environment Variables](#environment-variables)
4. [Staging Deployment](#staging-deployment)
5. [Production Deployment](#production-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring Setup](#monitoring-setup)
8. [Rollback Procedures](#rollback-procedures)

## Pre-Deployment Checklist

### Code Review
- [ ] All code changes reviewed and approved
- [ ] No console errors or warnings
- [ ] All TypeScript types are correct
- [ ] No hardcoded values (use environment variables)
- [ ] Error handling is comprehensive
- [ ] Analytics tracking is in place

### Testing
- [ ] All manual tests pass
- [ ] Integration tests pass
- [ ] Performance tests pass
- [ ] Mobile tests pass
- [ ] Browser compatibility verified
- [ ] Accessibility tests pass

### Documentation
- [ ] User guide is complete
- [ ] Developer guide is complete
- [ ] Testing guide is complete
- [ ] API documentation is up to date
- [ ] Migration guide is documented

### Database
- [ ] All migrations are tested
- [ ] Migration order is correct
- [ ] RLS policies are verified
- [ ] Indexes are created
- [ ] Realtime is enabled

## Database Migrations

### Migration Order

Deploy migrations in this exact order:

1. `20250108000000_add_draft_status_fields.sql`
   - Adds draft status fields to leagues table
   - Creates indexes
   - Updates RLS policies

2. `20250108000001_add_draft_pick_timer_fields.sql`
   - Adds timer fields to draft_picks table
   - Creates indexes

3. `20250108000002_create_draft_queues_table.sql`
   - Creates draft_queues table
   - Sets up RLS policies
   - Creates indexes

4. `20250108000003_update_draft_picks_rls_for_team_owners.sql`
   - Updates RLS policies for team owners
   - Allows team owners to make picks

5. `20250108000004_enable_realtime_for_draft_tables.sql`
   - Enables Supabase Realtime
   - Adds tables to realtime publication

6. `20250108000005_create_draft_audit_log.sql`
   - Creates audit log table
   - Sets up RLS policies
   - Creates indexes

### Applying Migrations

#### Using Supabase MCP (Recommended)

```bash
# Apply each migration via MCP
# Use mcp_supabase_apply_migration tool
```

#### Using Supabase CLI

```bash
# Link to project
supabase link --project-ref <your-project-ref>

# Apply migrations
supabase db push
```

#### Manual Application

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Run each migration SQL file in order
4. Verify each migration succeeds

### Verification

After applying migrations, verify:

```sql
-- Check leagues table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leagues' 
AND column_name IN ('draft_status', 'draft_started_at', 'current_pick_id', 'draft_settings');

-- Check draft_queues table exists
SELECT * FROM information_schema.tables WHERE table_name = 'draft_queues';

-- Check draft_audit_log table exists
SELECT * FROM information_schema.tables WHERE table_name = 'draft_audit_log';

-- Check indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('leagues', 'draft_picks', 'draft_queues', 'draft_audit_log');

-- Check Realtime is enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

## Environment Variables

### Required Variables

#### Next.js (Vercel)

**Client-Side (NEXT_PUBLIC_*):**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `NEXT_PUBLIC_POSTHOG_KEY`: PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST`: PostHog host (default: https://app.posthog.com)
- `NEXT_PUBLIC_APP_ENV`: Environment (dev, staging, production)

**Server-Side:**
- No additional server-side variables needed (uses Supabase client)

### Setting Variables in Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable for:
   - Production
   - Preview (staging)
   - Development

### Verification

After setting variables, verify they're accessible:

```typescript
// Check in browser console (client-side only)
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('PostHog Key:', process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'Set' : 'Missing')
```

## Staging Deployment

### Step 1: Deploy to Staging Branch

1. **Create Staging Branch** (if not exists)
   ```bash
   git checkout -b staging
   git push origin staging
   ```

2. **Configure Vercel Preview**
   - Connect staging branch to Vercel
   - Set up preview deployments
   - Configure environment variables

3. **Deploy**
   ```bash
   git push origin staging
   # Vercel will auto-deploy
   ```

### Step 2: Apply Staging Migrations

1. Use Supabase MCP or CLI to apply migrations
2. Verify all migrations succeed
3. Check database state

### Step 3: Test Staging

- [ ] Access staging URL
- [ ] Verify draft page loads
- [ ] Test draft generation
- [ ] Test starting draft
- [ ] Test making picks
- [ ] Test queue functionality
- [ ] Test mobile experience
- [ ] Verify analytics tracking
- [ ] Check error monitoring

### Step 4: Staging Sign-Off

- [ ] All tests pass
- [ ] No errors in console
- [ ] Performance is acceptable
- [ ] Analytics are tracking
- [ ] Team approves staging

## Production Deployment

### Step 1: Final Checks

- [ ] Staging is fully tested
- [ ] All migrations are verified
- [ ] Environment variables are set
- [ ] Documentation is complete
- [ ] Team is notified

### Step 2: Deploy to Production

1. **Merge to Main**
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

2. **Vercel Auto-Deploy**
   - Vercel will automatically deploy main branch
   - Monitor deployment in Vercel dashboard

3. **Verify Deployment**
   - Check deployment status
   - Verify build succeeds
   - Check for build warnings

### Step 3: Apply Production Migrations

**IMPORTANT**: Only apply migrations that haven't been applied yet.

1. Check which migrations are already applied:
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations 
   ORDER BY version;
   ```

2. Apply missing migrations via MCP or CLI

3. Verify migrations succeed

### Step 4: Production Verification

- [ ] Production URL is accessible
- [ ] Draft page loads correctly
- [ ] No console errors
- [ ] Analytics tracking works
- [ ] Error monitoring works
- [ ] Database connections work
- [ ] Realtime subscriptions work

## Post-Deployment Verification

### Functional Tests

Run these tests immediately after deployment:

1. **Basic Functionality**
   - [ ] Create a test league
   - [ ] Generate draft picks
   - [ ] Start draft
   - [ ] Make a pick
   - [ ] Add to queue
   - [ ] Complete draft

2. **Error Handling**
   - [ ] Test invalid inputs
   - [ ] Test rate limiting
   - [ ] Test concurrent picks
   - [ ] Verify error messages

3. **Performance**
   - [ ] Page load time < 2s
   - [ ] Search response < 100ms
   - [ ] Realtime updates < 1s latency
   - [ ] No memory leaks

### Monitoring Checks

1. **PostHog Analytics**
   - [ ] Events are being tracked
   - [ ] User identification works
   - [ ] Page views are tracked
   - [ ] Draft events are tracked

2. **Error Monitoring**
   - [ ] No critical errors
   - [ ] Error boundary catches React errors
   - [ ] Server errors are logged
   - [ ] Client errors are tracked

3. **Supabase**
   - [ ] Database queries are fast
   - [ ] Realtime connections are stable
   - [ ] No RLS policy errors
   - [ ] Audit logs are being created

### User Acceptance

- [ ] Test with real users
- [ ] Gather feedback
- [ ] Monitor for issues
- [ ] Document any problems

## Monitoring Setup

### PostHog Dashboard

1. **Create Dashboards**
   - Draft events overview
   - Error rate monitoring
   - User activity
   - Performance metrics

2. **Set Up Alerts**
   - High error rate
   - Draft failures
   - Performance degradation

### Supabase Monitoring

1. **Database Logs**
   - Monitor query performance
   - Check for slow queries
   - Monitor connection pool

2. **Realtime Status**
   - Monitor connection count
   - Check for disconnections
   - Monitor message throughput

### Vercel Monitoring

1. **Deployment Status**
   - Monitor build times
   - Check for build failures
   - Monitor function execution

2. **Performance**
   - Monitor page load times
   - Check Core Web Vitals
   - Monitor API response times

## Rollback Procedures

### Code Rollback

If issues are found:

1. **Revert Deployment**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Vercel Auto-Rollback**
   - Vercel will deploy previous version
   - Monitor rollback deployment

### Database Rollback

**WARNING**: Only rollback if absolutely necessary.

1. **Identify Problem Migration**
   - Check which migration caused issues
   - Document the problem

2. **Manual Rollback** (if needed)
   ```sql
   -- Example: Rollback draft_status column
   ALTER TABLE leagues DROP COLUMN IF EXISTS draft_status;
   ```

3. **Re-apply Fixed Migration**
   - Fix the migration
   - Test in staging
   - Re-apply to production

### Communication

1. **Notify Team**
   - Inform about rollback
   - Explain the issue
   - Provide timeline for fix

2. **Document Issue**
   - Record what went wrong
   - Document the fix
   - Update runbook

## Deployment Checklist Summary

### Pre-Deployment
- [ ] Code reviewed
- [ ] Tests pass
- [ ] Documentation complete
- [ ] Migrations tested

### Staging
- [ ] Deploy to staging
- [ ] Apply migrations
- [ ] Test thoroughly
- [ ] Get sign-off

### Production
- [ ] Merge to main
- [ ] Deploy to production
- [ ] Apply migrations
- [ ] Verify deployment
- [ ] Monitor closely

### Post-Deployment
- [ ] Functional tests pass
- [ ] Monitoring is active
- [ ] No critical errors
- [ ] Users can access
- [ ] Performance is good

## Support

If issues arise during deployment:

1. Check deployment logs in Vercel
2. Check Supabase logs
3. Check PostHog for errors
4. Review error monitoring
5. Contact team lead if needed

## Future Deployments

For future updates:

1. Follow same process
2. Test in staging first
3. Apply migrations carefully
4. Monitor after deployment
5. Document any issues

