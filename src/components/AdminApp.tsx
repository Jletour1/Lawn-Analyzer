import React, { useState } from 'react';
import { useEffect } from 'react';
import AdminHeader from './AdminHeader';
import UnifiedAdminDashboard from './UnifiedAdminDashboard';
import DataCollection from './DataCollection';
import AIAnalysis from './AIAnalysis';
import RootCauseManager from './RootCauseManager';
import SmartAnalysisEngine from './SmartAnalysisEngine';
import CategorySuggestionManager from './CategorySuggestionManager';
import Settings from './Settings';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Admin component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Component Error</h3>
              <p className="text-gray-600 mb-4">Something went wrong loading the admin dashboard.</p>
              <pre className="text-xs text-red-600 bg-red-50 p-3 rounded-lg text-left overflow-auto">
                {this.state.error?.toString()}
              </pre>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AdminApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({ username: 'admin', password: '' });

  useEffect(() => {
    console.log('AdminApp: Checking authentication...');
    // Check if user is authenticated
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    console.log('AdminApp: Auth status from localStorage:', authStatus);
    setIsAuthenticated(authStatus === 'true');
  }, []);

  const handleLogin = () => {
    const username = loginCredentials.username.trim();
    const password = loginCredentials.password.trim();

    console.log('Login attempt:', { username, password: password ? '[PROVIDED]' : '[EMPTY]' });

    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('isAdminAuthenticated', 'true');
      setIsAuthenticated(true);
      console.log('Login successful');
    } else {
      console.log('Login failed - invalid credentials');
      alert(`Invalid credentials.\nYou entered: "${username}" / "${password}"`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  console.log('AdminApp: Rendering, isAuthenticated:', isAuthenticated);
  if (!isAuthenticated) {
    console.log('AdminApp: Showing login form');
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Admin Login</h2>
            <p className="text-gray-600 mt-2">Access the Lawn Analyzer admin dashboard</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={loginCredentials.username}
                onChange={(e) => setLoginCredentials(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={loginCredentials.password}
                onChange={(e) => setLoginCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter password"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
            >
              Login to Dashboard
            </button>

            <div className="text-center">
              <button
                onClick={() => window.location.href = '/'}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                ← Back to Lawn Analyzer
              </button>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              <strong>Admin Access:</strong><br />
              Username: admin | Password: admin123
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    console.log('Rendering content for tab:', activeTab);
    try {
    switch (activeTab) {
      case 'dashboard':
          console.log('AdminApp: Rendering AdminDashboard');
        return <UnifiedAdminDashboard />;
      case 'collection':
          console.log('AdminApp: Rendering DataCollection');
        return <DataCollection />;
      case 'analysis':
          console.log('AdminApp: Rendering AIAnalysis');
        return <AIAnalysis />;
      case 'root-causes':
          console.log('AdminApp: Rendering RootCauseManager');
        return <RootCauseManager />;
      case 'category-suggestions':
          console.log('AdminApp: Rendering CategorySuggestionManager');
        return <CategorySuggestionManager />;
      case 'smart-engine':
          console.log('AdminApp: Rendering SmartAnalysisEngine');
        return <SmartAnalysisEngine />;
      case 'settings':
          console.log('AdminApp: Rendering Settings');
        return <Settings />;
      default:
        console.log('Unknown tab, defaulting to dashboard');
        return <AdminDashboard />;
    }
    } catch (error) {
      console.error('Error rendering content for tab:', activeTab, error);
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Component Error</h3>
            <p className="text-gray-600 mb-4">Failed to load the {activeTab} component.</p>
            <pre className="text-xs text-red-600 bg-red-50 p-3 rounded-lg text-left">
              {error.toString()}
            </pre>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
  };

  console.log('AdminApp: Rendering main dashboard');
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100">
        <ErrorBoundary>
          <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
        </ErrorBoundary>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default AdminApp;