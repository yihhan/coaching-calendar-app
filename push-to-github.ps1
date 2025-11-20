# Push Changes to GitHub Repository
# Repository: https://github.com/yihhan/coaching-calendar-app

# Add Git to PATH for this session
$env:Path += ";C:\Program Files\Git\cmd"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Pushing Changes to GitHub" -ForegroundColor Cyan
Write-Host "Repository: yihhan/coaching-calendar-app" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is available
try {
    $gitVersion = git --version 2>&1
    Write-Host "✅ Git is available: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not found. Please run: `$env:Path += ';C:\Program Files\Git\cmd'" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Checking git repository status..." -ForegroundColor Cyan

# Check if this is a git repository
if (-not (Test-Path .git)) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
}

# Check remote
Write-Host ""
Write-Host "Checking remote repository..." -ForegroundColor Cyan
$remote = git remote get-url origin 2>&1

if ($LASTEXITCODE -ne 0 -or $remote -match "fatal") {
    Write-Host "Adding remote repository..." -ForegroundColor Yellow
    git remote add origin https://github.com/yihhan/coaching-calendar-app.git
    Write-Host "✅ Remote added" -ForegroundColor Green
} else {
    Write-Host "✅ Remote already configured: $remote" -ForegroundColor Green
}

# Check current branch
Write-Host ""
Write-Host "Checking current branch..." -ForegroundColor Cyan
$currentBranch = git branch --show-current
if (-not $currentBranch) {
    # No branch exists, check if we have commits
    $hasCommits = git log --oneline -1 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "No commits found. Creating initial commit..." -ForegroundColor Yellow
        git add .
        git commit -m "Add Chinese translations for session creation form and fix ESLint warnings

- Added complete i18n support for CoachCalendar session creation form
- All form labels, buttons, messages now support English/Chinese
- Fixed React Hook dependency warnings in Profile and StudentBooking components
- Added comprehensive test suites for subscription and full application features
- All 80 automated tests passing (100% pass rate)"
        $currentBranch = "main"
        git branch -M main
    }
} else {
    Write-Host "Current branch: $currentBranch" -ForegroundColor Green
}

# Stage all changes
Write-Host ""
Write-Host "Staging all changes..." -ForegroundColor Cyan
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "Changes detected. Creating commit..." -ForegroundColor Cyan
    git commit -m "Add Chinese translations for session creation form and fix ESLint warnings

- Added complete i18n support for CoachCalendar session creation form
- All form labels, buttons, messages now support English/Chinese
- Fixed React Hook dependency warnings in Profile and StudentBooking components
- Added comprehensive test suites for subscription and full application features
- All 80 automated tests passing (100% pass rate)"
    Write-Host "✅ Commit created" -ForegroundColor Green
} else {
    Write-Host "No changes to commit" -ForegroundColor Yellow
}

# Determine branch name
$branch = git branch --show-current
if (-not $branch) {
    $branch = "main"
}

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "Branch: $branch" -ForegroundColor Gray
Write-Host "Remote: origin" -ForegroundColor Gray
Write-Host ""

# Push to main or master
if ($branch -eq "main") {
    git push -u origin main
} elseif ($branch -eq "master") {
    git push -u origin master
} else {
    Write-Host "Pushing branch: $branch" -ForegroundColor Yellow
    git push -u origin $branch
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "View your repository at:" -ForegroundColor Cyan
    Write-Host "https://github.com/yihhan/coaching-calendar-app" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Push failed. You may need to:" -ForegroundColor Red
    Write-Host "1. Set up authentication (GitHub token or SSH key)" -ForegroundColor Yellow
    Write-Host "2. Pull first if remote has changes: git pull origin $branch --rebase" -ForegroundColor Yellow
    Write-Host "3. Check your branch name matches remote" -ForegroundColor Yellow
}

