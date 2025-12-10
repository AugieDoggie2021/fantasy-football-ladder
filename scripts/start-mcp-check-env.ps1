Write-Host "Checking required env vars..."
$vars = @{
    VERCEL_API_TOKEN = $env:VERCEL_API_TOKEN
    SUPABASE_URL = $env:SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY
}

foreach ($k in $vars.Keys) {
    if (-not [string]::IsNullOrEmpty($vars[$k])) {
        Write-Host "$k : SET"
    }
    else {
        Write-Host "$k : MISSING"
    }
}

Write-Host "`nTip: set missing variables with `setx NAME value` and restart terminal." 
