# Git Setup and Push Script
# Run this script after installing Git and restarting PowerShell

Write-Host "Checking Git installation..." -ForegroundColor Cyan

# Check if Git is available
try {
    $gitVersion = git --version 2>&1
    Write-Host "✅ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please try one of the following:" -ForegroundColor Yellow
    Write-Host "1. Close and reopen PowerShell (restart terminal)" -ForegroundColor Yellow
    Write-Host "2. Use Git Bash instead of PowerShell" -ForegroundColor Yellow
    Write-Host "3. Add Git to PATH manually:" -ForegroundColor Yellow
    Write-Host "   - Git is usually installed at: C:\Program Files\Git\cmd" -ForegroundColor Yellow
    Write-Host "   - Add this to your PATH environment variable" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Checking if this is a git repository..." -ForegroundColor Cyan

if (Test-Path .git) {
    Write-Host "✅ This is already a git repository" -ForegroundColor Green
    git status
} else {
    Write-Host "⚠️  Not a git repository. Initializing..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

Write-Host ""
Write-Host "Staging all changes..." -ForegroundColor Cyan
git add .

Write-Host ""
Write-Host "Files staged. Ready to commit." -ForegroundColor Green
Write-Host ""
Write-Host "To commit and push, run:" -ForegroundColor Cyan
Write-Host '  git commit -m "Add Chinese translations for session creation form and fix ESLint warnings"' -ForegroundColor White
Write-Host ""
Write-Host "If you have a remote repository:" -ForegroundColor Cyan
Write-Host '  git remote add origin <your-repo-url>' -ForegroundColor White
Write-Host '  git push origin main' -ForegroundColor White

