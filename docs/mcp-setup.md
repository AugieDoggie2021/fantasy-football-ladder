# Vercel MCP Configuration Guide

This guide explains how to configure Vercel MCP tools in Cursor to access deployment logs and manage your Vercel projects.

## Prerequisites

1. **Vercel Account**: You need a Vercel account with access to your project
2. **Vercel API Token**: You'll need to generate an API token from Vercel

## Step 1: Get Your Vercel API Token

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a name (e.g., "Cursor MCP")
4. Set expiration if desired
5. Copy the token (you won't see it again!)

## Step 2: Configure MCP in Cursor

Update your `.cursor/mcp.json` file with one of these configurations:

### Option 1: Using Vercel MCP Server Package

```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-vercel"
      ],
      "env": {
        "VERCEL_API_TOKEN": "your_vercel_api_token_here"
      }
    }
  }
}
```

### Option 2: Using Remote MCP Server (if available)

```json
{
  "mcpServers": {
    "vercel": {
      "url": "https://mcp.vercel.com",
      "headers": {
        "Authorization": "Bearer your_vercel_api_token_here"
      }
    }
  }
}
```

### Option 3: Environment Variable (Recommended for Security)

Instead of hardcoding the token, use an environment variable:

```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-vercel"
      ],
      "env": {
        "VERCEL_API_TOKEN": "${VERCEL_API_TOKEN}"
      }
    }
  }
}
```

Then set the environment variable in your system:
- **Windows (PowerShell)**: `$env:VERCEL_API_TOKEN="your_token_here"`
- **Windows (CMD)**: `set VERCEL_API_TOKEN=your_token_here`
- **macOS/Linux**: `export VERCEL_API_TOKEN=your_token_here`

## Step 3: Restart Cursor

After updating the configuration:
1. Save the `mcp.json` file
2. Restart Cursor completely
3. The MCP tools should now be available

## Step 4: Verify Configuration

Once configured, you should be able to:
- View deployment logs
- Check build status
- Access project information
- View deployment history

## Troubleshooting

### MCP Server Not Found
- Ensure you have Node.js installed
- The `npx` command should be available in your PATH
- Try running `npx @modelcontextprotocol/server-vercel --help` manually

### Authentication Errors
- Verify your API token is correct
- Check that the token hasn't expired
- Ensure the token has the necessary permissions

### Resources Not Available
- Restart Cursor after configuration changes
- Check Cursor's MCP status/connection indicator
- Verify the configuration JSON syntax is valid

## Alternative: Using Vercel CLI

If MCP tools aren't working, you can use Vercel CLI directly:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# View deployments
vercel list

# View logs for a deployment
vercel logs [deployment-url]
```

## Resources

- [Vercel API Documentation](https://vercel.com/docs/rest-api)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Vercel Account Tokens](https://vercel.com/account/tokens)

