# GitHub MCP Configuration Guide

This guide explains how to configure GitHub MCP tools in Cursor to interact with GitHub repositories, issues, pull requests, and more.

## Prerequisites

1. **GitHub Account**: You need a GitHub account
2. **GitHub Copilot Access**: The hosted MCP server requires GitHub Copilot access
3. **Personal Access Token (Optional)**: For local MCP server setup, you may need a GitHub Personal Access Token

## Option 1: Using GitHub Hosted MCP Server (Recommended)

GitHub provides a hosted MCP server that handles authentication automatically. This is the simplest setup.

### Configuration

Update your `.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}
```

### Authentication

The hosted server uses your GitHub Copilot authentication. Make sure you're signed into GitHub Copilot in Cursor.

**Note**: This requires:
- GitHub Copilot subscription (Individual, Business, or Enterprise)
- For organizations: "MCP servers in Copilot" policy must be enabled

## Option 2: Using Local GitHub MCP Server Package

If you prefer a local setup or don't have Copilot access, you can use a local MCP server package.

### Step 1: Get Your GitHub Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "Cursor MCP")
4. Select scopes:
   - `repo` - Full control of private repositories
   - `read:org` - Read org and team membership (if needed)
   - `read:user` - Read user profile data
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

### Step 2: Configure Local MCP Server

Update your `.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

### Step 3: Using Environment Variable (Recommended for Security)

Instead of hardcoding the token, use an environment variable:

```json
{
  "mcpServers": {
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
}
```

Then set the environment variable in your system:
- **Windows (PowerShell)**: `$env:GITHUB_PERSONAL_ACCESS_TOKEN="your_token_here"`
- **Windows (CMD)**: `set GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here`
- **macOS/Linux**: `export GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here`

## Step 3: Restart Cursor

After updating the configuration:
1. Save the `mcp.json` file
2. Restart Cursor completely
3. The GitHub MCP tools should now be available

## Step 4: Verify Configuration

Once configured, you should be able to:
- List repositories
- Create and manage issues
- View and create pull requests
- Search code and repositories
- Access repository information
- Manage branches and commits

## Available GitHub MCP Tools

The GitHub MCP server provides tools for:

- **Repository Management**: List repos, get repo info, search repos
- **Issues**: Create, list, update, close issues
- **Pull Requests**: Create, list, review, merge PRs
- **Code Search**: Search code across repositories
- **Branches**: List branches, get branch info
- **Commits**: Get commit information
- **Collaborators**: List repository collaborators

## Troubleshooting

### MCP Server Not Found (Local Setup)
- Ensure you have Node.js installed
- The `npx` command should be available in your PATH
- Try running `npx @modelcontextprotocol/server-github --help` manually
- Verify the package name is correct

### Authentication Errors (Hosted Server)
- Ensure you're signed into GitHub Copilot in Cursor
- Check that you have an active Copilot subscription
- For organizations, verify "MCP servers in Copilot" is enabled
- Try signing out and back into Copilot

### Authentication Errors (Local Setup)
- Verify your Personal Access Token is correct
- Check that the token hasn't expired
- Ensure the token has the necessary scopes/permissions
- Try regenerating the token

### Resources Not Available
- Restart Cursor after configuration changes
- Check Cursor's MCP status/connection indicator
- Verify the configuration JSON syntax is valid (no trailing commas)
- For hosted server, ensure Copilot is properly authenticated

### Package Not Found
If `@modelcontextprotocol/server-github` doesn't exist:
- Check the official MCP server registry
- Use the hosted server option instead
- Verify you're using the correct package name

## Combining Multiple MCP Servers

You can configure multiple MCP servers in the same `mcp.json` file:

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
    }
  }
}
```

## Resources

- [GitHub MCP Server Documentation](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp/use-the-github-mcp-server)
- [GitHub MCP Practical Guide](https://github.blog/ai-and-ml/generative-ai/a-practical-guide-on-how-to-use-the-github-mcp-server/)
- [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [GitHub Copilot](https://github.com/features/copilot)

