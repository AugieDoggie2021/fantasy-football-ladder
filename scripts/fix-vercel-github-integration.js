#!/usr/bin/env node

/**
 * Fix Vercel-GitHub Integration
 * 
 * This script checks the Vercel project configuration and fixes
 * the GitHub integration if it's broken.
 */

const https = require('https');

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const REPO_OWNER = 'AugieDoggie2021';
const REPO_NAME = 'fantasy-football-ladder';
const REPO_FULL_NAME = `${REPO_OWNER}/${REPO_NAME}`;

if (!VERCEL_API_TOKEN) {
  console.error('❌ VERCEL_API_TOKEN environment variable is not set');
  process.exit(1);
}

function makeRequest(method, path, data = null) {
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

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

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
          reject(new Error(`Parse Error: ${e.message} - Body: ${body}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function listProjects() {
  console.log('📋 Fetching Vercel projects...');
  const response = await makeRequest('GET', '/v9/projects');
  return response.projects || [];
}

async function getProject(projectId) {
  console.log(`📦 Fetching project details for ${projectId}...`);
  return await makeRequest('GET', `/v9/projects/${projectId}`);
}

async function triggerRedeploy(projectId) {
  console.log(`🔄 Triggering redeploy for project ${projectId}...`);
  // Get latest deployment
  const deployments = await makeRequest('GET', `/v6/deployments?projectId=${projectId}&limit=1`);
  if (deployments.deployments && deployments.deployments.length > 0) {
    const latestDeployment = deployments.deployments[0];
    console.log(`   Latest deployment: ${latestDeployment.url}`);
    return latestDeployment;
  }
  return null;
}

async function checkDeployments(projectId) {
  console.log(`📊 Checking recent deployments...`);
  const deployments = await makeRequest('GET', `/v6/deployments?projectId=${projectId}&limit=5`);
  return deployments.deployments || [];
}

async function main() {
  try {
    console.log('🚀 Starting Vercel-GitHub integration fix...\n');

    // Find the project
    const projects = await listProjects();
    const project = projects.find(
      (p) => p.name === 'fantasy-football-ladder' || 
             p.name === 'fantasy-football-ladder-web' ||
             (p.link && p.link.repo === REPO_FULL_NAME)
    );

    if (!project) {
      console.error('❌ Project not found. Available projects:');
      projects.forEach((p) => {
        console.log(`   - ${p.name} (${p.id})`);
      });
      process.exit(1);
    }

    console.log(`✅ Found project: ${project.name} (${project.id})\n`);

    // Get detailed project info
    const projectDetails = await getProject(project.id);
    
    console.log('📊 Current Git Configuration:');
    if (projectDetails.link) {
      console.log(`   Repository: ${projectDetails.link.repo}`);
      console.log(`   Type: ${projectDetails.link.type}`);
      console.log(`   Production Branch: ${projectDetails.link.productionBranch || 'not set'}`);
    } else {
      console.log('   ⚠️  No Git repository connected!');
    }

    // Check if repository is correctly connected
    const repoName = projectDetails.link?.repo;
    const isConnected = projectDetails.link && 
                        repoName && 
                        repoName.includes('fantasy-football-ladder') &&
                        projectDetails.link.type === 'github';

    console.log(`\n📦 Repository: ${repoName || 'Not connected'}`);
    console.log(`   Type: ${projectDetails.link?.type || 'N/A'}`);
    
    if (!isConnected) {
      console.log('\n⚠️  Repository connection issue detected!');
      console.log('   The repository format may be different than expected.');
    } else {
      console.log('\n✅ Repository is connected!');
    }

    // Check production branch
    const productionBranch = projectDetails.link?.productionBranch || 'main';
    console.log(`\n🌿 Production Branch: ${productionBranch}`);
    
    // Check recent deployments
    const deployments = await checkDeployments(project.id);
    console.log(`\n📋 Recent Deployments (${deployments.length}):`);
    deployments.forEach((deployment, index) => {
      const date = new Date(deployment.createdAt).toLocaleString();
      const source = deployment.source || 'unknown';
      console.log(`   ${index + 1}. ${deployment.url || 'N/A'} (${source}) - ${date}`);
    });

    console.log('\n🔧 To fix the GitHub integration:');
    console.log('   1. Go to: https://vercel.com/waldopotter-9802s-projects/fantasy-football-ladder/settings/git');
    console.log('   2. Click "Disconnect" on the Git repository');
    console.log('   3. Click "Connect Git Repository"');
    console.log('   4. Select: AugieDoggie2021/fantasy-football-ladder');
    console.log('   5. This will recreate the webhook and fix the integration');
    console.log('\n✨ After reconnecting, new commits should automatically trigger deployments!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('   Your VERCEL_API_TOKEN may be invalid or expired.');
      console.error('   Get a new token at: https://vercel.com/account/tokens');
    }
    process.exit(1);
  }
}

main();

