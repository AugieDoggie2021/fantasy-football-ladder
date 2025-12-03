# Vercel MCP Configuration for Cursor

## Current Configuration

Your current `.cursor/mcp.json` file has:
```json
{
  "mcpServers": {
    "vercel": {
      "url": "https://mcp.vercel.com"
    }
  }
}
```

## Required Updates

To properly configure Vercel MCP tools to access deployment logs, you need to add authentication.

### Option 1: Using Command-Based MCP Server (Recommended)

Update your `.cursor/mcp.json` file to:

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

### Option 2: Using URL with Authentication Headers

If the URL-based approach works, try:

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

### Option 3: Using Environment Variable (Most Secure)

Use an environment variable instead of hardcoding:

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

Then set the environment variable:
- **Windows PowerShell**: `$env:VERCEL_API_TOKEN="your_token"`
- **Windows CMD**: `set VERCEL_API_TOKEN=your_token`
- **macOS/Linux**: `export VERCEL_API_TOKEN=your_token`

## Step 1: Get Your Vercel API Token

1. Go to https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Name it (e.g., "Cursor MCP")
4. Select scope: **Full Account** (or appropriate permissions)
5. Click **"Create"**
6. **Copy the token immediately** (you won't see it again!)

## Step 2: Update Configuration

Manually edit `.cursor/mcp.json` in Cursor and add the authentication as shown above.

## Step 3: Restart Cursor

After updating the configuration:
1. Save the file
2. **Completely close and restart Cursor**
3. MCP tools should now be available

## Verification

Once configured, you should be able to:
- View deployment logs
- Check build status  
- Access project information
- View deployment history

## Troubleshooting

### MCP Resources Not Available
- Restart Cursor completely after configuration changes
- Check that your API token is valid
- Verify the JSON syntax is correct (no trailing commas)

### Authentication Errors
- Verify the API token is correct and hasn't expired
- Check token permissions in Vercel dashboard
- Try regenerating the token

### Package Not Found
If `@modelcontextprotocol/server-vercel` doesn't exist, you may need to:
- Use the URL-based approach with headers
- Check Vercel's documentation for the correct package name
- Use Vercel CLI as an alternative

## Alternative: Vercel CLI

If MCP isn't working, you can use Vercel CLI directly:

```bash
# Install
npm i -g vercel

# Login
vercel login

# View deployments
vercel list

# View logs
vercel logs [deployment-url]
```

## Resources

- [Vercel API Tokens](https://vercel.com/account/tokens)
- [Vercel API Documentation](https://vercel.com/docs/rest-api)
- [Model Context Protocol](https://modelcontextprotocol.io)

