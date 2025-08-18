import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  Database, 
  Brain, 
  Save, 
  TestTube,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { config } from '../utils/config';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    openaiApiKey: config.openai.apiKey,
    redditClientId: config.reddit.clientId,
    redditClientSecret: config.reddit.clientSecret,
    databaseUrl: 'sqlite:./lawn_analyzer.db',
    autoCollection: true,
    collectionInterval: 'daily',
    analysisModel: 'gpt-4o',
    confidenceThreshold: 0.7,
    maxTokens: 4000,
    temperature: 0.3
  });

  const [testResults, setTestResults] = useState<{
    openai: 'pending' | 'success' | 'error';
    reddit: 'pending' | 'success' | 'error';
    database: 'pending' | 'success' | 'error';
  }>({
    openai: 'pending',
    reddit: 'pending',
    database: 'pending'
  });

  const handleSave = () => {
    // Save settings logic here
    console.log('Saving settings:', settings);
  };

  const testConnection = async (service: 'openai' | 'reddit' | 'database') => {
    setTestResults(prev => ({ ...prev, [service]: 'pending' }));
    
    // Simulate API test
    setTimeout(() => {
      setTestResults(prev => ({ 
        ...prev, 
        [service]: Math.random() > 0.3 ? 'success' : 'error' 
      }));
    }, 2000);
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <TestTube className="w-4 h-4 text-gray-400 animate-pulse" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="w-8 h-8 text-gray-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Configure your Lawn Analyzer application</p>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Key className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">API Configuration</h2>
        </div>

        <div className="space-y-6">
          {/* OpenAI Settings */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">OpenAI API</h3>
                <p className="text-sm text-gray-600">Required for AI analysis and image processing</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(testResults.openai)}
                <button
                  onClick={() => testConnection('openai')}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Test Connection
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={settings.openaiApiKey}
                  onChange={(e) => setSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <select
                    value={settings.analysisModel}
                    onChange={(e) => setSettings(prev => ({ ...prev, analysisModel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={settings.maxTokens}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reddit Settings */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Reddit API</h3>
                <p className="text-sm text-gray-600">Required for collecting lawn data from Reddit</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(testResults.reddit)}
                <button
                  onClick={() => testConnection('reddit')}
                  className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Test Connection
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client ID
                </label>
                <input
                  type="text"
                  value={settings.redditClientId}
                  onChange={(e) => setSettings(prev => ({ ...prev, redditClientId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Secret
                </label>
                <input
                  type="password"
                  value={settings.redditClientSecret}
                  onChange={(e) => setSettings(prev => ({ ...prev, redditClientSecret: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4 p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Setup Instructions:</strong> Create a Reddit app at{' '}
                <a 
                  href="https://www.reddit.com/prefs/apps" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-800 underline inline-flex items-center"
                >
                  reddit.com/prefs/apps
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
                {' '}and select "script\" type.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Database Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Database className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Database Configuration</h2>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Database Connection</h3>
              <p className="text-sm text-gray-600">SQLite database for storing lawn analysis data</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(testResults.database)}
              <button
                onClick={() => testConnection('database')}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                Test Connection
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Database URL
            </label>
            <input
              type="text"
              value={settings.databaseUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, databaseUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Application Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Application Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Data Collection</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.autoCollection}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoCollection: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Auto Collection</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection Interval
                </label>
                <select
                  value={settings.collectionInterval}
                  onChange={(e) => setSettings(prev => ({ ...prev, collectionInterval: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">AI Analysis</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confidence Threshold
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={settings.confidenceThreshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low (0.1)</span>
                  <span>Current: {settings.confidenceThreshold}</span>
                  <span>High (1.0)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Save className="w-5 h-5" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;