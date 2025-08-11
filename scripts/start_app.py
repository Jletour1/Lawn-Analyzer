#!/usr/bin/env python3
"""
Simple App Startup Script
Just run this to start the lawn care AI application
"""

import subprocess
import sys
import os
import time
import webbrowser
from pathlib import Path


def main():
    print("🌿 Starting Lawn Care AI Application")
    print("=" * 40)

    # Check if we're in the right directory
    if not Path('package.json').exists():
        print("❌ Error: Run this from the project root directory")
        print("   Make sure you're in the lawn-care-ai folder")
        return

    # Check Node.js
    try:
        subprocess.run(['node', '--version'], check=True, capture_output=True)
        print("✅ Node.js found")
    except:
        print("❌ Node.js not found. Please install Node.js 18+")
        return

    # Install dependencies if needed
    if not Path('node_modules').exists():
        print("📦 Installing dependencies...")
        subprocess.run(['npm', 'install'], check=True)

    print("🚀 Starting application...")
    print("   Frontend will be available at: http://localhost:5173")
    print("   User mode: Upload images for diagnosis")
    print("   Admin mode: Click 'Admin' button (password: admin123)")
    print("\n⌨️  Press Ctrl+C to stop")

    # Start the development server
    try:
        # Open browser after a delay
        import threading
        def open_browser():
            time.sleep(3)
            try:
                webbrowser.open('http://localhost:5173')
                print("🌐 Opening browser...")
            except:
                pass

        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()

        # Start Vite dev server
        subprocess.run(['npm', 'run', 'dev'], check=True)

    except KeyboardInterrupt:
        print("\n🛑 Stopping application...")
    except Exception as e:
        print(f"❌ Error starting application: {e}")


if __name__ == "__main__":
    main()