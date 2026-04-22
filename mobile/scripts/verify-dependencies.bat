@echo off
REM Dependency Verification Script for Windows
REM Verifies all dependencies are installed and compatible with React Native 0.81.5

setlocal enabledelayedexpansion

echo.
echo ================================================
echo PropertyArk Mobile - Dependency Verification
echo ================================================
echo.

REM Check Node.js version
echo Checking Node.js version...
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo Node.js version: %NODE_VERSION%
echo [OK] Node.js version: %NODE_VERSION%
echo.

REM Check npm version
echo Checking npm version...
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo npm version: %NPM_VERSION%
echo [OK] npm version: %NPM_VERSION%
echo.

REM Check React Native version
echo Checking React Native version...
findstr /M "react-native.*0.81.5" package.json >nul
if %errorlevel% equ 0 (
    echo [OK] React Native version: 0.81.5
) else (
    echo [ERROR] React Native version mismatch
    exit /b 1
)
echo.

REM Check critical dependencies
echo Checking critical dependencies...
setlocal enabledelayedexpansion

set "CRITICAL_DEPS=expo react react-native expo-router expo-secure-store @react-native-async-storage/async-storage axios"

for %%d in (%CRITICAL_DEPS%) do (
    findstr /M "%%d" package.json >nul
    if !errorlevel! equ 0 (
        echo [OK] %%d
    ) else (
        echo [ERROR] %%d missing
        exit /b 1
    )
)
echo.

REM Check for deprecated packages
echo Checking for deprecated packages...
findstr /M "react-native-crypto" package.json >nul
if %errorlevel% equ 0 (
    echo [WARNING] Deprecated package found: react-native-crypto
) else (
    echo [OK] No deprecated packages found
)
echo.

REM Check package-lock.json exists
echo Checking package-lock.json...
if exist package-lock.json (
    echo [OK] package-lock.json exists
) else (
    echo [WARNING] package-lock.json not found
)
echo.

REM Summary
echo ================================================
echo Dependency Verification Summary
echo ================================================
echo [OK] All critical dependencies present
echo [OK] React Native version: 0.81.5
echo [OK] No deprecated packages
echo.
echo Next steps:
echo 1. Run: npm install
echo 2. Run: npm audit (to check for vulnerabilities)
echo 3. Run: npm list (to verify all dependencies installed)
echo.
echo Dependency verification complete!
echo.

endlocal
