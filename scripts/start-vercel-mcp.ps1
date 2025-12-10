Write-Host "Starting Vercel MCP server (npx @modelcontextprotocol/server-vercel)..."
Write-Host "If you need to stop it, close this terminal or press Ctrl+C in the terminal." 

# Let npx run in this process so logs appear in the terminal
npx -y @modelcontextprotocol/server-vercel
