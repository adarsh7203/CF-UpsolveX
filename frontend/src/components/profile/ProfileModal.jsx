import { useState, useEffect } from 'react';
import { dashboardApi } from '../../services/api';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose, profile }) => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && profile?.cf_handle) {
      const fetchKpis = async () => {
        try {
          setLoading(true);
          const res = await dashboardApi.getKPIs(profile.cf_handle);
          setKpis(res.kpis);
        } catch (err) {
          console.error("Failed to fetch KPIs for profile modal", err);
        } finally {
          setLoading(false);
        }
      };
      fetchKpis();
    }
  }, [isOpen, profile]);

  if (!isOpen || !profile) return null;

  const cfInfo = profile.cf_info || {};

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

  const getRankColor = (rank) => {
    if (!rank) return '#808080';
    const r = rank.toLowerCase();
    if (r.includes('newbie')) return '#CCCCCC';
    if (r.includes('pupil')) return '#00CC00';
    if (r.includes('specialist')) return '#03A89E';
    if (r.includes('expert')) return '#AAAAFF';
    if (r.includes('candidate master')) return '#FF88FF';
    if (r.includes('master')) return '#FFCC88';
    if (r.includes('grandmaster')) return '#FF7777';
    return '#808080';
  };

  const formatRank = (rank) => {
    if (!rank) return 'Unrated';
    return rank.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const rankColor = getRankColor(profile.rank);

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div 
        className="profile-modal-content-cool animate-slide-up" 
        onClick={e => e.stopPropagation()}
        style={{ '--rank-color': rankColor }}
      >
        <button className="close-btn" onClick={onClose}>
          <i className="fi fi-rr-cross"></i>
        </button>

        <div className="cool-card-left">
          <div className="cool-avatar-wrapper" style={{ boxShadow: `0 0 30px ${rankColor}40` }}>
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" />
            ) : (
              <div className="avatar-placeholder">{profile.cf_handle.charAt(0).toUpperCase()}</div>
            )}
          </div>
        </div>

        <div className="cool-card-right">
          <div className="cool-header-info">
            <h1 className={`cool-username ${getRankClass(profile.rank)}`}>
              {profile.cf_handle}
            </h1>
            <div className="cool-rating-display">
              <span className="cool-rating-badge">{formatRank(profile.rank)}</span>
            </div>
          </div>

          <div className="cool-stats-row">
            <div className="cool-stat-item">
              <span className="cool-stat-val">{profile.rating || 'N/A'}</span>
              <span className="cool-stat-lbl">Rating</span>
            </div>
            <div className="cool-stat-divider"></div>
            <div className="cool-stat-item">
              <span className="cool-stat-val">{cfInfo.maxRating || 'N/A'}</span>
              <span className="cool-stat-lbl">Max Rating</span>
            </div>
            <div className="cool-stat-divider"></div>
            <div className="cool-stat-item">
              <span className="cool-stat-val">{loading ? '...' : (kpis?.total_contests || 0)}</span>
              <span className="cool-stat-lbl">Contests</span>
            </div>
            <div className="cool-stat-divider"></div>
            <div className="cool-stat-item">
              <span className="cool-stat-val">{cfInfo.friendOfCount || 0}</span>
              <span className="cool-stat-lbl">Friends</span>
            </div>
          </div>

          <div className="cool-card-actions">
            <a 
              href={`https://codeforces.com/profile/${profile.cf_handle}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="cool-btn"
            >
              Codeforces Profile <i className="fi fi-rr-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
