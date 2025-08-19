import React from 'react';
import { Leaf, Database, Brain, Users, Settings, BarChart3, LogOut, Plus } from 'lucide-react';

interface AdminHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, onTabChange, onLogout }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'collection', label: 'Data Collection', icon: Leaf },
    { id: 'analysis', label: 'AI Analysis', icon: Brain },
    { id: 'root-causes', label: 'Root Causes', icon: Database },
    { id: 'category-suggestions', label: 'Category Suggestions', icon: Plus },
    { id: 'smart-engine', label: 'Smart Engine', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-gray-900 shadow-sm border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-lg">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Lawn Analyzer Admin</h1>
              <p className="text-xs text-gray-400">AI-Powered Lawn Diagnostics</p>
            <p className="text-xs text-gray-400 whitespace-nowrap">AI-Powered Lawn Diagnostics</p>
          </div>
          
          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
          
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
        <nav className="flex space-x-1 ml-4">
  );
};

export default AdminHeader;