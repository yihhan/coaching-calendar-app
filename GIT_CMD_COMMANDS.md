# Git Commands for CMD (Command Prompt)

Since Git works in CMD but not PowerShell, use these commands in **Command Prompt** (cmd.exe):

## Quick Commands (Run in CMD)

Open **Command Prompt** (cmd.exe) and navigate to your project:

```cmd
cd C:\calla
```

Then run these commands:

### 1. Check Status
```cmd
git status
```

### 2. Stage All Files
```cmd
git add .
```

### 3. Create Commit
```cmd
git commit -m "Add Chinese translations for session creation form and fix ESLint warnings"
```

### 4. Check Current Branch
```cmd
git branch
```

### 5. Push to Main Branch

**If your branch is called "main":**
```cmd
git push origin main
```

**If your branch is called "master":**
```cmd
git push origin master
```

**If you get an error about no upstream branch:**
```cmd
git push -u origin main
```
or
```cmd
git push -u origin master
```

## Quick Script

Or simply double-click `commit-and-push.bat` in Windows Explorer, or run:
```cmd
commit-and-push.bat
```

## Fix PowerShell PATH (Optional)

If you want Git to work in PowerShell too, add Git to PowerShell's PATH:

1. Find where Git is installed (usually `C:\Program Files\Git\cmd`)
2. Add it to your PowerShell profile:
   ```powershell
   $env:Path += ";C:\Program Files\Git\cmd"
   ```
3. Or add it permanently to System Environment Variables

## Common Issues

**Error: "src refspec main does not match any"**
- This means you haven't committed yet, or your branch is named "master"
- Check with: `git branch`
- If you see "master", use: `git push origin master`

**Error: "remote origin already exists"**
- Your remote is already set up, just push: `git push origin main`

