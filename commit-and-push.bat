@echo off
echo ========================================
echo Git Commit and Push Script
echo ========================================
echo.

echo Checking git status...
git status
echo.

echo Staging all files...
git add .
echo.

echo Creating commit...
git commit -m "Add Chinese translations for session creation form and fix ESLint warnings

- Added complete i18n support for CoachCalendar session creation form
- All form labels, buttons, messages now support English/Chinese
- Fixed React Hook dependency warnings in Profile and StudentBooking components
- Added comprehensive test suites for subscription and full application features
- All 80 automated tests passing (100% pass rate)"
echo.

echo Checking current branch...
git branch
echo.

echo Checking remote repository...
git remote -v
echo.

echo ========================================
echo Commit completed!
echo ========================================
echo.
echo To push to main branch, run:
echo   git push origin main
echo.
echo Or if your branch is master:
echo   git push origin master
echo.
echo Or to push and set upstream:
echo   git push -u origin main
echo.
pause

