import React from 'react';
import UserDiagnostic from './components/UserDiagnostic';
import AdminApp from './components/AdminApp';

function App() {
  // Simple routing based on URL path
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  
  if (isAdminRoute) {
    return <AdminApp />;
  }
  
  return (
    <UserDiagnostic />
  );
}

export default App;
