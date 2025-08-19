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
  Leaf,
  Database,
  MessageSquare,
  Edit,
  Save,
  X
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'reddit' | 'emails'>('submissions');
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingReview: 0,
    flaggedCases: 0,
    totalAnalyses: 0,
    redditPosts: 0,
    avgConfidence: 0,
    recentSubmissions: [] as any[],
    flaggedSubmissions: [] as any[],
    redditData: [] as any[],
    userEmails: [] as any[]
  });

  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());
  const [editingSubmission, setEditingSubmission] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});

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

    // Prepare Reddit data for display
    const redditData = redditAnalyses
      .sort((a: any, b: any) => (b.created_utc || 0) - (a.created_utc || 0))
      .slice(0, 10);

    // Extract unique user emails
    const userEmails = Array.from(new Set(submissions.map((sub: any) => sub.user_email)))
      .map(email => {
        const userSubmissions = submissions.filter((sub: any) => sub.user_email === email);
        const latestSubmission = userSubmissions.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        return {
          email,
          submissionCount: userSubmissions.length,
          latestSubmission: latestSubmission.created_at,
          flagged: userSubmissions.some((sub: any) => sub.flagged_for_review),
          reviewed: userSubmissions.every((sub: any) => sub.admin_reviewed)
        };
      })
      .slice(0, 10);
    setStats({
      totalSubmissions: submissions.length,
      pendingReview: pendingReview.length,
      flaggedCases: flaggedSubmissions.length,
      totalAnalyses: analyzedPosts.length,
      redditPosts: redditAnalyses.length,
      avgConfidence,
      recentSubmissions,
      flaggedSubmissions,
      redditData,
      userEmails
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

  const handleEditSubmission = (submission: any) => {
    setEditingSubmission(submission);
    setEditFormData({
      user_email: submission.user_email || '',
      user_name: submission.user_name || '',
      problem_description: submission.problem_description || '',
      grass_type: submission.grass_type || '',
      location: submission.location || '',
      season: submission.season || 'spring',
      analysis_result: {
        rootCause: submission.analysis_result?.rootCause || '',
        confidence: submission.analysis_result?.confidence || 0.5,
        solutions: submission.analysis_result?.solutions || [],
        healthScore: submission.analysis_result?.healthScore || 5,
        urgency: submission.analysis_result?.urgency || 'medium',
        difficulty: submission.analysis_result?.difficulty || 'intermediate',
        costEstimate: submission.analysis_result?.costEstimate || '',
        timeline: submission.analysis_result?.timeline || '',
        category: getAICategory(submission.analysis_result).category,
        subcategory: getAICategory(submission.analysis_result).subcategory || ''
      }
    });
  };

  const handleSaveEdit = () => {
    if (!editingSubmission) return;

    const localData = getLocalData();
    const submissionIndex = localData.submissions?.findIndex((sub: any) => sub.id === editingSubmission.id);
    
    if (submissionIndex !== undefined && submissionIndex >= 0 && localData.submissions) {
      // Update the submission with edited data
      localData.submissions[submissionIndex] = {
        ...localData.submissions[submissionIndex],
        user_email: editFormData.user_email,
        user_name: editFormData.user_name,
        problem_description: editFormData.problem_description,
        grass_type: editFormData.grass_type,
        location: editFormData.location,
        season: editFormData.season,
        analysis_result: {
          ...localData.submissions[submissionIndex].analysis_result,
          rootCause: editFormData.analysis_result.rootCause,
          confidence: parseFloat(editFormData.analysis_result.confidence),
          solutions: editFormData.analysis_result.solutions,
          healthScore: parseInt(editFormData.analysis_result.healthScore),
          urgency: editFormData.analysis_result.urgency,
          difficulty: editFormData.analysis_result.difficulty,
          costEstimate: editFormData.analysis_result.costEstimate,
          timeline: editFormData.analysis_result.timeline
        },
        admin_reviewed: true,
        reviewed_at: new Date().toISOString()
      };
      
      saveLocalData(localData);
      loadDashboardData();
      setEditingSubmission(null);
      setEditFormData({});
      
      console.log('Updated submission:', editingSubmission.id);
    }
  };

  const addSolution = () => {
    setEditFormData(prev => ({
      ...prev,
      analysis_result: {
        ...prev.analysis_result,
        solutions: [...prev.analysis_result.solutions, '']
      }
    }));
  };

  const updateSolution = (index: number, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      analysis_result: {
        ...prev.analysis_result,
        solutions: prev.analysis_result.solutions.map((sol: string, i: number) => 
          i === index ? value : sol
        )
      }
    }));
  };

  const removeSolution = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      analysis_result: {
        ...prev.analysis_result,
        solutions: prev.analysis_result.solutions.filter((_: string, i: number) => i !== index)
      }
    }));
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

  const getAICategory = (analysisResult: any) => {
    if (!analysisResult) return { category: 'Unknown', subcategory: null };
    
    // Extract category from root cause or solutions
    const rootCause = analysisResult.rootCause || '';
    const lowerCause = rootCause.toLowerCase();
    
    let category = 'General';
    let subcategory = null;
    
    if (lowerCause.includes('fungal') || lowerCause.includes('disease') || lowerCause.includes('patch')) {
      category = 'Disease';
      if (lowerCause.includes('brown patch')) subcategory = 'Brown Patch';
      else if (lowerCause.includes('dollar spot')) subcategory = 'Dollar Spot';
      else if (lowerCause.includes('fungal')) subcategory = 'Fungal Disease';
    } else if (lowerCause.includes('grub') || lowerCause.includes('pest') || lowerCause.includes('insect')) {
      category = 'Pest';
      if (lowerCause.includes('grub')) subcategory = 'Grubs';
      else if (lowerCause.includes('chinch')) subcategory = 'Chinch Bugs';
    } else if (lowerCause.includes('weed') || lowerCause.includes('dandelion') || lowerCause.includes('clover')) {
      category = 'Weed';
      if (lowerCause.includes('broadleaf')) subcategory = 'Broadleaf Weeds';
      else if (lowerCause.includes('crabgrass')) subcategory = 'Crabgrass';
    } else if (lowerCause.includes('drought') || lowerCause.includes('water') || lowerCause.includes('stress')) {
      category = 'Environmental';
      if (lowerCause.includes('drought')) subcategory = 'Drought Stress';
      else if (lowerCause.includes('overwater')) subcategory = 'Overwatering';
    } else if (lowerCause.includes('dog') || lowerCause.includes('urine') || lowerCause.includes('pet')) {
      category = 'Pet Damage';
      subcategory = 'Dog Urine Spots';
    } else if (lowerCause.includes('mower') || lowerCause.includes('fertilizer') || lowerCause.includes('maintenance')) {
      category = 'Maintenance';
      if (lowerCause.includes('mower')) subcategory = 'Mowing Issues';
      else if (lowerCause.includes('fertilizer')) subcategory = 'Fertilizer Burn';
    }
    
    return { category, subcategory };
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

      {/* Data View Tabs */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="flex items-center space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'submissions'
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Submissions ({stats.totalSubmissions})</span>
          </button>
          <button
            onClick={() => setActiveTab('reddit')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'reddit'
                ? 'bg-orange-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Reddit Data ({stats.redditPosts})</span>
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'emails'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>User Emails ({stats.userEmails.length})</span>
          </button>
        </div>
      </div>

      {/* Recent Submissions */}
      {activeTab === 'submissions' && (
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
              {stats.recentSubmissions.map((submission) => {
                const aiCategory = getAICategory(submission.analysis_result);
                return (
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
                          
                          {/* AI Category Display */}
                          {submission.analysis_result && (
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                {aiCategory.category}
                              </span>
                              {aiCategory.subcategory && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {aiCategory.subcategory}
                                </span>
                              )}
                            </div>
                          )}
                          
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
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reddit Data Tab */}
      {activeTab === 'reddit' && (
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Reddit Data Collection</h3>
          
          {stats.redditData.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-gray-500" />
              </div>
              <h4 className="text-lg font-medium text-gray-300 mb-2">No Reddit Data</h4>
              <p className="text-gray-500">Run data collection to gather Reddit posts and discussions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.redditData.map((post) => (
                <div key={post.id} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-white">r/{post.subreddit}</h4>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                          {post.score} upvotes
                        </span>
                        {post.post_hint === 'image' && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Has Image
                          </span>
                        )}
                      </div>
                      <h5 className="text-gray-300 font-medium mb-2">{post.title}</h5>
                      <p className="text-gray-400 text-sm mb-2">
                        {post.selftext ? post.selftext.substring(0, 150) + '...' : 'No description'}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span>By u/{post.author}</span>
                        <span>{post.num_comments} comments</span>
                        <span>{new Date(post.created_utc * 1000).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Emails Tab */}
      {activeTab === 'emails' && (
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-6">User Email Management</h3>
          
          {stats.userEmails.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-500" />
              </div>
              <h4 className="text-lg font-medium text-gray-300 mb-2">No User Emails</h4>
              <p className="text-gray-500">User emails will appear here as submissions are received.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.userEmails.map((user) => (
                <div key={user.email} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-white">{user.email}</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {user.submissionCount} submission{user.submissionCount !== 1 ? 's' : ''}
                        </span>
                        {user.flagged && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Flagged
                          </span>
                        )}
                        {user.reviewed ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Reviewed
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Last submission: {new Date(user.latestSubmission).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          // Filter submissions by this email and show first one
                          const userSubmissions = stats.recentSubmissions.filter(sub => sub.user_email === user.email);
                          if (userSubmissions.length > 0) {
                            setSelectedSubmission(userSubmissions[0]);
                          }
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => setEditingSubmission(submission.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          const userSubmissions = stats.recentSubmissions.filter(sub => sub.user_email === user.email);
                          if (userSubmissions.length > 0) {
                            handleEditSubmission(userSubmissions[0]);
                          }
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Edit Submission Modal */}
      {editingSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Edit User Submission</h3>
                <button
                  onClick={() => {
                    setEditingSubmission(null);
                    setEditFormData({});
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - User Info & Image */}
                <div>
                  <img
                    src={editingSubmission.image_data}
                    alt="Lawn submission"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={editFormData.user_email || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, user_email: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                      <input
                        type="text"
                        value={editFormData.user_name || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, user_name: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Problem Description</label>
                      <textarea
                        value={editFormData.problem_description || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, problem_description: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={4}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Grass Type</label>
                        <select
                          value={editFormData.grass_type || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, grass_type: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Select grass type</option>
                          <option value="bermuda">Bermuda</option>
                          <option value="zoysia">Zoysia</option>
                          <option value="st-augustine">St. Augustine</option>
                          <option value="kentucky-bluegrass">Kentucky Bluegrass</option>
                          <option value="tall-fescue">Tall Fescue</option>
                          <option value="perennial-ryegrass">Perennial Ryegrass</option>
                          <option value="unknown">Unknown</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                        <input
                          type="text"
                          value={editFormData.location || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="City, State"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Analysis Results */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">AI Analysis Results</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Root Cause</label>
                      <textarea
                        value={editFormData.analysis_result?.rootCause || ''}
                        onChange={(e) => setEditFormData(prev => ({
                          ...prev,
                          analysis_result: { ...prev.analysis_result, rootCause: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                        <select
                          value={editFormData.analysis_result?.category || ''}
                          onChange={(e) => setEditFormData(prev => ({
                            ...prev,
                            analysis_result: { ...prev.analysis_result, category: e.target.value }
                          }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Select category</option>
                          <option value="Disease">Disease</option>
                          <option value="Pest">Pest</option>
                          <option value="Weed">Weed</option>
                          <option value="Environmental">Environmental</option>
                          <option value="Pet Damage">Pet Damage</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="General">General</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Subcategory</label>
                        <input
                          type="text"
                          value={editFormData.analysis_result?.subcategory || ''}
                          onChange={(e) => setEditFormData(prev => ({
                            ...prev,
                            analysis_result: { ...prev.analysis_result, subcategory: e.target.value }
                          }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="e.g., Brown Patch, Grubs"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Confidence</label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={editFormData.analysis_result?.confidence || 0.5}
                          onChange={(e) => setEditFormData(prev => ({
                            ...prev,
                            analysis_result: { ...prev.analysis_result, confidence: e.target.value }
                          }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Health Score</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={editFormData.analysis_result?.healthScore || 5}
                          onChange={(e) => setEditFormData(prev => ({
                            ...prev,
                            analysis_result: { ...prev.analysis_result, healthScore: e.target.value }
                          }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Urgency</label>
                        <select
                          value={editFormData.analysis_result?.urgency || 'medium'}
                          onChange={(e) => setEditFormData(prev => ({
                            ...prev,
                            analysis_result: { ...prev.analysis_result, urgency: e.target.value }
                          }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                        <select
                          value={editFormData.analysis_result?.difficulty || 'intermediate'}
                          onChange={(e) => setEditFormData(prev => ({
                            ...prev,
                            analysis_result: { ...prev.analysis_result, difficulty: e.target.value }
                          }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Timeline</label>
                        <input
                          type="text"
                          value={editFormData.analysis_result?.timeline || ''}
                          onChange={(e) => setEditFormData(prev => ({
                            ...prev,
                            analysis_result: { ...prev.analysis_result, timeline: e.target.value }
                          }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="e.g., 2-4 weeks"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Cost Estimate</label>
                      <input
                        type="text"
                        value={editFormData.analysis_result?.costEstimate || ''}
                        onChange={(e) => setEditFormData(prev => ({
                          ...prev,
                          analysis_result: { ...prev.analysis_result, costEstimate: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., $50-100"
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-300">Solutions</label>
                        <button
                          onClick={addSolution}
                          className="text-green-400 hover:text-green-300 text-sm"
                        >
                          + Add Solution
                        </button>
                      </div>
                      {(editFormData.analysis_result?.solutions || []).map((solution: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={solution}
                            onChange={(e) => updateSolution(index, e.target.value)}
                            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Treatment solution..."
                          />
                          {(editFormData.analysis_result?.solutions || []).length > 1 && (
                            <button
                              onClick={() => removeSolution(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-700 mt-6">
                <button
                  onClick={() => {
                    setEditingSubmission(null);
                    setEditFormData({});
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
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
                          onClick={() => handleMarkReviewed(selectedSubmission.id, '')}
                          className="flex items-center space-x-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark as Reviewed</span>
                        </button>
                      </div>
                    )}
                    
                    <div>
                      <button
                        onClick={() => handleFlagSubmission(selectedSubmission.id, 'Manual review required')}
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