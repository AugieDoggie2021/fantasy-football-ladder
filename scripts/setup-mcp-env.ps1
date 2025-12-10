# MCP Environment Variables Setup Script
# This script sets the required environment variables for MCP servers

Write-Host "Setting up MCP environment variables..." -ForegroundColor Cyan
Write-Host ""

# Check if VERCEL_API_TOKEN is already set
$vercelToken = [System.Environment]::GetEnvironmentVariable('VERCEL_API_TOKEN', 'User')
if ($vercelToken) {
    Write-Host "VERCEL_API_TOKEN is already set (skipping)" -ForegroundColor Yellow
} else {
    Write-Host "VERCEL_API_TOKEN is not set." -ForegroundColor Yellow
    Write-Host "Get your token from: https://vercel.com/account/tokens" -ForegroundColor Gray
    $newToken = Read-Host "Enter your Vercel API token (or press Enter to skip)"
    if ($newToken) {
        [System.Environment]::SetEnvironmentVariable('VERCEL_API_TOKEN', $newToken, 'User')
        Write-Host "VERCEL_API_TOKEN set successfully!" -ForegroundColor Green
    }
}

Write-Host ""

# Check if SUPABASE_URL is already set
$supabaseUrl = [System.Environment]::GetEnvironmentVariable('SUPABASE_URL', 'User')
if ($supabaseUrl) {
    Write-Host "SUPABASE_URL is already set: $supabaseUrl" -ForegroundColor Yellow
} else {
    Write-Host "SUPABASE_URL is not set." -ForegroundColor Yellow
    Write-Host "Get your URL from: Supabase Dashboard -> Project Settings -> API" -ForegroundColor Gray
    $newUrl = Read-Host "Enter your Supabase URL (e.g., https://xxxxx.supabase.co) (or press Enter to skip)"
    if ($newUrl) {
        [System.Environment]::SetEnvironmentVariable('SUPABASE_URL', $newUrl, 'User')
        Write-Host "SUPABASE_URL set successfully!" -ForegroundColor Green
    }
}

Write-Host ""

# Check if SUPABASE_SERVICE_ROLE_KEY is already set
$supabaseKey = [System.Environment]::GetEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY', 'User')
if ($supabaseKey) {
    Write-Host "SUPABASE_SERVICE_ROLE_KEY is already set (skipping)" -ForegroundColor Yellow
} else {
    Write-Host "SUPABASE_SERVICE_ROLE_KEY is not set." -ForegroundColor Yellow
    Write-Host "Get your service role key from: Supabase Dashboard -> Project Settings -> API" -ForegroundColor Gray
    Write-Host "⚠️  WARNING: This is the SERVICE ROLE key (not the anon key) - it bypasses RLS!" -ForegroundColor Red
    $newKey = Read-Host "Enter your Supabase Service Role Key (or press Enter to skip)"
    if ($newKey) {
        [System.Environment]::SetEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY', $newKey, 'User')
        Write-Host "SUPABASE_SERVICE_ROLE_KEY set successfully!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Environment Variables Summary:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$vercel = [System.Environment]::GetEnvironmentVariable('VERCEL_API_TOKEN', 'User')
$supabaseUrl = [System.Environment]::GetEnvironmentVariable('SUPABASE_URL', 'User')
$supabaseKey = [System.Environment]::GetEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY', 'User')

Write-Host "VERCEL_API_TOKEN: " -NoNewline
if ($vercel) { Write-Host "✅ Set" -ForegroundColor Green } else { Write-Host "❌ Not set" -ForegroundColor Red }

Write-Host "SUPABASE_URL: " -NoNewline
if ($supabaseUrl) { Write-Host "✅ Set ($supabaseUrl)" -ForegroundColor Green } else { Write-Host "❌ Not set" -ForegroundColor Red }

Write-Host "SUPABASE_SERVICE_ROLE_KEY: " -NoNewline
if ($supabaseKey) { Write-Host "✅ Set" -ForegroundColor Green } else { Write-Host "❌ Not set" -ForegroundColor Red }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Completely close and restart Cursor" -ForegroundColor Yellow
Write-Host "2. Check MCP status in Cursor settings" -ForegroundColor Yellow
Write-Host "3. You should see 3 working servers: GitHub, Vercel, and Supabase" -ForegroundColor Yellow
Write-Host ""

