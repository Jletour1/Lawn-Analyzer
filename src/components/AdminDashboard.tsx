import React, { useState, useEffect } from 'react';
import { getLocalData, saveLocalData, exportDataAsJSON } from '../utils/localStorage';
import {
  Users,
  Mail,
  Image,
  Brain,
  TrendingUp,
  Download,
  RefreshCw,
  Eye,
  Flag,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  Calendar,
  MapPin,
  Leaf
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingReview: 0,
    flaggedCases: 0,
    totalAnalyses: 0,
    redditPosts: 0,
    avgConfidence: 0,
    recentSubmissions: [] as any[],
    flaggedSubmissions: [] as any[]
  });

  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const localData = getLocalData();
    const submissions = localData.submissions || [];
    const redditAnalyses = localData.reddit_analyses || [];
    const analyzedPosts = localData.analyzed_posts || [];

    const flaggedSubmissions = submissions.filter((sub: any) => sub.flagged_for_review);
    const pendingReview = submissions.filter((sub: any) => !sub.admin_reviewed);
    
    const avgConfidence = submissions.length > 0
      ? submissions.reduce((sum: number, sub: any) => sum + (sub.analysis_result?.confidence || 0), 0) / submissions.length
      : 0;

    const recentSubmissions = submissions
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    setStats({
      totalSubmissions: submissions.length,
      pendingReview: pendingReview.length,
      flaggedCases: flaggedSubmissions.length,
      totalAnalyses: analyzedPosts.length,
      redditPosts: redditAnalyses.length,
      avgConfidence,
      recentSubmissions,
      flaggedSubmissions
    });
  };

  const handleDeleteSubmission = (submissionId: string) => {
    const localData = getLocalData();
    localData.submissions = localData.submissions?.filter((sub: any) => sub.id !== submissionId) || [];
    saveLocalData(localData);
    loadDashboardData();
    setShowDeleteConfirm(null);
    setSelectedSubmission(null);
  };

  const handleBulkDelete = () => {
    if (selectedForDeletion.size === 0) return;
    
    const localData = getLocalData();
    localData.submissions = localData.submissions?.filter((sub: any) => !selectedForDeletion.has(sub.id)) || [];
    saveLocalData(localData);
    
    setSelectedForDeletion(new Set());
    setBulkDeleteMode(false);
    loadDashboardData();
  };

  const toggleSubmissionSelection = (submissionId: string) => {
    const newSelection = new Set(selectedForDeletion);
    if (newSelection.has(submissionId)) {
      newSelection.delete(submissionId);
    } else {
      newSelection.add(submissionId);
    }
    setSelectedForDeletion(newSelection);
  };

  const handleFlagSubmission = (submissionId: string, reason: string) => {
    const localData = getLocalData();
    const submissionIndex = localData.submissions?.findIndex((sub: any) => sub.id === submissionId);
    
    if (submissionIndex !== undefined && submissionIndex >= 0 && localData.submissions) {
      localData.submissions[submissionIndex] = {
        ...localData.submissions[submissionIndex],
        flagged_for_review: true,
        review_reason: reason,
        admin_reviewed: true,
        reviewed_at: new Date().toISOString()
      };
      saveLocalData(localData);
      loadDashboardData();
    }
  };

  const handleMarkReviewed = (submissionId: string, notes: string) => {
    const localData = getLocalData();
    const submissionIndex = localData.submissions?.findIndex((sub: any) => sub.id === submissionId);
    
    if (submissionIndex !== undefined && submissionIndex >= 0 && localData.submissions) {
      localData.submissions[submissionIndex] = {
        ...localData.submissions[submissionIndex],
        admin_reviewed: true,
        admin_notes: notes,
        reviewed_at: new Date().toISOString()
      };
      saveLocalData(localData);
      loadDashboardData();
      setSelectedSubmission(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
            <p className="text-gray-400 mt-1">Monitor system performance and manage user submissions</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setBulkDeleteMode(!bulkDeleteMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                bulkDeleteMode 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>{bulkDeleteMode ? 'Cancel Bulk Delete' : 'Bulk Delete'}</span>
            </button>
            <button
              onClick={loadDashboardData}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportDataAsJSON}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Delete Actions */}
      {bulkDeleteMode && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-300">
                Bulk Delete Mode: {selectedForDeletion.size} submissions selected
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  const allIds = new Set(stats.recentSubmissions.map(sub => sub.id));
                  setSelectedForDeletion(allIds);
                }}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedForDeletion(new Set())}
                className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selectedForDeletion.size === 0}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Selected ({selectedForDeletion.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Submissions</p>
              <p className="text-2xl font-bold text-white">{stats.totalSubmissions}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-white">{stats.pendingReview}</p>
            </div>
            <Mail className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Flagged Cases</p>
              <p className="text-2xl font-bold text-white">{stats.flaggedCases}</p>
            </div>
            <Flag className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">AI Analyses</p>
              <p className="text-2xl font-bold text-white">{stats.totalAnalyses}</p>
            </div>
            <Brain className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Reddit Posts</p>
              <p className="text-2xl font-bold text-white">{stats.redditPosts}</p>
            </div>
            <Image className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Avg Confidence</p>
              <p className="text-2xl font-bold text-white">{Math.round(stats.avgConfidence * 100)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Recent User Submissions</h3>
        
        {stats.recentSubmissions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-500" />
            </div>
            <h4 className="text-lg font-medium text-gray-300 mb-2">No Submissions Yet</h4>
            <p className="text-gray-500">User submissions will appear here once people start using the lawn analyzer.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.recentSubmissions.map((submission) => (
              <div key={submission.id} className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {bulkDeleteMode && (
                      <input
                        type="checkbox"
                        checked={selectedForDeletion.has(submission.id)}
                        onChange={() => toggleSubmissionSelection(submission.id)}
                        className="mt-1 w-4 h-4 text-red-600 border-gray-600 rounded focus:ring-red-500 bg-gray-700"
                      />
                    )}
                    <img
                      src={submission.image_data}
                      alt="Lawn submission"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-white">{submission.user_email}</h4>
                        {submission.flagged_for_review && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Flagged
                          </span>
                        )}
                        {submission.admin_reviewed ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Reviewed
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{submission.problem_description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                        </div>
                        {submission.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{submission.location}</span>
                          </div>
                        )}
                        {submission.grass_type && (
                          <div className="flex items-center space-x-1">
                            <Leaf className="w-3 h-3" />
                            <span>{submission.grass_type}</span>
                          </div>
                        )}
                        {submission.analysis_result && (
                          <span className="text-blue-400">
                            {Math.round(submission.analysis_result.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(submission.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flagged Submissions */}
      {stats.flaggedSubmissions.length > 0 && (
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Flagged Submissions</h3>
          <div className="space-y-4">
            {stats.flaggedSubmissions.map((submission) => (
              <div key={submission.id} className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <img
                      src={submission.image_data}
                      alt="Flagged submission"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <h4 className="font-medium text-white mb-1">{submission.user_email}</h4>
                      <p className="text-red-300 text-sm mb-2">
                        <strong>Reason:</strong> {submission.review_reason}
                      </p>
                      <p className="text-gray-300 text-sm">{submission.problem_description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Review</span>
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(submission.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Submission</h3>
                  <p className="text-gray-400 text-sm">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this user submission? This will permanently remove 
                the submission, image, and analysis data from the system.
              </p>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteSubmission(showDeleteConfirm)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Submission Details</h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedSubmission.image_data}
                    alt="Lawn submission"
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                      <p className="text-white">{selectedSubmission.user_email}</p>
                    </div>
                    
                    {selectedSubmission.user_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                        <p className="text-white">{selectedSubmission.user_name}</p>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Problem Description</label>
                      <p className="text-white">{selectedSubmission.problem_description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {selectedSubmission.grass_type && (
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Grass Type</label>
                          <p className="text-white">{selectedSubmission.grass_type}</p>
                        </div>
                      )}
                      
                      {selectedSubmission.location && (
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                          <p className="text-white">{selectedSubmission.location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  {selectedSubmission.analysis_result && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-white mb-3">AI Analysis Results</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Root Cause</label>
                          <p className="text-white text-sm">{selectedSubmission.analysis_result.rootCause}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Confidence</label>
                          <p className="text-white">{Math.round(selectedSubmission.analysis_result.confidence * 100)}%</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Solutions</label>
                          <ul className="text-white text-sm space-y-1">
                            {selectedSubmission.analysis_result.solutions?.map((solution: string, index: number) => (
                              <li key={index} className="flex items-start space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span>{solution}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {!selectedSubmission.admin_reviewed && (
                      <div>
                        <button
                          onClick={() => handleMarkReviewed(selectedSubmission.id, 'Reviewed by admin')}
                          className="flex items-center space-x-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark as Reviewed</span>
                        </button>
                      </div>
                    )}
                    
                    <div>
                      <button
                        onClick={() => handleFlagSubmission(selectedSubmission.id, 'Flagged for expert review')}
                        className="flex items-center space-x-2 w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        <Flag className="w-4 h-4" />
                        <span>Flag for Review</span>
                      </button>
                    </div>

                    <div>
                      <button
                        onClick={() => setShowDeleteConfirm(selectedSubmission.id)}
                        className="flex items-center space-x-2 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Submission</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;