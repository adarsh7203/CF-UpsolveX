import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { settingsApi, clearApiCache } from '../services/api';
import { supabase } from '../services/supabase'; // Import supabase client for password update
import toast from 'react-hot-toast';
import './Settings.css';

const Settings = () => {
  const { profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    cf_handle: '',
    email: '',
    email_notifications: false,
    min_notify_index: 'Z',
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const fetchLatestSettings = async () => {
      if (profile?.cf_handle) {
        try {
          const res = await settingsApi.getSettings(profile.cf_handle);
          const currentSettings = res.settings;
          setFormData({
            cf_handle: currentSettings.cf_handle || '',
            email: currentSettings.email || '',
            email_notifications: currentSettings.email_enabled || false,
            min_notify_index: currentSettings.min_notify_index || 'Z',
          });
        } catch(err) {
          console.error("Failed to load settings:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchLatestSettings();
  }, [profile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    try {
      setIsChangingPassword(true);

      // 1. Get the current user's email
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Could not verify active session.");

      // 2. Verify the old password by attempting a sign-in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.oldPassword
      });

      if (signInError) {
        toast.error("Incorrect old password. Please try again.");
        setIsChangingPassword(false);
        return;
      }

      // 3. Update to the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) throw updateError;
      
      toast.success('Password updated successfully!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error("Failed to update password:", err);
      toast.error(`Failed to update password: ${err.message}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        cf_handle: formData.cf_handle,
        email: formData.email, // Backend expects this payload field, even if read-only
        email_enabled: formData.email_notifications,
        weekly_digest: false, // Force false since we removed it
        min_notify_index: formData.min_notify_index,
        include_virtual: false, // Force false since we removed it
      };
      
      await settingsApi.updateSettings(profile.cf_handle, payload);
      clearApiCache();
      toast.success('Settings saved!');
    } catch (err) {
      console.error(err);
      toast.error(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="sync-overlay-container animate-fade-in">
        <div className="sync-card">
          <div className="sync-icon-wrapper">
            <i className="fi fi-rr-rotate-right sync-spin"></i>
          </div>
          <h2 className="sync-title">Loading Settings</h2>
          <p className="sync-subtitle">Fetching your preferences...</p>
        </div>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="sync-overlay-container animate-fade-in">
        <div className="sync-card">
          <div className="sync-icon-wrapper">
            <i className="fi fi-rr-rotate-right sync-spin"></i>
          </div>
          <h2 className="sync-title">Saving Preferences</h2>
          <p className="sync-subtitle">Updating your profile and notification settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page-container animate-fade-in">
      <div className="page-header">
        <div className="page-header-badge">• SETTINGS</div>
        <h1 className="page-title">Preferences</h1>
        <p className="page-subtitle">Tune Your Handle, Reminders and What Counts as a Missed Problem.</p>
      </div>

      <div className="settings-grid">
        {/* LEFT COLUMN */}
        <div className="settings-left-col">
          <form id="settings-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="settings-panel">
              <div className="settings-panel-header">
                <i className="fi fi-rr-user" style={{ color: '#f59e0b' }}></i>
                <h3>Profile</h3>
              </div>
              
              <div className="input-group">
                <label>Codeforces handle</label>
                <input 
                  type="text" 
                  name="cf_handle"
                  value={formData.cf_handle}
                  onChange={handleChange}
                  className="settings-input"
                />
              </div>
              
              <div className="input-group">
                <label>Email address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  disabled={true}
                  className="settings-input"
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
                <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem'}}>
                  Email cannot be changed directly to protect your account.
                </p>
              </div>
            </div>

            <div className="settings-panel">
              <div className="settings-panel-header">
                <i className="fi fi-rr-envelope" style={{ color: '#f59e0b' }}></i>
                <h3>Notifications</h3>
              </div>

              <div className="toggle-group">
                <div className="toggle-info">
                  <h4>Email notifications</h4>
                  <p>Receive a reminder after every rated contest.</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    name="email_notifications"
                    checked={formData.email_notifications}
                    onChange={handleChange}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <div className="settings-panel">
              <div className="settings-panel-header">
                <i className="fi fi-rr-target" style={{ color: '#f59e0b' }}></i>
                <h3>Tracking Options</h3>
              </div>

              <div className="input-group">
                <label>Max Problem Index to Track</label>
                <select 
                  name="min_notify_index"
                  value={formData.min_notify_index}
                  onChange={handleChange}
                  className="settings-input"
                  style={{ appearance: 'auto' }}
                >
                  <option style={{ background: '#1e293b', color: '#fff' }} value="A">Up to A (Only A)</option>
                  <option style={{ background: '#1e293b', color: '#fff' }} value="B">Up to B (A, B)</option>
                  <option style={{ background: '#1e293b', color: '#fff' }} value="C">Up to C (A, B, C)</option>
                  <option style={{ background: '#1e293b', color: '#fff' }} value="D">Up to D (A, B, C, D)</option>
                  <option style={{ background: '#1e293b', color: '#fff' }} value="E">Up to E</option>
                  <option style={{ background: '#1e293b', color: '#fff' }} value="F">Up to F</option>
                  <option style={{ background: '#1e293b', color: '#fff' }} value="G">Up to G</option>
                  <option style={{ background: '#1e293b', color: '#fff' }} value="Z">All Problems</option>
                </select>
                <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem'}}>
                  Problems beyond this index will not be added to your Upsolve Queue.
                </p>
              </div>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN */}
        <div className="settings-right-col">
          
          <form className="settings-panel" onSubmit={submitPasswordChange} style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div className="settings-panel-header">
              <i className="fi fi-rr-lock" style={{ color: '#ef4444' }}></i>
              <h3 style={{ color: '#ef4444' }}>Security</h3>
            </div>

            <div className="input-group">
              <label>Old Password</label>
              <input 
                type="password" 
                name="oldPassword"
                value={passwordData.oldPassword}
                onChange={handlePasswordChange}
                placeholder="Enter your current password"
                className="settings-input"
              />
            </div>
            
            <div className="input-group" style={{ marginTop: '0.5rem' }}>
              <label>New Password</label>
              <input 
                type="password" 
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Minimum 6 characters"
                className="settings-input"
              />
            </div>

            <div className="input-group">
              <label>Confirm New Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm your new password"
                className="settings-input"
              />
            </div>

            <button type="submit" className="save-btn" style={{ background: '#ef4444', opacity: isChangingPassword ? 0.7 : 1, alignSelf: 'flex-start', marginTop: '1rem' }} disabled={isChangingPassword}>
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>

        </div>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <button type="submit" form="settings-form" className="save-btn" style={{ width: 'auto' }}>
          Save Preferences
        </button>
      </div>

    </div>
  );
};

export default Settings;
