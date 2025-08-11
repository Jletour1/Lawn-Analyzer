import React, { useState, useEffect } from 'react';
import { Eye, Edit3, Save, X, Download, Filter, Search } from 'lucide-react';

interface UserSubmission {
  id: string;
  timestamp: string;
  imageUrl: string;
  userDescription: string;
  aiAnalysis: {
    rootCause: string;
    confidence: number;
    weedPercentage: number;
    healthScore: number;
    recommendations: string[];
  };
  manualRootCause: string;
  manualNotes: string;
  isReviewed: boolean;
  isTrainingData: boolean;
}

const AdminUserSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<UserSubmission | null>(null);
  const [filter, setFilter] = useState<'all' | 'unreviewed' | 'reviewed' | 'training'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Load submissions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('userSubmissions');
    if (saved) {
      setSubmissions(JSON.parse(saved));
    } else {
      // Initialize with some mock data for demonstration
      const mockSubmissions: UserSubmission[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          imageUrl: 'https://images.pexels.com/photos/1453499/pexels-photo-1453499.jpeg?auto=compress&cs=tinysrgb&w=400',
          userDescription: 'Brown patches appearing in my lawn after rain, getting worse each week',
          aiAnalysis: {
            rootCause: 'Brown Patch Disease',
            confidence: 0.85,
            weedPercentage: 12,
            healthScore: 4.2,
            recommendations: ['Apply fungicide treatment', 'Improve drainage', 'Reduce watering frequency']
          },
          manualRootCause: '',
          manualNotes: '',
          isReviewed: false,
          isTrainingData: false
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          imageUrl: 'https://images.pexels.com/photos/1453499/pexels-photo-1453499.jpeg?auto=compress&cs=tinysrgb&w=400',
          userDescription: 'Yellow spots where my dog goes to the bathroom, dark green rings around them',
          aiAnalysis: {
            rootCause: 'Dog Urine Spots',
            confidence: 0.92,
            weedPercentage: 5,
            healthScore: 6.8,
            recommendations: ['Flush with water immediately', 'Apply gypsum', 'Train dog to use designated area']
          },
          manualRootCause: 'Dog Urine Spots',
          manualNotes: 'Classic presentation - AI was correct',
          isReviewed: true,
          isTrainingData: true
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          imageUrl: 'https://images.pexels.com/photos/1453499/pexels-photo-1453499.jpeg?auto=compress&cs=tinysrgb&w=400',
          userDescription: 'Grass looks shredded and brown at the tips after mowing',
          aiAnalysis: {
            rootCause: 'Dull Mower Blades',
            confidence: 0.78,
            weedPercentage: 8,
            healthScore: 5.5,
            recommendations: ['Sharpen mower blades', 'Water lightly to help recovery', 'Avoid mowing until repaired']
          },
          manualRootCause: 'Dull Mower Blades',
          manualNotes: 'Correct diagnosis, good training example',
          isReviewed: true,
          isTrainingData: true
        }
      ];
      setSubmissions(mockSubmissions);
    }
  }, []);

  // Save submissions to localStorage
  useEffect(() => {
    if (submissions.length > 0) {
      localStorage.setItem('userSubmissions', JSON.stringify(submissions));
    }
  }, [submissions]);

  // Add new submission (called from user diagnostic)
  const addSubmission = (imageFile: File, description: string, analysis: any) => {
    const newSubmission: UserSubmission = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      imageUrl: URL.createObjectURL(imageFile),
      userDescription: description,
      aiAnalysis: {
        rootCause: analysis.problem_name || 'Unknown',
        confidence: analysis.confidence || 0,
        weedPercentage: analysis.weed_analysis?.total_weed_percentage || 0,
        healthScore: analysis.health_metrics?.health_score || 0,
        recommendations: analysis.recommendations?.immediate || []
      },
      manualRootCause: '',
      manualNotes: '',
      isReviewed: false,
      isTrainingData: false
    };

    setSubmissions(prev => [newSubmission, ...prev]);
  };

  // Expose addSubmission globally for use in UserDiagnostic
  useEffect(() => {
    // The addSubmission is now handled by the lawnAnalyzer
    // This component just displays the data
  }, []);

  const startEditing = (submission: UserSubmission) => {
    setEditingId(submission.id);
    setEditingData({ ...submission });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const saveEditing = () => {
    if (!editingData) return;

    setSubmissions(prev => prev.map(sub => 
      sub.id === editingData.id 
        ? { ...editingData, isReviewed: true }
        : sub
    ));
    setEditingId(null);
    setEditingData(null);
  };

  const toggleTrainingData = (id: string) => {
    setSubmissions(prev => prev.map(sub => 
      sub.id === id 
        ? { ...sub, isTrainingData: !sub.isTrainingData }
        : sub
    ));
  };

  const exportTrainingData = () => {
    const trainingData = submissions.filter(sub => sub.isTrainingData);
    const csvContent = [
      'ID,Timestamp,User Description,AI Root Cause,AI Confidence,Manual Root Cause,Manual Notes,Weed Percentage,Health Score',
      ...trainingData.map(sub => [
        sub.id,
        sub.timestamp,
        `"${sub.userDescription.replace(/"/g, '""')}"`,
        sub.aiAnalysis.rootCause,
        sub.aiAnalysis.confidence,
        sub.manualRootCause,
        `"${sub.manualNotes.replace(/"/g, '""')}"`,
        sub.aiAnalysis.weedPercentage,
        sub.aiAnalysis.healthScore
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lawn-training-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'unreviewed' && !sub.isReviewed) ||
      (filter === 'reviewed' && sub.isReviewed) ||
      (filter === 'training' && sub.isTrainingData);

    const matchesSearch = 
      sub.userDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.aiAnalysis.rootCause.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.manualRootCause.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const rootCauseOptions = [
    'Dog Urine Spots',
    'Dull Mower Blades', 
    'Fertilizer Burn',
    'Grub Infestation',
    'Chinch Bugs',
    'Brown Patch Disease',
    'Dollar Spot',
    'Fairy Rings',
    'Rust Fungus',
    'Drought Stress',
    'Overwatering',
    'Compacted Soil',
    'Thatch Buildup',
    'Moss Invasion',
    'Broadleaf Weeds',
    'Grassy Weeds',
    'Creeping Weeds',
    'Multiple Issues',
    'Other/Unknown'
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">User Submissions</h2>
            <p className="text-gray-400 mt-1">Review user uploads and manually classify for model improvement</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              <span className="text-yellow-400">{submissions.filter(s => !s.isReviewed).length}</span> unreviewed •{' '}
              <span className="text-green-400">{submissions.filter(s => s.isTrainingData).length}</span> training data
            </div>
            <button
              onClick={exportTrainingData}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Training Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Filter</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Submissions</option>
              <option value="unreviewed">Unreviewed</option>
              <option value="reviewed">Reviewed</option>
              <option value="training">Training Data</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search descriptions or root causes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-400">
              Showing {filteredSubmissions.length} of {submissions.length} submissions
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Image</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">User Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">AI Analysis</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Manual Root Cause</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Manual Notes</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredSubmissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-700/50">
                  {/* Image */}
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <img
                        src={submission.imageUrl}
                        alt="User submission"
                        className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80"
                        onClick={() => setSelectedImage(submission.imageUrl)}
                      />
                      <button
                        onClick={() => setSelectedImage(submission.imageUrl)}
                        className="p-1 text-gray-400 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                  {/* User Description */}
                  <td className="px-4 py-4">
                    <div className="max-w-xs">
                      <p className="text-white text-sm">{submission.userDescription}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(submission.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </td>

                  {/* AI Analysis */}
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{submission.aiAnalysis.rootCause}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          submission.aiAnalysis.confidence > 0.8 ? 'bg-green-900 text-green-300' :
                          submission.aiAnalysis.confidence > 0.6 ? 'bg-yellow-900 text-yellow-300' :
                          'bg-red-900 text-red-300'
                        }`}>
                          {Math.round(submission.aiAnalysis.confidence * 100)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Weeds: {submission.aiAnalysis.weedPercentage}% • Health: {submission.aiAnalysis.healthScore}/10
                      </div>
                    </div>
                  </td>

                  {/* Manual Root Cause */}
                  <td className="px-4 py-4">
                    {editingId === submission.id ? (
                      <select
                        value={editingData?.manualRootCause || ''}
                        onChange={(e) => setEditingData(prev => prev ? { ...prev, manualRootCause: e.target.value } : null)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm"
                      >
                        <option value="">Select root cause...</option>
                        {rootCauseOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`text-sm ${submission.manualRootCause ? 'text-white' : 'text-gray-500'}`}>
                        {submission.manualRootCause || 'Not classified'}
                      </span>
                    )}
                  </td>

                  {/* Manual Notes */}
                  <td className="px-4 py-4">
                    {editingId === submission.id ? (
                      <textarea
                        value={editingData?.manualNotes || ''}
                        onChange={(e) => setEditingData(prev => prev ? { ...prev, manualNotes: e.target.value } : null)}
                        placeholder="Add notes about this case..."
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm resize-none"
                        rows={2}
                      />
                    ) : (
                      <p className="text-gray-300 text-sm max-w-xs">
                        {submission.manualNotes || 'No notes'}
                      </p>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        submission.isReviewed ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                      }`}>
                        {submission.isReviewed ? 'Reviewed' : 'Pending'}
                      </div>
                      <label className="flex items-center space-x-2 text-xs">
                        <input
                          type="checkbox"
                          checked={submission.isTrainingData}
                          onChange={() => toggleTrainingData(submission.id)}
                          className="w-3 h-3 text-blue-600 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-300">Training</span>
                      </label>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    {editingId === submission.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={saveEditing}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(submission)}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-2">No submissions found</div>
            <div className="text-gray-500 text-sm">
              {filter === 'all' ? 'No user submissions yet' : `No ${filter} submissions`}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Full size submission"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-800 border border-gray-600 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">📋 Manual Classification Instructions</h3>
        <div className="space-y-3">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2">🔍 Review Process</h4>
            <ul className="space-y-1 text-gray-200 text-sm ml-4">
              <li>• Review each user submission and compare AI analysis with the actual image</li>
              <li>• Click images to view full-size for better analysis</li>
              <li>• Look for patterns in AI accuracy to improve the system</li>
            </ul>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2">✏️ Classification</h4>
            <ul className="space-y-1 text-gray-200 text-sm ml-4">
              <li>• Select the correct root cause from the dropdown if AI was incorrect</li>
              <li>• Add notes about why the AI was right/wrong for training purposes</li>
              <li>• Use detailed notes to help improve future AI accuracy</li>
            </ul>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-purple-400 font-semibold mb-2">🎯 Training Data</h4>
            <ul className="space-y-1 text-gray-200 text-sm ml-4">
              <li>• Check "Training" for high-quality examples to include in model improvement</li>
              <li>• Export training data regularly to improve AI accuracy over time</li>
              <li>• Focus on clear, well-documented cases for best training results</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserSubmissions;