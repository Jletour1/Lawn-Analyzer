import React, { useState } from 'react';
import { Brain, Play, Settings, Zap, Target, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const Analysis: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settings, setSettings] = useState({
    model: 'gpt-4o-mini',
    batchSize: 40,
    confidence: 'medium'
  });

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setProgress(0);
    
    // Simulate analysis progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          return 100;
        }
        return prev + Math.random() * 8;
      });
    }, 800);
  };

  const models = [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', cost: 'Low', speed: 'Fast', accuracy: 'Good' },
    { id: 'gpt-4o', name: 'GPT-4o', cost: 'Medium', speed: 'Medium', accuracy: 'Excellent' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', cost: 'High', speed: 'Slow', accuracy: 'Excellent' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Analysis</h2>
            <p className="text-gray-600 mt-1">Analyze collected posts using OpenAI models</p>
          </div>
          <div className="flex items-center space-x-3">
            {!isAnalyzing ? (
              <button
                onClick={handleStartAnalysis}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Brain className="w-4 h-4" />
                <span>Start Analysis</span>
              </button>
            ) : (
              <button
                disabled
                className="flex items-center space-x-2 bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed"
              >
                <Brain className="w-4 h-4 animate-pulse" />
                <span>Analyzing...</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Analysis Progress</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Brain className="w-4 h-4 animate-pulse text-blue-500" />
              <span>Processing with {settings.model}</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-green-500" />
              <span>Analyzed: {Math.floor(progress * 8.92)}/892</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>ETA: {Math.max(1, Math.floor((100 - progress) / 15))} min</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-purple-500" />
              <span>Tokens used: {Math.floor(progress * 1250)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              <span>Progress: {Math.floor(progress)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Model Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {models.map((model) => (
            <div
              key={model.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                settings.model === model.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSettings(prev => ({ ...prev, model: model.id }))}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{model.name}</h4>
                {settings.model === model.id && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span className={`font-medium ${
                    model.cost === 'Low' ? 'text-green-600' :
                    model.cost === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{model.cost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Speed:</span>
                  <span className="font-medium text-gray-900">{model.speed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="font-medium text-gray-900">{model.accuracy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Size
              </label>
              <input
                type="number"
                value={settings.batchSize}
                onChange={(e) => setSettings(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">Number of posts to process in each batch</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Confidence
              </label>
              <select
                value={settings.confidence}
                onChange={(e) => setSettings(prev => ({ ...prev, confidence: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low (Include uncertain analyses)</option>
                <option value="medium">Medium (Balanced approach)</option>
                <option value="high">High (Only confident analyses)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Categories</h3>
          <div className="space-y-3">
            {[
              'Fungal Diseases',
              'Pest Damage',
              'Nutrient Deficiency',
              'Watering Issues',
              'Weed Problems',
              'Soil Compaction',
              'Environmental Stress'
            ].map((category, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Analysis Runs</h3>
        <div className="space-y-3">
          {[
            { date: '2024-01-15 15:45', model: 'gpt-4o-mini', posts: 247, success: 234, failed: 13, status: 'completed' },
            { date: '2024-01-14 10:30', model: 'gpt-4o', posts: 189, success: 189, failed: 0, status: 'completed' },
            { date: '2024-01-13 17:20', model: 'gpt-4o-mini', posts: 156, success: 142, failed: 14, status: 'completed' },
            { date: '2024-01-12 12:15', model: 'gpt-4-turbo', posts: 203, success: 0, failed: 203, status: 'failed' },
          ].map((run, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  run.status === 'completed' ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                <div>
                  <p className="font-medium text-gray-900">{run.date}</p>
                  <p className="text-sm text-gray-500">
                    {run.model} • {run.success}/{run.posts} successful
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right text-sm">
                  <p className="text-green-600 font-medium">{run.success} analyzed</p>
                  {run.failed > 0 && <p className="text-red-600">{run.failed} failed</p>}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  run.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {run.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analysis;