#!/usr/bin/env node

/**
 * Check Vercel Account Limits and Deployment Status
 * 
 * This script checks for deployment limits, quotas, and account restrictions
 * that might prevent automatic deployments.
 */

const https = require('https');

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const PROJECT_NAME = 'fantasy-football-ladder';

if (!VERCEL_API_TOKEN) {
  console.error('❌ VERCEL_API_TOKEN environment variable is not set');
  process.exit(1);
}

function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            // For some endpoints, we want to see the error
            resolve({ error: parsed, statusCode: res.statusCode });
          }
        } catch (e) {
          reject(new Error(`Parse Error: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function checkAccount() {
  try {
    console.log('📊 Checking Vercel account information...\n');
    const account = await makeRequest('GET', '/v2/user');
    
    console.log('👤 Account Information:');
    console.log(`   Username: ${account.user?.username || 'N/A'}`);
    console.log(`   Email: ${account.user?.email || 'N/A'}`);
    console.log(`   Name: ${account.user?.name || 'N/A'}`);
    
    // Check for team info
    if (account.user?.teams) {
      console.log(`\n👥 Teams: ${account.user.teams.length}`);
      account.user.teams.forEach(team => {
        console.log(`   - ${team.name} (${team.slug})`);
      });
    }
    
    return account;
  } catch (error) {
    console.log('   ⚠️  Could not fetch account info');
    return null;
  }
}

async function checkProjectLimits(projectId) {
  try {
    console.log('\n📦 Checking project limits...');
    const project = await makeRequest('GET', `/v9/projects/${projectId}`);
    
    console.log('   Project Settings:');
    console.log(`   - Name: ${project.name}`);
    console.log(`   - Account ID: ${project.accountId}`);
    console.log(`   - Team ID: ${project.teamId || 'Personal account'}`);
    
    return project;
  } catch (error) {
    console.log('   ⚠️  Could not fetch project limits');
    return null;
  }
}

async function checkRecentDeployments(projectId) {
  console.log('\n📋 Checking recent deployments for errors...');
  const deployments = await makeRequest('GET', `/v6/deployments?projectId=${projectId}&limit=20`);
  const recentDeployments = deployments.deployments || [];

  const errorDeployments = recentDeployments.filter(d => 
    d.readyState === 'ERROR' || 
    d.readyState === 'CANCELED' ||
    d.build?.error
  );

  const recentErrors = errorDeployments.slice(0, 5);
  
  if (recentErrors.length > 0) {
    console.log(`\n⚠️  Found ${errorDeployments.length} failed deployments:`);
    recentErrors.forEach((deployment, index) => {
      const date = new Date(deployment.createdAt).toLocaleString();
      const error = deployment.build?.error || 'Unknown error';
      console.log(`   ${index + 1}. ${date} - ${deployment.readyState}`);
      if (deployment.build?.error) {
        console.log(`      Error: ${deployment.build.error.message || JSON.stringify(deployment.build.error)}`);
      }
    });
  } else {
    console.log('   ✅ No recent deployment errors found');
  }

  // Check for any deployments in the last hour
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const lastHourDeployments = recentDeployments.filter(d => 
    new Date(d.createdAt).getTime() > oneHourAgo
  );

  console.log(`\n⏰ Deployments in last hour: ${lastHourDeployments.length}`);
  
  return recentDeployments;
}

async function checkDeploymentLogs(projectId) {
  try {
    console.log('\n📝 Checking for deployment restrictions...');
    
    // Get the most recent deployment
    const deployments = await makeRequest('GET', `/v6/deployments?projectId=${projectId}&limit=1`);
    if (deployments.deployments && deployments.deployments.length > 0) {
      const latest = deployments.deployments[0];
      console.log(`   Latest deployment: ${latest.uid}`);
      console.log(`   State: ${latest.readyState}`);
      console.log(`   Source: ${latest.source}`);
      console.log(`   Created: ${new Date(latest.createdAt).toLocaleString()}`);
      
      if (latest.readyState === 'ERROR') {
        console.log('\n   ⚠️  Latest deployment failed!');
        if (latest.build?.error) {
          console.log(`   Error: ${JSON.stringify(latest.build.error, null, 2)}`);
        }
      }
    }
  } catch (error) {
    console.log('   ⚠️  Could not fetch deployment logs');
  }
}

async function main() {
  try {
    console.log('🔍 Checking Vercel Account Limits and Deployment Status...\n');

    // Check account
    const account = await checkAccount();

    // Find project
    const projects = await makeRequest('GET', '/v9/projects');
    const project = projects.projects.find(p => p.name === PROJECT_NAME);

    if (!project) {
      console.error('❌ Project not found');
      process.exit(1);
    }

    console.log(`\n✅ Project found: ${project.name} (${project.id})\n`);

    // Check project limits
    await checkProjectLimits(project.id);

    // Check recent deployments
    await checkRecentDeployments(project.id);

    // Check deployment logs
    await checkDeploymentLogs(project.id);

    // Check Git configuration
    const projectDetails = await makeRequest('GET', `/v9/projects/${project.id}`);
    console.log('\n🔗 Git Configuration:');
    if (projectDetails.link) {
      console.log(`   Repository: ${projectDetails.link.repo}`);
      console.log(`   Production Branch: ${projectDetails.link.productionBranch || 'main'}`);
    }

    console.log('\n💡 Vercel Hobby Account Limits:');
    console.log('   - Unlimited deployments (no monthly cap)');
    console.log('   - 100GB bandwidth per month');
    console.log('   - 100 serverless function executions per day');
    console.log('   - No build time limits');
    console.log('\n   ⚠️  If deployments aren\'t triggering, it\'s likely:');
    console.log('   1. Webhook not firing (check GitHub webhooks)');
    console.log('   2. GitHub App permissions issue');
    console.log('   3. Branch mismatch (commits to wrong branch)');
    console.log('   4. Build errors preventing deployment');

    console.log('\n✨ Next steps:');
    console.log('   1. Check GitHub webhooks: https://github.com/AugieDoggie2021/fantasy-football-ladder/settings/hooks');
    console.log('   2. Check GitHub App: https://github.com/settings/installations');
    console.log('   3. Verify you\'re pushing to the correct branch (main)');
    console.log('   4. Check Vercel build logs for errors');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('   Your VERCEL_API_TOKEN may be invalid or expired.');
    }
    process.exit(1);
  }
}

main();

