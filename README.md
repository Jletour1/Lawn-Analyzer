# Lawn Care AI Diagnostic System

A comprehensive AI-powered lawn care diagnostic system that analyzes images, compares them to a database of similar cases, and provides treatment recommendations based on community data and machine learning.

## 🚀 Features

### Frontend (React + TypeScript)
- **User Diagnostic Interface** - Upload images and get AI-powered lawn problem diagnosis
- **Admin Panel** - Manage data collection, AI analysis, and root cause database
- **Image-to-Image Comparison** - Advanced similarity matching against database of lawn images
- **Dynamic Problem Indicators** - AI automatically learns new problem patterns
- **Community Validation** - Treatment recommendations based on Reddit community success stories

### Backend (Python)
- **Reddit Data Collection** - Automated scraping of lawn care posts and images
- **OpenAI Integration** - GPT-4 Vision API for advanced image analysis
- **SQLite Database** - Comprehensive storage of posts, comments, and analysis results
- **Enhanced Analysis Pipeline** - Multi-stage analysis with confidence boosting

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **PyCharm** (Professional or Community)
- **OpenAI API Key**
- **Reddit API Credentials** (optional, for data collection)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd lawn-care-ai
```

### 2. Python Environment Setup
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Node.js Setup
```bash
# Install Node.js dependencies
npm install

# Start development server
npm run dev
```

### 4. Environment Configuration
The `.env` file is already configured with your OpenAI API key. For Reddit data collection, add:
- `REDDIT_CLIENT_ID` - Your Reddit app client ID
- `REDDIT_CLIENT_SECRET` - Your Reddit app client secret
- `REDDIT_USER_AGENT` - Your Reddit app user agent

### 5. PyCharm Configuration

#### Project Setup:
1. **Open PyCharm**
2. **File → Open** → Select the project directory
3. **File → Settings → Project → Python Interpreter**
4. **Add Interpreter → Existing Environment**
5. **Select**: `.venv/Scripts/python.exe` (Windows) or `.venv/bin/python` (macOS/Linux)

#### Run Configurations:

**Frontend Development Server:**
- **Type**: npm
- **Command**: `run`
- **Arguments**: `dev`
- **Working Directory**: `{project root}`

**Python Data Collection:**
- **Type**: Python
- **Script Path**: `scripts/enhanced_lawn_reddit_pipeline.py`
- **Parameters**: `collect --subs lawncare landscaping plantclinic --limit 200`
- **Working Directory**: `{project root}`

**Python Analysis:**
- **Type**: Python  
- **Script Path**: `scripts/enhanced_lawn_reddit_pipeline.py`
- **Parameters**: `analyze --model gpt-4o-mini`
- **Working Directory**: `{project root}`

## 📁 Project Structure

```
lawn-care-ai/
├── src/                          # React frontend source
│   ├── components/
│   │   ├── admin/               # Admin panel components
│   │   └── user/                # User diagnostic interface
│   ├── utils/                   # Utility functions and analyzers
│   └── main.tsx                 # React entry point
├── scripts/                     # Python backend scripts
│   ├── enhanced_lawn_reddit_pipeline.py  # Main data pipeline
│   └── run_collect_and_analyze.bat       # Windows batch script
├── datasets/                    # Data storage directory
│   ├── reddit_lawn_data.db     # SQLite database
│   └── reddit_lawns/           # Downloaded images
├── .env                        # Environment variables
├── requirements.txt            # Python dependencies
└── package.json               # Node.js dependencies
```

## 🔧 Usage

### Frontend Development
```bash
npm run dev
```
Access the application at `http://localhost:5173`

### Data Collection (Python)
```bash
# Collect Reddit data
python scripts/enhanced_lawn_reddit_pipeline.py collect --subs lawncare landscaping plantclinic --limit 200

# Run AI analysis
python scripts/enhanced_lawn_reddit_pipeline.py analyze --model gpt-4o-mini

# Export results
python scripts/enhanced_lawn_reddit_pipeline.py export
```

### User Interface
1. **User Mode**: Upload lawn images for AI diagnosis
2. **Admin Mode**: Click "Admin" button (password: `admin123`)
   - **Dashboard**: System overview and statistics
   - **Data Collection**: Manage Reddit data scraping
   - **AI Analysis**: Configure and run OpenAI analysis
   - **Results**: Browse and export analysis results
   - **Root Causes**: Manage problem types and product recommendations
   - **User Submissions**: Review user uploads and manual classification
   - **Dynamic Indicators**: Monitor auto-generated problem detection algorithms

## 🧠 AI Features

### Image Analysis
- **Advanced Computer Vision** - Color, pattern, and texture analysis
- **Image Embeddings** - 256-dimensional feature vectors for similarity matching
- **Dynamic Learning** - System automatically learns new problem patterns
- **Confidence Boosting** - Similarity matching improves diagnosis accuracy

### Community Integration
- **Reddit Data Mining** - Automated collection of lawn care discussions
- **Treatment Validation** - Track success rates of community recommendations
- **Expert Knowledge** - Combine AI analysis with human expertise

### Machine Learning
- **Continuous Learning** - System improves with each new image
- **Pattern Recognition** - Automatically discovers new lawn problems
- **Predictive Analytics** - Forecast treatment success probability

## 🔍 Troubleshooting

### Common Issues:
1. **OpenAI API Errors** - Check API key in `.env` file
2. **Reddit API Errors** - Verify Reddit credentials
3. **Database Errors** - Ensure `datasets/` directory exists
4. **Node.js Errors** - Run `npm install` to install dependencies
5. **Python Errors** - Activate virtual environment and install requirements

### Development Tips:
- Use **PyCharm's integrated terminal** for running commands
- **Enable auto-reload** for both frontend and backend development
- **Check browser console** for frontend debugging
- **Use PyCharm debugger** for Python script debugging

## 📊 Data Flow

1. **Reddit Collection** → Scrape posts, comments, and images
2. **AI Analysis** → Process with OpenAI GPT-4 Vision
3. **Database Storage** → Store results in SQLite
4. **User Upload** → Analyze new images against database
5. **Similarity Matching** → Find visually similar cases
6. **Dynamic Learning** → Auto-generate new problem indicators
7. **Treatment Recommendations** → Provide evidence-based solutions

## 🚀 Deployment

The system is designed for server deployment with unlimited storage. All analysis data is preserved for continuous learning and research purposes.

## 📝 License

This project is for educational and research purposes.# Lawn-Analyzer
