import React, { useState } from 'react';
import { Brain, Play, Zap, Target, CheckCircle, Clock } from 'lucide-react';

const AdminAnalysis: React.FC = () => {
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
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">AI Analysis</h2>
            <p className="text-gray-400 mt-1">Analyze collected posts using OpenAI models</p>
          </div>
          <div className="flex items-center space-x-3">
            {!isAnalyzing ? (
              <button
                onClick={handleStartAnalysis}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Brain className="w-4 h-4" />
                <span>Start Analysis</span>
              </button>
            ) : (
              <button
                disabled
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg cursor-not-allowed"
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
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Analysis Progress</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Brain className="w-4 h-4 animate-pulse text-red-400" />
              <span>Processing with {settings.model}</span>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">Analyzed: {Math.floor(progress * 8.92)}/892</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-gray-300">ETA: {Math.max(1, Math.floor((100 - progress) / 15))} min</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-gray-300">Tokens: {Math.floor(progress * 1250)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300">Progress: {Math.floor(progress)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Model Selection */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Model Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {models.map((model) => (
            <div
              key={model.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                settings.model === model.id
                  ? 'border-red-500 bg-red-900/20'
                  : 'border-gray-600 hover:border-gray-500 bg-gray-700'
              }`}
              onClick={() => setSettings(prev => ({ ...prev, model: model.id }))}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">{model.name}</h4>
                {settings.model === model.id && (
                  <CheckCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Cost:</span>
                  <span className={`font-medium ${
                    model.cost === 'Low' ? 'text-green-400' :
                    model.cost === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                  }`}>{model.cost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Speed:</span>
                  <span className="font-medium text-white">{model.speed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Accuracy:</span>
                  <span className="font-medium text-white">{model.accuracy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Enhanced Analysis Features */}
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-semibold text-white mb-3">Enhanced AI Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span>Comment-based solution extraction</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>Community diagnostic insights</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                <span>Weed percentage estimation</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                <span>Treatment urgency assessment</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                <span>Seasonal timing recommendations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-pink-400 rounded-full"></div>
                <span>Health score calculation (1-10)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalysis;