import React, { useState } from 'react';
import { useEffect } from 'react';
import { collectRedditData, CollectionResult } from '../utils/redditCollector';
import { getLocalData, saveLocalData } from '../utils/localStorage';
import { config } from '../utils/config';
import {
  Download,
  Play,
  Pause,
  RefreshCw,
  Database,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Filter,
  Plus,
  X
} from 'lucide-react';

const DataCollection: React.FC = () => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [collectionResult, setCollectionResult] = useState<CollectionResult | null>(null);
  const [settings, setSettings] = useState({
    subreddits: ['lawncare', 'landscaping', 'plantclinic', 'gardening'],
    keywords: ['brown spots', 'dead grass', 'lawn disease', 'grubs', 'weeds'],
    limit: 500,
    incremental: true,
    startDate: '',
    endDate: ''
  });

  const [stats, setStats] = useState({
    totalCollected: 0,
    newToday: 0,
    lawnImages: 0,
    nonLawnImages: 0,
    duplicatesSkipped: 0,
    alreadyAnalyzed: 0,
    lastRun: localStorage.getItem('lastRedditCollection') || 'Never'
  });

  // Load stats on component mount
  useEffect(() => {
    const localData = getLocalData();
    const redditPosts = localData.reddit_analyses || [];
    const analyzedPosts = localData.analyzed_posts || [];

    setStats(prev => ({
      ...prev,
      totalCollected: redditPosts.length,
      lawnImages: redditPosts.filter((p: any) => p.post_hint === 'image').length,
      analyzed: analyzedPosts.length
    }));
  }, []);

  const handleStartCollection = () => {
    if (!config.reddit.clientId || !config.reddit.clientSecret) {
      alert('Reddit API credentials not configured. Please check your .env file and add:\nVITE_REDDIT_CLIENT_ID=your_client_id\nVITE_REDDIT_CLIENT_SECRET=your_client_secret');
      return;
    }

    console.log('Starting REAL Reddit data collection...');
    setIsCollecting(true);
    setProgress(0);
    setCollectionResult(null);

    // Use real Reddit API
    performRealRedditCollection();
  };

  const performRealRedditCollection = async () => {
    try {
      console.log('🚀 Starting REAL Reddit API collection...');
      
      // Validate date range
      let startTimestamp: number | undefined;
      let endTimestamp: number | undefined;
      
      if (settings.startDate) {
        startTimestamp = Math.floor(new Date(settings.startDate).getTime() / 1000);
      }
      if (settings.endDate) {
        endTimestamp = Math.floor(new Date(settings.endDate + 'T23:59:59').getTime() / 1000);
      }
      
      if (startTimestamp && endTimestamp && startTimestamp > endTimestamp) {
        throw new Error('Start date must be before end date');
      }

      console.log('📋 Configuration:', {
        subreddits: settings.subreddits,
        keywords: settings.keywords.length,
        limit: settings.limit,
        dateRange: settings.startDate && settings.endDate ? 
          `${settings.startDate} to ${settings.endDate}` : 'All time',
        clientId: config.reddit.clientId ? 'SET' : 'MISSING',
        clientSecret: config.reddit.clientSecret ? 'SET' : 'MISSING'
      });

      // Get existing data to check for duplicates
      const localData = getLocalData();
      const existingPostIds = new Set((localData.reddit_analyses || []).map((p: any) => p.id));
      const analyzedPostIds = new Set((localData.analyzed_posts || []).map((p: any) => p.post_id || p.id));
      
      console.log('📊 Existing data:', {
        existingPosts: existingPostIds.size,
        analyzedPosts: analyzedPostIds.size
      });
      // Calculate total operations for progress tracking
      const totalOperations = settings.subreddits.length * settings.keywords.length;
      let completedOperations = 0;
      let duplicatesSkipped = 0;
      let alreadyAnalyzedCount = 0;

      // Progress update function
      const updateProgress = () => {
        const progressPercent = (completedOperations / totalOperations) * 100;
        setProgress(Math.min(progressPercent, 95)); // Cap at 95% until complete
      };

      const result = await collectRedditData({
        subreddits: settings.subreddits,
        keywords: settings.keywords,
        postsPerKeyword: Math.max(5, Math.floor(settings.limit / settings.keywords.length)),
        includeComments: true,
        startDate: startTimestamp,
        endDate: endTimestamp,
        existingPostIds,
        onProgress: (completed: number, total: number) => {
          completedOperations = completed;
          updateProgress();
        }
      });

      console.log('📊 Reddit API collection results:', {
        totalPosts: result.totalCollected,
        duplicatesSkipped: result.duplicatesSkipped,
        errors: result.errors.length,
        postsWithImages: result.posts.filter(p => p.post_hint === 'image').length,
        postsWithComments: result.posts.filter(p => p.comments && p.comments.length > 0).length
      });

      // Filter out posts that are already analyzed to save on AI costs
      const postsToSave = result.posts.filter(post => {
        if (analyzedPostIds.has(post.id)) {
          alreadyAnalyzedCount++;
          return false;
        }
        return true;
      });

      console.log('💰 Cost optimization:', {
        totalCollected: result.posts.length,
        alreadyAnalyzed: alreadyAnalyzedCount,
        newForAnalysis: postsToSave.length,
        costSavings: `$${(alreadyAnalyzedCount * 0.02).toFixed(2)} estimated`
      });

      // Save new data to localStorage
      if (!localData.reddit_analyses) {
        localData.reddit_analyses = [];
      }

      localData.reddit_analyses = [...localData.reddit_analyses, ...postsToSave];
      saveLocalData(localData);

      console.log('💾 Saved', postsToSave.length, 'new posts from Reddit API to localStorage');
      console.log('📈 Total posts in database:', localData.reddit_analyses.length);

      // Update UI
      setStats(prev => ({
        ...prev,
        totalCollected: localData.reddit_analyses.length,
        newToday: postsToSave.length,
        duplicatesSkipped: result.duplicatesSkipped || 0,
        alreadyAnalyzed: alreadyAnalyzedCount,
        lawnImages: prev.lawnImages + postsToSave.filter(p => p.post_hint === 'image').length,
        lastRun: new Date().toLocaleString()
      }));

      localStorage.setItem('lastRedditCollection', new Date().toISOString());
      setCollectionResult(result);
      setProgress(100);
      setIsCollecting(false);

    } catch (error) {
      console.error('Real Reddit collection failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      setIsCollecting(false);
      setProgress(0);

      let errorMessage = 'Reddit collection failed: ' + error.message;
      if (error.message.includes('credentials')) {
        errorMessage += '\n\n🔧 Setup Instructions:\n1. Create Reddit app at https://www.reddit.com/prefs/apps\n2. Choose "script" type\n3. Add credentials to .env file:\n   VITE_REDDIT_CLIENT_ID=your_client_id\n   VITE_REDDIT_CLIENT_SECRET=your_client_secret';
      }
      errorMessage += '\n\nCheck browser console (F12) for detailed logs.';

      alert(errorMessage);
    }
  };

  const handleStopCollection = () => {
    setIsCollecting(false);
    setProgress(0);
  };

  const addSubreddit = () => {
    const newSub = prompt('Enter subreddit name (without r/):');
    if (newSub && !settings.subreddits.includes(newSub)) {
      setSettings(prev => ({
        ...prev,
        subreddits: [...prev.subreddits, newSub]
      }));
    }
  };

  const removeSubreddit = (sub: string) => {
    setSettings(prev => ({
      ...prev,
      subreddits: prev.subreddits.filter(s => s !== sub)
    }));
  };

  const addKeyword = () => {
    const newKeyword = prompt('Enter search keyword:');
    if (newKeyword && !settings.keywords.includes(newKeyword)) {
      setSettings(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword]
      }));
    }
  };

  const removeKeyword = (keyword: string) => {
    setSettings(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  return (
    <div className="space-y-8">
      {/* Collection Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reddit Data Collection</h2>
            <p className="text-gray-600 mt-1">Collect lawn images and discussions from Reddit</p>
          </div>
          <div className="flex items-center space-x-3">
            {!isCollecting ? (
              <button
                onClick={handleStartCollection}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Start Collection</span>
              </button>
            ) : (
              <button
                onClick={handleStopCollection}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span>Stop Collection</span>
              </button>
            )}
            <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isCollecting && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Collection Progress</span>
              <span className="text-sm text-gray-500">{Math.floor(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
              <span>Collecting from Reddit using real API...</span>
              <span>ETA: {Math.max(1, Math.floor((100 - progress) / 15))} min</span>
            </div>
          </div>
        )}

        {/* Collection Results */}
        {collectionResult && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Collection Complete!</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-green-700">Posts Collected:</span>
                <span className="ml-2 font-medium">{collectionResult.totalCollected}</span>
              </div>
              <div>
                <span className="text-green-700">With Images:</span>
                <span className="ml-2 font-medium">
                  {collectionResult.posts.filter(p => p.post_hint === 'image').length}
                </span>
              </div>
              <div>
                <span className="text-green-700">Errors:</span>
                <span className="ml-2 font-medium">{collectionResult.errors.length}</span>
              </div>
            </div>
            {collectionResult.errors.length > 0 && (
              <details className="mt-3">
                <summary className="text-sm text-orange-600 cursor-pointer">View Errors</summary>
                <div className="mt-2 text-xs text-orange-700">
                  {collectionResult.errors.map((error, idx) => (
                    <div key={idx} className="mb-1">{error}</div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Collected</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalCollected}</p>
              </div>
              <Database className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">New Today</p>
                <p className="text-2xl font-bold text-green-900">{stats.newToday}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Lawn Images</p>
                <p className="text-2xl font-bold text-purple-900">{stats.lawnImages}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Duplicates Skipped</p>
                <p className="text-2xl font-bold text-orange-900">{stats.duplicatesSkipped}</p>
              </div>
              <Filter className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Already Analyzed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.alreadyAnalyzed}</p>
              </div>
              <Clock className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>
        
        {/* Last Run Info */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Last collection: <span className="font-medium">{stats.lastRun}</span>
          </p>
        </div>
      </div>

      {/* Collection Settings */}
      <div className="space-y-8">
        {/* Subreddits Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Target Subreddits</h3>
            <button
              onClick={addSubreddit}
              className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subreddit</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {settings.subreddits.map((sub) => (
              <div key={sub} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-900">r/{sub}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Active
                  </span>
                </div>
                <button
                  onClick={() => removeSubreddit(sub)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Keywords Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Search Keywords</h3>
            <button
              onClick={addKeyword}
              className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Keyword</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {settings.keywords.map((keyword) => (
              <div key={keyword} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">"{keyword}"</span>
                <button
                  onClick={() => removeKeyword(keyword)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Collection Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Date Range Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Date Range Filter</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={settings.startDate}
                  onChange={(e) => setSettings(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Only collect posts created after this date</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={settings.endDate}
                  onChange={(e) => setSettings(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Only collect posts created before this date</p>
              </div>
              
              {settings.startDate && settings.endDate && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Date Range:</strong> {settings.startDate} to {settings.endDate}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Advanced Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Posts Limit
                </label>
                <input
                  type="number"
                  value={settings.limit}
                  onChange={(e) => setSettings(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection Mode
                </label>
                <select
                  value={settings.incremental ? 'incremental' : 'full'}
                  onChange={(e) => setSettings(prev => ({ ...prev, incremental: e.target.value === 'incremental' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="incremental">Incremental (New posts only)</option>
                  <option value="full">Full Collection</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Schedule
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <option value="manual">Manual Only</option>
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
            
            {/* Efficiency Info */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-2">💰 Cost Optimization Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Duplicate post detection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Skip already analyzed posts</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Date range filtering</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Incremental collection mode</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">
                  {config.reddit.clientId ? 'Real Reddit API Enabled' : 'Reddit API Not Configured'}
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  {config.reddit.clientId
                    ? 'Ready to collect real posts and comments from Reddit API. Rate limited to respect Reddit\'s terms of service.'
                    : 'Add VITE_REDDIT_CLIENT_ID and VITE_REDDIT_CLIENT_SECRET to your .env file to enable real Reddit collection.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCollection;