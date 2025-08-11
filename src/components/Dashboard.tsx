import React from 'react';
import { TrendingUp, Users, MessageSquare, Target, Calendar, Award } from 'lucide-react';

interface DashboardProps {
  stats: {
    totalPosts: number;
    analyzedPosts: number;
    topIssues: any[];
    recentActivity: any[];
  };
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const mockStats = {
    totalPosts: 1247,
    analyzedPosts: 892,
    avgConfidence: 87,
    topCategories: [
      { name: 'Fungal Diseases', count: 234, percentage: 26 },
      { name: 'Pest Damage', count: 189, percentage: 21 },
      { name: 'Nutrient Deficiency', count: 156, percentage: 17 },
      { name: 'Watering Issues', count: 143, percentage: 16 },
      { name: 'Weed Problems', count: 98, percentage: 11 },
    ],
    recentAnalyses: [
      { id: 1, title: 'Brown patches appearing in my lawn', issue: 'Brown Patch Fungus', confidence: 'high', time: '2 hours ago' },
      { id: 2, title: 'Yellow spots after fertilizing', issue: 'Fertilizer Burn', confidence: 'high', time: '4 hours ago' },
      { id: 3, title: 'Grass dying in circular patterns', issue: 'Fairy Ring', confidence: 'medium', time: '6 hours ago' },
      { id: 4, title: 'Thin areas near dog run', issue: 'Dog Urine Damage', confidence: 'high', time: '8 hours ago' },
    ]
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Welcome to Lawn Care AI</h2>
        <p className="text-green-100 text-lg">
          Analyzing Reddit posts to identify and solve lawn care problems using artificial intelligence
        </p>
        <div className="mt-6 flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
            <span className="text-green-100">Pipeline Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span className="text-green-100">Last updated: Today</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Posts Collected"
          value={mockStats.totalPosts.toLocaleString()}
          subtitle="From Reddit communities"
          icon={MessageSquare}
          color="bg-blue-500"
        />
        <StatCard
          title="Posts Analyzed"
          value={mockStats.analyzedPosts.toLocaleString()}
          subtitle={`${Math.round((mockStats.analyzedPosts / mockStats.totalPosts) * 100)}% completion`}
          icon={Target}
          color="bg-green-500"
        />
        <StatCard
          title="Avg Confidence"
          value={`${mockStats.avgConfidence}%`}
          subtitle="AI analysis accuracy"
          icon={Award}
          color="bg-purple-500"
        />
        <StatCard
          title="Active Communities"
          value="3"
          subtitle="r/lawncare, r/landscaping, r/plantclinic"
          icon={Users}
          color="bg-orange-500"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Issues */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Lawn Issues</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {mockStats.topCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    <span className="text-sm text-gray-500">{category.count} posts</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Analyses</h3>
            <div className="text-sm text-gray-500">Live updates</div>
          </div>
          <div className="space-y-4">
            {mockStats.recentAnalyses.map((analysis) => (
              <div key={analysis.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  analysis.confidence === 'high' ? 'bg-green-400' :
                  analysis.confidence === 'medium' ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{analysis.title}</p>
                  <p className="text-sm text-green-600 font-medium">{analysis.issue}</p>
                  <p className="text-xs text-gray-500">{analysis.time}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  analysis.confidence === 'high' ? 'bg-green-100 text-green-800' :
                  analysis.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {analysis.confidence}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">Collect New Data</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <Target className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">Run Analysis</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">Export Results</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;