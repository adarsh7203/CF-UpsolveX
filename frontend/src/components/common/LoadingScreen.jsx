import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';
import { cpTips } from '../../data/cp_tips';

const LoadingScreen = ({ message = 'Syncing Codeforces Data' }) => {
  const [selectedTips, setSelectedTips] = useState([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Pick 3 random tips
  useEffect(() => {
    const shuffled = [...cpTips].sort(() => 0.5 - Math.random());
    setSelectedTips(shuffled.slice(0, 3));
    setCurrentTipIndex(0);
    setDisplayedText('');
    setIsTyping(true);
  }, [refreshTrigger]);

  // Typewriter effect
  useEffect(() => {
    if (selectedTips.length === 0) return;

    if (currentTipIndex >= selectedTips.length) {
      // All 3 tips are done. Wait 3 seconds, then pick 3 new tips.
      const timeout = setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 3000);
      return () => clearTimeout(timeout);
    }

    const fullText = selectedTips[currentTipIndex];
    
    if (displayedText.length < fullText.length) {
      setIsTyping(true);
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 30); // Typing speed
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
      // Wait a bit before starting the next tip
      const timeout = setTimeout(() => {
        setCurrentTipIndex((prev) => prev + 1);
        setDisplayedText('');
      }, 2000); // Pause between tips
      return () => clearTimeout(timeout);
    }
  }, [displayedText, currentTipIndex, selectedTips]);

  return (
    <div className="terminal-loading-container animate-fade-in">
      <div className="terminal-card">
        <div className="terminal-header">
          <div className="terminal-dots">
            <div className="terminal-dot red"></div>
            <div className="terminal-dot yellow"></div>
            <div className="terminal-dot green"></div>
          </div>
          <div className="terminal-title">
            <i className="fi fi-rr-rotate-right sync-spin"></i>
            {message}... <span style={{ opacity: 0.6, fontSize: '12px', marginLeft: '6px', fontWeight: 'normal' }}>(CF API limits may cause slight delays)</span>
          </div>
        </div>
        
        <div className="terminal-body">
          {/* Render already completed tips */}
          {selectedTips.slice(0, currentTipIndex).map((tip, idx) => (
            <div key={idx} className="terminal-line">
              <span className="terminal-prompt">~</span>
              <span className="terminal-text">{tip}</span>
            </div>
          ))}
          
          {/* Render the currently typing tip */}
          {currentTipIndex < selectedTips.length && (
            <div className="terminal-line">
              <span className="terminal-prompt">~</span>
              <span className="terminal-text">{displayedText}</span>
              {isTyping && <span className="terminal-cursor"></span>}
            </div>
          )}

          {/* If all 3 are done, keep blinking cursor at end until refresh */}
          {currentTipIndex >= selectedTips.length && (
            <div className="terminal-line">
              <span className="terminal-prompt">~</span>
              <span className="terminal-cursor"></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
