import React from 'react';
import { AuthProvider, useAuth } from './utils/authContext';
import UserDiagnostic from './components/UserDiagnostic';
import AdminApp from './components/AdminApp';
import LoginForm from './components/LoginForm';

function AppContent() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // In a real app, you'd use React Router for proper routing
  // For now, we'll check the URL path to determine which app to show
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  // Admin routes require authentication and admin role
  if (isAdminRoute) {
    if (!isAuthenticated) {
      return <LoginForm onSuccess={() => window.location.reload()} />;
    }
    if (!isAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have admin privileges.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Go to Main App
            </button>
          </div>
        </div>
      );
    }
    return <AdminApp />;
  }

  // Main app - authentication optional but recommended
  return <UserDiagnostic />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
