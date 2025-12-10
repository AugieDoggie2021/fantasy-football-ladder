# Fix MCP Configuration Script
# This script updates the MCP config file with the correct 3 servers

$mcpPath = Join-Path $env:USERPROFILE ".cursor\mcp.json"
$mcpDir = Split-Path $mcpPath -Parent

# Create .cursor directory if it doesn't exist
if (-not (Test-Path $mcpDir)) {
    New-Item -ItemType Directory -Path $mcpDir -Force | Out-Null
    Write-Host "Created directory: $mcpDir" -ForegroundColor Green
}

# Create the correct MCP configuration JSON
$mcpConfig = @{
    mcpServers = @{
        github = @{
            url = "https://api.githubcopilot.com/mcp/"
        }
        vercel = @{
            command = "npx"
            args = @(
                "-y",
                "@modelcontextprotocol/server-vercel"
            )
            env = @{
                VERCEL_API_TOKEN = "`${VERCEL_API_TOKEN}"
            }
        }
        supabase = @{
            command = "npx"
            args = @(
                "-y",
                "@modelcontextprotocol/server-supabase"
            )
            env = @{
                SUPABASE_URL = "`${SUPABASE_URL}"
                SUPABASE_SERVICE_ROLE_KEY = "`${SUPABASE_SERVICE_ROLE_KEY}"
            }
        }
    }
}

# Convert to JSON and write to file
$json = $mcpConfig | ConvertTo-Json -Depth 10
Set-Content -Path $mcpPath -Value $json -Encoding UTF8

Write-Host "✅ MCP configuration file updated successfully!" -ForegroundColor Green
Write-Host "Location: $mcpPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration includes:" -ForegroundColor Yellow
Write-Host "  - GitHub (hosted via Copilot)" -ForegroundColor White
Write-Host "  - Vercel (requires VERCEL_API_TOKEN)" -ForegroundColor White
Write-Host "  - Supabase (requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)" -ForegroundColor White
Write-Host ""

