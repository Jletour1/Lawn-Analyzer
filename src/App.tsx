import React, { useState } from 'react';
import { Shield, Leaf } from 'lucide-react';
import AdminPanel from './components/admin/AdminPanel';
import UserDiagnostic from './components/user/UserDiagnostic';

type AppMode = 'user' | 'admin';

function App() {
  const [mode, setMode] = useState<AppMode>('user');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const handleAdminLogin = () => {
    // In production, implement proper authentication
    const password = prompt('Enter admin password:');
    if (password === 'admin123') {
      setIsAdminAuthenticated(true);
      setMode('admin');
    } else {
      alert('Invalid password');
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    setMode('user');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Mode Toggle */}
      <div className="fixed top-4 right-4 z-50">
        {mode === 'user' ? (
          <button
            onClick={handleAdminLogin}
            className="flex items-center space-x-2 bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Leaf className="w-4 h-4" />
            <span>User View</span>
          </button>
        )}
      </div>

      {mode === 'admin' && isAdminAuthenticated ? (
        <AdminPanel />
      ) : (
        <UserDiagnostic />
      )}
    </div>
  );
}

export default App;