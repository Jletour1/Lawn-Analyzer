import React, { useState } from 'react';
import { Download, Search, Filter, ExternalLink, TrendingUp } from 'lucide-react';

const AdminResults: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const mockResults = [
    {
      id: '1a2b3c',
      title: 'Brown patches appearing in my lawn after rain',
      subreddit: 'lawncare',
      rootCause: 'Brown patch fungus caused by excessive moisture',
      confidence: 'high',
      categories: ['Fungal Diseases'],
      score: 47,
      comments: 23,
      analyzedAt: '2024-01-15T14:30:00Z',
    },
    {
      id: '2d3e4f',
      title: 'Yellow spots after fertilizing',
      subreddit: 'landscaping',
      rootCause: 'Fertilizer burn from over-application',
      confidence: 'high',
      categories: ['Nutrient Issues'],
      score: 89,
      comments: 34,
      analyzedAt: '2024-01-15T13:15:00Z',
    }
  ];

  const handleExport = () => {
    alert('Export functionality would download the CSV file here');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
            <p className="text-gray-400 mt-1">Browse and export AI-analyzed lawn care issues</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts or issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="Fungal Diseases">Fungal Diseases</option>
              <option value="Pest Damage">Pest Damage</option>
              <option value="Nutrient Issues">Nutrient Issues</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {mockResults.map((result) => (
          <div key={result.id} className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{result.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                  <span>r/{result.subreddit}</span>
                  <span>{result.score} upvotes</span>
                  <span>{result.comments} comments</span>
                  <span className="text-green-400">Solutions: 3</span>
                  <span className="text-blue-400">Diagnostic: 2</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  result.confidence === 'high' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                }`}>
                  {result.confidence}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-900 text-purple-300">
                  15% weeds
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                  Health: 6.5/10
                </span>
              </div>
            </div>

            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
              <h4 className="font-medium text-red-300 mb-1">Root Cause</h4>
              <p className="text-red-200">{result.rootCause}</p>
              <div className="mt-3 flex items-center space-x-4 text-xs">
                <span className="text-orange-300">Treatment Urgency: Medium</span>
                <span className="text-green-300">Best Timing: Spring/Fall</span>
                <span className="text-blue-300">Community Confidence: High</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminResults;