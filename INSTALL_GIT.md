# Git Installation Guide

## Quick Installation Steps

### Method 1: Download and Install Manually

1. **Open your browser** and go to: https://git-scm.com/download/win
2. **Download** the latest Git for Windows installer
3. **Run the installer** with these recommended settings:
   - ✅ Use Git from the command line and also from 3rd-party software
   - ✅ Use the OpenSSL library
   - ✅ Checkout Windows-style, commit Unix-style line endings
   - ✅ Use MinTTY (the default terminal of MSYS2)
   - ✅ Default (fast-forward or merge)
   - ✅ Git Credential Manager
   - ✅ Enable file system caching
4. **Click Install** and wait for completion
5. **Restart PowerShell** after installation

### Method 2: Using Chocolatey (if installed)

```powershell
choco install git -y
```

### Method 3: Using winget (Windows 10/11)

```powershell
winget install --id Git.Git -e --source winget
```

## After Installation

1. **Close and reopen PowerShell** (or restart your terminal)
2. **Verify installation**:
   ```powershell
   git --version
   ```
3. **Configure Git** (first time only):
   ```powershell
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

## Then Push Your Changes

Once Git is installed and configured:

```powershell
# Navigate to your project
cd C:\calla

# Check if it's a git repository
git status

# If not initialized, initialize it:
git init

# Add remote (if you have one)
git remote add origin <your-repo-url>

# Stage all changes
git add .

# Commit
git commit -m "Add Chinese translations for session creation form and fix ESLint warnings"

# Push to main
git push origin main
```

## Need Help?

If you encounter issues:
- Make sure PowerShell is restarted after installation
- Check that Git is in your PATH: `$env:PATH -split ';' | Select-String git`
- Try using Git Bash instead of PowerShell

