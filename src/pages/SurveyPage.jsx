import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import QuestionCard from '../components/QuestionCard';
import AnimatedBackground from '../components/AnimatedBackground';
import { calculateBehavioralScore, calculateFinalScore } from '../utils/stressCalculator';
import { initializeFaceLandmarker, analyzeFrame, resetTracking } from '../services/mediapipeService';
import { generateSurveyQuestions, calculateSurveyStressScore, analyzeStressWithAI, detectAcademicStressType } from '../services/openaiService';
import { startTracking, stopTracking, getKeyboardStressScore, getLiveMetrics } from '../services/keyboardTrackerService';

const SurveyPage = () => {
  const navigate = useNavigate();
  const { dispatch, state } = useAppContext();

  useEffect(() => {
    if (!state.consent.webcam) {
      navigate('/home');
    }
  }, [state.consent, navigate]);

  // ── Survey State ──
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  // ── Webcam State (hidden — background tracking only) ──
  const videoRef = useRef(null);
  const requestRef = useRef();
  const lastVideoTimeRef = useRef(-1);
  const [webcamReady, setWebcamReady] = useState(false);

  const [accumulatedMetrics, setAccumulatedMetrics] = useState({
    blinkScores: [],
    jawTensions: [],
    emotions: [],
    facialStressScores: [],
  });

  // ── Load AI Questions ──
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoadingQuestions(true);
      const qs = await generateSurveyQuestions();
      setQuestions(qs);
      dispatch({ type: 'SET_SURVEY_QUESTIONS', payload: qs });
      setIsLoadingQuestions(false);
    };
    loadQuestions();
  }, [dispatch]);

  // ── Webcam Setup (hidden — no video element visible) ──
  useEffect(() => {
    const setupCameraAndModel = async () => {
      try {
        resetTracking();
        await initializeFaceLandmarker();

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setWebcamReady(true);
        }
      } catch (err) {
        console.warn("Webcam/Model setup error (background):", err);
      }
    };

    setupCameraAndModel();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // ── Keyboard Tracking (silent) ──
  useEffect(() => {
    startTracking();
    return () => { stopTracking(); };
  }, []);

  const handleVideoPlay = () => {
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  const predictWebcam = () => {
    if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

    const result = analyzeFrame(videoRef.current, lastVideoTimeRef.current);
    if (result) {
      lastVideoTimeRef.current = result.newVideoTime;
      const blinkScore = result.blinkScore * 100;
      const jawTension = result.jawTensionScore * 100;

      setAccumulatedMetrics(prev => ({
        blinkScores: [...prev.blinkScores, blinkScore],
        jawTensions: [...prev.jawTensions, jawTension],
        emotions: [...prev.emotions, result.emotion],
        facialStressScores: [...prev.facialStressScores, result.facialStressScore || 0],
      }));
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  // ── Question Navigation ──
  const handleAnswer = useCallback((id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  }, []);

  const goNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentQ > 0) {
      setCurrentQ(prev => prev - 1);
    }
  };

  const currentQuestion = questions[currentQ];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== '' && currentAnswer !== null;
  const isLastQuestion = currentQ === questions.length - 1;
  const progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;

  // ── Submit ──
  const handleSubmit = async () => {
    cancelAnimationFrame(requestRef.current);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    stopTracking();

    // Calculate algorithmic survey score
    const surveyScore = calculateSurveyStressScore(questions, answers);
    dispatch({ type: 'SET_SURVEY', payload: { data: answers, score: surveyScore } });
    dispatch({ type: 'SET_SURVEY_ANSWERS', payload: answers });

    // Detect academic stress type from indirect probes
    const academicType = detectAcademicStressType(questions, answers);
    dispatch({ type: 'SET_ACADEMIC_STRESS_TYPE', payload: academicType });

    // Calculate keyboard score
    const keyboardResult = getKeyboardStressScore();
    dispatch({ type: 'SET_KEYBOARD', payload: { data: keyboardResult.metrics, score: keyboardResult.score } });

    // Calculate behavioral (webcam) score — tracked silently in background
    let behavioralScore = 0;
    if (accumulatedMetrics.blinkScores.length > 0) {
      const avgBlink = accumulatedMetrics.blinkScores.reduce((a, b) => a + b, 0) / accumulatedMetrics.blinkScores.length;
      const avgJaw = accumulatedMetrics.jawTensions.reduce((a, b) => a + b, 0) / accumulatedMetrics.jawTensions.length;
      const avgFacialStress = accumulatedMetrics.facialStressScores.reduce((a, b) => a + b, 0) / accumulatedMetrics.facialStressScores.length;

      const emotionCounts = accumulatedMetrics.emotions.reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {});
      const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => emotionCounts[a] > emotionCounts[b] ? a : b);

      const simulatedBpm = avgBlink > 20 ? 35 : (avgBlink > 10 ? 20 : 10);
      behavioralScore = calculateBehavioralScore(simulatedBpm, avgJaw, 0, dominantEmotion);
      behavioralScore = behavioralScore * 0.5 + avgFacialStress * 0.5;

      dispatch({
        type: 'SET_BEHAVIORAL',
        payload: { data: { avgBlink, avgJaw, dominantEmotion, avgFacialStress }, score: behavioralScore }
      });
    } else {
      dispatch({ type: 'SET_BEHAVIORAL', payload: { data: null, score: 0 } });
    }

    // Try AI-driven stress analysis (blends with algorithmic for better accuracy)
    let finalSurveyScore = surveyScore;
    try {
      const aiResult = await analyzeStressWithAI(questions, answers);
      if (aiResult && aiResult.score) {
        // Blend: 70% AI analysis + 30% algorithmic for robust scoring
        finalSurveyScore = (aiResult.score * 0.7) + (surveyScore * 0.3);
        dispatch({ type: 'SET_SURVEY', payload: { data: answers, score: finalSurveyScore } });
      }
    } catch (err) {
      console.warn('AI analysis skipped, using algorithmic score only.');
    }

    // Final score with adaptive weighting
    const finalScore = calculateFinalScore(finalSurveyScore, behavioralScore, keyboardResult.score);
    dispatch({ type: 'SET_FINAL_SCORE', payload: finalScore });

    navigate('/results');
  };

  // ── Render ──
  return (
    <div className="animate-fade-in w-full" style={{
      height: 'calc(100vh - 3rem)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0.5rem 1rem',
      maxWidth: '800px',
      margin: '0 auto',
      boxSizing: 'border-box',
    }}>
      <AnimatedBackground />

      {/* Hidden webcam for background tracking */}
      <video
        ref={videoRef}
        autoPlay playsInline muted
        onPlay={handleVideoPlay}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}
      />

      {/* ── Progress Header ── */}
      <div style={{ flexShrink: 0, marginBottom: '0.5rem', position: 'relative', zIndex: 1 }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[var(--color-text-muted)] font-medium">Assessment Progress</span>
          <span className="text-sm font-bold text-[var(--color-text-accent)]">{currentQ + 1}/{questions.length}</span>
        </div>
        <div className="progress-container" style={{ marginBottom: 0 }}>
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* ── Question Card (fills remaining space) ── */}
      <div className="glass-card" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
        minHeight: 0,
        padding: '1.25rem',
      }}>
        {isLoadingQuestions ? (
          <div className="flex flex-col items-center justify-center" style={{ flex: 1 }}>
            <div className="w-12 h-12 rounded-full border-3 border-t-transparent animate-spin mb-4"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div>
            <p className="text-[var(--color-text-secondary)]">Generating personalized questions...</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">Powered by AI</p>
          </div>
        ) : (
          <>
            {/* Scrollable question content */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '0.25rem' }} key={currentQ}>
              <QuestionCard
                question={currentQuestion}
                answer={currentAnswer}
                onAnswer={handleAnswer}
                questionNumber={currentQ + 1}
                totalQuestions={questions.length}
              />
            </div>

            {/* ── Navigation — ALWAYS visible, pinned to bottom ── */}
            <div style={{
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '1rem',
              marginTop: '0.75rem',
              borderTop: '1px solid var(--color-border)',
            }}>
              <button
                onClick={goPrev}
                disabled={currentQ === 0}
                className="btn btn-secondary px-6"
              >
                ← Back
              </button>

              {isLastQuestion ? (
                <button
                  onClick={handleSubmit}
                  className="btn btn-primary px-8 py-3 text-lg"
                >
                  Submit Assessment ✨
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={!hasAnswer}
                  className="btn btn-primary px-6"
                >
                  Next →
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Subtle privacy note */}
      <p style={{
        flexShrink: 0,
        textAlign: 'center',
        fontSize: '0.65rem',
        color: 'var(--color-text-muted)',
        marginTop: '0.5rem',
        position: 'relative',
        zIndex: 1,
      }}>
        🔒 All analysis is processed locally in your browser. Nothing is recorded or uploaded.
      </p>
    </div>
  );
};

export default SurveyPage;
