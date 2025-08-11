import React, { useState } from 'react';
import { Leaf, Database, Brain, BarChart3, CheckCircle, Edit3, Users, Zap } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import AdminDataCollection from './AdminDataCollection';
import AdminAnalysis from './AdminAnalysis';
import AdminResults from './AdminResults';
import AdminRootCauseManager from './AdminRootCauseManager';
import AdminUserSubmissions from './AdminUserSubmissions';
import AdminDynamicIndicators from './AdminDynamicIndicators';

type Tab = 'dashboard' | 'collect' | 'analyze' | 'results' | 'rootcauses' | 'submissions' | 'indicators';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: BarChart3 },
    { id: 'collect' as Tab, label: 'Data Collection', icon: Database },
    { id: 'analyze' as Tab, label: 'AI Analysis', icon: Brain },
    { id: 'results' as Tab, label: 'Results', icon: CheckCircle },
    { id: 'rootcauses' as Tab, label: 'Root Causes', icon: Edit3 },
    { id: 'submissions' as Tab, label: 'User Submissions', icon: Users },
    { id: 'indicators' as Tab, label: 'Dynamic Indicators', icon: Zap },
  ];

  return (
    <div className="min-h-screen">
      {/* Admin Header */}
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-600 rounded-lg">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <p className="text-sm text-gray-300">Lawn Care AI Backend</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span>Admin Mode</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'collect' && <AdminDataCollection />}
        {activeTab === 'analyze' && <AdminAnalysis />}
        {activeTab === 'results' && <AdminResults />}
        {activeTab === 'rootcauses' && <AdminRootCauseManager />}
        {activeTab === 'submissions' && <AdminUserSubmissions />}
        {activeTab === 'indicators' && <AdminDynamicIndicators />}
      </main>
    </div>
  );
};

export default AdminPanel;