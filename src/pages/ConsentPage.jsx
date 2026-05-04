import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import AnimatedBackground from '../components/AnimatedBackground';

const ConsentPage = () => {
  const navigate = useNavigate();
  const { dispatch } = useAppContext();
  const [agreements, setAgreements] = useState({ webcam: false, dataProcessing: false, research: false, parentNotification: false });
  const [parentInfo, setParentInfo] = useState({ name: '', phone: '', email: '' });

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setAgreements(prev => ({ ...prev, [name]: checked }));
  };

  const handleParentInfoChange = (e) => {
    const { name, value } = e.target;
    setParentInfo(prev => ({ ...prev, [name]: value }));
  };

  // Required: webcam, dataProcessing, research
  const requiredAgreed = agreements.webcam && agreements.dataProcessing && agreements.research;

  const handleStart = () => {
    dispatch({ type: 'SET_CONSENT', payload: { ...agreements, timestamp: new Date().toISOString() } });
    if (agreements.parentNotification && (parentInfo.phone || parentInfo.email)) {
      dispatch({ type: 'SET_PARENT_CONTACT', payload: parentInfo });
    }
    navigate('/survey');
  };

  const consentItems = [
    { name: 'webcam', icon: '📷', title: 'Webcam & Input Access', desc: 'Allow webcam for facial analysis and keyboard/cursor tracking for behavioral analysis. All processed locally — NEVER uploaded.', required: true },
    { name: 'dataProcessing', icon: '🔒', title: 'Data Processing', desc: 'Allow survey responses and AI insights to be processed for personalized recommendations.', required: true },
    { name: 'research', icon: '📊', title: 'Research & Anonymity', desc: 'Anonymized data may be used to improve the SoundMind application.', required: true },
  ];

  return (
    <div className="flex-1 flex items-center justify-center animate-fade-in py-8">
      <AnimatedBackground />
      <div className="glass-card max-w-2xl w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full text-white mb-4" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow-primary)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Before We Begin</h1>
          <p className="text-lg">Your privacy is our priority</p>
        </div>

        <div className="space-y-3 mb-6">
          {consentItems.map(item => (
            <label key={item.name} className="checkbox-container">
              <input type="checkbox" name={item.name} checked={agreements[item.name]} onChange={handleCheckboxChange} />
              <span className="flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <strong className="text-[var(--color-text-main)]">{item.title}</strong>
                  {item.required && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>Required</span>}
                </span>
                <span className="block text-sm text-[var(--color-text-muted)] mt-1">{item.desc}</span>
              </span>
            </label>
          ))}
        </div>

        {/* Parent Notification — Optional */}
        <div style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem',
          marginBottom: '1.5rem',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <label className="checkbox-container" style={{ marginBottom: agreements.parentNotification ? '1rem' : 0, border: 'none', padding: '0.5rem' }}>
            <input type="checkbox" name="parentNotification" checked={agreements.parentNotification} onChange={handleCheckboxChange} />
            <span className="flex-1">
              <span className="flex items-center gap-2">
                <span className="text-lg">👨‍👩‍👧</span>
                <strong className="text-[var(--color-text-main)]">Parent/Guardian Alert</strong>
                <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 600 }}>Optional</span>
              </span>
              <span className="block text-sm text-[var(--color-text-muted)] mt-1">
                If your stress level is critical (9+/10), we'll automatically notify your parent/guardian with a supportive message. You can provide their contact info below.
              </span>
            </span>
          </label>

          {agreements.parentNotification && (
            <div style={{
              display: 'grid',
              gap: '0.75rem',
              paddingLeft: '2.25rem',
              animation: 'fadeIn 0.3s ease-out',
            }}>
              <div>
                <label className="input-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Guardian Name</label>
                <input
                  type="text"
                  name="name"
                  value={parentInfo.name}
                  onChange={handleParentInfoChange}
                  placeholder="e.g., Mom, Dad, Guardian"
                  className="input-field"
                  style={{ padding: '0.65rem 0.875rem', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="input-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={parentInfo.phone}
                    onChange={handleParentInfoChange}
                    placeholder="+1 (555) 000-0000"
                    className="input-field"
                    style={{ padding: '0.65rem 0.875rem', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label className="input-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={parentInfo.email}
                    onChange={handleParentInfoChange}
                    placeholder="parent@email.com"
                    className="input-field"
                    style={{ padding: '0.65rem 0.875rem', fontSize: '0.9rem' }}
                  />
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                📩 Message sent: "Your child used SoundMind and their stress level is high. Please check in with them."
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center">
          <button className="btn btn-primary w-full max-w-sm mb-4 py-3.5 text-lg" disabled={!requiredAgreed} onClick={handleStart}>
            Start Assessment ✨
          </button>
          {!requiredAgreed && <p className="text-sm text-[var(--color-level-4)]">Please agree to all required terms to proceed.</p>}
        </div>
      </div>
    </div>
  );
};

export default ConsentPage;
