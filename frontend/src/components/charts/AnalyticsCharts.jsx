import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './AnalyticsCharts.css';

const COLORS = ['#10b981', '#0ea5e9', '#ef4444']; // Solved, Upsolved, Pending

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip glass-panel">
        <p className="label font-bold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, margin: '2px 0', fontSize: '0.9rem' }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalyticsCharts = ({ data }) => {
  if (!data) return null;

  const { completion_ratio, completion_trend, contest_performance, upsolve_progress } = data;

  // Prepare Pie Chart Data
  const pieData = [
    { name: 'Solved During', value: completion_ratio.solved },
    { name: 'Upsolved After', value: completion_ratio.upsolved },
    { name: 'Still Pending', value: completion_ratio.pending },
  ];

  return (
    <div className="charts-container">
      
      {/* Contest Completion Trend (Line) */}
      <div className="chart-card glass-panel">
        <h3 className="chart-title">Contest Completion Trend</h3>
        <p className="chart-subtitle">Percentage of problems completed per contest over time</p>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={completion_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickFormatter={(str) => str.length > 10 ? str.slice(0, 10) + '...' : str} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="completion_percentage" 
                name="Completion %" 
                stroke="#a78bfa" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#fff', stroke: '#a78bfa', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row of two smaller charts */}
      <div className="charts-row">
        
        {/* Contest Performance (Bar) */}
        <div className="chart-card glass-panel flex-1">
          <h3 className="chart-title">Performance</h3>
          <div className="chart-wrapper small">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contest_performance} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="solved" stackId="a" name="Solved" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="upsolved" stackId="a" name="Upsolved" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Completion Ratio (Pie) */}
        <div className="chart-card glass-panel flex-1">
          <h3 className="chart-title">Ratio</h3>
          <div className="chart-wrapper small">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AnalyticsCharts;
