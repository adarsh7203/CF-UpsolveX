import { useState } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Code2, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import './Auth.css';

const VERIFICATION_PROBLEMS = [
  { id: '4A', name: 'Watermelon' },
  { id: '71A', name: 'Way Too Long Words' },
  { id: '158A', name: 'Next Round' },
  { id: '231A', name: 'Team' },
  { id: '282A', name: 'Bit++' },
  { id: '50A', name: 'Domino piling' },
  { id: '112A', name: 'Petya and Strings' },
  { id: '339A', name: 'Helpful Maths' },
  { id: '266A', name: 'Stones on the Table' },
  { id: '236A', name: 'Boy or Girl' },
  { id: '546A', name: 'Soldier and Bananas' },
  { id: '791A', name: 'Bear and Big Brother' },
  { id: '617A', name: 'Elephant' },
  { id: '59A', name: 'Word' },
  { id: '977A', name: 'Wrong Subtraction' },
  { id: '110A', name: 'Nearly Lucky Number' },
  { id: '734A', name: 'Anton and Danik' },
  { id: '41A', name: 'Translation' },
  { id: '116A', name: 'Tram' },
  { id: '677A', name: 'Vanya and Fence' },
  { id: '271A', name: 'Beautiful Year' },
  { id: '136A', name: 'Presents' },
  { id: '467A', name: 'George and Accommodation' },
  { id: '1030A', name: 'In Search of an Easy Problem' },
  { id: '148A', name: 'Insomnia cure' },
  { id: '344A', name: 'Magnets' },
  { id: '486A', name: 'Calculating Function' },
  { id: '200B', name: 'Drinks' },
  { id: '1328A', name: 'Divisibility Problem' },
  { id: '228A', name: 'Is your horseshoe on the other hoof?' },
  { id: '705A', name: 'Hulk' },
  { id: '61A', name: 'Ultra-Fast Mathematician' },
  { id: '520A', name: 'Pangram' },
  { id: '144A', name: 'Arrival of the General' },
  { id: '469A', name: 'I Wanna Be the Guy' },
  { id: '155A', name: 'I_love_\\%username\\%' },
  { id: '996A', name: 'Hit the Lottery' }
];

const Auth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(location.state?.isLogin ?? true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationProblem, setVerificationProblem] = useState(VERIFICATION_PROBLEMS[0]);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRefreshProblem = () => {
    const currentIndex = VERIFICATION_PROBLEMS.findIndex(p => p.id === verificationProblem.id);
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * VERIFICATION_PROBLEMS.length);
    } while (nextIndex === currentIndex);
    setVerificationProblem(VERIFICATION_PROBLEMS[nextIndex]);
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      handleSubmit(e);
    } else {
      // Validate input before showing modal
      if (!email || !password || !handle) {
        setError("Please fill all fields.");
        return;
      }
      setShowVerificationModal(true);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        // Sign Up Flow
        // We hit our FastAPI backend directly to ensure the handle and user are created atomically
        const API_URL = import.meta.env.VITE_API_URL || 'https://cf-upsolvex.onrender.com/api';
        const response = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, cf_handle: handle, verification_problem: verificationProblem.id })
        });

        const backendData = await response.json();
        if (!response.ok) {
          throw new Error(backendData.detail || 'Failed to register account');
        }

        // If signup is successful, we automatically log them in so Supabase sets the local session
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Decorative Orbs */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>

      <button 
        onClick={() => navigate('/')} 
        style={{ 
          position: 'absolute', 
          top: '2rem', 
          left: '2rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'var(--bg-glass)', 
          backdropFilter: 'blur(10px)', 
          border: '1px solid var(--border-subtle)', 
          padding: '0.5rem 1rem', 
          borderRadius: 'var(--radius-xl)', 
          color: 'var(--text-muted)', 
          cursor: 'pointer', 
          fontSize: '0.9rem', 
          fontWeight: 500, 
          transition: 'all 0.2s',
          zIndex: 10
        }}
        onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateX(-3px)'; }}
        onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateX(0)'; }}
      >
        <ArrowLeft size={16} /> Back to Home
      </button>

      <div className="auth-container glass-panel animate-slide-up">
        <div className="auth-header">
          <div className="logo-container mx-auto mb-4">
            <Code2 size={24} />
          </div>
          <h2 className="auth-title">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
          <p className="auth-subtitle">
            {isLogin ? 'Enter your details to access your dashboard' : 'Start tracking your Codeforces progression'}
          </p>
        </div>

        {error && !showVerificationModal && (
          <div className="auth-error animate-fade-in" style={error.includes("VERIFICATION_FAILED") ? { background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', lineHeight: '1.5' } : {}}>
            {error.includes("VERIFICATION_FAILED") ? (
              <div>
                <strong>Verification Failed:</strong><br />
                {error.replace("VERIFICATION_FAILED:", "")}
              </div>
            ) : error}
          </div>
        )}

        <form onSubmit={handlePreSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label>Codeforces Handle</label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. tourist"
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" className="toggle-btn" onClick={() => { setIsLogin(!isLogin); setError(null); }}>
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>

      {showVerificationModal && (
        <div className="verification-modal-backdrop" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(5, 10, 20, 0.85)', backdropFilter: 'blur(8px)', 
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
        }}>
          <div className="glass-panel animate-slide-up" style={{
            padding: '2.5rem', width: '100%', maxWidth: '440px',
            position: 'relative', zIndex: 10
          }}>
            <button 
              onClick={() => setShowVerificationModal(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', transition: 'background 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-main)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <i className="fi fi-rr-cross-small"></i>
            </button>

            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: '600' }}>Codeforces Verification</h3>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>HANDLE</div>
              <div style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{handle}</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PROBLEM</div>
                <button 
                  type="button" 
                  onClick={handleRefreshProblem}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', transition: 'background 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <i className="fi fi-rr-refresh"></i> Change problem
                </button>
              </div>
              <div style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', fontWeight: '600', marginBottom: '0.75rem' }}>
                <a href={`https://codeforces.com/problemset/problem/${verificationProblem.id.match(/^(\d+)/)[1]}/${verificationProblem.id.match(/([A-Z]\d*)$/)[1]}`} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                  {verificationProblem.name} ({verificationProblem.id})
                </a>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Submit a <strong>Compilation Error</strong> on this problem, then verify.
              </div>
            </div>

            {error && (
              <div className="auth-error" style={{ fontSize: '0.85rem', marginBottom: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                {error.replace("VERIFICATION_FAILED:", "").trim()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="btn-primary"
                style={{ flex: 1, height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Verify Submission'}
              </button>
              <button 
                onClick={() => setShowVerificationModal(false)}
                disabled={loading}
                style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-strong)', height: '48px', padding: '0 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
