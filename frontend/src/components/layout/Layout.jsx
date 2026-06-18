import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import './Layout.css';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // If user is not logged in but was logged in previously, their session expired
  const [showExpiredModal, setShowExpiredModal] = useState(() => {
    if (!user && localStorage.getItem('wasLoggedIn') === 'true') {
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (showExpiredModal) {
      localStorage.removeItem('wasLoggedIn');
    }
    if (user) {
      localStorage.setItem('wasLoggedIn', 'true');
    }
  }, [user, showExpiredModal]);

  if (showExpiredModal) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <div className="glass-panel text-center" style={{ padding: '3rem 2rem', maxWidth: '400px', width: '90%', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', marginBottom: '1rem' }}>Session Expired</h2>
          <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.5' }}>
            For your security, your session has expired. Please log in again to continue using CF UpsolveX.
          </p>
          <button 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setShowExpiredModal(false)}
          >
            Log In Again
          </button>
        </div>
      </div>
    );
  }

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
