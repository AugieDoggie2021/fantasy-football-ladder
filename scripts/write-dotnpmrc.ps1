Set-Content -Path $env:USERPROFILE\".npmrc" -Value '//registry.npmjs.org/:_authToken=${NPM_TOKEN}' -Encoding UTF8
Write-Host "Wrote: $env:USERPROFILE\.npmrc"
Write-Host "Contents:" 
Get-Content -Raw -Path $env:USERPROFILE\".npmrc"
