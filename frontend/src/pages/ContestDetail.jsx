import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contestApi, notifyApi } from '../services/api';
import toast from 'react-hot-toast';
import './ContestDetail.css';

const ContestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const localKey = `reminder_${profile?.cf_handle}_${id}`;
  const [manualSent, setManualSent] = useState(() => localStorage.getItem(localKey) === 'true');
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSendReminder = async () => {
    if (!profile?.cf_handle || !id) return;
    try {
      setSendingEmail(true);
      const res = await notifyApi.triggerReminder(profile.cf_handle, id);
      if (res.result && res.result.status === 'success') {
        setManualSent(true);
        localStorage.setItem(localKey, 'true');
        toast.success("Email reminder sent successfully!");
      } else if (res.result && res.result.status === 'simulated') {
        toast.error("Email simulated (credentials missing on server)");
      } else {
        toast.error("Failed to send email (SMTP error or Google block)");
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to send email: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      if (!profile?.cf_handle || !id) return;
      try {
        setLoading(true);
        const data = await contestApi.getContestDetail(profile.cf_handle, id);
        setDetail(data);
      } catch (err) {
        console.error("Failed to load contest detail:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [profile, id]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'solved': return <i className="fi fi-rr-check-circle status-solved"></i>;
      case 'upsolved': return <i className="fi fi-rr-refresh status-upsolved"></i>;
      case 'wrong': return <i className="fi fi-rr-cross-circle status-wrong"></i>;
      default: return <i className="fi fi-rr-minus-circle status-not_attempted"></i>;
    }
  };

  const formatStatus = (status) => {
    if (status === 'not_attempted') return 'Not Attempted';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="sync-overlay-container animate-fade-in">
        <div className="sync-card">
          <div className="sync-icon-wrapper">
            <i className="fi fi-rr-rotate-right sync-spin"></i>
          </div>
          <h2 className="sync-title">Loading Contest Details</h2>
          <p className="sync-subtitle">Fetching contest problems and performance...</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="loading-state" style={{ color: '#f87171' }}>
        <i className="fi fi-rr-exclamation" style={{ fontSize: '2rem' }}></i>
        <p>Error loading contest: {error || 'Not found'}</p>
        <button className="back-btn" onClick={() => navigate('/contests')} style={{marginTop: '1rem'}}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="contest-detail-container animate-fade-in">
      <button className="back-btn" onClick={() => navigate('/contests')}>
        <i className="fi fi-rr-arrow-left"></i> Back to Contests
      </button>

      <div className="contest-detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>{detail.name}</h1>
          <p>Review your performance and tackle the problems you missed.</p>
        </div>
        <div className="reminder-status-container" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {(detail.reminder_sent || manualSent) ? (
            <>
              <div className="reminder-status-badge" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.5rem 1rem', 
                background: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid rgba(16, 185, 129, 0.2)', 
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                color: '#10b981',
                fontWeight: '600'
              }}>
                <i className="fi fi-rr-check-circle"></i>
                Email Reminder Sent
              </div>
              <button 
                onClick={handleSendReminder}
                disabled={sendingEmail}
                className="resend-reminder-btn"
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  padding: '0.5rem 1rem', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  color: '#e2e8f0',
                  cursor: sendingEmail ? 'wait' : 'pointer',
                  opacity: sendingEmail ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <i className={`fi ${sendingEmail ? 'fi-rr-rotate-right sync-spin' : 'fi-rr-rotate-right'}`}></i>
                {sendingEmail ? 'Sending...' : 'Resend'}
              </button>
            </>
          ) : (
            <button 
              onClick={handleSendReminder}
              disabled={sendingEmail}
              className="send-reminder-btn"
              style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.5rem 1rem', 
                background: 'var(--primary-color, #0ea5e9)', 
                border: 'none', 
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                color: '#fff',
                cursor: sendingEmail ? 'wait' : 'pointer',
                opacity: sendingEmail ? 0.7 : 1,
                transition: 'all 0.2s',
                fontWeight: '600'
              }}
            >
              <i className={`fi ${sendingEmail ? 'fi-rr-rotate-right sync-spin' : 'fi-rr-envelope'}`}></i>
              {sendingEmail ? 'Sending...' : 'Send Email Reminder'}
            </button>
          )}
        </div>
      </div>

      <div className="problem-table-container">
        <table className="problem-table">
          <thead>
            <tr>
              <th>Index</th>
              <th>Status</th>
              <th>Rating</th>
              <th>Attempts</th>
              <th style={{textAlign: 'right'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {detail.problems?.length > 0 ? (
              detail.problems.map((prob) => (
                <tr key={prob.id}>
                  <td className="problem-index">{prob.problem_index}</td>
                  <td>
                    <span className={`status-cell status-${prob.status}`}>
                      {getStatusIcon(prob.status)}
                      {formatStatus(prob.status)}
                    </span>
                  </td>
                  <td>{prob.problem_rating || 'N/A'}</td>
                  <td>{prob.failed_attempts}</td>
                  <td style={{textAlign: 'right', display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
                    <a href={prob.problem_url} target="_blank" rel="noopener noreferrer" className="open-cf-btn">
                      <i className="fi fi-rr-external-link"></i> Open on CF
                    </a>
                    {(prob.status === 'wrong' || prob.status === 'not_attempted') && (
                      <a href={prob.problem_url} target="_blank" rel="noopener noreferrer" className="upsolve-now-btn">
                        Upsolve Now
                      </a>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)'}}>
                  No problem data available for this contest.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContestDetail;
