
import { ExternalLink, Target } from 'lucide-react';
import './PriorityQueue.css';

const PriorityQueue = ({ queue }) => {
  const problems = queue;
  if (!problems || problems.length === 0) {
    return (
      <div className="empty-queue">
        <Target size={32} className="text-muted mb-2" />
        <p>No upsolves recommended right now!</p>
        <span className="text-muted text-sm">Check back after your next contest.</span>
      </div>
    );
  }

  const getDifficultyColor = (rating) => {
    if (!rating) return '#94a3b8'; // Unrated
    if (rating < 1200) return '#34d399'; // Newbie (Greenish)
    if (rating < 1600) return '#60a5fa'; // Specialist (Blue)
    if (rating < 2000) return '#a78bfa'; // CM (Purple)
    return '#f87171'; // Master+ (Red)
  };

  return (
    <div className="queue-list">
      {problems.map((prob, idx) => (
        <div key={`${prob.contest_id}-${prob.problem_index}`} className="queue-item glass-panel">
          
          <div className="queue-item-left">
            <div className="queue-rank">#{idx + 1}</div>
            <div className="queue-details">
              <h4>{prob.problem_index} - {prob.contest_id}</h4>
              <span className="rating-badge" style={{ color: getDifficultyColor(prob.problem_rating), borderColor: getDifficultyColor(prob.problem_rating) }}>
                {prob.problem_rating || 'Unrated'}
              </span>
            </div>
          </div>

          <div className="queue-item-right">
            <div className="attempts-info">
              <span className="text-muted">Failed Attempts:</span>
              <span className="font-bold text-red">{prob.failed_attempts}</span>
            </div>
            
            <a 
              href={prob.problem_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="solve-btn"
            >
              Solve <ExternalLink size={14} />
            </a>
          </div>

        </div>
      ))}
    </div>
  );
};

export default PriorityQueue;
