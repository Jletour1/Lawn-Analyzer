import React, { useState } from 'react';
import { Play, Pause, Settings, Database, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

const DataCollection: React.FC = () => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settings, setSettings] = useState({
    subreddits: ['lawncare', 'landscaping', 'plantclinic'],
    limit: 200,
    keywords: [
      'dog urine', 'pee spots', 'dull blades', 'fertilizer burn', 'grubs',
      'chinch bugs', 'brown patch', 'dollar spot', 'fairy ring', 'rust fungus'
    ]
  });

  const handleStartCollection = () => {
    setIsCollecting(true);
    setProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCollecting(false);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 500);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Data Collection</h2>
            <p className="text-gray-600 mt-1">Collect posts and comments from Reddit communities</p>
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
          </div>
        </div>
      </div>

      {/* Progress */}
      {isCollecting && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Collection Progress</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Collecting...</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-500" />
              <span>Posts collected: {Math.floor(progress * 2)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>Estimated time: {Math.max(1, Math.floor((100 - progress) / 10))} min</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Progress: {Math.floor(progress)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subreddits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Target Subreddits</h3>
            <button
              onClick={addSubreddit}
              className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Add Subreddit
            </button>
          </div>
          <div className="space-y-2">
            {settings.subreddits.map((sub, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="font-medium">r/{sub}</span>
                </div>
                <button
                  onClick={() => removeSubreddit(sub)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Collection Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posts Limit
              </label>
              <input
                type="number"
                value={settings.limit}
                onChange={(e) => setSettings(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="1"
                max="1000"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum number of posts to collect per run</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Keywords
              </label>
              <div className="flex flex-wrap gap-2">
                {settings.keywords.slice(0, 6).map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{settings.keywords.length - 6} more
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Collections */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Collections</h3>
        <div className="space-y-3">
          {[
            { date: '2024-01-15 14:30', posts: 247, comments: 1834, status: 'completed' },
            { date: '2024-01-14 09:15', posts: 189, comments: 1456, status: 'completed' },
            { date: '2024-01-13 16:45', posts: 156, comments: 987, status: 'completed' },
            { date: '2024-01-12 11:20', posts: 203, comments: 1567, status: 'failed' },
          ].map((collection, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  collection.status === 'completed' ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                <div>
                  <p className="font-medium text-gray-900">{collection.date}</p>
                  <p className="text-sm text-gray-500">
                    {collection.posts} posts, {collection.comments} comments
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                collection.status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {collection.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataCollection;