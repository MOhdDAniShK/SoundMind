import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { getAssessmentHistory } from '../services/apiService';
import AnimatedBackground from '../components/AnimatedBackground';

const STRESSOR_OPTIONS = ["Academic/Grades","Social/Relationships","Family","Health","Financial","Career/Future","Nothing specific"];
const CONSENT_KEY = 'soundmind_consent_data';

// ── Onboarding Modal ──
const OnboardingModal = ({ onComplete }) => {
  const [step, setStep] = useState(0); // 0=consent, 1=profile, 2=parent
  const [agreements, setAgreements] = useState({ webcam: false, dataProcessing: false, research: false });
  const [profile, setProfile] = useState({ hobbies: '', primaryStressor: '', overwhelmingSubject: '' });
  const [parentInfo, setParentInfo] = useState({ name: '', phone: '', email: '' });

  const allAgreed = agreements.webcam && agreements.dataProcessing && agreements.research;
  const hasParentEmail = parentInfo.email.trim().length > 0;

  const inputStyle = {
    padding: '0.7rem 0.875rem', fontSize: '0.9rem', borderRadius: '0.5rem',
    border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.04)',
    color: 'var(--color-text-main)', width: '100%', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
  };
  const focusStyle = e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; };
  const blurStyle = e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; };

  const consentItems = [
    { name: 'webcam', icon: '📷', title: 'Webcam & Input Access', desc: 'Allow webcam for facial analysis. All processed locally.' },
    { name: 'dataProcessing', icon: '🔒', title: 'Data Processing', desc: 'Allow survey responses to be processed for recommendations.' },
    { name: 'research', icon: '📊', title: 'Research & Anonymity', desc: 'Anonymized data may improve the app.' },
  ];

  const steps = [
    // Step 0: Consent
    <div key="consent">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Privacy & Consent</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>We need your permission before we begin.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {consentItems.map(item => (
          <label key={item.name} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', cursor: 'pointer', background: agreements[item.name] ? 'rgba(99,102,241,0.08)' : 'transparent', transition: 'all 0.2s' }}>
            <input type="checkbox" checked={agreements[item.name]} onChange={e => setAgreements(p => ({ ...p, [item.name]: e.target.checked }))} style={{ marginTop: '0.2rem', accentColor: 'var(--color-primary)' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>{item.icon}</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{item.title}</strong>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.desc}</span>
            </div>
          </label>
        ))}
      </div>
      <button className="btn btn-primary w-full" style={{ marginTop: '1.25rem', padding: '0.75rem' }} disabled={!allAgreed} onClick={() => setStep(1)}>
        Continue →
      </button>
    </div>,

    // Step 1: Profile
    <div key="profile">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Quick Profile ✨</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>Helps us personalize tasks to your interests.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>🎯 Your hobbies / idle time activities</label>
          <input type="text" value={profile.hobbies} onChange={e => setProfile(p => ({ ...p, hobbies: e.target.value }))} placeholder="e.g., Reading, Gaming, Drawing, Running..." style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>🧠 Biggest mental energy drain</label>
          <select value={profile.primaryStressor} onChange={e => setProfile(p => ({ ...p, primaryStressor: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }} onFocus={focusStyle} onBlur={blurStyle}>
            <option value="">Select...</option>
            {STRESSOR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>📚 Most overwhelming subject/area</label>
          <input type="text" value={profile.overwhelmingSubject} onChange={e => setProfile(p => ({ ...p, overwhelmingSubject: e.target.value }))} placeholder="e.g., AP Calculus, Organic Chemistry..." style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
      </div>
      <button className="btn btn-primary w-full" style={{ marginTop: '1.25rem', padding: '0.75rem' }} onClick={() => setStep(2)}>Continue →</button>
    </div>,

    // Step 2: Parent contact
    <div key="parent">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Parent/Guardian Contact 👨‍👩‍👧</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>Required for safety — we'll notify them only if your stress is critical (9+/10).</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>Guardian Name</label>
          <input type="text" value={parentInfo.name} onChange={e => setParentInfo(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Mom, Dad" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="email" value={parentInfo.email} onChange={e => setParentInfo(p => ({ ...p, email: e.target.value }))} placeholder="parent@email.com" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
          {!hasParentEmail && <p style={{ fontSize: '0.7rem', color: '#ef4444', margin: '0.3rem 0 0' }}>⚠️ Required for safety notifications.</p>}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>Phone (optional)</label>
          <input type="tel" value={parentInfo.phone} onChange={e => setParentInfo(p => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 000-0000" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
      </div>
      <button className="btn btn-primary w-full" style={{ marginTop: '1.25rem', padding: '0.75rem' }} disabled={!hasParentEmail} onClick={() => onComplete({ agreements, profile, parentInfo })}>
        Complete Setup ✨
      </button>
    </div>,
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', margin: '1rem', padding: '2rem', borderRadius: '1.25rem', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(139,92,246,0.1)' }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: i === step ? '2rem' : '0.5rem', height: '0.5rem', borderRadius: '9999px', background: i <= step ? 'var(--color-primary)' : 'var(--color-border)', transition: 'all 0.3s' }} />
          ))}
        </div>
        {steps[step]}
      </div>
    </div>
  );
};

// ── Main HomePage ──
const HomePage = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Check if onboarding is needed
  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (!saved) {
      setShowOnboarding(true);
    } else {
      try {
        const parsed = JSON.parse(saved);
        // Restore context silently
        if (parsed.agreements) dispatch({ type: 'SET_CONSENT', payload: { ...parsed.agreements, parentNotification: true, timestamp: new Date().toISOString() } });
        if (parsed.profile?.hobbies) dispatch({ type: 'SET_USER_HOBBIES', payload: parsed.profile.hobbies });
        if (parsed.profile?.primaryStressor) dispatch({ type: 'SET_USER_PRIMARY_STRESSOR', payload: parsed.profile.primaryStressor });
        if (parsed.profile?.overwhelmingSubject) dispatch({ type: 'SET_USER_OVERWHELMING_SUBJECT', payload: parsed.profile.overwhelmingSubject });
        if (parsed.parentInfo) dispatch({ type: 'SET_PARENT_CONTACT', payload: parsed.parentInfo });
      } catch { /* ignore */ }
    }
  }, []);

  // Load history and auto-restore latest score to avoid re-taking survey every login
  useEffect(() => {
    (async () => { 
      const hist = await getAssessmentHistory();
      setHistory(hist); 
      setIsLoading(false); 
      
      // If there's history but the app state was just reset (e.g., fresh login/refresh), 
      // restore the latest score so the user doesn't have to take the survey again
      if (hist && hist.length > 0 && state.finalScore === 0) {
        const latest = hist[0];
        if (latest.finalScore) dispatch({ type: 'SET_FINAL_SCORE', payload: latest.finalScore });
        if (latest.surveyData) dispatch({ type: 'SET_SURVEY', payload: { data: latest.surveyData, score: latest.surveyScore || 0 } });
        if (latest.behavioralData) dispatch({ type: 'SET_BEHAVIORAL', payload: { data: latest.behavioralData, score: latest.behavioralScore || 0 } });
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const handleOnboardingComplete = ({ agreements, profile, parentInfo }) => {
    dispatch({ type: 'SET_CONSENT', payload: { ...agreements, parentNotification: true, timestamp: new Date().toISOString() } });
    if (profile.hobbies) dispatch({ type: 'SET_USER_HOBBIES', payload: profile.hobbies });
    if (profile.primaryStressor) dispatch({ type: 'SET_USER_PRIMARY_STRESSOR', payload: profile.primaryStressor });
    if (profile.overwhelmingSubject) dispatch({ type: 'SET_USER_OVERWHELMING_SUBJECT', payload: profile.overwhelmingSubject });
    dispatch({ type: 'SET_PARENT_CONTACT', payload: parentInfo });
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ agreements, profile, parentInfo, savedAt: new Date().toISOString() }));
    localStorage.setItem('soundmind_profile', JSON.stringify(profile));
    setShowOnboarding(false);
  };

  const greeting = () => {
    const h = currentTime.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const lastScore = history.length > 0 ? history[0] : null;
  const userName = user?.name?.split(' ')[0] || 'Student';

  const quickActions = [
    { icon: '📋', title: 'New Assessment', desc: 'Take a stress evaluation', color: '#6366f1', path: '/survey' },
    { icon: '💬', title: 'AI Counselor', desc: 'Talk through your feelings', color: '#8b5cf6', path: '/chat', locked: !state.surveyData && state.finalScore === 0 },
    { icon: '🎯', title: 'My Tasks', desc: 'View personalized activities', color: '#06b6d4', path: '/interventions', locked: !state.surveyData && state.finalScore === 0 },
    { icon: '📈', title: 'Dashboard', desc: 'Track your progress', color: '#22c55e', path: '/history' },
  ];

  const wellnessTips = [
    "💧 Stay hydrated — even mild dehydration can increase cortisol levels.",
    "🌿 Try the 5-4-3-2-1 grounding technique when feeling overwhelmed.",
    "😴 Aim for 7-9 hours of sleep — it's your brain's reset button.",
    "🎵 Music reduces anxiety by up to 65% according to research.",
    "🚶 A 10-minute walk can boost mood for up to 2 hours.",
    "📱 Take a 15-minute social media break — your mind will thank you.",
    "🧘 Just 5 minutes of deep breathing activates your rest-and-digest system.",
    "📝 Writing about worries for 10 minutes reduces their mental weight significantly.",
  ];
  const todayTip = wellnessTips[Math.floor(currentTime.getDate() % wellnessTips.length)];

  return (
    <div className="flex-1 animate-fade-in py-4 max-w-5xl mx-auto w-full">
      <AnimatedBackground />
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

      {/* Welcome Header */}
      <div style={{ position: 'relative', zIndex: 1, marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          {greeting()}, {userName} 👋
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', margin: 0 }}>
          {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ position: 'relative', zIndex: 1 }}>
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions Grid */}
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text-main)', WebkitTextFillColor: 'unset', background: 'none' }}>Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => action.locked ? alert('Complete an assessment first to unlock this!') : navigate(action.path)}
                  style={{
                    padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-card)', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.25s', opacity: action.locked ? 0.5 : 1, position: 'relative', overflow: 'hidden',
                  }}
                  onMouseOver={e => { if (!action.locked) { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 25px ${action.color}20`; }}}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{action.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-main)', marginBottom: '0.2rem' }}>{action.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{action.desc}</div>
                  {action.locked && <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', fontSize: '0.85rem' }}>🔒</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Wellness Tip */}
          <div className="glass-card" style={{ borderLeft: '3px solid #22c55e' }}>
            <div className="flex items-start gap-4">
              <span className="text-3xl shrink-0">🌟</span>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-main)', WebkitTextFillColor: 'unset', background: 'none' }}>Daily Wellness Tip</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>{todayTip}</p>
              </div>
            </div>
          </div>

          {/* Recent History */}
          {!isLoading && history.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-main)', WebkitTextFillColor: 'unset', background: 'none', margin: 0 }}>Recent Assessments</h2>
                <button onClick={() => navigate('/history')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>View All →</button>
              </div>
              <div className="space-y-2">
                {history.slice(0, 3).map(entry => {
                  const scoreColor = entry.finalScore >= 9 ? '#ef4444' : entry.finalScore >= 8 ? '#f97316' : entry.finalScore >= 6 ? '#3b82f6' : '#22c55e';
                  return (
                    <div key={entry.id} className="metric-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                          {new Date(entry.timestamp).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{entry.category}</div>
                      </div>
                      <span style={{ padding: '0.35rem 0.75rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.85rem', color: 'white', backgroundColor: scoreColor }}>{entry.finalScore.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Current Status Card */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-main)', WebkitTextFillColor: 'unset', background: 'none' }}>
              Your Status
            </h3>
            {lastScore ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.25rem' }}>
                  {lastScore.finalScore.toFixed(1)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Last Score • {lastScore.category}</div>
                <div style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', background: 'rgba(99,102,241,0.08)', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  {history.length} assessment{history.length !== 1 ? 's' : ''} completed
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🧠</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 1rem' }}>No assessments yet</p>
                <button className="btn btn-primary text-sm w-full" onClick={() => navigate('/survey')}>Take First Assessment</button>
              </div>
            )}
          </div>

          {/* Settings Quick Access */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text-main)', WebkitTextFillColor: 'unset', background: 'none' }}>Settings</h3>
            <button onClick={() => setShowOnboarding(true)} style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--color-text-secondary)', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            >
              ⚙️ Update Profile & Consent
            </button>
          </div>

          {/* Crisis Line */}
          <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p style={{ fontSize: '0.75rem', color: '#fca5a5', margin: 0, lineHeight: 1.6 }}>
              <strong>Need help now?</strong><br />
              📞 <a href="tel:988" style={{ color: '#f87171', textDecoration: 'none' }}>988 Suicide & Crisis Lifeline</a><br />
              💬 Text HOME to 741741
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
