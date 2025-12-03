# Helper script to run Supabase CLI commands
# This script sets execution policy and runs supabase via npx

param(
    [Parameter(Mandatory=$true)]
    [string]$Command
)

# Set execution policy for this process
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Run supabase command via npx
npx --yes supabase $Command

