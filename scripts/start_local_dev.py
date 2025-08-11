#!/usr/bin/env python3
"""
Local Development Startup Script
Starts both frontend and backend services for local development
"""

import subprocess
import sys
import os
import time
import webbrowser
from pathlib import Path


def check_requirements():
    """Check if all requirements are met"""
    print("🔍 Checking requirements...")

    # Check if virtual environment exists
    if not Path('.venv').exists():
        print("❌ Virtual environment not found. Run setup first:")
        print("   python scripts/setup_pycharm.py")
        return False

    # Check if node_modules exists
    if not Path('node_modules').exists():
        print("❌ Node.js dependencies not installed. Run:")
        print("   npm install")
        return False

    # Check if .env exists
    if not Path('.env').exists():
        print("❌ .env file not found")
        return False

    print("✅ All requirements met")
    return True


def start_frontend():
    """Start the React frontend development server"""
    print("🚀 Starting React frontend...")
    try:
        # Start Vite dev server
        process = subprocess.Popen(
            ['npm', 'run', 'dev'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        return process
    except Exception as e:
        print(f"❌ Failed to start frontend: {e}")
        return None


def check_data_status():
    """Check if we have data for analysis"""
    db_path = Path("datasets/reddit_lawn_data.db")
    if db_path.exists():
        print("✅ Database found - AI analysis ready")
        return True
    else:
        print("⚠️  No database found. To collect data, run:")
        print("   python scripts/enhanced_lawn_reddit_pipeline.py collect")
        print("   python scripts/enhanced_lawn_reddit_pipeline.py analyze")
        return False


def main():
    """Main startup function"""
    print("🌿 Starting Lawn Care AI Local Development")
    print("=" * 50)

    if not check_requirements():
        sys.exit(1)

    # Check data status
    check_data_status()

    # Start frontend
    frontend_process = start_frontend()
    if not frontend_process:
        sys.exit(1)

    print("\n" + "=" * 50)
    print("✅ Development servers starting...")
    print("\n📋 Available URLs:")
    print("   🌐 Frontend: http://localhost:5173")
    print("   👤 User Mode: Upload images for AI diagnosis")
    print("   🔧 Admin Mode: Click 'Admin' button (password: admin123)")
    print("\n🛠️  Admin Panel Features:")
    print("   📊 Dashboard - System overview")
    print("   🗄️  Data Collection - Reddit scraping")
    print("   🧠 AI Analysis - OpenAI processing")
    print("   📈 Results - Browse analysis results")
    print("   ⚙️  Root Causes - Manage problem types")
    print("   👥 User Submissions - Review user uploads")
    print("   🤖 Dynamic Indicators - Auto-generated patterns")

    print("\n⌨️  Press Ctrl+C to stop all servers")

    # Wait a moment for server to start, then open browser
    time.sleep(3)
    try:
        webbrowser.open('http://localhost:5173')
        print("🌐 Opening browser...")
    except:
        pass

    try:
        # Wait for frontend process
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down servers...")
        frontend_process.terminate()
        print("✅ Servers stopped")


if __name__ == "__main__":
    main()