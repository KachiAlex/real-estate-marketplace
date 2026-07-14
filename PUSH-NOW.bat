@echo off
cd /d "d:\real-estate-marketplace"
echo ========================================
echo Pushing Property Ark to GitHub
echo ========================================
echo.
echo Adding all changes...
git add .
echo.
echo Committing changes...
git commit -m "Rebrand from Kiki Estates to Property Ark - Update all branding, components, and documentation"
echo.
echo Pushing to GitHub...
git push -u origin master
if %errorlevel% neq 0 (
    echo.
    echo Trying 'main' branch...
    git push -u origin main
)
echo.
echo Done!
pause

