import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, settingsApi, clearApiCache } from '../services/api';
import toast from 'react-hot-toast';
import './UpsolveQueue.css';

const UpsolveQueue = () => {
  const { profile } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maxIndex, setMaxIndex] = useState('Z');
  const [contestTypeFilter, setContestTypeFilter] = useState('all');
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
      toast.error("Failed to update problem index.");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredQueue = queue.filter(prob => {
    if (contestTypeFilter === 'all') return true;
    
    const name = (prob.contests?.name || '').toLowerCase();
    switch (contestTypeFilter) {
      case 'div1': return name.includes('div. 1') && !name.includes('div. 2');
      case 'div2': return name.includes('div. 2') && !name.includes('div. 1');
      case 'div1+2': return name.includes('div. 1 + div. 2') || (name.includes('div. 1') && name.includes('div. 2'));
      case 'div3': return name.includes('div. 3');
      case 'div4': return name.includes('div. 4');
      case 'edu': return name.includes('educational');
      default: return true;
    }
  });

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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div className="page-header-badge">• QUEUE</div>
          <h1 className="page-title">Upsolve Queue</h1>
          <div className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Prioritized by Recency, Difficulty and Attempts.
            <div className="info-tooltip-container">
              <i className="fi fi-rr-info tooltip-icon"></i>
              <div className="tooltip-content">
                <strong>Priority Formula Weights:</strong>
                <ul>
                  <li><strong>Recency (50%):</strong> exp(-days_since_contest / 30)</li>
                  <li><strong>Difficulty (30%):</strong> exp(-(delta²) / (2 × σ²)), where σ=300</li>
                  <li><strong>Attempts (20%):</strong> min(failed_attempts × 0.25, 1.0)</li>
                </ul>
                <em style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  * delta = |problem_rating - user_rating|.<br />
                  * Total score is normalized to a 10-point scale.
                </em>
                <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Priority algorithm designed by <a href="https://codeforces.com/profile/abhijeetballabh_23" target="_blank" rel="noopener noreferrer" style={{ color: '#c4b5fd', textDecoration: 'none', fontWeight: 600 }}>abhijeetballabh_23</a> (Candidate Master)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="queue-filter-card" style={{ 
            background: 'var(--bg-glass-card)', 
            padding: '1rem', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            minWidth: '180px'
          }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONTEST TYPE</label>
            <select 
              value={contestTypeFilter} 
              onChange={(e) => setContestTypeFilter(e.target.value)}
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                color: '#fff', 
                border: '1px solid var(--border-color)', 
                padding: '0.5rem', 
                borderRadius: 'var(--radius-md)',
                appearance: 'auto'
              }}
            >
              <option style={{ background: '#1e293b', color: '#fff' }} value="all">All Types</option>
              <option style={{ background: '#1e293b', color: '#fff' }} value="div1">Div. 1</option>
              <option style={{ background: '#1e293b', color: '#fff' }} value="div2">Div. 2</option>
              <option style={{ background: '#1e293b', color: '#fff' }} value="div1+2">Div. 1 + Div. 2</option>
              <option style={{ background: '#1e293b', color: '#fff' }} value="div3">Div. 3</option>
              <option style={{ background: '#1e293b', color: '#fff' }} value="div4">Div. 4</option>
              <option style={{ background: '#1e293b', color: '#fff' }} value="edu">Educational</option>
            </select>
          </div>

          <div className="queue-filter-card" style={{ 
            background: 'var(--bg-glass-card)', 
            padding: '1rem', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            minWidth: '180px'
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
      </div>

      <div className="queue-list" style={{ opacity: isUpdating ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        {filteredQueue.length > 0 ? filteredQueue.map((prob) => {
          const isHigh = prob.priority_score > 5;
          const contestName = prob.contests?.name || `Contest ${prob.contest_id}`;
          return (
            <div key={prob.id} className="queue-row">
              <div className="queue-icon-wrapper">
                <i className="fi fi-rr-bullseye"></i>
              </div>
              
              <div className="queue-info">
                <div className="queue-prob-name">{prob.contest_id}{prob.problem_index} — {prob.problem_name || 'Problem'}</div>
                <div className="queue-prob-meta">
                  {contestName} • {prob.failed_attempts} failed attempts
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
          <div className="empty-state-card" style={{
            gridColumn: '1 / -1',
            background: 'var(--bg-glass-card)',
            backdropFilter: 'var(--backdrop-blur)',
            WebkitBackdropFilter: 'var(--backdrop-blur)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '4rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            <div style={{ fontSize: '3rem', color: 'var(--border-strong)' }}>
              <i className="fi fi-rr-box-open"></i>
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>Queue is empty</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '400px' }}>
              {contestTypeFilter === 'all' 
                ? "You don't have any problems to upsolve in your queue right now. Great job!" 
                : `No problems found matching your "${contestTypeFilter.toUpperCase()}" filter.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpsolveQueue;
