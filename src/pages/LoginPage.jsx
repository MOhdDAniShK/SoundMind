import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AnimatedBackground from '../components/AnimatedBackground';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, loginWithCredentials } = useAuth();
  const googleBtnRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/home');
      return;
    }

    const initGoogle = () => {
      if (!window.google?.accounts?.id) {
        setTimeout(initGoogle, 200);
        return;
      }
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black', size: 'large', shape: 'pill', width: 360, text: 'continue_with',
        });
      }
    };
    initGoogle();
  }, [user, navigate]);

  const handleCredentialResponse = (response) => {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const userData = { id: payload.sub, name: payload.name, email: payload.email, picture: payload.picture, token: response.credential };
      localStorage.setItem('soundmind_user', JSON.stringify(userData));
      window.location.href = '/home';
    } catch (err) {
      setError('Sign-in failed. Please try again.');
    }
  };

  const handleEmailLogin = (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const result = loginWithCredentials(email, password);
      if (result.success) {
        navigate('/home');
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    }, 500);
  };

  const inputStyle = {
    width: '100%',
    padding: '0.85rem 1rem',
    paddingLeft: '2.75rem',
    fontSize: '0.95rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--color-border)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--color-text-main)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
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
          <h2 className="text-center text-xl font-semibold mb-2" style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--color-text-main)' }}>Welcome Back</h2>
          <p className="text-center text-sm text-[var(--color-text-muted)] mb-6">Sign in to begin your wellness journey</p>

          {error && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={() => {
              if (window.google?.accounts?.id && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
                window.google.accounts.id.prompt();
              } else {
                setError('Google Sign-In is not configured. Please use email/password.');
              }
            }}
            style={{
              width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem',
              border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.06)',
              color: 'var(--color-text-main)', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
          <div ref={googleBtnRef} style={{ display: 'none' }} />

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }}></div>
            <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }}></div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', opacity: 0.5 }}>📧</span>
              <input id="login-email" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                autoComplete="email" />
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', opacity: 0.5 }}>🔒</span>
              <input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isLoading} style={{ padding: '0.9rem', fontSize: '1rem', fontWeight: 700 }}>
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'white', borderTopColor: 'transparent' }} />
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-8">By signing in, you agree to SoundMind's Terms and Privacy Policy.</p>
      </div>
    </div>
  );
};

export default LoginPage;
