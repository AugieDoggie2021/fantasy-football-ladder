# MCP Configuration Guide

This guide explains how to set up and configure MCP (Model Context Protocol) servers for GitHub and Vercel in Cursor.

## Configuration File Location

The MCP configuration file is located at:
- **Windows**: `%USERPROFILE%\.cursor\mcp.json` or in your project at `.cursor/mcp.json`
- **macOS/Linux**: `~/.cursor/mcp.json` or in your project at `.cursor/mcp.json`

## Current Configuration

Your `.cursor/mcp.json` file should be configured with three MCP servers:

```json
{
  "mcpServers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "vercel": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-vercel"
      ],
      "env": {
        "VERCEL_API_TOKEN": "${VERCEL_API_TOKEN}"
      }
    },
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase"
      ],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    }
  }
}
```

## Setup Instructions

### Supabase MCP Setup

The Supabase MCP server requires your Supabase project URL and service role key.

#### Step 1: Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Project Settings** → **API**
4. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`) → Use for `SUPABASE_URL`
   - **service_role secret** key → Use for `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important**: Use the **service_role** key, not the **anon** key. The service role key bypasses Row Level Security and is required for MCP operations.

#### Step 2: Set Environment Variables

**Windows PowerShell:**
```powershell
[System.Environment]::SetEnvironmentVariable('SUPABASE_URL', 'https://your-project-ref.supabase.co', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY', 'your_service_role_key_here', 'User')
```

**Windows CMD:**
```cmd
setx SUPABASE_URL "https://your-project-ref.supabase.co"
setx SUPABASE_SERVICE_ROLE_KEY "your_service_role_key_here"
```

**macOS/Linux:**
```bash
export SUPABASE_URL=https://your-project-ref.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Add to `~/.bashrc` or `~/.zshrc` to make it permanent:
```bash
echo 'export SUPABASE_URL=https://your-project-ref.supabase.co' >> ~/.bashrc
echo 'export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here' >> ~/.bashrc
source ~/.bashrc
```

### GitHub MCP Setup

The GitHub MCP server uses GitHub Copilot's hosted service, which requires:

1. **GitHub Copilot Subscription**
   - Individual, Business, or Enterprise plan
   - Sign in to GitHub Copilot in Cursor

2. **For Organizations**
   - "MCP servers in Copilot" policy must be enabled
   - Contact your organization admin if needed

3. **No Additional Configuration Needed**
   - The hosted server handles authentication automatically
   - Uses your GitHub Copilot credentials

**Alternative: Local GitHub MCP Server**

If you don't have Copilot access, you can use a local server:

```json
{
  "github": {
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-github"
    ],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
    }
  }
}
```

Then create a GitHub Personal Access Token:
1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Generate a new token (classic) with `repo` scope
3. Set environment variable: `$env:GITHUB_PERSONAL_ACCESS_TOKEN="your_token"`

### Vercel MCP Setup

The Vercel MCP server requires a Vercel API token.

#### Step 1: Get Your Vercel API Token

1. Go to [Vercel Account Tokens](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Name it (e.g., "Cursor MCP")
4. Select scope: **Full Account** (or appropriate permissions)
5. Click **"Create"**
6. **Copy the token immediately** (you won't see it again!)

#### Step 2: Set Environment Variable

**Windows PowerShell:**
```powershell
$env:VERCEL_API_TOKEN="your_vercel_token_here"
```

**Windows CMD:**
```cmd
set VERCEL_API_TOKEN=your_vercel_token_here
```

**macOS/Linux:**
```bash
export VERCEL_API_TOKEN=your_vercel_token_here
```

**To make it permanent (Windows PowerShell):**
```powershell
[System.Environment]::SetEnvironmentVariable('VERCEL_API_TOKEN', 'your_token_here', 'User')
```

**To make it permanent (macOS/Linux):**
Add to `~/.bashrc` or `~/.zshrc`:
```bash
export VERCEL_API_TOKEN=your_token_here
```

## Verification

After configuration:

1. **Restart Cursor completely** (close and reopen)
2. Check MCP status in Cursor
3. You should see:
   - GitHub MCP tools available (repositories, issues, PRs, etc.)
   - Vercel MCP tools available (deployments, logs, projects, etc.)
   - Supabase MCP tools available (database, migrations, functions, etc.)

## Available Tools

### GitHub MCP Tools
- List repositories
- Create and manage issues
- View and create pull requests
- Search code and repositories
- Access repository information
- Manage branches and commits
- List collaborators

### Vercel MCP Tools
- View deployment logs
- Check build status
- Access project information
- View deployment history
- Manage deployments
- Access environment variables

### Supabase MCP Tools
- Access database tables and schemas
- Run SQL queries
- Manage migrations
- Deploy edge functions
- View project settings
- Access API endpoints

## Troubleshooting

### MCP Servers Not Available

1. **Restart Cursor** - Configuration changes require a full restart
2. **Check Environment Variables** - Verify tokens are set correctly
3. **Verify JSON Syntax** - Ensure no trailing commas or syntax errors
4. **Check Node.js** - Ensure Node.js and `npx` are available

### GitHub MCP Issues

- **Hosted Server**: Ensure you're signed into GitHub Copilot
- **Local Server**: Verify your Personal Access Token is valid and has correct scopes
- **Organization**: Check that "MCP servers in Copilot" policy is enabled

### Vercel MCP Issues

- **Token Invalid**: Regenerate your Vercel API token
- **Token Expired**: Create a new token and update environment variable
- **Package Not Found**: The `npx` command will automatically download the package

### Supabase MCP Issues

- **Connection Error**: Verify `SUPABASE_URL` is correct and includes `https://`
- **Authentication Error**: Verify `SUPABASE_SERVICE_ROLE_KEY` is the service role key (not anon key)
- **Package Not Found**: The `npx` command will automatically download the package
- **Permission Denied**: Ensure you're using the service role key, not the anon key

### Environment Variables Not Working

- **Windows**: Use `$env:VARIABLE_NAME` in PowerShell or `set VARIABLE_NAME` in CMD
- **Permanent**: Set system/user environment variables through Windows Settings
- **Verify**: Run `echo $env:VERCEL_API_TOKEN` (PowerShell) to check if set

## Alternative: Hardcode Tokens (Not Recommended)

If environment variables don't work, you can temporarily hardcode tokens (not recommended for security):

```json
{
  "mcpServers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "vercel": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-vercel"
      ],
      "env": {
        "VERCEL_API_TOKEN": "your_actual_token_here"
      }
    }
  }
}
```

**⚠️ Warning**: Never commit tokens to version control! Add `.cursor/mcp.json` to `.gitignore` if you hardcode tokens.

## Resources

- [MCP Troubleshooting Guide](./MCP_TROUBLESHOOTING.md) - Troubleshooting common MCP issues
- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [GitHub Copilot MCP](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp)
- [Vercel API Tokens](https://vercel.com/account/tokens)
- [Supabase Dashboard](https://supabase.com/dashboard)

