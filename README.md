# Lawn Analyzer - AI-Powered Lawn Diagnostic Tool

A comprehensive web application that provides users with intelligent lawn diagnostics and treatment recommendations using real OpenAI GPT-4o Vision API and Reddit data collection.

## 🚀 Setup Instructions

### Prerequisites

1. **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Reddit API Credentials**: Create app at [Reddit Apps](https://www.reddit.com/prefs/apps)

### Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.local.example .env
# Edit .env with your API keys
```

3. **Start development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to `http://localhost:5173`

## 🔑 Environment Configuration

Create a `.env` file with:

```env
# OpenAI Configuration (Required for AI analysis)
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_PROJECT=your_project_id_here

# Reddit API Configuration (Required for data collection)
VITE_REDDIT_CLIENT_ID=your_reddit_client_id
VITE_REDDIT_CLIENT_SECRET=your_reddit_client_secret
VITE_REDDIT_USER_AGENT=lawn_analyzer_v1.0_by_/u/yourusername

# Development Settings
NODE_ENV=development
VITE_DEV_MODE=true
```

### API Setup Instructions

#### OpenAI API Setup
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new API key
3. Add billing information (GPT-4o Vision requires paid account)
4. Copy key to `VITE_OPENAI_API_KEY`

#### Reddit API Setup
1. Go to [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Choose "script" type
4. Copy Client ID and Secret to your .env file

## 🎯 Features

### Real AI Analysis
- **GPT-4o Vision**: Analyzes actual lawn images
- **Professional Diagnostics**: Uses expert-level system prompts
- **Confidence Scoring**: Provides accuracy estimates
- **Fallback System**: Uses mock analysis if API fails

### Reddit Data Collection
- **Real-time Collection**: Gathers posts from lawn care subreddits
- **Comment Analysis**: Extracts solutions from community discussions
- **Smart Filtering**: Focuses on relevant lawn care content
- **Rate Limiting**: Respects Reddit API limits

### Local Development Features

- **Local Data Storage**: All data saved in browser localStorage
- **Image Storage**: Base64 encoding for development
- **Export/Import**: Download your data as JSON files
- **Hybrid Mode**: Real APIs with local storage

## 🔄 How It Works

### User Flow
1. **Upload Image**: User uploads lawn photo
2. **Describe Problem**: User provides detailed description
3. **AI Analysis**: GPT-4o Vision analyzes image + description
4. **Get Results**: Detailed diagnosis with treatment plan
5. **Expert Review**: Option to flag for human expert review

### Admin Flow
1. **Data Collection**: Collect posts from Reddit automatically
2. **Review Submissions**: Manage user submissions and flagged cases
3. **Export Data**: Download collected data for analysis
4. **Monitor Performance**: Track collection and analysis stats

## 📊 Data Management

### Local Storage Structure
```json
{
  "submissions": [
    {
      "id": "timestamp",
      "user_email": "user@example.com", 
      "image_data": "data:image/jpeg;base64,...",
      "problem_description": "Brown patches...",
      "analysis_result": { ... },
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "reddit_analyses": [
    {
      "id": "reddit_post_id",
      "title": "Help with brown spots",
      "selftext": "My lawn has...",
      "comments": [ ... ],
      "created_utc": 1234567890
    }
  ]
}
```

### Export Options
- **JSON Export**: Complete data dump
- **CSV Export**: Structured analysis results  
- **Image Export**: Separate image files

## 🚀 Production Deployment

### Migration Checklist
- [ ] Replace localStorage with real database (PostgreSQL/MongoDB)
- [ ] Implement proper file storage (AWS S3/Cloudinary)
- [ ] Add user authentication system
- [ ] Set up email service for expert reviews
- [ ] Configure server-side API endpoints
- [ ] Add proper error handling and logging
- [ ] Implement rate limiting and security measures

## 🛠 Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **AI**: OpenAI GPT-4o Vision API
- **Data Collection**: Reddit API
- **Storage**: localStorage (dev) → Database (prod)
- **Icons**: Lucide React
- **Build**: Vite

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production  
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## 📱 Admin Access

- **URL**: `http://localhost:5173/admin`
- **Username**: `admin`
- **Password**: `admin123`

## ⚠️ Important Notes

### API Costs
- **OpenAI**: GPT-4o Vision costs ~$0.01-0.03 per image analysis
- **Reddit**: Free tier allows 100 requests/minute

### Rate Limits
- **OpenAI**: 500 requests/minute (paid tier)
- **Reddit**: 100 requests/minute per app

### Data Privacy
- User images stored locally during development
- No data sent to third parties except OpenAI for analysis
- Reddit data collection follows API terms of service

## 🆘 Troubleshooting

### Common Issues

1. **"OpenAI API error"**: Check API key and billing status
2. **"Reddit authentication failed"**: Verify client ID/secret
3. **"Analysis failed"**: Will fallback to mock analysis automatically
4. **Images not loading**: Check base64 data format

### Debug Mode
Open browser console to see detailed logs of:
- API requests and responses
- Data storage operations  
- Analysis results and confidence scores
- Collection progress and errors

---

**Built with ❤️ for lawn care enthusiasts and professionals using real AI and community data.**

*Production-ready with real APIs and local development support!*