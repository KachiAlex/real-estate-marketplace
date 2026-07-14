@echo off
cd /d "d:\real-estate-marketplace"
echo ========================================
echo Committing and Pushing Property Ark
echo ========================================
echo.

echo Adding all changes...
git add .
if %errorlevel% neq 0 (
    echo ERROR: git add failed. Make sure Git is installed and in PATH.
    pause
    exit /b 1
)

echo.
echo Committing changes...
git commit -m "Rebrand from Kiki Estates to Property Ark - Update all branding, components, and documentation"
if %errorlevel% neq 0 (
    echo Note: Commit may have failed if there are no changes or already committed.
)

echo.
echo Pushing to GitHub...
git push -u origin master
if %errorlevel% neq 0 (
    echo Trying 'main' branch...
    git push -u origin main
)

echo.
echo ========================================
echo Done!
echo ========================================
pause

