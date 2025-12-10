# MCP Troubleshooting Guide

This guide helps troubleshoot common issues with MCP (Model Context Protocol) servers in Cursor.

## Common Issues

### MCP Servers Not Loading

If MCP servers are not showing up or not working after configuration:

### Solution Steps

1. **Verify Configuration File**
   - Check that `.cursor/mcp.json` exists and has valid JSON syntax
   - Ensure no trailing commas or syntax errors
   - See [MCP Configuration Guide](./MCP_CONFIGURATION.md) for correct format

2. **Check Environment Variables**
   - Verify all required environment variables are set
   - For Vercel: `VERCEL_API_TOKEN`
   - For Supabase: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - Restart Cursor after setting environment variables

3. **Verify Package Availability**
   - Ensure Node.js and `npx` are installed
   - Try running the server manually: `npx -y @modelcontextprotocol/server-vercel`
   - Check that packages exist in npm registry

4. **Check Cursor's MCP Settings**
   - Open Cursor Settings
   - Navigate to **Features** → **Model Context Protocol (MCP)**
   - Check MCP server status indicators
   - Review any error messages in the MCP output

### GitHub MCP Issues

- **Hosted Server**: Ensure you're signed into GitHub Copilot in Cursor
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

## Environment Variables Not Working

### Windows
- Use `[System.Environment]::SetEnvironmentVariable(..., 'User')` for permanent setting
- Verify in a new PowerShell window: `$env:VARIABLE_NAME`
- System environment variables require restarting Cursor

### macOS/Linux
- Add to `~/.bashrc` or `~/.zshrc` and run `source ~/.bashrc`
- Verify: `echo $VARIABLE_NAME`

## Restarting Cursor

After making configuration changes:
1. **Completely close Cursor** (not just minimize - fully quit)
2. **Reopen Cursor**
3. Wait a few seconds for MCP servers to initialize
4. Check MCP status indicators in Cursor settings

## Security Best Practices

⚠️ **Important Security Notes**:
- Never commit tokens to version control
- Use environment variables instead of hardcoding tokens
- Add `.cursor/mcp.json` to `.gitignore` if it contains tokens
- Rotate tokens if they've been exposed
- Use service role keys only when necessary (they bypass RLS)

## Still Having Issues?

1. Check Cursor's MCP output/logs for detailed error messages
2. Verify Node.js and `npx` are installed: `npx --version`
3. Try removing the MCP configuration file and recreating it
4. Check that your `.cursor/mcp.json` file has valid JSON (no trailing commas)
5. Review the [MCP Configuration Guide](./MCP_CONFIGURATION.md) for setup instructions

