import React from 'react';
import { TrendingUp, Users, MessageSquare, Target, Calendar, Award, AlertTriangle } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const stats = {
    totalPosts: 1247,
    analyzedPosts: 892,
    avgConfidence: 87,
    userDiagnoses: 156,
    topCategories: [
      { name: 'Fungal Diseases', count: 234, percentage: 26 },
      { name: 'Pest Damage', count: 189, percentage: 21 },
      { name: 'Nutrient Deficiency', count: 156, percentage: 17 },
      { name: 'Watering Issues', count: 143, percentage: 16 },
      { name: 'Weed Problems', count: 98, percentage: 11 },
    ],
    recentActivity: [
      { id: 1, type: 'diagnosis', user: 'user_123', issue: 'Brown Patch Fungus', time: '2 hours ago' },
      { id: 2, type: 'analysis', posts: 45, model: 'gpt-4o-mini', time: '4 hours ago' },
      { id: 3, type: 'collection', posts: 67, subreddit: 'lawncare', time: '6 hours ago' },
      { id: 4, type: 'diagnosis', user: 'user_456', issue: 'Dog Urine Damage', time: '8 hours ago' },
    ]
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Admin Welcome */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
        <p className="text-red-100 text-lg">
          Monitor and manage the lawn care AI analysis pipeline
        </p>
        <div className="mt-6 flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-300 rounded-full animate-pulse"></div>
            <span className="text-red-100">System Operational</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span className="text-red-100">Last updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Reddit Posts Analyzed"
          value={stats.analyzedPosts.toLocaleString()}
          subtitle={`${Math.round((stats.analyzedPosts / stats.totalPosts) * 100)}% of collected`}
          icon={MessageSquare}
          color="bg-blue-600"
        />
        <StatCard
          title="User Diagnoses"
          value={stats.userDiagnoses.toLocaleString()}
          subtitle="This month"
          icon={Target}
          color="bg-green-600"
        />
        <StatCard
          title="AI Confidence"
          value={`${stats.avgConfidence}%`}
          subtitle="Average accuracy"
          icon={Award}
          color="bg-purple-600"
        />
        <StatCard
          title="Data Sources"
          value="3"
          subtitle="Active subreddits"
          icon={Users}
          color="bg-orange-600"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Health */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">System Health</h3>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <span className="text-gray-300">Reddit API</span>
              <span className="text-green-400 text-sm font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <span className="text-gray-300">OpenAI API</span>
              <span className="text-green-400 text-sm font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <span className="text-gray-300">Database</span>
              <span className="text-green-400 text-sm font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <span className="text-gray-300">Image Analysis</span>
              <span className="text-yellow-400 text-sm font-medium">Limited</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <div className="text-sm text-gray-400">Live feed</div>
          </div>
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'diagnosis' ? 'bg-green-400' :
                  activity.type === 'analysis' ? 'bg-blue-400' : 'bg-purple-400'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    {activity.type === 'diagnosis' && `User diagnosis: ${activity.issue}`}
                    {activity.type === 'analysis' && `AI analysis completed: ${(activity as any).posts} posts`}
                    {activity.type === 'collection' && `Data collection: ${(activity as any).posts} posts from r/${(activity as any).subreddit}`}
                  </p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Issue Categories */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Top Diagnosed Issues</h3>
          <TrendingUp className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {stats.topCategories.map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{category.name}</span>
                  <span className="text-sm text-gray-400">{category.count} cases</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;