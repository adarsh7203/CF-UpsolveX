import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import './Layout.css'; // Make sure layout CSS is imported here

const Layout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="content-wrapper animate-slide-up">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
