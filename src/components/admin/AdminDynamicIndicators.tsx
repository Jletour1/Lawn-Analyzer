import React, { useState, useEffect } from 'react';
import { Zap, Eye, ToggleLeft, ToggleRight, Trash2, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';
import { enhancedImageAnalyzer } from '../../utils/enhancedImageAnalyzer';
import { lawnAnalyzer } from '../../utils/lawnAnalyzer';

interface DynamicIndicator {
  id: string;
  problemType: string;
  indicatorFunction: string;
  confidence: number;
  trainingExamples: number;
  lastUpdated: string;
  isActive: boolean;
}

const AdminDynamicIndicators: React.FC = () => {
  const [indicators, setIndicators] = useState<DynamicIndicator[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<DynamicIndicator | null>(null);
  const [showCode, setShowCode] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalIndicators: 0,
    activeIndicators: 0,
    avgConfidence: 0,
    recentlyGenerated: 0
  });

  useEffect(() => {
    loadIndicators();
    calculateStats();
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      loadIndicators();
      calculateStats();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadIndicators = () => {
    const dynamicIndicators = enhancedImageAnalyzer.getDynamicIndicators();
    setIndicators(dynamicIndicators);
  };

  const calculateStats = () => {
    const dynamicIndicators = enhancedImageAnalyzer.getDynamicIndicators();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentCount = dynamicIndicators.filter(ind => 
      new Date(ind.lastUpdated) > oneDayAgo
    ).length;
    
    const avgConf = dynamicIndicators.length > 0 
      ? dynamicIndicators.reduce((sum, ind) => sum + ind.confidence, 0) / dynamicIndicators.length 
      : 0;
    
    setStats({
      totalIndicators: dynamicIndicators.length,
      activeIndicators: dynamicIndicators.filter(ind => ind.isActive).length,
      avgConfidence: avgConf,
      recentlyGenerated: recentCount
    });
  };

  const toggleIndicator = (id: string, active: boolean) => {
    enhancedImageAnalyzer.toggleIndicator(id, active);
    loadIndicators();
    calculateStats();
  };

  const removeIndicator = (id: string) => {
    if (confirm('Are you sure you want to remove this dynamic indicator?')) {
      enhancedImageAnalyzer.removeIndicator(id);
      loadIndicators();
      calculateStats();
    }
  };

  const viewIndicatorCode = (indicator: DynamicIndicator) => {
    setShowCode(showCode === indicator.id ? null : indicator.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-900 text-green-300';
    if (confidence >= 0.6) return 'bg-yellow-900 text-yellow-300';
    return 'bg-red-900 text-red-300';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Dynamic Problem Indicators</h2>
            <p className="text-gray-400 mt-1">AI-generated indicators that automatically learn new problem patterns</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => { loadIndicators(); calculateStats(); }}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <div className="text-sm text-gray-400">
              <span className="text-yellow-400">{stats.activeIndicators}</span> active •{' '}
              <span className="text-green-400">{stats.recentlyGenerated}</span> generated today
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Indicators</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.totalIndicators}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-600">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Active Indicators</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.activeIndicators}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-600">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Avg Confidence</p>
              <p className="text-3xl font-bold text-white mt-2">{Math.round(stats.avgConfidence * 100)}%</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-600">
              <Eye className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Generated Today</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.recentlyGenerated}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-600">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h3 className="text-xl font-bold text-white mb-4">🤖 How Dynamic Indicators Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2">1. Pattern Detection</h4>
            <p className="text-gray-200 text-sm">
              When users upload images, the system analyzes visual patterns and compares them to existing cases. 
              If 5+ high-confidence matches are found for a new problem type, it triggers indicator generation.
            </p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2">2. Auto-Generation</h4>
            <p className="text-gray-200 text-sm">
              The AI automatically creates JavaScript functions that can detect the new problem pattern. 
              These functions analyze color, texture, and shape features specific to the discovered issue.
            </p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-purple-400 font-semibold mb-2">3. Continuous Learning</h4>
            <p className="text-gray-200 text-sm">
              Each new user submission helps refine the indicators. The system tracks accuracy and 
              automatically adjusts confidence levels based on real-world validation.
            </p>
          </div>
        </div>
      </div>

      {/* Indicators Table */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Dynamic Indicators</h3>
        </div>
        
        {indicators.length === 0 ? (
          <div className="p-12 text-center">
            <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Dynamic Indicators Yet</h3>
            <p className="text-gray-500 mb-4">
              Dynamic indicators will be automatically generated as users submit images and the AI discovers new problem patterns.
            </p>
            <div className="text-sm text-gray-400">
              <p>💡 To generate indicators:</p>
              <p>• Users need to submit images with similar problems</p>
              <p>• AI needs 5+ high-confidence matches (85%+)</p>
              <p>• System will auto-create detection functions</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Problem Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Confidence</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Training Examples</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Last Updated</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {indicators.map((indicator) => (
                  <React.Fragment key={indicator.id}>
                    <tr className="hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <Zap className="w-5 h-5 text-yellow-400" />
                          <div>
                            <p className="font-medium text-white">{indicator.problemType}</p>
                            <p className="text-xs text-gray-400">Auto-generated</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`text-2xl font-bold ${getConfidenceColor(indicator.confidence)}`}>
                            {Math.round(indicator.confidence * 100)}%
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceBg(indicator.confidence)}`}>
                            {indicator.confidence >= 0.8 ? 'High' : indicator.confidence >= 0.6 ? 'Medium' : 'Low'}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{indicator.trainingExamples}</div>
                        <div className="text-xs text-gray-400">training cases</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-white text-sm">{formatDate(indicator.lastUpdated)}</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleIndicator(indicator.id, !indicator.isActive)}
                          className="flex items-center space-x-2"
                        >
                          {indicator.isActive ? (
                            <>
                              <ToggleRight className="w-6 h-6 text-green-400" />
                              <span className="text-green-400 text-sm font-medium">Active</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-6 h-6 text-gray-500" />
                              <span className="text-gray-500 text-sm font-medium">Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => viewIndicatorCode(indicator)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            title="View Code"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeIndicator(indicator.id)}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            title="Remove Indicator"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Code View Row */}
                    {showCode === indicator.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-900">
                          <div className="space-y-4">
                            <h4 className="text-white font-semibold">Generated Indicator Function</h4>
                            <div className="bg-black rounded-lg p-4 overflow-x-auto">
                              <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                                {indicator.indicatorFunction}
                              </pre>
                            </div>
                            <div className="text-xs text-gray-400">
                              This function is automatically executed during image analysis to detect {indicator.problemType} patterns.
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 border border-gray-600 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">📋 Dynamic Indicator Management</h3>
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2">🤖 Automatic Generation</h4>
            <ul className="space-y-1 text-gray-200 text-sm ml-4">
              <li>• System monitors user image submissions for recurring patterns</li>
              <li>• When 5+ high-confidence matches are found for a new problem, an indicator is auto-generated</li>
              <li>• Generated functions analyze color, texture, and pattern features specific to the problem</li>
              <li>• New indicators start with moderate confidence and improve over time</li>
            </ul>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2">⚙️ Management</h4>
            <ul className="space-y-1 text-gray-200 text-sm ml-4">
              <li>• Toggle indicators on/off to control which ones are used in analysis</li>
              <li>• View the generated JavaScript code to understand how detection works</li>
              <li>• Remove indicators that prove to be inaccurate or redundant</li>
              <li>• Monitor confidence levels and training example counts</li>
            </ul>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-purple-400 font-semibold mb-2">📈 Performance</h4>
            <ul className="space-y-1 text-gray-200 text-sm ml-4">
              <li>• High confidence (80%+) indicators are most reliable for diagnosis</li>
              <li>• More training examples generally lead to better accuracy</li>
              <li>• System continuously learns and adjusts based on user feedback</li>
              <li>• Inactive indicators don't affect analysis but are preserved for future use</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDynamicIndicators;