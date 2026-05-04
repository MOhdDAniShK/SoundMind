import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AnimatedBackground from '../components/AnimatedBackground';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const googleBtnRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // If already signed in, go to consent
    if (user) {
      navigate('/consent');
      return;
    }

    // Wait for Google Identity Services to load
    const initGoogle = () => {
      if (!window.google?.accounts?.id) {
        setTimeout(initGoogle, 200);
        return;
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        setError('Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in .env');
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });

      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          width: 360,
          text: 'continue_with',
        });
      }
    };

    initGoogle();
  }, [user, navigate]);

  const handleCredentialResponse = (response) => {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const userData = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        token: response.credential,
      };

      localStorage.setItem('soundmind_user', JSON.stringify(userData));
      // Force reload to re-read user from AuthContext
      window.location.href = '/consent';
    } catch (err) {
      setError('Sign-in failed. Please try again.');
      console.error('Google sign-in error:', err);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center animate-fade-in py-8 min-h-screen">
      <AnimatedBackground />
      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl text-white mb-6" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow-primary)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5.002 5.002 0 117.072 0l.146.146a3 3 0 01.88 2.121v.94a1 1 0 01-1 1H9.05a1 1 0 01-1-1v-.94a3 3 0 01.879-2.121l.146-.147z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-3">SoundMind</h1>
          <p className="text-lg text-[var(--color-text-secondary)]">AI-Powered Student Stress Detection</p>
        </div>

        {/* Login Card */}
        <div className="glass-card">
          <h2 className="text-center text-xl font-semibold mb-2" style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--color-text-main)' }}>Welcome</h2>
          <p className="text-center text-sm text-[var(--color-text-muted)] mb-8">Sign in to begin your wellness journey</p>

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              marginBottom: '1rem',
              fontSize: '0.8rem',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              {error}
            </div>
          )}

          {/* Google Sign-In Button (rendered by Google) */}
          <div style={{ display: 'flex', justifyContent: 'center', minHeight: '44px' }}>
            <div ref={googleBtnRef} />
          </div>

          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <>
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }}></div>
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">or</span>
                <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }}></div>
              </div>

              <button
                onClick={() => navigate('/consent')}
                className="btn btn-primary w-full py-3"
              >
                Continue as Guest →
              </button>
              <p className="text-center text-xs text-[var(--color-text-muted)] mt-3">
                Google Auth is not configured. Using guest mode.
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-8">By signing in, you agree to SoundMind's Terms and Privacy Policy.</p>
      </div>
    </div>
  );
};

export default LoginPage;
