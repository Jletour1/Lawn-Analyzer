#!/bin/bash

echo "Setting up Lawn Care AI Project for PyCharm..."
echo "================================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.9 or higher"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js 18 or higher"
    exit 1
fi

# Make the script executable
chmod +x scripts/setup_pycharm.py

# Run the setup script
python3 scripts/setup_pycharm.py

echo ""
echo "Setup complete! You can now open this project in PyCharm."