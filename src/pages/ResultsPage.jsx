import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import StressGauge from '../components/StressGauge';
import AnimatedBackground from '../components/AnimatedBackground';
import { getScoreCategory } from '../utils/stressCalculator';
import { saveAssessment } from '../services/apiService';

const ResultsPage = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();

  useEffect(() => {
    if (state.finalScore === 0 && !state.surveyData) {
      navigate('/consent');
    }
  }, [state, navigate]);

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
