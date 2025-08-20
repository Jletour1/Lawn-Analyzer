import React, { useState, useEffect } from 'react';
import { getLocalData, saveLocalData, LocalUserSubmission, exportDataAsJSON, updateUserSubmission } from '../utils/localStorage';
import {
  Users,
  Brain,
  Database,
  TrendingUp,
  Eye,
  Trash2,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  Target,
  Clock,
  Plus,
  Filter
  onTabChange: (tab: string) => void;
} from 'lucide-react';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onTabChange }) => {
  const [submissions, setSubmissions] = useState<LocalUserSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<LocalUserSubmission | null>(null);
  const [editingSubmission, setEditingSubmission] = useState<LocalUserSubmission | null>(null);
  const [editForm, setEditForm] = useState({
    category: '',
    subcategory: '',
    rootCause: '',
    confidence: 0.5,
    healthScore: 5,
    urgency: 'medium' as 'low' | 'medium' | 'high',
    solutions: ['']
  });
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'pending' | 'reviewed' | 'flagged'>('all');

  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingReview: 0,
    flaggedCases: 0,
    avgConfidence: 0,
    todaySubmissions: 0,
    weeklyGrowth: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const localData = getLocalData();
    const userSubmissions = localData.submissions || [];
    setSubmissions(userSubmissions);

    // Calculate stats
    const today = new Date().toDateString();
    const todayCount = userSubmissions.filter(sub => 
      new Date(sub.created_at).toDateString() === today
    ).length;

    const avgConf = userSubmissions.length > 0
      ? userSubmissions.reduce((sum, sub) => sum + (sub.analysis_result?.confidence || 0.5), 0) / userSubmissions.length
      : 0;

    setStats({
      totalSubmissions: userSubmissions.length,
      pendingReview: userSubmissions.filter(sub => !sub.admin_reviewed).length,
      flaggedCases: userSubmissions.filter(sub => sub.flagged_for_review).length,
      avgConfidence: avgConf,
      todaySubmissions: todayCount,
      weeklyGrowth: 12 // Mock data
    });
  };

  const handleEdit = (submission: LocalUserSubmission) => {
    setEditingSubmission(submission);
    
    // Pre-populate form with existing data
    const analysis = submission.analysis_result;
    setEditForm({
      category: extractCategory(analysis?.rootCause || ''),
      subcategory: extractSubcategory(analysis?.rootCause || ''),
      rootCause: analysis?.rootCause || '',
      confidence: analysis?.confidence || 0.5,
      healthScore: analysis?.healthScore || 5,
      urgency: analysis?.urgency || 'medium',
      solutions: analysis?.solutions || ['']
    });
  };

  const handleSaveEdit = () => {
    if (!editingSubmission) return;

    const localData = getLocalData();
    const submissionIndex = localData.submissions?.findIndex(sub => sub.id === editingSubmission.id);
    
    if (submissionIndex !== undefined && submissionIndex >= 0 && localData.submissions) {
      // Update the submission
      localData.submissions[submissionIndex] = {
        ...editingSubmission,
        analysis_result: {
          ...editingSubmission.analysis_result,
          rootCause: editForm.rootCause,
          confidence: editForm.confidence,
          healthScore: editForm.healthScore,
          urgency: editForm.urgency,
          solutions: editForm.solutions.filter(s => s.trim())
        },
        admin_reviewed: true,
        admin_notes: `Category: ${editForm.category}${editForm.subcategory ? ` / ${editForm.subcategory}` : ''}`,
        reviewed_at: new Date().toISOString()
      };

      saveLocalData(localData);
      loadData();
      setEditingSubmission(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingSubmission(null);
    setEditForm({
      category: '',
      subcategory: '',
      rootCause: '',
      confidence: 0.5,
      healthScore: 5,
      urgency: 'medium',
      solutions: ['']
    });
  };

  const handleDelete = (submissionId: string) => {
    if (confirm('Are you sure you want to delete this submission?')) {
      const localData = getLocalData();
      if (localData.submissions) {
        localData.submissions = localData.submissions.filter(sub => sub.id !== submissionId);
        saveLocalData(localData);
        loadData();
      }
    }
  };

  const addSolution = () => {
    setEditForm(prev => ({
      ...prev,
      solutions: [...prev.solutions, '']
    }));
  };

  const updateSolution = (index: number, value: string) => {
    setEditForm(prev => ({
      ...prev,
      solutions: prev.solutions.map((sol, i) => i === index ? value : sol)
    }));
  };

  const removeSolution = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      solutions: prev.solutions.filter((_, i) => i !== index)
    }));
  };

  const extractCategory = (rootCause: string): string => {
    const lowerCause = rootCause.toLowerCase();
    if (lowerCause.includes('fungal') || lowerCause.includes('disease')) return 'disease';
    if (lowerCause.includes('grub') || lowerCause.includes('pest')) return 'pest';
    if (lowerCause.includes('weed')) return 'weed';
    if (lowerCause.includes('mower') || lowerCause.includes('fertilizer')) return 'maintenance';
    return 'environmental';
  };

  const extractSubcategory = (rootCause: string): string => {
    const lowerCause = rootCause.toLowerCase();
    if (lowerCause.includes('brown patch')) return 'Brown Patch';
    if (lowerCause.includes('grub')) return 'Grubs';
    if (lowerCause.includes('dog urine')) return 'Pet Damage';
    if (lowerCause.includes('drought')) return 'Drought Stress';
    return '';
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'disease': return 'bg-red-100 text-red-800';
      case 'pest': return 'bg-orange-100 text-orange-800';
      case 'weed': return 'bg-yellow-100 text-yellow-800';
      case 'environmental': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingReview}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Flagged Cases</p>
              <p className="text-2xl font-bold text-gray-900">{stats.flaggedCases}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(stats.avgConfidence * 100)}%</p>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todaySubmissions}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Weekly Growth</p>
              <p className="text-2xl font-bold text-gray-900">+{stats.weeklyGrowth}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Recent User Submissions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent User Submissions</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={submissionFilter}
                onChange={(e) => setSubmissionFilter(e.target.value as 'all' | 'pending' | 'reviewed' | 'flagged')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Submissions</option>
                <option value="pending">Pending Review</option>
                <option value="reviewed">Reviewed</option>
                <option value="flagged">Flagged for Review</option>
              </select>
            </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadData}
              className="flex items-center space-x-2 px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportDataAsJSON}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h4>
            <p className="text-gray-600">User submissions will appear here once people start using the diagnostic tool.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions
              .filter((submission) => {
                if (submissionFilter === 'pending') return !submission.admin_reviewed;
                if (submissionFilter === 'reviewed') return submission.admin_reviewed;
                if (submissionFilter === 'flagged') return submission.flagged_for_review;
                return true; // 'all'
              })
              .slice(0, 10)
              .map((submission) => (
              <div key={submission.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <img
                  src={submission.image_data}
                  alt="Lawn submission"
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="font-medium text-gray-900">{submission.user_email}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      submission.admin_reviewed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {submission.admin_reviewed ? 'Reviewed' : 'Pending'}
                    </span>
                    {submission.flagged_for_review && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                        Flagged
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{submission.problem_description}</p>
                  
                  {/* Category badges */}
                  {submission.admin_notes && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {submission.admin_notes.includes('Category:') && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                          submission.admin_notes.split('Category: ')[1]?.split(' /')[0] || 'General'
                        )}`}>
                          {submission.admin_notes.split('Category: ')[1]?.split(' /')[0] || 'General'}
                        </span>
                      )}
                      {submission.admin_notes.includes(' / ') && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {submission.admin_notes.split(' / ')[1] || ''}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                    </span>
                    {submission.analysis_result && (
                      <span className="flex items-center space-x-1">
                        <BarChart3 className="w-4 h-4" />
                        <span>{Math.round((submission.analysis_result.confidence || 0.5) * 100)}% confidence</span>
                      </span>
                    )}
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
                    onClick={() => handleEdit(submission)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(submission.id)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reddit Data Collection Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Reddit Data Collection</h3>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onTabChange('collection')}
              className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Database className="w-4 h-4" />
              <span>View Collection</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Posts Collected</p>
                <p className="text-2xl font-bold text-orange-900">1,247</p>
              </div>
              <Database className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">With Images</p>
                <p className="text-2xl font-bold text-blue-900">892</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Analyzed</p>
                <p className="text-2xl font-bold text-green-900">743</p>
              </div>
              <Brain className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Last Run</p>
                <p className="text-sm font-bold text-purple-900">2 hours ago</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-orange-50 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>Status:</strong> Automatic collection running every 6 hours. Next collection in 4 hours.
          </p>
        </div>
      </div>

      {/* Email Collection Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Email Collection & Outreach</h3>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => alert('Email management feature coming soon! This will show:\n\n• Email subscriber list\n• Segmentation by engagement\n• Follow-up campaign management\n• Expert review notifications\n• Automated email sequences')}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Manage Emails</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Total Emails</p>
                <p className="text-2xl font-bold text-indigo-900">156</p>
              </div>
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Users</p>
                <p className="text-2xl font-bold text-green-900">89</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Follow-ups Sent</p>
                <p className="text-2xl font-bold text-yellow-900">34</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Expert Reviews</p>
                <p className="text-2xl font-bold text-red-900">12</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
          <p className="text-sm text-indigo-800">
            <strong>Recent Activity:</strong> 23 new email subscribers this week. 5 follow-up emails scheduled for flagged cases.
          </p>
        </div>
      </div>

      {/* View Submission Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Submission Details</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleEdit(selectedSubmission)}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Analysis</span>
                  </button>
                  {!selectedSubmission.admin_reviewed && (
                    <button
                      onClick={() => {
                        updateUserSubmission(selectedSubmission.id, {
                          admin_reviewed: true,
                          reviewed_at: new Date().toISOString(),
                          admin_notes: 'Marked as reviewed by admin'
                        });
                        loadData();
                        setSelectedSubmission(null);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark as Reviewed</span>
                    </button>
                  )}
                  {!selectedSubmission.flagged_for_review && (
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for flagging (optional):') || 'Flagged for expert review';
                        updateUserSubmission(selectedSubmission.id, {
                          flagged_for_review: true,
                          review_reason: reason
                        });
                        loadData();
                        setSelectedSubmission(null);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Flag for Review</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Info */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">User Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{selectedSubmission.user_email}</p>
                    </div>
                    {selectedSubmission.user_name && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="text-gray-900">{selectedSubmission.user_name}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600">Problem Description</label>
                      <p className="text-gray-900">{selectedSubmission.problem_description}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Submitted</label>
                      <p className="text-gray-900">{new Date(selectedSubmission.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Lawn Image</label>
                    <img
                      src={selectedSubmission.image_data}
                      alt="Lawn submission"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                </div>

                {/* Analysis Results */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">AI Analysis</h4>
                  {selectedSubmission.analysis_result ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Root Cause</label>
                        <p className="text-gray-900">{selectedSubmission.analysis_result.rootCause}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Confidence</label>
                        <p className="text-gray-900">{Math.round((selectedSubmission.analysis_result.confidence || 0.5) * 100)}%</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Solutions</label>
                        <ul className="list-disc list-inside text-gray-900 space-y-1">
                          {(selectedSubmission.analysis_result.solutions || []).map((solution, idx) => (
                            <li key={idx}>{solution}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No analysis available</p>
                  )}

                  {selectedSubmission.admin_notes && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <label className="text-sm font-medium text-blue-900 block mb-2">Admin Notes</label>
                      <p className="text-blue-800">{selectedSubmission.admin_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Submission Modal */}
      {editingSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Edit Submission</h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - User Info & Image */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">User Information</h4>
                  <div className="space-y-3 mb-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{editingSubmission.user_email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Problem Description</label>
                      <p className="text-gray-900">{editingSubmission.problem_description}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Lawn Image</label>
                    <img
                      src={editingSubmission.image_data}
                      alt="Lawn submission"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                </div>

                {/* Right Column - Edit Form */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Edit Analysis</h4>
                  <div className="space-y-4">
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Select Category</option>
                        <option value="disease">Disease</option>
                        <option value="pest">Pest</option>
                        <option value="weed">Weed</option>
                        <option value="environmental">Environmental</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>

                    {/* Subcategory */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                      <input
                        type="text"
                        value={editForm.subcategory}
                        onChange={(e) => setEditForm(prev => ({ ...prev, subcategory: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., Brown Patch, Grubs, Pet Damage"
                      />
                    </div>

                    {/* Root Cause */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Root Cause</label>
                      <textarea
                        value={editForm.rootCause}
                        onChange={(e) => setEditForm(prev => ({ ...prev, rootCause: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                        placeholder="Describe the root cause..."
                      />
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confidence</label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={editForm.confidence}
                          onChange={(e) => setEditForm(prev => ({ ...prev, confidence: parseFloat(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Health Score</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={editForm.healthScore}
                          onChange={(e) => setEditForm(prev => ({ ...prev, healthScore: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                        <select
                          value={editForm.urgency}
                          onChange={(e) => setEditForm(prev => ({ ...prev, urgency: e.target.value as 'low' | 'medium' | 'high' }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    {/* Solutions */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Solutions</label>
                        <button
                          onClick={addSolution}
                          className="text-purple-600 hover:text-purple-700 text-sm"
                        >
                          + Add Solution
                        </button>
                      </div>
                      {editForm.solutions.map((solution, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={solution}
                            onChange={(e) => updateSolution(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter solution..."
                          />
                          {editForm.solutions.length > 1 && (
                            <button
                              onClick={() => removeSolution(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
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