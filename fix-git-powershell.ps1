# Fix Git PATH in PowerShell
# Run this script to add Git to PowerShell's PATH permanently

Write-Host "Adding Git to PowerShell PATH..." -ForegroundColor Cyan

# Add to current session
$env:Path += ";C:\Program Files\Git\cmd"

# Verify it works
Write-Host ""
Write-Host "Testing Git..." -ForegroundColor Cyan
try {
    $gitVersion = git --version
    Write-Host "✅ Git is now working: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git still not found" -ForegroundColor Red
    exit 1
}

# Add to PowerShell profile for permanent fix
Write-Host ""
Write-Host "Adding Git to PowerShell profile for permanent fix..." -ForegroundColor Cyan

$profilePath = $PROFILE
$gitPathLine = '$env:Path += ";C:\Program Files\Git\cmd"'

# Check if profile exists
if (-not (Test-Path $profilePath)) {
    Write-Host "Creating PowerShell profile..." -ForegroundColor Yellow
    $profileDir = Split-Path $profilePath -Parent
    if (-not (Test-Path $profileDir)) {
        New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    }
    New-Item -ItemType File -Path $profilePath -Force | Out-Null
}

# Read current profile content
$currentContent = Get-Content $profilePath -ErrorAction SilentlyContinue

# Check if Git path is already added
if ($currentContent -notmatch [regex]::Escape('C:\Program Files\Git\cmd')) {
    Add-Content -Path $profilePath -Value ""
    Add-Content -Path $profilePath -Value "# Git PATH fix"
    Add-Content -Path $profilePath -Value $gitPathLine
    Write-Host "✅ Added Git to PowerShell profile" -ForegroundColor Green
    Write-Host "   Profile location: $profilePath" -ForegroundColor Gray
} else {
    Write-Host "✅ Git is already in PowerShell profile" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Git is now working in PowerShell!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: You may need to restart PowerShell for the profile changes to take effect in new sessions." -ForegroundColor Yellow
Write-Host "The current session should work immediately." -ForegroundColor Green
Write-Host ""

