#!/bin/bash

echo "Starting Lawn Care AI Local Development"
echo "================================================"

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Error: Virtual environment not found"
    echo "Run: python3 scripts/setup_pycharm.py"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Error: Node.js dependencies not installed"
    echo "Run: npm install"
    exit 1
fi

# Make the script executable
chmod +x scripts/start_local_dev.py

# Start the Python development script
python3 scripts/start_local_dev.py