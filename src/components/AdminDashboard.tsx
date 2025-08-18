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
  MessageSquare
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