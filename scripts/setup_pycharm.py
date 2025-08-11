#!/usr/bin/env python3
"""
PyCharm Setup Script for Lawn Care AI Project
Automatically configures the development environment
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def create_pycharm_config():
    """Create PyCharm configuration files"""
    
    # Create .idea directory if it doesn't exist
    idea_dir = Path('.idea')
    idea_dir.mkdir(exist_ok=True)
    
    # Create run configurations
    runConfigurations_dir = idea_dir / 'runConfigurations'
    runConfigurations_dir.mkdir(exist_ok=True)
    
    # Frontend Dev Server Configuration
    frontend_config = """<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="Frontend Dev Server" type="js.build_tools.npm">
    <package-json value="$PROJECT_DIR$/package.json" />
    <command value="run" />
    <scripts>
      <script value="dev" />
    </scripts>
    <node-interpreter value="project" />
    <envs />
    <method v="2" />
  </configuration>
</component>"""
    
    with open(runConfigurations_dir / 'Frontend_Dev_Server.xml', 'w') as f:
        f.write(frontend_config)
    
    # Python Data Collection Configuration
    collection_config = """<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="Collect Reddit Data" type="PythonConfigurationType" factoryName="Python">
    <module name="lawn-care-ai" />
    <option name="INTERPRETER_OPTIONS" value="" />
    <option name="PARENT_ENVS" value="true" />
    <envs>
      <env name="PYTHONUNBUFFERED" value="1" />
    </envs>
    <option name="SDK_HOME" value="$PROJECT_DIR$/.venv/Scripts/python.exe" />
    <option name="WORKING_DIRECTORY" value="$PROJECT_DIR$" />
    <option name="IS_MODULE_SDK" value="false" />
    <option name="ADD_CONTENT_ROOTS" value="true" />
    <option name="ADD_SOURCE_ROOTS" value="true" />
    <option name="SCRIPT_NAME" value="$PROJECT_DIR$/scripts/enhanced_lawn_reddit_pipeline.py" />
    <option name="PARAMETERS" value="collect --subs lawncare landscaping plantclinic --limit 200" />
    <option name="SHOW_COMMAND_LINE" value="false" />
    <option name="EMULATE_TERMINAL" value="false" />
    <option name="MODULE_MODE" value="false" />
    <option name="REDIRECT_INPUT" value="false" />
    <option name="INPUT_FILE" value="" />
    <method v="2" />
  </configuration>
</component>"""
    
    with open(runConfigurations_dir / 'Collect_Reddit_Data.xml', 'w') as f:
        f.write(collection_config)
    
    # Python AI Analysis Configuration
    analysis_config = """<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="Run AI Analysis" type="PythonConfigurationType" factoryName="Python">
    <module name="lawn-care-ai" />
    <option name="INTERPRETER_OPTIONS" value="" />
    <option name="PARENT_ENVS" value="true" />
    <envs>
      <env name="PYTHONUNBUFFERED" value="1" />
    </envs>
    <option name="SDK_HOME" value="$PROJECT_DIR$/.venv/Scripts/python.exe" />
    <option name="WORKING_DIRECTORY" value="$PROJECT_DIR$" />
    <option name="IS_MODULE_SDK" value="false" />
    <option name="ADD_CONTENT_ROOTS" value="true" />
    <option name="ADD_SOURCE_ROOTS" value="true" />
    <option name="SCRIPT_NAME" value="$PROJECT_DIR$/scripts/enhanced_lawn_reddit_pipeline.py" />
    <option name="PARAMETERS" value="analyze --model gpt-4o-mini" />
    <option name="SHOW_COMMAND_LINE" value="false" />
    <option name="EMULATE_TERMINAL" value="false" />
    <option name="MODULE_MODE" value="false" />
    <option name="REDIRECT_INPUT" value="false" />
    <option name="INPUT_FILE" value="" />
    <method v="2" />
  </configuration>
</component>"""
    
    with open(runConfigurations_dir / 'Run_AI_Analysis.xml', 'w') as f:
        f.write(analysis_config)
    
    print("✅ PyCharm run configurations created")

def setup_virtual_environment():
    """Set up Python virtual environment"""
    
    if not Path('.venv').exists():
        print("🐍 Creating Python virtual environment...")
        subprocess.run([sys.executable, '-m', 'venv', '.venv'], check=True)
        print("✅ Virtual environment created")
    else:
        print("✅ Virtual environment already exists")
    
    # Determine the correct python executable path
    if os.name == 'nt':  # Windows
        python_exe = Path('.venv/Scripts/python.exe')
        pip_exe = Path('.venv/Scripts/pip.exe')
    else:  # macOS/Linux
        python_exe = Path('.venv/bin/python')
        pip_exe = Path('.venv/bin/pip')
    
    if python_exe.exists():
        print("📦 Installing Python dependencies...")
        subprocess.run([str(pip_exe), 'install', '-r', 'requirements.txt'], check=True)
        print("✅ Python dependencies installed")
    else:
        print("❌ Virtual environment python executable not found")

def setup_node_environment():
    """Set up Node.js environment"""
    
    if Path('package.json').exists():
        print("📦 Installing Node.js dependencies...")
        subprocess.run(['npm', 'install'], check=True)
        print("✅ Node.js dependencies installed")
    else:
        print("❌ package.json not found")

def create_directories():
    """Create necessary directories"""
    
    directories = [
        'datasets',
        'datasets/reddit_lawns',
        '.venv',
        'logs'
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {directory}")

def verify_environment():
    """Verify the environment setup"""
    
    print("\n🔍 Verifying environment setup...")
    
    # Check .env file
    if Path('.env').exists():
        print("✅ .env file exists")
    else:
        print("❌ .env file missing")
    
    # Check virtual environment
    if Path('.venv').exists():
        print("✅ Virtual environment exists")
    else:
        print("❌ Virtual environment missing")
    
    # Check node_modules
    if Path('node_modules').exists():
        print("✅ Node.js dependencies installed")
    else:
        print("❌ Node.js dependencies missing")
    
    # Check Python packages
    try:
        if os.name == 'nt':
            python_exe = '.venv/Scripts/python.exe'
        else:
            python_exe = '.venv/bin/python'
        
        result = subprocess.run([python_exe, '-c', 'import praw, openai, requests'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Python dependencies verified")
        else:
            print("❌ Python dependencies missing or broken")
    except Exception as e:
        print(f"❌ Error checking Python dependencies: {e}")

def main():
    """Main setup function"""
    
    print("🚀 Setting up Lawn Care AI Project for PyCharm")
    print("=" * 50)
    
    try:
        create_directories()
        create_pycharm_config()
        setup_virtual_environment()
        setup_node_environment()
        verify_environment()
        
        print("\n" + "=" * 50)
        print("✅ Setup complete!")
        print("\n📋 Next steps:")
        print("1. Open PyCharm")
        print("2. File → Open → Select this project directory")
        print("3. Configure Python interpreter: .venv/Scripts/python.exe (Windows) or .venv/bin/python (macOS/Linux)")
        print("4. Run configurations are already created:")
        print("   - Frontend Dev Server (npm run dev)")
        print("   - Collect Reddit Data (Python script)")
        print("   - Run AI Analysis (Python script)")
        print("5. Start with 'Frontend Dev Server' to launch the web interface")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()