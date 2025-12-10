# PowerShell script to set Vercel API Token for MCP
# This sets the token as a user-level environment variable

param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

# Set as user-level environment variable (persists across sessions)
[System.Environment]::SetEnvironmentVariable('VERCEL_API_TOKEN', $Token, 'User')

# Also set for current session
$env:VERCEL_API_TOKEN = $Token

Write-Host "✅ Vercel API Token set successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "The token has been set as a user environment variable." -ForegroundColor Yellow
Write-Host "You may need to restart Cursor for the MCP server to pick it up." -ForegroundColor Yellow
Write-Host ""
Write-Host "To verify, run:" -ForegroundColor Cyan
Write-Host "  `$env:VERCEL_API_TOKEN" -ForegroundColor Gray

