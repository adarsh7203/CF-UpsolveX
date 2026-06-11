import toast from 'react-hot-toast';

export const showModalAlert = (message, type = 'success') => {
  toast.custom(
    (t) => (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        pointerEvents: t.visible ? 'auto' : 'none'
      }}>
        {/* Dimming Backdrop */}
        <div 
          onClick={() => toast.dismiss(t.id)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            opacity: t.visible ? 1 : 0,
            transition: 'opacity 0.4s ease'
          }}
        />

        {/* Curved Rectangular Card */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            opacity: t.visible ? 1 : 0,
            transform: t.visible ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(30px)',
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            background: 'var(--bg-glass-card, #0f172a)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '32px',
            padding: '3rem 2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            maxWidth: '400px',
            width: '90vw'
          }}
        >
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: '1.5rem',
            filter: type === 'success' ? 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.5))' : 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.5))'
          }}>
            {type === 'success' ? '🎉' : '⚠️'}
          </div>
          
          <h2 style={{ 
            color: '#fff', 
            fontSize: '1.75rem', 
            fontWeight: '800', 
            marginBottom: '1rem', 
            marginTop: 0,
            letterSpacing: '-0.5px'
          }}>
            {type === 'success' ? 'Success!' : 'Error'}
          </h2>
          
          <p style={{ 
            color: 'var(--text-secondary, #cbd5e1)', 
            fontSize: '1.1rem', 
            margin: 0, 
            lineHeight: 1.6,
            fontWeight: '500'
          }}>
            {message}
          </p>

          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              marginTop: '2.5rem',
              background: type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#fff',
              border: 'none',
              padding: '1rem 3rem',
              borderRadius: '20px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: type === 'success' ? '0 8px 20px rgba(16, 185, 129, 0.3)' : '0 8px 20px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.2s ease',
              width: '100%'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = type === 'success' ? '0 12px 25px rgba(16, 185, 129, 0.4)' : '0 12px 25px rgba(239, 68, 68, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = type === 'success' ? '0 8px 20px rgba(16, 185, 129, 0.3)' : '0 8px 20px rgba(239, 68, 68, 0.3)';
            }}
          >
            {type === 'success' ? 'Awesome' : 'Okay'}
          </button>
        </div>
      </div>
    ),
    {
      duration: 3000,
    }
  );
};
