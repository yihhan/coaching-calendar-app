# Git Commands to Push to Main Branch

## Step-by-Step Instructions

### 1. Initialize Git Repository (if not already done)
```powershell
git init
```

### 2. Stage All Changes
```powershell
git add .
```

### 3. Create Commit
```powershell
git commit -m "Add Chinese translations for session creation form and fix ESLint warnings

- Added complete i18n support for CoachCalendar session creation form
- All form labels, buttons, messages now support English/Chinese
- Fixed React Hook dependency warnings in Profile and StudentBooking components
- Added comprehensive test suites for subscription and full application features
- All 80 automated tests passing (100% pass rate)"
```

### 4. Add Remote Repository (if you have one)

If you have a GitHub/GitLab/Bitbucket repository:

```powershell
git remote add origin https://github.com/yourusername/your-repo.git
```

Replace `yourusername/your-repo` with your actual repository URL.

### 5. Push to Main Branch

```powershell
git push -u origin main
```

If your default branch is `master` instead of `main`:
```powershell
git push -u origin master
```

## Quick Script

Or simply run the provided script:
```powershell
.\commit-and-push.ps1
```

## If You Don't Have a Remote Repository Yet

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Create a new repository (don't initialize with README)
   - Copy the repository URL

2. **Add it as remote:**
   ```powershell
   git remote add origin https://github.com/yourusername/your-repo.git
   ```

3. **Push:**
   ```powershell
   git push -u origin main
   ```

## Check Status

To see what will be committed:
```powershell
git status
```

To see the commit history:
```powershell
git log --oneline
```

