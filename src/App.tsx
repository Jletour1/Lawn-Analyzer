import React from 'react';
import UserDiagnostic from './components/UserDiagnostic';
import AdminApp from './components/AdminApp';

function App() {
  // In a real app, you'd use React Router for proper routing
  // For now, we'll check the URL path to determine which app to show
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <AdminApp />;
  }

  return <UserDiagnostic />;
}

export default App;
