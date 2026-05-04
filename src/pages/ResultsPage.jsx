import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import StressGauge from '../components/StressGauge';
import AnimatedBackground from '../components/AnimatedBackground';
import { getScoreCategory } from '../utils/stressCalculator';
import { saveAssessment } from '../services/apiService';

const ResultsPage = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const { user } = useAuth();
  const [notificationStatus, setNotificationStatus] = useState(null); // null | 'sending' | 'sent' | 'failed' | 'not_configured'

  useEffect(() => {
    if (state.finalScore === 0 && !state.surveyData) {
      navigate('/home');
    }
  }, [state, navigate]);

  // Auto-send parent notification when score >= 9
  useEffect(() => {
    const sendParentNotification = async () => {
      const { finalScore, consent, parentContact, parentNotificationSent } = state;

      // Only send if: score >= 9, parent notification opted in, email provided, and not already sent
      if (
        finalScore >= 9 &&
        consent.parentNotification &&
        parentContact?.email &&
        !parentNotificationSent
      ) {
        setNotificationStatus('sending');
        try {
          const response = await fetch('/api/notify-parent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              parentName: parentContact.name || 'Parent/Guardian',
              parentEmail: parentContact.email,
              parentPhone: parentContact.phone || '',
              studentName: user?.name || 'Your child',
              stressScore: finalScore,
              message: `Your child completed a wellness assessment on SoundMind and their stress level is ${finalScore}/10 (Critical). Please check in with them.`,
            }),
          });

          const data = await response.json();
          if (data.success) {
            setNotificationStatus('sent');
            dispatch({ type: 'SET_PARENT_NOTIFICATION_SENT', payload: true });
          } else {
            setNotificationStatus('failed');
          }
        } catch (err) {
          console.error('Failed to send parent notification:', err);
          setNotificationStatus('failed');
        }
      } else if (finalScore >= 9 && (!state.consent.parentNotification || !parentContact?.email)) {
        setNotificationStatus('not_configured');
      }
    };

    if (state.finalScore > 0) {
      sendParentNotification();
    }
  }, [state.finalScore]); // eslint-disable-line react-hooks/exhaustive-deps

  const { finalScore, surveyScore, behavioralScore, keyboardScore, behavioralData, keyboardData, surveyData } = state;
  const category = getScoreCategory(finalScore);

  const handleSaveAndProceed = async () => {
    const assessment = {
      surveyData,
      behavioralData,
      keyboardData,
      surveyScore,
      behavioralScore,
      keyboardScore,
      finalScore,
      category: category.label
    };

    await saveAssessment(assessment);
    dispatch({ type: 'ADD_ASSESSMENT', payload: assessment });
    navigate('/interventions');
  };

  return (
    <div className="flex-1 animate-fade-in py-4 w-full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <AnimatedBackground />

      <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Assessment Complete</h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--color-text-secondary)', margin: 0 }}>Here is your personalized stress analysis.</p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
        width: '100%',
        maxWidth: '600px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Parent Notification Banner */}
        {notificationStatus && notificationStatus !== 'not_configured' && (
          <div style={{
            width: '100%',
            padding: '0.875rem 1.25rem',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            animation: 'fadeIn 0.4s ease-out',
            ...(notificationStatus === 'sent' ? {
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#4ade80',
            } : notificationStatus === 'sending' ? {
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#818cf8',
            } : {
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
            }),
          }}>
            <span style={{ fontSize: '1.25rem' }}>
              {notificationStatus === 'sent' ? '✅' : notificationStatus === 'sending' ? '📧' : '⚠️'}
            </span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {notificationStatus === 'sent' && 'Parent/Guardian Notified'}
                {notificationStatus === 'sending' && 'Sending notification to parent/guardian...'}
                {notificationStatus === 'failed' && 'Notification could not be sent'}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.15rem' }}>
                {notificationStatus === 'sent' && `An email has been sent to ${state.parentContact?.email} with your stress assessment results.`}
                {notificationStatus === 'sending' && 'Please wait while we notify your parent/guardian about your stress level.'}
                {notificationStatus === 'failed' && 'Please reach out to your parent/guardian directly if you need support.'}
              </div>
            </div>
          </div>
        )}

        {/* Critical stress warning for score >= 9 without parent notification */}
        {finalScore >= 9 && notificationStatus === 'not_configured' && (
          <div style={{
            width: '100%',
            padding: '0.875rem 1.25rem',
            borderRadius: '0.75rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            animation: 'fadeIn 0.4s ease-out',
          }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              ⚠️ Your stress level is critical
            </div>
            <div style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
              Please consider talking to a trusted adult, school counselor, or calling <strong>988</strong> (Suicide & Crisis Lifeline).
              You can enable parent notifications in your consent settings to automatically alert your guardian.
            </div>
          </div>
        )}

        {/* Main Gauge Card */}
        <div className="glass-card" style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2.5rem 2rem',
        }}>
          <h2 style={{
            marginBottom: '2rem',
            WebkitTextFillColor: 'unset',
            background: 'none',
            color: 'var(--color-text-main)',
            fontSize: '1.5rem',
          }}>
            Your Stress Level
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <StressGauge score={finalScore} />
          </div>

          <div style={{ marginTop: '2.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <span
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '1.125rem',
                color: 'white',
                backgroundColor: category.color,
                boxShadow: `0 0 25px ${category.color}40`,
                display: 'inline-block',
              }}
            >
              {category.label}
            </span>
          </div>

          <p style={{
            fontSize: '0.875rem',
            padding: '0 1rem',
            color: 'var(--color-text-muted)',
            marginTop: '0.5rem',
            marginBottom: 0,
          }}>
            This score is calculated holistically based on your survey responses and behavioral analysis.
          </p>
        </div>

        <div style={{ width: '100%' }}>
          <button
            className="btn btn-primary"
            onClick={handleSaveAndProceed}
            style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}
          >
            View My Action Plan →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;

