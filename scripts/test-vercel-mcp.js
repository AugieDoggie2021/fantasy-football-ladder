#!/usr/bin/env node
/**
 * Test script to verify Vercel API connection
 * This helps verify your API token is working before MCP connects
 */

const https = require('https');

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;

if (!VERCEL_API_TOKEN) {
  console.error('❌ VERCEL_API_TOKEN environment variable not set');
  console.log('\nSet it with:');
  console.log('  Windows PowerShell: $env:VERCEL_API_TOKEN="your_token"');
  console.log('  Windows CMD: set VERCEL_API_TOKEN=your_token');
  console.log('  macOS/Linux: export VERCEL_API_TOKEN=your_token');
  process.exit(1);
}
const MCP_ENDPOINT = 'https://mcp.vercel.com';

console.log('🔍 Testing Vercel MCP Connection...\n');
console.log(`Endpoint: ${MCP_ENDPOINT}`);
console.log(`Token: ${VERCEL_API_TOKEN ? VERCEL_API_TOKEN.substring(0, 10) + '...' : 'Not set'}\n`);

// First, test regular Vercel API to verify token works
function testVercelAPI() {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.vercel.com',
        path: '/v9/projects',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve({ success: true, message: '✅ Vercel API token is valid' });
          } else {
            resolve({ success: false, message: `❌ API returned status ${res.statusCode}`, data });
          }
        });
      }
    );

    req.on('error', (error) => {
      reject({ success: false, message: `❌ Connection error: ${error.message}` });
    });

    req.end();
  });
}

// Test MCP endpoint (if it supports direct HTTP)
function testMCPEndpoint() {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'mcp.vercel.com',
        path: '/',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            message: `MCP endpoint responded with status ${res.statusCode}`,
          });
        });
      }
    );

    req.on('error', (error) => {
      resolve({
        error: true,
        message: `MCP endpoint error: ${error.message}`,
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        timeout: true,
        message: 'MCP endpoint request timed out',
      });
    });

    req.end();
  });
}

async function main() {
  console.log('1️⃣ Testing Vercel API connection...');
  try {
    const apiResult = await testVercelAPI();
    console.log(apiResult.message);
    if (!apiResult.success) {
      console.log('   Response:', apiResult.data);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n2️⃣ Testing MCP endpoint...');
  const mcpResult = await testMCPEndpoint();
  if (mcpResult.error) {
    console.log(`   ${mcpResult.message}`);
    console.log('   ℹ️  This is normal - MCP endpoints may require WebSocket or MCP protocol');
  } else if (mcpResult.timeout) {
    console.log(`   ${mcpResult.message}`);
  } else {
    console.log(`   Status: ${mcpResult.statusCode}`);
    console.log(`   ${mcpResult.message}`);
  }

  console.log('\n📝 Next Steps:');
  console.log('   1. Restart Cursor completely');
  console.log('   2. Check if MCP resources are available');
  console.log('   3. If you see "Needs login", authorize through the UI');
  console.log('   4. If still not working, check Cursor Settings → Features → MCP');
}

main().catch(console.error);

