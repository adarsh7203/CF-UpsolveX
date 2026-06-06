import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contestApi, settingsApi, clearApiCache } from '../services/api';
import './Contests.css';

const Contests = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('official');
  const [maxIndex, setMaxIndex] = useState('Z');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const loadContestsAndSettings = async () => {
      if (!profile?.cf_handle) return;
      try {
        setLoading(true);
        const [data, settingsRes] = await Promise.all([
          contestApi.getContests(profile.cf_handle),
          settingsApi.getSettings(profile.cf_handle)
        ]);
        setContests(data.contests || []);
        setMaxIndex(settingsRes.settings?.min_notify_index || 'Z');
      } catch (err) {
        console.error("Failed to load contests:", err);
      } finally {
        setLoading(false);
      }
    };
    loadContestsAndSettings();
  }, [profile]);

  const handleIndexChange = async (e) => {
    const newIndex = e.target.value;
    setMaxIndex(newIndex);
    
    if (!profile?.cf_handle) return;
    try {
      setIsUpdating(true);
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
      
      // Invalidate cache and refetch contests
      clearApiCache();
      const res = await contestApi.getContests(profile.cf_handle);
      setContests(res.contests || []);
    } catch (err) {
      console.error("Failed to update index:", err);
      alert("Failed to update problem index.");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatStartTime = (isoString) => {
    if (!isoString) return 'Unknown Date';
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="sync-overlay-container animate-fade-in">
        <div className="sync-card">
          <div className="sync-icon-wrapper">
            <i className="fi fi-rr-rotate-right sync-spin"></i>
          </div>
          <h2 className="sync-title">Loading Contests</h2>
          <p className="sync-subtitle">Fetching your contest history...</p>
        </div>
      </div>
    );
  }

  const filteredContests = contests.filter(c =>
    activeTab === 'virtual' ? c.is_virtual : !c.is_virtual
  );

  return (
    <div className="contests-page-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-header-badge">• CONTESTS</div>
          <h1 className="page-title">Your Contest History</h1>
          <p className="page-subtitle">Every Rated Round You Participated In, With Completion Progress and Missed Problems.</p>
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

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'official' ? 'active' : ''}`}
          onClick={() => setActiveTab('official')}
        >
          Official Contests
        </button>
        <button
          className={`tab-btn ${activeTab === 'virtual' ? 'active' : ''}`}
          onClick={() => setActiveTab('virtual')}
        >
          Virtual / Unrated
        </button>
      </div>

      <div className="contests-page-grid" style={{ opacity: isUpdating ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        {filteredContests.length > 0 ? (
          filteredContests.map(contest => {
            const unsolved = contest.total_problems - contest.solved - contest.upsolved;
            let badgeClass = 'badge-needs';
            let badgeText = 'NEEDS UPSOLVING';

            if (contest.completion_percentage === 100) {
              badgeClass = 'badge-completed';
              badgeText = 'COMPLETED';
            } else if (contest.completion_percentage > 0) {
              badgeClass = 'badge-partial';
              badgeText = 'PARTIAL';
            }

            return (
              <div key={contest.contest_id} className="contest-card">
                <div className="contest-card-header">
                  <span className="contest-date">
                    <i className="fi fi-rr-calendar"></i> {formatStartTime(contest.start_time)}
                  </span>
                  <span className={`status-badge ${badgeClass}`}>{badgeText}</span>
                </div>
                <h3 className="contest-name">{contest.name}</h3>

                <div className="contest-stats">
                  <div className="stat-block">
                    <span className="stat-num stat-solved">{contest.solved}</span>
                    <span className="stat-label">SOLVED</span>
                  </div>
                  <div className="stat-block">
                    <span className="stat-num stat-upsolved">{contest.upsolved}</span>
                    <span className="stat-label">UPSOLVED</span>
                  </div>
                  <div className="stat-block">
                    <span className="stat-num stat-unsolved">{unsolved}</span>
                    <span className="stat-label">UNSOLVED</span>
                  </div>
                </div>

                <div className="completion-bar-container">
                  <div className="completion-text-row">
                    <span>Completion</span>
                    <span>{contest.completion_percentage}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill fill-solved" style={{ width: `${(contest.solved / contest.total_problems) * 100}%` }}></div>
                    <div className="progress-fill fill-upsolved" style={{ width: `${(contest.upsolved / contest.total_problems) * 100}%` }}></div>
                  </div>
                </div>

                <button className="view-details-link" onClick={() => navigate(`/contests/${contest.contest_id}`)}>
                  View details <i className="fi fi-rr-arrow-small-right"></i>
                </button>
              </div>
            );
          })
        ) : (
          <div className="empty-state">No {activeTab} contest history found.</div>
        )}
      </div>
    </div>
  );
};

export default Contests;
