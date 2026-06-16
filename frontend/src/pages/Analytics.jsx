import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, settingsApi } from '../services/api';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import MultiSelectDropdown from '../components/common/MultiSelectDropdown';
import './Analytics.css';

const PIE_COLORS = ['#10b981', '#3b82f6', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isContest = data.start_time !== undefined;
    
    let formattedDate = '';
    if (isContest && data.start_time) {
      const d = new Date(data.start_time);
      formattedDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    // Fallback to label if not a contest chart
    const displayTitle = isContest ? (data.name || label) : label;
    // Extract division or type from name
    let contestType = "Official";
    const isGym = data.contest_id >= 100000;
    if (isGym) {
      contestType = "Gym";
    } else if (data.name) {
      const nameLower = data.name.toLowerCase();
      const divMatch = data.name.match(/(Div\.?\s*\d(\s*\+\s*Div\.?\s*\d)?)/i);
      if (divMatch) {
        contestType = divMatch[0];
      } else if (nameLower.includes("educational")) {
        contestType = "Educational";
      } else if (nameLower.includes("global")) {
        contestType = "Global";
      } else if (nameLower.includes("pinely") || nameLower.includes("hello") || nameLower.includes("good bye")) {
        contestType = "Special";
      }
    }

    return (
      <div className="custom-tooltip" style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '12px', minWidth: '220px' }}>
        <p className="label" style={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px', fontSize: '1.05rem', lineHeight: '1.3' }}>{displayTitle}</p>
        
        {isContest ? (
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '6px' }}>
            <span><i className="fi fi-rr-calendar"></i> {formattedDate || 'Unknown Date'}</span>
            <span>• {contestType}</span>
            <span>• #{data.contest_id}</span>
          </div>
        ) : (
          <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '8px' }}></div>
        )}

        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: entry.color }}></span>
            <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{entry.name}:</span>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const { profile } = useAuth();
  
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maxIndex, setMaxIndex] = useState('');
  const [contestTypeFilters, setContestTypeFilters] = useState([]);
  const [initialSettingsLoaded, setInitialSettingsLoaded] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!profile?.cf_handle) return;
      try {
        const res = await settingsApi.getSettings(profile.cf_handle);
        setMaxIndex(res.settings?.min_notify_index || 'Z');
        setInitialSettingsLoaded(true);
      } catch (err) {
        setMaxIndex('Z');
        setInitialSettingsLoaded(true);
      }
    };
    fetchSettings();
  }, [profile]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!profile?.cf_handle || !initialSettingsLoaded) return;
      try {
        setLoading(true);
        const divParam = contestTypeFilters.length > 0 ? contestTypeFilters.join(',') : 'all';
        const res = await dashboardApi.getAnalytics(profile.cf_handle, maxIndex, divParam);
        setAnalytics(res.analytics);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [profile, maxIndex, contestTypeFilters, initialSettingsLoaded]);

  if (loading) {
    return (
      <div className="sync-overlay-container animate-fade-in">
        <div className="sync-card">
          <div className="sync-icon-wrapper">
            <i className="fi fi-rr-rotate-right sync-spin"></i>
          </div>
          <h2 className="sync-title">Loading Analytics</h2>
          <p className="sync-subtitle">Crunching your upsolve data...</p>
        </div>
      </div>
    );
  }

  const pieData = analytics ? [
    { name: 'Solved During', value: analytics.completion_ratio.solved },
    { name: 'Upsolved Later', value: analytics.completion_ratio.upsolved },
    { name: 'Pending Upsolve', value: analytics.completion_ratio.pending },
  ] : [];

  // Need to calculate 'unsolved' for the stacked bar chart since API returns 'solved' and 'upsolved'
  // But wait, the API contest_performance returns {solved, upsolved} but we need 'unsolved' too.
  // Actually, wait, does contest_performance return total? No, it doesn't.
  // The screenshot shows red stacked on top. I will map it to 'pending' if possible, or just fake it if it's missing from the endpoint.
  // Let's assume the endpoint can be derived from completion_trend? 
  // Wait, I can just use a dummy 'unsolved' if it's missing, but I'll check what we have.
  const barData = analytics?.contest_performance?.map(c => ({
    ...c,
    // Calculate unsolved using the total from backend
    unsolved: Math.max(0, (c.total || 0) - (c.solved || 0) - (c.upsolved || 0))
  })) || [];

  return (
    <div className="analytics-page-container animate-fade-in" style={{ opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div className="page-header-badge">• ANALYTICS</div>
          <h1 className="page-title">Visualize Your Growth</h1>
          <p className="page-subtitle">The Metrics That Show Whether You're Actually Improving — Not Just Practicing.</p>
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
            minWidth: '220px'
          }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONTEST TYPE</label>
            <MultiSelectDropdown 
              options={[
                { id: 'div1', label: 'Div. 1' },
                { id: 'div2', label: 'Div. 2' },
                { id: 'div1+2', label: 'Div. 1+2' },
                { id: 'div3', label: 'Div. 3' },
                { id: 'div4', label: 'Div. 4' },
                { id: 'edu', label: 'Educational' }
              ]}
              selected={contestTypeFilters}
              onChange={setContestTypeFilters}
              placeholder="All Types"
            />
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
              onChange={(e) => setMaxIndex(e.target.value)}
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                color: '#fff', 
                border: '1px solid var(--border-color)', 
                padding: '0.5rem', 
                borderRadius: 'var(--radius-md)',
                appearance: 'auto'
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

      <div className="analytics-grid">
        
        {/* Chart 1: Upsolve Progress */}
        <div className="chart-panel">
          <div className="chart-panel-header">
            <h3>Upsolve Progress</h3>
            <p>Weekly Upsolved vs. Target</p>
          </div>
          <div className="chart-wrapper">
            {analytics?.upsolve_progress?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.upsolve_progress} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Area type="monotone" name="Count" dataKey="count" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="empty-chart">No data available</div>}
          </div>
        </div>

        {/* Chart 2: Contest Performance */}
        <div className="chart-panel">
          <div className="chart-panel-header">
            <h3>Contest Performance</h3>
            <p>Solved • Upsolved • Unsolved Per Contest</p>
          </div>
          <div className="chart-wrapper">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v.split(' ')[1] || v} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="solved" name="Solved" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="upsolved" name="Upsolved" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="unsolved" name="Unsolved" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-chart">No data available</div>}
          </div>
        </div>

        {/* Chart 3: Completion Ratio */}
        <div className="chart-panel">
          <div className="chart-panel-header">
            <h3>Completion Ratio</h3>
            <p>Where Your Problems End Up</p>
          </div>
          <div className="chart-wrapper">
            {pieData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="empty-chart">No data available</div>}
          </div>
        </div>

        {/* Chart 4: Contest Completion Trend */}
        <div className="chart-panel">
          <div className="chart-panel-header">
            <h3>Contest Completion Trend</h3>
            <p>The Most Direct Measure of Improvement</p>
          </div>
          <div className="chart-wrapper">
            {analytics?.completion_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.completion_trend} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v.split(' ')[1] || v} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" name="Completion %" dataKey="completion_percentage" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="empty-chart">No data available</div>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
