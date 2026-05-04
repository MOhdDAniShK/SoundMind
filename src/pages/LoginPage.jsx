import React from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';

const LoginPage = () => {
  const navigate = useNavigate();
  const handleGoogleSignIn = () => navigate('/consent');

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
          <p className="text-center text-sm text-[var(--color-text-muted)] mb-8">Sign in to continue your wellness journey</p>

          <button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border-2 rounded-xl font-medium transition-all duration-200 cursor-pointer group" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--color-border-hover)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }}></div>
            <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }}></div>
          </div>

          <div className="space-y-4">
            <div><label className="input-label">Email</label><input type="email" placeholder="student@school.edu" className="input-field" disabled /></div>
            <div><label className="input-label">Password</label><input type="password" placeholder="••••••••" className="input-field" disabled /></div>
            <button className="btn w-full py-3 cursor-not-allowed" style={{ background: 'rgba(100,116,139,0.2)', color: 'var(--color-text-muted)' }} disabled>Sign In</button>
            <p className="text-center text-xs text-[var(--color-text-muted)] mt-2">Email/password login coming soon.</p>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-8">By signing in, you agree to SoundMind's Terms and Privacy Policy.</p>
      </div>
    </div>
  );
};

export default LoginPage;
