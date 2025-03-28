@echo off
echo Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error installing dependencies
    pause
    exit /b 1
)

echo Starting development server...
call npm run dev
if %ERRORLEVEL% NEQ 0 (
    echo Error starting development server
    pause
)
pause
