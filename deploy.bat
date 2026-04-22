@echo off
echo ========================================
echo Property Ark - Firebase Deployment
echo ========================================
echo.

REM Add Node.js to PATH
set "PATH=%PATH%;C:\Program Files\nodejs"

echo Step 1: Checking Firebase login...
"C:\Program Files\nodejs\npx.cmd" firebase-tools projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo You need to login to Firebase first!
    echo Opening Firebase login...
    "C:\Program Files\nodejs\npx.cmd" firebase-tools login
    echo.
    echo Please complete the login in your browser, then press any key to continue...
    pause >nul
)

echo.
echo Step 2: Deploying to Firebase Hosting...
"C:\Program Files\nodejs\npx.cmd" firebase-tools deploy --only hosting

echo.
echo ========================================
echo Deployment complete!
echo ========================================
echo.
echo Your Property Ark app should now be live!
echo.
pause

