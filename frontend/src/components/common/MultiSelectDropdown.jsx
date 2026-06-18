import { useState, useRef, useEffect } from 'react';

const MultiSelectDropdown = ({ options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter(item => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const displayValue = selected.length === 0 
    ? "All Types" 
    : selected.length === 1 
      ? options.find(o => o.id === selected[0])?.label 
      : `${selected.length} Selected`;

  return (
    <div className="multi-select-dropdown" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          color: '#fff',
          border: '1px solid var(--border-color)',
          padding: '0.65rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.9rem',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <span>{displayValue}</span>
        <i className={`fi fi-rr-angle-small-${isOpen ? 'up' : 'down'}`}></i>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '0.25rem',
          background: '#1e293b',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.5rem',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
        }}>
          {options.map(option => (
            <label 
              key={option.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                fontSize: '0.85rem', 
                color: '#fff', 
                cursor: 'pointer',
                padding: '0.4rem 0.5rem',
                borderRadius: '4px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={selected.includes(option.id)}
                  onChange={() => handleToggle(option.id)}
                  style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }}
                />
                <div style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '0.35rem',
                  border: selected.includes(option.id) ? 'none' : '2px solid rgba(255,255,255,0.15)',
                  backgroundColor: selected.includes(option.id) ? 'var(--accent-primary)' : 'rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: selected.includes(option.id) ? '0 0 10px rgba(99, 102, 241, 0.4)' : 'none'
                }}>
                  {selected.includes(option.id) && (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              {option.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
