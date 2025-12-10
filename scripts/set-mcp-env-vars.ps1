# Quick script to set MCP environment variables
# Run this script and it will prompt for values if not already set

param(
    [string]$VercelToken,
    [string]$SupabaseUrl,
    [string]$SupabaseKey
)

Write-Host "Setting MCP Environment Variables..." -ForegroundColor Cyan
Write-Host ""

# Set Vercel Token
if ($VercelToken) {
    [System.Environment]::SetEnvironmentVariable('VERCEL_API_TOKEN', $VercelToken, 'User')
    Write-Host "✅ VERCEL_API_TOKEN set" -ForegroundColor Green
} else {
    $existing = [System.Environment]::GetEnvironmentVariable('VERCEL_API_TOKEN', 'User')
    if ($existing) {
        Write-Host "✅ VERCEL_API_TOKEN already set" -ForegroundColor Green
    } else {
        Write-Host "⚠️  VERCEL_API_TOKEN not set - get it from https://vercel.com/account/tokens" -ForegroundColor Yellow
    }
}

# Set Supabase URL
if ($SupabaseUrl) {
    [System.Environment]::SetEnvironmentVariable('SUPABASE_URL', $SupabaseUrl, 'User')
    Write-Host "✅ SUPABASE_URL set" -ForegroundColor Green
} else {
    $existing = [System.Environment]::GetEnvironmentVariable('SUPABASE_URL', 'User')
    if ($existing) {
        Write-Host "✅ SUPABASE_URL already set: $existing" -ForegroundColor Green
    } else {
        Write-Host "⚠️  SUPABASE_URL not set - get it from Supabase Dashboard -> Project Settings -> API" -ForegroundColor Yellow
    }
}

# Set Supabase Service Role Key
if ($SupabaseKey) {
    [System.Environment]::SetEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY', $SupabaseKey, 'User')
    Write-Host "✅ SUPABASE_SERVICE_ROLE_KEY set" -ForegroundColor Green
} else {
    $existing = [System.Environment]::GetEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY', 'User')
    if ($existing) {
        Write-Host "✅ SUPABASE_SERVICE_ROLE_KEY already set" -ForegroundColor Green
    } else {
        Write-Host "⚠️  SUPABASE_SERVICE_ROLE_KEY not set - get it from Supabase Dashboard -> Project Settings -> API (service_role key)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Next: Restart Cursor completely for changes to take effect!" -ForegroundColor Cyan

