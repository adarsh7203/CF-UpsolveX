import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileModal from '../profile/ProfileModal';
import './Layout.css';

const Navbar = () => {
  const { profile, signOut } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'fi-rr-apps' },
    { name: 'Queue', path: '/queue', icon: 'fi-rr-list' },
    { name: 'Contests', path: '/contests', icon: 'fi-rr-trophy' },
    { name: 'Analytics', path: '/analytics', icon: 'fi-rr-stats' },
    { name: 'Settings', path: '/settings', icon: 'fi-rr-settings' },
  ];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          
          {/* Left: Brand */}
          <div className="navbar-brand">
            <div className="brand-info">
              <h2 className="brand-name">CF UpsolveX</h2>
              <p className="brand-subtitle">TRACK • UPSOLVE • IMPROVE</p>
            </div>
          </div>

          {/* Center: Navigation Links */}
          <div className="navbar-nav">
            {navItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <i className={`fi ${item.icon} nav-icon`}></i>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>

          {/* Right: User Profile & Actions */}
          <div className="navbar-actions">
            <div className="user-profile" onClick={() => setIsProfileModalOpen(true)} style={{cursor: 'pointer'}}>
              <div className="user-avatar">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="avatar-img" />
                ) : (
                  profile?.cf_handle ? profile.cf_handle.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <div className="user-details">
                <span className="user-handle">{profile?.cf_handle || 'User'}</span>
                <span className="user-rating">
                  {profile?.rating ? `${profile.rating} - ${profile.rank || 'Unrated'}` : 'Unrated'}
                </span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); signOut(); }} 
                className="logout-btn" 
                title="Sign Out"
              >
                <i className="fi fi-rr-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>

        </div>
      </nav>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        profile={profile} 
      />
    </>
  );
};

export default Navbar;
