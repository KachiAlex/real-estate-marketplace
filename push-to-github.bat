@echo off
echo ========================================
echo Pushing Property Ark to GitHub
echo ========================================
echo.

REM Try to find Git
set "GIT_EXE="
if exist "C:\Program Files\Git\cmd\git.exe" (
    set "GIT_EXE=C:\Program Files\Git\cmd\git.exe"
) else if exist "C:\Program Files (x86)\Git\cmd\git.exe" (
    set "GIT_EXE=C:\Program Files (x86)\Git\cmd\git.exe"
) else (
    set "GIT_EXE=git"
)

echo Using Git: %GIT_EXE%
echo.

echo Step 1: Checking git status...
"%GIT_EXE%" status
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Git not found or not accessible!
    echo Please install Git from: https://git-scm.com/download/win
    echo Or ensure Git is in your PATH.
    pause
    exit /b 1
)

echo.
echo Step 2: Adding all changes...
"%GIT_EXE%" add .

echo.
echo Step 3: Committing changes...
"%GIT_EXE%" commit -m "Rebrand from Kiki Estates to Property Ark - Update all branding, components, and documentation"
if %errorlevel% neq 0 (
    echo.
    echo No changes to commit or commit failed.
    echo Continuing with push...
)

echo.
echo Step 4: Pushing to GitHub...
"%GIT_EXE%" push -u origin master
if %errorlevel% neq 0 (
    echo.
    echo Push failed. Trying 'main' branch...
    "%GIT_EXE%" push -u origin main
)

echo.
echo ========================================
echo Done!
echo ========================================
echo.
pause

