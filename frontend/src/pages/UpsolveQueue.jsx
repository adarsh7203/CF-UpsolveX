import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, settingsApi, clearApiCache } from '../services/api';
import './UpsolveQueue.css';

const UpsolveQueue = () => {
  const { profile } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maxIndex, setMaxIndex] = useState('Z');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchQueueAndSettings = async () => {
      if (!profile?.cf_handle) return;
      try {
        setLoading(true);
        const [queueRes, settingsRes] = await Promise.all([
          dashboardApi.getUpsolveQueue(profile.cf_handle),
          settingsApi.getSettings(profile.cf_handle)
        ]);
        setQueue(queueRes.queue || []);
        setMaxIndex(settingsRes.settings?.min_notify_index || 'Z');
      } catch (err) {
        console.error("Failed to load queue:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQueueAndSettings();
  }, [profile]);

  const handleIndexChange = async (e) => {
    const newIndex = e.target.value;
    setMaxIndex(newIndex);
    
    if (!profile?.cf_handle) return;
    try {
      setIsUpdating(true);
      // Fetch current settings to preserve other fields
      const resSettings = await settingsApi.getSettings(profile.cf_handle);
      const currentSettings = resSettings.settings;
      const payload = {
        cf_handle: currentSettings.cf_handle,
        email: currentSettings.email,
        email_enabled: currentSettings.email_enabled,
        weekly_digest: currentSettings.weekly_digest,
        min_notify_index: newIndex,
        include_virtual: currentSettings.include_virtual
      };
      
      await settingsApi.updateSettings(profile.cf_handle, payload);
      
      // Invalidate cache and refetch queue
      clearApiCache();
      const res = await dashboardApi.getUpsolveQueue(profile.cf_handle);
      setQueue(res.queue || []);
    } catch (err) {
      console.error("Failed to update index:", err);
      alert("Failed to update problem index.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="sync-overlay-container animate-fade-in">
        <div className="sync-card">
          <div className="sync-icon-wrapper">
            <i className="fi fi-rr-rotate-right sync-spin"></i>
          </div>
          <h2 className="sync-title">Loading Queue</h2>
          <p className="sync-subtitle">Fetching your personalized problem queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="queue-page-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-header-badge">• QUEUE</div>
          <h1 className="page-title">Upsolve Queue</h1>
          <p className="page-subtitle">Prioritized by Recency, Difficulty, and Attempts.</p>
        </div>
        
        <div className="queue-filter-card" style={{ 
          background: 'var(--bg-glass-card)', 
          padding: '1rem', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          minWidth: '200px'
        }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>MAX PROBLEM INDEX</label>
          <select 
            value={maxIndex} 
            onChange={handleIndexChange}
            disabled={isUpdating}
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              color: '#fff', 
              border: '1px solid var(--border-color)', 
              padding: '0.5rem', 
              borderRadius: 'var(--radius-md)',
              appearance: 'auto',
              opacity: isUpdating ? 0.5 : 1
            }}
          >
            <option style={{ background: '#1e293b', color: '#fff' }} value="A">Up to A</option>
            <option style={{ background: '#1e293b', color: '#fff' }} value="B">Up to B</option>
            <option style={{ background: '#1e293b', color: '#fff' }} value="C">Up to C</option>
            <option style={{ background: '#1e293b', color: '#fff' }} value="D">Up to D</option>
            <option style={{ background: '#1e293b', color: '#fff' }} value="E">Up to E</option>
            <option style={{ background: '#1e293b', color: '#fff' }} value="F">Up to F</option>
            <option style={{ background: '#1e293b', color: '#fff' }} value="G">Up to G</option>
            <option style={{ background: '#1e293b', color: '#fff' }} value="Z">All Problems</option>
          </select>
        </div>
      </div>

      <div className="queue-list" style={{ opacity: isUpdating ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        {queue.length > 0 ? queue.map((prob) => {
          const isHigh = prob.priority_score > 5;
          return (
            <div key={prob.id} className="queue-row">
              <div className="queue-icon-wrapper">
                <i className="fi fi-rr-bullseye"></i>
              </div>
              
              <div className="queue-info">
                <div className="queue-prob-name">{prob.contest_id}{prob.problem_index} — {prob.problem_name || 'Problem'}</div>
                <div className="queue-prob-meta">
                  Contest {prob.contest_id} • {prob.failed_attempts} failed attempts
                </div>
              </div>

              <div className="queue-actions">
                <span className="queue-rating">{prob.problem_rating || 'N/A'}</span>
                <span className={`priority-badge ${isHigh ? 'badge-high' : 'badge-medium'}`}>
                  {isHigh ? 'HIGH' : 'MEDIUM'}
                </span>
                <a href={prob.problem_url} target="_blank" rel="noopener noreferrer" className="queue-btn">
                  Upsolve now <i className="fi fi-rr-angle-right"></i>
                </a>
              </div>
            </div>
          )
        }) : (
          <div className="empty-state">Queue is empty or filtered out. Great job!</div>
        )}
      </div>
    </div>
  );
};

export default UpsolveQueue;
