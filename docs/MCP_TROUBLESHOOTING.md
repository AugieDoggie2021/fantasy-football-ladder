# MCP Troubleshooting Guide

## Current Configuration

Your `.cursor/mcp.json` currently uses:
```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-vercel"],
      "env": {
        "VERCEL_API_TOKEN": "your_token"
      }
    }
  }
}
```

## Issue

MCP resources are not showing up after restart. This suggests the package might not exist or the connection isn't working.

## Alternative Configuration to Try

### Option 1: URL-Based with Headers

Try this configuration instead:

```json
{
  "mcpServers": {
    "vercel": {
      "url": "https://mcp.vercel.com",
      "headers": {
        "Authorization": "Bearer YOUR_VERCEL_API_TOKEN_HERE"
      }
    }
  }
}
```

### Option 2: Check Cursor's MCP Settings

1. Open Cursor Settings
2. Navigate to **Features** → **Model Context Protocol (MCP)**
3. Check if Vercel MCP is listed there
4. You might need to configure it through the UI instead of just the JSON file

### Option 3: Verify Package Exists

The package `@modelcontextprotocol/server-vercel` might not exist. Try checking:

```bash
npm search @modelcontextprotocol/server-vercel
```

Or try manually running:
```bash
npx -y @modelcontextprotocol/server-vercel
```

If it fails, the package name might be different.

## Manual Vercel API Access

While troubleshooting MCP, you can use the provided script:

1. Set your token:
   ```powershell
   $env:VERCEL_API_TOKEN="your_token_here"
   ```

2. Run the script:
   ```powershell
   node scripts/check-vercel-deployment.js
   ```

Or use Vercel CLI directly:
```bash
npm i -g vercel
vercel login
vercel list
vercel logs [deployment-url]
```

## Checking MCP Connection Status

After updating the configuration:
1. **Completely close Cursor** (not just restart, fully quit)
2. **Reopen Cursor**
3. Check for MCP connection indicators in the UI
4. Try listing resources again

## Security Note

⚠️ **Important**: Your Vercel API token is visible in terminal output. For security:
1. Consider rotating your token
2. Use environment variables instead of hardcoding
3. Add `.cursor/mcp.json` to `.gitignore` if it contains tokens

## Next Steps

1. Try the URL-based configuration (Option 1)
2. Check Cursor's MCP settings UI (Option 2)
3. Verify package exists (Option 3)
4. Use manual API access while troubleshooting

