@echo off
title EduBond Mobile Setup & Run
echo ===================================================
echo      EduBond Mobile App - Setup & Start
echo ===================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

echo [1/2] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b
)

echo.
echo [2/2] Starting Expo Development Server...
echo.
echo ===================================================
echo INSTRUCTIONS:
echo 1. Install "Expo Go" app on your Android or iOS device.
echo 2. Connect your phone to the same Wi-Fi as this PC.
echo 3. Scan the QR code below with the Expo Go app (Android) 
echo    or Camera app (iOS).
echo ===================================================
echo.

call npx expo start --clear

pause
