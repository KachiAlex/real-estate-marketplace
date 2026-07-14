@echo off
REM Bootstrap Gradle Wrapper - Downloads gradle-wrapper.jar

echo.
echo ========================================
echo Bootstrapping Gradle Wrapper
echo ========================================
echo.

REM Create the wrapper directory if it doesn't exist
if not exist "android\gradle\wrapper" mkdir android\gradle\wrapper

REM Download gradle-wrapper.jar using PowerShell
echo Downloading gradle-wrapper.jar (Gradle 8.13)...
echo.

powershell -Command "^
  $url = 'https://services.gradle.org/distributions/gradle-8.13-wrapper.jar'; ^
  $output = 'android\gradle\wrapper\gradle-wrapper.jar'; ^
  try { ^
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; ^
    $client = New-Object System.Net.WebClient; ^
    $client.DownloadFile($url, $output); ^
    Write-Host 'Downloaded successfully!'; ^
  } catch { ^
    Write-Host 'Download failed: $_'; ^
    exit 1; ^
  } ^
"

if errorlevel 1 (
    echo.
    echo ERROR: Failed to download gradle-wrapper.jar
    echo.
    echo Alternative: Download manually from:
    echo https://services.gradle.org/distributions/gradle-8.13-wrapper.jar
    echo.
    echo Place the file at:
    echo android\gradle\wrapper\gradle-wrapper.jar
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Gradle Wrapper bootstrapped successfully!
echo ========================================
echo.
echo You can now build the APK:
echo   BUILD_WITH_GRADLE.bat
echo.
pause
