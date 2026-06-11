import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, contestApi, userApi, settingsApi, clearApiCache } from '../services/api';
import { fetchContests } from '../services/codeforces';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [kpis, setKpis] = useState(null);
  const [recentContests, setRecentContests] = useState([]);
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [maxIndex, setMaxIndex] = useState('Z');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async (forceSync = false) => {
      if (!profile?.cf_handle) return;
      try {
        setLoading(true);
        
        // 1. FAST QUERIES (From our Supabase DB)
        const [kpiRes, contestRes, settingsRes] = await Promise.all([
          dashboardApi.getKPIs(profile.cf_handle),
          contestApi.getContests(profile.cf_handle),
          settingsApi.getSettings(profile.cf_handle)
        ]);

        setMaxIndex(settingsRes.settings?.min_notify_index || 'Z');

        // Auto-sync if data is completely empty and we haven't just tried syncing
        if ((kpiRes.kpis.total_contests === 0 || forceSync) && !syncing) {
          setSyncing(true);
          console.log("No data found, triggering sync with Codeforces...");
          await userApi.refreshData(profile.cf_handle);
          
          // Refetch after sync
          const [newKpi, newContest] = await Promise.all([
            dashboardApi.getKPIs(profile.cf_handle),
            contestApi.getContests(profile.cf_handle)
          ]);
          setKpis(newKpi.kpis);
          setRecentContests(newContest.contests.slice(0, 3));
          setSyncing(false);
        } else {
          setKpis(kpiRes.kpis);
          setRecentContests(contestRes.contests.slice(0, 3));
        }

        // Dashboard is now ready to render!
        setLoading(false);

        // 2. SLOW QUERY (From External Codeforces API)
        // Fetch upcoming contests asynchronously without blocking the main dashboard
        fetchContests().then(allContests => {
          const upcoming = (allContests || [])
            .filter(c => c.phase === 'BEFORE')
            .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
            .slice(0, 3);
          setUpcomingContests(upcoming);
        }).catch(err => {
          console.error("Failed to load upcoming contests:", err);
        });

      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setSyncing(false);
        setLoading(false);
      }
    };
    fetchDashboardData();
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
      
      // Invalidate cache and refetch KPIs
      clearApiCache();
      const newKpi = await dashboardApi.getKPIs(profile.cf_handle);
      setKpis(newKpi.kpis);
      toast.success("Dashboard metrics updated!");
    } catch (err) {
      console.error("Failed to update index:", err);
      toast.error("Failed to update problem index.");
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

  const formatUnixTime = (seconds) => {
    if (!seconds) return 'Unknown Date';
    const date = new Date(seconds * 1000);
    return date.toLocaleString(undefined, {
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins > 0 ? mins + 'm' : ''}`;
  };

  const getRankClass = (rank) => {
    if (!rank) return 'rank-unrated';
    const r = rank.toLowerCase();
    if (r.includes('newbie')) return 'rank-newbie';
    if (r.includes('pupil')) return 'rank-pupil';
    if (r.includes('specialist')) return 'rank-specialist';
    if (r.includes('expert')) return 'rank-expert';
    if (r.includes('candidate master')) return 'rank-candidate-master';
    if (r.includes('master')) return 'rank-master';
    if (r.includes('grandmaster')) return 'rank-grandmaster';
    return 'rank-unrated';
  };

  const formatRank = (rank) => {
    if (!rank) return 'Coder';
    return rank.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (loading || syncing) {
    return (
      <div className="sync-overlay-container animate-fade-in">
        <div className="sync-card">
          <div className="sync-icon-wrapper">
            <i className="fi fi-rr-rotate-right sync-spin"></i>
          </div>
          <h2 className="sync-title">
            {syncing ? 'Syncing Codeforces Data' : 'Loading Dashboard'}
          </h2>
          <p className="sync-subtitle">
            {syncing 
              ? 'Fetching your contests, submissions, and metrics... this may take a few moments.'
              : 'Crunching the latest data...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container animate-fade-in">
      
      {/* Welcome Message & Filters */}
      <div className="dashboard-welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <h1 className="welcome-title" style={{ margin: 0 }}>
          Welcome Back, <span className={getRankClass(profile?.rank)}>{formatRank(profile?.rank)}!</span>
        </h1>
        
        <div className="queue-filter-card" style={{ 
            background: 'var(--bg-glass-card)', 
            padding: '1rem', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            minWidth: '180px'
          }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>MAX PROBLEM INDEX</label>
            <select 
              value={maxIndex} 
              onChange={handleIndexChange}
              disabled={isUpdating}
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                color: '#fff', 
                border: '1px solid var(--border-color)', 
                padding: '0.4rem', 
                borderRadius: 'var(--radius-md)',
                appearance: 'auto',
                opacity: isUpdating ? 0.5 : 1,
                fontSize: '0.9rem'
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

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-value">{kpis?.pending_upsolves || 0}</span>
          <span className="kpi-label">Pending Upsolves</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-value">{kpis?.completed_upsolves || 0}</span>
          <span className="kpi-label">Completed Upsolves</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-value">{kpis?.current_streak || 0}</span>
          <span className="kpi-label">Current Streak</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-value">{kpis?.total_contests || 0}</span>
          <span className="kpi-label">Total Contests</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-value">{kpis?.total_solved || 0}</span>
          <span className="kpi-label">Solved In-Contest</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-value">{kpis?.completion_rate || 0}%</span>
          <span className="kpi-label">Completion Rate</span>
        </div>
      </div>

      {/* Upcoming Contests */}
      {upcomingContests.length > 0 && (
        <div className="section-container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Upcoming Contests</h2>
              <p className="section-subtitle">Register and Prepare for Upcoming Rated Rounds</p>
            </div>
            <a href="https://codeforces.com/contests" target="_blank" rel="noopener noreferrer" className="view-all-btn">
              View all <i className="fi fi-rr-arrow-right"></i>
            </a>
          </div>
          
          <div className="contests-grid">
            {upcomingContests.map(contest => (
              <div key={contest.id} className="contest-card">
                <div className="contest-card-header">
                  <span className="contest-date">
                    <i className="fi fi-rr-calendar"></i> {formatUnixTime(contest.startTimeSeconds)}
                  </span>
                  <span className="status-badge badge-upcoming">UPCOMING</span>
                </div>
                <h3 className="contest-name" title={contest.name}>{contest.name}</h3>
                
                <div className="contest-stats upcoming-stats">
                  <div className="stat-block">
                    <span className="stat-num stat-duration">{formatDuration(contest.durationSeconds)}</span>
                    <span className="stat-label">DURATION</span>
                  </div>
                  <div className="stat-block">
                    <span className="stat-num stat-type">{contest.type}</span>
                    <span className="stat-label">TYPE</span>
                  </div>
                </div>

                <a href={`https://codeforces.com/contests/${contest.id}`} target="_blank" rel="noopener noreferrer" className="view-details-link">
                  Register now <i className="fi fi-rr-arrow-small-right"></i>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Contests */}
      <div className="section-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Recent Contests</h2>
            <p className="section-subtitle">Latest Rated Rounds and Completion</p>
          </div>
          <button className="view-all-btn" onClick={() => navigate('/contests')}>
            View all <i className="fi fi-rr-arrow-right"></i>
          </button>
        </div>
        
        <div className="contests-grid">
          {recentContests.map(contest => {
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
                <h3 className="contest-name" title={contest.name}>{contest.name}</h3>
                
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
          })}
        </div>
      </div>

      {/* Upsolve Queue removed, moved to dedicated page */}
      
    </div>
  );
};

export default Dashboard;

