#!/usr/bin/env node

/**
 * Check GitHub Webhooks for Vercel
 * 
 * This script helps diagnose webhook issues by providing
 * instructions to check GitHub webhook deliveries.
 */

console.log('🔍 GitHub Webhook Diagnostic Guide\n');
console.log('Since we can\'t access GitHub webhooks via API without a GitHub token,');
console.log('please check manually:\n');
console.log('1. Go to: https://github.com/AugieDoggie2021/fantasy-football-ladder/settings/hooks');
console.log('2. Look for webhooks from Vercel (should have vercel.com in the URL)');
console.log('3. Click on each webhook and check:');
console.log('   - Recent Deliveries tab');
console.log('   - Look for recent push events');
console.log('   - Check if deliveries show 200 OK or errors');
console.log('\n4. If no webhooks exist, that\'s the problem!');
console.log('   - The repository needs to be reconnected in Vercel');
console.log('\n5. If webhooks exist but show errors:');
console.log('   - Check the response status codes');
console.log('   - Look for 404, 401, or 500 errors');
console.log('   - These indicate the webhook URL is invalid or permissions are wrong');
console.log('\n6. If webhooks show 200 OK but no deployments:');
console.log('   - Check Vercel project settings');
console.log('   - Verify the production branch matches your commits');
console.log('   - Check if there are build errors preventing deployments');

