@echo off
rem SwayCommand - double-click installer / launcher (Windows)
rem Installs Node.js (if needed), installs dependencies, and starts the app.
setlocal
title SwayCommand - Install ^& Launch
chcp 65001 >nul
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\install-launch.ps1"
if errorlevel 1 (
    echo.
    echo The installer/launcher reported a problem. See the messages above.
    echo.
    pause
)
endlocal
exit /b %errorlevel%
