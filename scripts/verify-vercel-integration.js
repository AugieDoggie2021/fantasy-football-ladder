#!/usr/bin/env node

/**
 * Verify Vercel-GitHub Integration
 * 
 * This script checks if the Vercel-GitHub integration is working correctly
 * by checking recent deployments and their sources.
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
            reject(new Error(`API Error: ${res.statusCode} - ${JSON.stringify(parsed)}`));
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

async function main() {
  try {
    console.log('🔍 Verifying Vercel-GitHub Integration...\n');

    // Find project
    const projects = await makeRequest('GET', '/v9/projects');
    const project = projects.projects.find(p => p.name === PROJECT_NAME);

    if (!project) {
      console.error('❌ Project not found');
      process.exit(1);
    }

    console.log(`✅ Project found: ${project.name}\n`);

    // Get project details
    const projectDetails = await makeRequest('GET', `/v9/projects/${project.id}`);
    
    console.log('📊 Git Configuration:');
    if (projectDetails.link) {
      console.log(`   Repository: ${projectDetails.link.repo}`);
      console.log(`   Type: ${projectDetails.link.type}`);
      console.log(`   Production Branch: ${projectDetails.link.productionBranch || 'main'}`);
    } else {
      console.log('   ⚠️  No repository connected!');
      console.log('   Run the fix: Go to Vercel Settings → Git → Connect Repository');
      process.exit(1);
    }

    // Check recent deployments
    const deployments = await makeRequest('GET', `/v6/deployments?projectId=${project.id}&limit=10`);
    const recentDeployments = deployments.deployments || [];

    console.log(`\n📋 Recent Deployments (${recentDeployments.length}):`);
    
    if (recentDeployments.length === 0) {
      console.log('   ⚠️  No deployments found');
      process.exit(1);
    }

    const gitDeployments = recentDeployments.filter(d => d.source === 'git');
    const manualDeployments = recentDeployments.filter(d => d.source !== 'git');

    console.log(`   ✅ Git-triggered: ${gitDeployments.length}`);
    console.log(`   📝 Manual/Other: ${manualDeployments.length}\n`);

    recentDeployments.slice(0, 5).forEach((deployment, index) => {
      const date = new Date(deployment.createdAt).toLocaleString();
      const source = deployment.source || 'unknown';
      const status = deployment.readyState || 'unknown';
      const icon = source === 'git' ? '✅' : '📝';
      console.log(`   ${icon} ${index + 1}. ${status} (${source}) - ${date}`);
    });

    // Check if recent deployments are from git
    const mostRecent = recentDeployments[0];
    const hoursAgo = (Date.now() - new Date(mostRecent.createdAt).getTime()) / (1000 * 60 * 60);

    console.log(`\n⏰ Most Recent Deployment: ${hoursAgo.toFixed(1)} hours ago`);
    
    if (mostRecent.source === 'git') {
      console.log('   ✅ Integration appears to be working!');
      if (hoursAgo > 24) {
        console.log('   ⚠️  But no recent git deployments. Make a test commit to verify.');
      }
    } else {
      console.log('   ⚠️  Most recent deployment was not from git');
      console.log('   🔧 Try: Disconnect and reconnect the repository in Vercel');
    }

    console.log('\n✨ To test: Make a commit and push to GitHub, then check for new deployment');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

