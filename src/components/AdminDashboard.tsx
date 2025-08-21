import React, { useState, useEffect } from 'react';
import { getLocalData } from '../utils/localStorage';
import {
  Users,
  FileImage,
  Brain,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Camera,
  Upload,
  Star,
  Award
} from 'lucide-react';

interface AdminDashboardProps {
  onTabChange?: (tab: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onTabChange }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
    redditPosts: 0,
    analyzedPosts: 0,
    categorySuggestions: 0,
    totalImages: 0,
    avgImagesPerUser: 0
  });

  const [topUsers, setTopUsers] = useState<Array<{
    id: string;
    email: string;
    name: string;
    image_upload_count: number;
    submissions_count: number;
    created_at: string;
  }>>([]);

  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    user_email: string;
    problem_description: string;
    created_at: string;
    admin_reviewed: boolean;
  }>>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const localData = getLocalData();
    
    // Calculate stats from local data
    const submissions = localData.submissions || [];
    const redditAnalyses = localData.reddit_analyses || [];
    const analyzedPosts = localData.analyzed_posts || [];
    const categorySuggestions = localData.category_suggestions || [];

    // Calculate user stats
    const userEmailMap = new Map();
    submissions.forEach(sub => {
      const email = sub.user_email;
      if (!userEmailMap.has(email)) {
        userEmailMap.set(email, {
          email,
          name: sub.user_name || email.split('@')[0],
          image_upload_count: 0,
          submissions_count: 0,
          created_at: sub.created_at
        });
      }
      const user = userEmailMap.get(email);
      user.image_upload_count++;
      user.submissions_count++;
    });

    const userStats = Array.from(userEmailMap.values())
      .sort((a, b) => b.image_upload_count - a.image_upload_count)
      .slice(0, 10);

    const totalImages = submissions.length;
    const avgImagesPerUser = userEmailMap.size > 0 ? totalImages / userEmailMap.size : 0;

    setStats({
      totalUsers: userEmailMap.size,
      totalSubmissions: submissions.length,
      pendingReviews: submissions.filter(s => s.flagged_for_review && !s.admin_reviewed).length,
      redditPosts: redditAnalyses.length,
      analyzedPosts: analyzedPosts.length,
      categorySuggestions: categorySuggestions.filter(cs => cs.status === 'pending').length,
      totalImages,
      avgImagesPerUser
    });

    setTopUsers(userStats);
    setRecentActivity(submissions.slice(0, 5).map(sub => ({
      id: sub.id,
      user_email: sub.user_email,
      problem_description: sub.problem_description,
      created_at: sub.created_at,
      admin_reviewed: sub.admin_reviewed
    })));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Overview of your Lawn Analyzer system</p>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-sm text-green-600 mt-1">Active accounts</p>
            </div>
            <Users className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Images</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalImages}</p>
              <p className="text-sm text-blue-600 mt-1">Photos analyzed</p>
            </div>
            <Camera className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg per User</p>
              <p className="text-3xl font-bold text-gray-900">{stats.avgImagesPerUser.toFixed(1)}</p>
              <p className="text-sm text-purple-600 mt-1">Images/user</p>
            </div>
            <Upload className="w-12 h-12 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingReviews}</p>
              <p className="text-sm text-orange-600 mt-1">Need attention</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reddit Posts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.redditPosts}</p>
            </div>
            <FileImage className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">AI Analyzed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.analyzedPosts}</p>
            </div>
            <Brain className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Category Suggestions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.categorySuggestions}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Top Users by Image Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Award className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">Top Users by Images</h3>
            </div>
            <span className="text-sm text-gray-500">{topUsers.length} users</span>
          </div>
          
          <div className="space-y-4">
            {topUsers.length === 0 ? (
              <div className="text-center py-8">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No user submissions yet</p>
                <p className="text-sm text-gray-400">Users will appear here after uploading images</p>
              </div>
            ) : (
              topUsers.map((user, index) => (
                <div key={user.email} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.name || user.email.split('@')[0]}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-blue-600">{user.image_upload_count}</span>
                      <span className="text-sm text-gray-500">images</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {user.submissions_count} submission{user.submissions_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {topUsers.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="font-medium text-gray-900">{stats.totalImages}</p>
                  <p className="text-gray-600">Total Images</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{stats.avgImagesPerUser.toFixed(1)}</p>
                  <p className="text-gray-600">Avg per User</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {topUsers.length > 0 ? Math.max(...topUsers.map(u => u.image_upload_count)) : 0}
                  </p>
                  <p className="text-gray-600">Most Active</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <span className="text-sm text-gray-500">{recentActivity.length} recent</span>
          </div>
          
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No recent activity</p>
                <p className="text-sm text-gray-400">User submissions will appear here</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    activity.admin_reviewed ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {activity.admin_reviewed ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.user_email}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {activity.problem_description.substring(0, 80)}...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      activity.admin_reviewed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {activity.admin_reviewed ? 'Reviewed' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => onTabChange?.('collection')}
            className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <FileImage className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-green-900">Collect Data</p>
              <p className="text-sm text-green-700">Gather Reddit posts</p>
            </div>
          </button>

          <button
            onClick={() => onTabChange?.('analysis')}
            className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Brain className="w-6 h-6 text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-purple-900">Run Analysis</p>
              <p className="text-sm text-purple-700">Process with AI</p>
            </div>
          </button>

          <button
            onClick={() => onTabChange?.('root-causes')}
            className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-blue-900">Manage Categories</p>
              <p className="text-sm text-blue-700">Root causes</p>
            </div>
          </button>

          <button
            onClick={() => onTabChange?.('smart-engine')}
            className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <TrendingUp className="w-6 h-6 text-orange-600" />
            <div className="text-left">
              <p className="font-medium text-orange-900">Smart Engine</p>
              <p className="text-sm text-orange-700">Learning insights</p>
            </div>
          </button>
        </div>
      </div>

      {/* User Engagement Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Star className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">User Engagement Insights</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">{stats.totalUsers}</div>
            <div className="text-sm text-blue-800">Registered Users</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">{stats.totalImages}</div>
            <div className="text-sm text-green-800">Images Uploaded</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">{stats.avgImagesPerUser.toFixed(1)}</div>
            <div className="text-sm text-purple-800">Avg Images/User</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {topUsers.length > 0 ? Math.max(...topUsers.map(u => u.image_upload_count)) : 0}
            </div>
            <div className="text-sm text-orange-800">Most Active User</div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Database</span>
              </div>
              <span className="text-sm text-green-700">Connected</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">AI Analysis</span>
              </div>
              <span className="text-sm text-green-700">Ready</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileImage className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Image Storage</span>
              </div>
              <span className="text-sm text-blue-700">S3 Ready</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">Smart Engine</span>
              </div>
              <span className="text-sm text-purple-700">Learning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default AdminDashboard;