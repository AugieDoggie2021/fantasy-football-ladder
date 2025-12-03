#!/usr/bin/env node
/**
 * Script to check Vercel deployment status and logs
 * Usage: node scripts/check-vercel-deployment.js [deployment-id]
 */

const https = require('https');

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const PROJECT_NAME = 'fantasy-football-ladder'; // Update if different

if (!VERCEL_API_TOKEN) {
  console.error('❌ VERCEL_API_TOKEN environment variable not set');
  console.log('\nSet it with:');
  console.log('  Windows PowerShell: $env:VERCEL_API_TOKEN="your_token"');
  console.log('  Windows CMD: set VERCEL_API_TOKEN=your_token');
  console.log('  macOS/Linux: export VERCEL_API_TOKEN=your_token');
  process.exit(1);
}

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.vercel.com',
        path: path,
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, data: json });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      }
    );

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function getProjects() {
  console.log('📦 Fetching projects...\n');
  const response = await makeRequest('/v9/projects');
  
  if (response.status !== 200) {
    console.error('❌ Failed to fetch projects:', response.data);
    return null;
  }

  return response.data.projects || [];
}

async function getDeployments(projectId) {
  console.log(`🚀 Fetching deployments for project: ${projectId}\n`);
  const response = await makeRequest(`/v6/deployments?projectId=${projectId}&limit=5`);
  
  if (response.status !== 200) {
    console.error('❌ Failed to fetch deployments:', response.data);
    return null;
  }

  return response.data.deployments || [];
}

async function getDeploymentLogs(deploymentId) {
  console.log(`📋 Fetching logs for deployment: ${deploymentId}\n`);
  const response = await makeRequest(`/v2/deployments/${deploymentId}/events`);
  
  if (response.status !== 200) {
    console.error('❌ Failed to fetch logs:', response.data);
    return null;
  }

  return response.data;
}

function formatDeployment(deployment) {
  const status = deployment.readyState;
  const statusEmoji = {
    'READY': '✅',
    'BUILDING': '🔨',
    'ERROR': '❌',
    'QUEUED': '⏳',
    'CANCELED': '🚫',
  };

  return {
    id: deployment.uid,
    url: deployment.url,
    status: `${statusEmoji[status] || '❓'} ${status}`,
    created: new Date(deployment.createdAt).toLocaleString(),
    commit: deployment.meta?.githubCommitMessage || 'N/A',
  };
}

async function main() {
  try {
    // Get projects
    const projects = await getProjects();
    if (!projects || projects.length === 0) {
      console.log('❌ No projects found');
      return;
    }

    // Find our project
    const project = projects.find(p => p.name === PROJECT_NAME);
    if (!project) {
      console.log(`❌ Project "${PROJECT_NAME}" not found`);
      console.log('\nAvailable projects:');
      projects.forEach(p => console.log(`  - ${p.name}`));
      return;
    }

    console.log(`✅ Found project: ${project.name} (${project.id})\n`);

    // Get deployments
    const deployments = await getDeployments(project.id);
    if (!deployments || deployments.length === 0) {
      console.log('❌ No deployments found');
      return;
    }

    console.log('📋 Recent Deployments:\n');
    deployments.forEach((deployment, index) => {
      const formatted = formatDeployment(deployment);
      console.log(`${index + 1}. ${formatted.status}`);
      console.log(`   URL: ${formatted.url}`);
      console.log(`   Created: ${formatted.created}`);
      console.log(`   Commit: ${formatted.commit}`);
      console.log(`   ID: ${formatted.id}\n`);
    });

    // Show logs for latest deployment
    const latestDeployment = deployments[0];
    console.log(`\n📜 Logs for latest deployment (${latestDeployment.uid}):\n`);
    
    const logs = await getDeploymentLogs(latestDeployment.uid);
    if (logs && Array.isArray(logs)) {
      logs.forEach(log => {
        if (log.type === 'stdout' || log.type === 'stderr') {
          const prefix = log.type === 'stderr' ? '⚠️  ' : '   ';
          console.log(`${prefix}${log.payload}`);
        }
      });
    } else {
      console.log('ℹ️  Log streaming format - check Vercel dashboard for full logs');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();

