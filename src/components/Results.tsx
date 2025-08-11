import React, { useState } from 'react';
import { Download, Search, Filter, Eye, ExternalLink, TrendingUp, AlertCircle } from 'lucide-react';

const Results: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedConfidence, setSelectedConfidence] = useState('all');

  const mockResults = [
    {
      id: '1a2b3c',
      title: 'Brown patches appearing in my lawn after rain',
      subreddit: 'lawncare',
      rootCause: 'Brown patch fungus caused by excessive moisture and warm temperatures',
      confidence: 'high',
      categories: ['Fungal Diseases', 'Environmental Stress'],
      solutions: [
        'Improve drainage in affected areas',
        'Apply fungicide treatment',
        'Reduce watering frequency',
        'Increase air circulation'
      ],
      score: 47,
      comments: 23,
      analyzedAt: '2024-01-15T14:30:00Z',
      url: 'https://reddit.com/r/lawncare/comments/example1'
    },
    {
      id: '2d3e4f',
      title: 'Yellow spots after fertilizing - what went wrong?',
      subreddit: 'landscaping',
      rootCause: 'Fertilizer burn from over-application of nitrogen-rich fertilizer',
      confidence: 'high',
      categories: ['Nutrient Issues', 'Chemical Damage'],
      solutions: [
        'Water heavily to dilute excess fertilizer',
        'Remove damaged grass and reseed',
        'Use slow-release fertilizer next time',
        'Follow application rates carefully'
      ],
      score: 89,
      comments: 34,
      analyzedAt: '2024-01-15T13:15:00Z',
      url: 'https://reddit.com/r/landscaping/comments/example2'
    },
    {
      id: '3g4h5i',
      title: 'Circular dead spots in my yard - help!',
      subreddit: 'plantclinic',
      rootCause: 'Fairy ring fungus creating distinctive circular patterns',
      confidence: 'medium',
      categories: ['Fungal Diseases'],
      solutions: [
        'Aerate affected areas',
        'Apply nitrogen fertilizer to mask symptoms',
        'Remove organic matter buildup',
        'Consider fungicide for severe cases'
      ],
      score: 23,
      comments: 12,
      analyzedAt: '2024-01-15T12:45:00Z',
      url: 'https://reddit.com/r/plantclinic/comments/example3'
    },
    {
      id: '4j5k6l',
      title: 'Grass dying near where my dog goes',
      subreddit: 'lawncare',
      rootCause: 'Dog urine damage from concentrated nitrogen and salts',
      confidence: 'high',
      categories: ['Pet Damage', 'Chemical Damage'],
      solutions: [
        'Dilute urine spots immediately with water',
        'Train dog to use designated area',
        'Reseed damaged areas with urine-resistant grass',
        'Consider dietary supplements for dog'
      ],
      score: 156,
      comments: 67,
      analyzedAt: '2024-01-15T11:20:00Z',
      url: 'https://reddit.com/r/lawncare/comments/example4'
    }
  ];

  const categories = ['all', 'Fungal Diseases', 'Pest Damage', 'Nutrient Issues', 'Pet Damage', 'Environmental Stress'];
  const confidenceLevels = ['all', 'high', 'medium', 'low'];

  const filteredResults = mockResults.filter(result => {
    const matchesSearch = result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.rootCause.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || result.categories.includes(selectedCategory);
    const matchesConfidence = selectedConfidence === 'all' || result.confidence === selectedConfidence;
    
    return matchesSearch && matchesCategory && matchesConfidence;
  });

  const handleExport = () => {
    // In a real app, this would trigger the actual export
    alert('Export functionality would download the CSV file here');
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
            <p className="text-gray-600 mt-1">Browse and export AI-analyzed lawn care issues</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts or issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confidence</label>
            <select
              value={selectedConfidence}
              onChange={(e) => setSelectedConfidence(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {confidenceLevels.map(level => (
                <option key={level} value={level}>
                  {level === 'all' ? 'All Confidence Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {filteredResults.map((result) => (
          <div key={result.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{result.title}</h3>
                  <span className="text-sm text-gray-500">r/{result.subreddit}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{result.score} upvotes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>{result.comments} comments</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>{new Date(result.analyzedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(result.confidence)}`}>
                  {result.confidence} confidence
                </span>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-900 mb-1">Identified Issue</h4>
                  <p className="text-red-800">{result.rootCause}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {result.categories.map((category, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Recommended Solutions</h4>
                <ul className="space-y-1">
                  {result.solutions.slice(0, 3).map((solution, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{solution}</span>
                    </li>
                  ))}
                  {result.solutions.length > 3 && (
                    <li className="text-sm text-gray-500">
                      +{result.solutions.length - 3} more solutions
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredResults.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">Try adjusting your search terms or filters</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{mockResults.length}</p>
            <p className="text-sm text-gray-600">Total Analyses</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {mockResults.filter(r => r.confidence === 'high').length}
            </p>
            <p className="text-sm text-gray-600">High Confidence</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(mockResults.reduce((sum, r) => sum + r.score, 0) / mockResults.length)}
            </p>
            <p className="text-sm text-gray-600">Avg Score</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {new Set(mockResults.flatMap(r => r.categories)).size}
            </p>
            <p className="text-sm text-gray-600">Categories</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;