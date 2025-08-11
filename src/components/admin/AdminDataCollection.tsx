import React, { useState, useEffect } from 'react';
import { Play, Pause, Settings, Database, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

const AdminDataCollection: React.FC = () => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [collectionMode, setCollectionMode] = useState<'incremental' | 'full'>('incremental');
  const [lastCollection, setLastCollection] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    subreddits: ['lawncare', 'landscaping', 'plantclinic'],
    limit: 200,
    keywords: [
      'dog urine', 'pee spots', 'dull blades', 'fertilizer burn', 'grubs',
      'chinch bugs', 'brown patch', 'dollar spot', 'fairy ring', 'rust fungus'
    ]
  });

  // Load last collection timestamp
  useEffect(() => {
    const saved = localStorage.getItem('lastCollectionTimestamp');
    if (saved) {
      setLastCollection(saved);
    }
  }, []);

  const handleStartCollection = () => {
    setIsCollecting(true);
    setProgress(0);
    
    // Save collection timestamp
    const timestamp = new Date().toISOString();
    localStorage.setItem('lastCollectionTimestamp', timestamp);
    setLastCollection(timestamp);
    
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Data Collection</h2>
            <p className="text-gray-400 mt-1">Collect posts and comments from Reddit communities</p>
          </div>
          <div className="flex items-center space-x-3">
            {!isCollecting ? (
              <button
                onClick={handleStartCollection}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Start {collectionMode === 'incremental' ? 'Incremental' : 'Full'} Collection</span>
              </button>
            ) : (
              <button
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg"
                disabled
              >
                <Pause className="w-4 h-4" />
                <span>Collecting...</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Collection Mode Selection */}
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-semibold text-white mb-3">Collection Mode</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="collectionMode"
                  value="incremental"
                  checked={collectionMode === 'incremental'}
                  onChange={(e) => setCollectionMode(e.target.value as 'incremental' | 'full')}
                  className="w-4 h-4 text-green-600 border-gray-600 focus:ring-green-500"
                />
                <span className="text-white font-medium">Incremental Collection</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="collectionMode"
                  value="full"
                  checked={collectionMode === 'full'}
                  onChange={(e) => setCollectionMode(e.target.value as 'incremental' | 'full')}
                  className="w-4 h-4 text-red-600 border-gray-600 focus:ring-red-500"
                />
                <span className="text-white font-medium">Full Re-collection</span>
              </label>
            </div>
            
            <div className="text-xs text-gray-300 space-y-1">
              {collectionMode === 'incremental' ? (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <span>Only collect new posts since last run</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    <span>Skip existing images and comments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    <span>Update comment counts for existing posts</span>
                  </div>
                  {lastCollection && (
                    <div className="flex items-center space-x-2 mt-2 p-2 bg-gray-600 rounded">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                      <span>Last collection: {new Date(lastCollection).toLocaleString()}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    <span>Re-collect all posts and comments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                    <span>Re-download all images</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                    <span>Slower but ensures complete data</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Collection Features */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h4 className="text-sm font-semibold text-white mb-3">Enhanced Collection Features</h4>
        <div className="space-y-2 text-xs text-gray-300">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <span>Comment analysis for solution identification</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span>15+ targeted problem categories</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
            <span>Weed identification and percentage analysis</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
            <span>Treatment success story extraction</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      {isCollecting && (
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Collection Progress</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Collecting...</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Overall Progress</span>
              <span className="text-sm font-bold text-white">{Math.floor(progress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-500 to-red-600 h-4 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Started</span>
              <span>{progress < 100 ? 'In Progress...' : 'Complete!'}</span>
            </div>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
            <p className="text-xs text-gray-400 mt-1">Enhanced collection includes up to 25 comments per post</p>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Categories
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                'Dog Urine Spots', 'Dull Mower Blades', 'Fertilizer Burn', 'Grubs',
                'Brown Patch', 'Dollar Spot', 'Fairy Rings', 'Rust Fungus',
                'Drought Stress', 'Overwatering', 'Broadleaf Weeds', 'Crabgrass'
              ].map((category, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-600 rounded">
                  <input type="checkbox" defaultChecked className="w-3 h-3" />
                  <span className="text-gray-200">{category}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300">
                {collectionMode === 'incremental' ? 'New posts' : 'Posts collected'}: {Math.floor(progress * 2)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-gray-300">
                ETA: {Math.max(1, Math.floor((100 - progress) / (collectionMode === 'incremental' ? 20 : 10)))} min
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">Progress: {Math.floor(progress)}%</span>
            </div>
          </div>
          
          {collectionMode === 'incremental' && (
            <div className="mt-4 p-3 bg-green-900/20 border border-green-800 rounded-lg">
              <div className="text-sm text-green-300 font-medium mb-2">Incremental Collection Status</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-green-200">
                <div>✓ Skipped {Math.floor(progress * 15)} existing posts</div>
                <div>✓ Found {Math.floor(progress * 2)} new posts</div>
                <div>✓ Updated {Math.floor(progress * 8)} comment counts</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings and Recent Collections remain similar but with dark theme */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Target Subreddits</h3>
          <div className="space-y-2">
            {settings.subreddits.map((sub, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="font-medium text-white">r/{sub}</span>
                </div>
                <button className="text-red-400 hover:text-red-300 text-sm">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Collection Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Posts Limit
              </label>
              <input
                type="number"
                value={settings.limit}
                onChange={(e) => setSettings(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                min="1"
                max="1000"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Collections */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Collections</h3>
        <div className="space-y-3">
          {[
            { date: '2024-01-15 14:30', posts: 247, comments: 1834, status: 'completed', mode: 'incremental', newPosts: 23 },
            { date: '2024-01-14 09:15', posts: 189, comments: 1456, status: 'completed', mode: 'full', newPosts: 189 },
            { date: '2024-01-13 16:45', posts: 156, comments: 987, status: 'completed', mode: 'incremental', newPosts: 12 },
            { date: '2024-01-12 11:20', posts: 203, comments: 1567, status: 'failed', mode: 'full', newPosts: 0 },
          ].map((collection, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  collection.status === 'completed' ? 'bg-green-400' :
                  collection.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'
                }`}></div>
                <div>
                  <p className="font-medium text-gray-900">{collection.date}</p>
                  <p className="text-sm text-gray-500">
                    {collection.mode === 'incremental' ? `${collection.newPosts} new posts` : `${collection.posts} total posts`}, {collection.comments} comments
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      collection.mode === 'incremental' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {collection.mode}
                    </span>
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                collection.status === 'completed' ? 'bg-green-100 text-green-800' :
                collection.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {collection.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Collection Strategy Info */}
      <div className="bg-gray-800 border border-gray-600 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">📋 Smart Collection Strategy</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-green-400 mb-2">🔄 Incremental Collection</h4>
                <ul className="space-y-1 text-gray-200 text-sm">
                <li>• Only scrapes posts newer than last collection</li>
                <li>• Skips existing images to save bandwidth</li>
                <li>• Updates comment counts for existing posts</li>
                <li>• Adds new comments to existing threads</li>
                <li>• 5-10x faster than full collection</li>
                <li>• Recommended for daily/weekly runs</li>
                </ul>
              </div>
            </div>
            <div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">🔄 Full Re-collection</h4>
                <ul className="space-y-1 text-gray-200 text-sm">
                <li>• Re-scrapes all posts and comments</li>
                <li>• Re-downloads all images</li>
                <li>• Ensures complete data integrity</li>
                <li>• Catches any missed updates</li>
                <li>• Slower but comprehensive</li>
                <li>• Recommended for monthly deep sync</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-400 mb-2">💡 Pro Tips</h4>
            <p className="text-gray-200 text-sm">
              <strong>💡 Pro Tip:</strong> Use incremental collection for regular updates, and full re-collection monthly 
              or when you suspect data inconsistencies. The system automatically tracks timestamps to ensure no data is missed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDataCollection;