@echo off
echo Starting Lawn Care AI Application
echo ========================================

REM Check if we're in the right directory
if not exist package.json (
    echo Error: Run this from the project root directory
    echo Make sure you're in the lawn-care-ai folder
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist node_modules (
    echo Installing dependencies...
    npm install
)

echo Starting application...
echo Frontend will be available at: http://localhost:5173
echo User mode: Upload images for diagnosis
echo Admin mode: Click 'Admin' button (password: admin123)
echo.
echo Press Ctrl+C to stop

REM Start the development server
npm run dev

pause