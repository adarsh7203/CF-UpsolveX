import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, Code2, LineChart, Target, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

const Landing = () => {
  const { user } = useAuth();

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    {
      icon: Target,
      title: "Priority Upsolve Queue",
      description: "Stop guessing what to solve next. Our algorithm recommends the perfect problems based on your rating, recency, and failed attempts."
    },
    {
      icon: LineChart,
      title: "Advanced Analytics",
      description: "Visualize your contest completion trends, track your progression, and spot regressions before they become habits."
    },
    {
      icon: Zap,
      title: "Smart Reminders",
      description: "Get gentle nudges via email highlighting the problems you missed. You can still reach 100% completion."
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav glass-panel">
        <div className="nav-brand">
          <Code2 className="text-accent" size={24} />
          <span className="font-bold text-xl">CF UpsolveX</span>
        </div>
        <div className="nav-actions">
          <Link to="/auth" className="btn-ghost">Login</Link>
          <Link to="/auth" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <div className="badge animate-slide-up stagger-1">
            <span className="pulse-dot"></span>
            Version 4.0 is now live
          </div>
          
          <h1 className="hero-title animate-slide-up stagger-2">
            Track. Upsolve. <span className="text-gradient">Improve.</span>
          </h1>
          
          <p className="hero-subtitle animate-slide-up stagger-3">
            The ultimate companion for competitive programmers. Automatically track your Codeforces contests, prioritize missed problems, and visualize your true rating potential.
          </p>
          
          <div className="hero-cta animate-slide-up stagger-4">
            <Link to="/auth" className="btn-primary btn-large">
              Start Upsolving <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="glow-orb orb-1 animate-float"></div>
        <div className="glow-orb orb-2 animate-float" style={{ animationDelay: '2s' }}></div>
      </header>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Everything you need to reach Candidate Master</h2>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="feature-card glass-panel">
              <div className="feature-icon-wrapper">
                <feature.icon className="feature-icon" size={24} />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2026 CF UpsolveX. Built for competitive programmers.</p>
      </footer>
    </div>
  );
};

export default Landing;
