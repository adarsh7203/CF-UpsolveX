import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { settingsApi, clearApiCache } from '../services/api';
import './Settings.css';

const Settings = () => {
  const { profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    cf_handle: '',
    email: '',
    email_notifications: false,
    weekly_digest: false,
    min_notify_index: 'Z',
    include_virtual: false,
  });

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
            weekly_digest: currentSettings.weekly_digest || false,
            min_notify_index: currentSettings.min_notify_index || 'Z',
            include_virtual: currentSettings.include_virtual || false,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        cf_handle: formData.cf_handle,
        email: formData.email,
        email_enabled: formData.email_notifications,
        weekly_digest: formData.weekly_digest,
        min_notify_index: formData.min_notify_index,
        include_virtual: formData.include_virtual
      };
      
      await settingsApi.updateSettings(profile.cf_handle, payload);
      clearApiCache();
      alert('Settings saved!');
    } catch (err) {
      console.error(err);
      alert(`Failed to save settings: ${err.message}`);
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
        <form className="settings-left-col" onSubmit={handleSubmit}>
          
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
                onChange={handleChange}
                className="settings-input"
              />
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

            <div className="toggle-divider"></div>

            <div className="toggle-group">
              <div className="toggle-info">
                <h4>Weekly digest</h4>
                <p>A summary of your upsolve velocity every Monday.</p>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  name="weekly_digest"
                  checked={formData.weekly_digest}
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

            <div className="toggle-divider"></div>

            <div className="toggle-group">
              <div className="toggle-info">
                <h4>Include Virtual Contests</h4>
                <p>Track progress for contests you participated in virtually.</p>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  name="include_virtual"
                  checked={formData.include_virtual}
                  onChange={handleChange}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          
          <button type="submit" className="save-btn" style={{alignSelf: 'flex-start'}}>Save Preferences</button>

        </form>

        <div className="settings-right-col">
          <div className="email-preview-card">
            <div className="preview-header">
              <i className="fi fi-rr-envelope" style={{fontSize: '0.9rem'}}></i> Reminder email - preview
            </div>
            
            <div className="preview-content">
              <div className="preview-subject">
                <span>SUBJECT</span>
                <h3>CF UpsolveX — Don't Skip Your Missed Problems</h3>
              </div>
              
              <div className="preview-body">
                Hey <strong>{formData.cf_handle || 'tourist'}</strong>, you participated in <strong>Codeforces Round 987 (Div. 2)</strong>. You solved 4 of 6 problems. Two are still waiting.
              </div>

              <div className="preview-contest-box">
                <div className="preview-contest-header">
                  <span>Contest completion</span>
                  <span style={{color: '#fff', fontWeight: 600}}>67%</span>
                </div>
                
                <div className="preview-problem">
                  <span>1987E — Median Maintenance</span>
                  <span className="priority-badge badge-high">HIGH</span>
                </div>
                
                <div className="preview-problem" style={{borderBottom: 'none'}}>
                  <span>1987F — Two Subsequences</span>
                  <span className="priority-badge badge-medium">MEDIUM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
