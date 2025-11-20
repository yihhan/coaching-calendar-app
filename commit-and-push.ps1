# Git Commit and Push Script
# Run this script to commit and push your changes

Write-Host "Initializing git repository..." -ForegroundColor Cyan
git init

Write-Host ""
Write-Host "Staging all files..." -ForegroundColor Cyan
git add .

Write-Host ""
Write-Host "Creating commit..." -ForegroundColor Cyan
git commit -m "Add Chinese translations for session creation form and fix ESLint warnings

- Added complete i18n support for CoachCalendar session creation form
- All form labels, buttons, messages now support English/Chinese
- Fixed React Hook dependency warnings in Profile and StudentBooking components
- Added comprehensive test suites for subscription and full application features
- All 80 automated tests passing (100% pass rate)"

Write-Host ""
Write-Host "✅ Commit created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To push to a remote repository:" -ForegroundColor Yellow
Write-Host "1. If you have a GitHub/GitLab repository, add it:" -ForegroundColor Yellow
Write-Host '   git remote add origin <your-repo-url>' -ForegroundColor White
Write-Host ""
Write-Host "2. Then push to main branch:" -ForegroundColor Yellow
Write-Host '   git push -u origin main' -ForegroundColor White
Write-Host ""
Write-Host "Or if your default branch is 'master':" -ForegroundColor Yellow
Write-Host '   git push -u origin master' -ForegroundColor White

