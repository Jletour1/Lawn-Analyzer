@echo off
echo Starting Lawn Care AI Local Development
echo ================================================

REM Check if virtual environment exists
if not exist .venv (
    echo Error: Virtual environment not found
    echo Run: python scripts/setup_pycharm.py
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules (
    echo Error: Node.js dependencies not installed
    echo Run: npm install
    pause
    exit /b 1
)

REM Start the Python development script
python scripts/start_local_dev.py

pause