import { CONSTANTS } from './constants';

// ──── Individual Metric Scores ────

export const calculateBlinkScore = (blinksPerMinute) => {
  if (blinksPerMinute < 15) return 2;
  if (blinksPerMinute <= 25) return 3;
  if (blinksPerMinute <= 35) return 6;
  if (blinksPerMinute <= 45) return 8;
  return 10;
};

export const calculateJawScore = (tensionPercent) => {
  return Math.min(10, tensionPercent / 10);
};

export const calculateMovementScore = (fidgetPercent) => {
  return Math.min(10, fidgetPercent / 10);
};

export const calculateEmotionScore = (emotion) => {
  switch (emotion?.toLowerCase()) {
    case 'happy': return 1;
    case 'neutral': return 3;
    case 'surprised': return 4;
    case 'sad': return 7;
    case 'contempt': return 7;
    case 'angry': case 'stressed/angry': return 8;
    case 'fearful': return 9;
    default: return 5;
  }
};

export const calculateBehavioralScore = (blinkBpm, jawTension, movement, emotion) => {
  const blinkScore = calculateBlinkScore(blinkBpm);
  const jawScore = calculateJawScore(jawTension);
  const movementScore = calculateMovementScore(movement);
  const emotionScore = calculateEmotionScore(emotion);

  // Emotion-dominant weighting (jaw is unreliable as a solo signal)
  return (blinkScore * 0.2) + (jawScore * 0.15) + (movementScore * 0.25) + (emotionScore * 0.4);
};

// ──── Final Composite Score ────
// Adaptive weighting: if behavioral/keyboard data is missing or minimal,
// the survey takes proportionally more weight so the score stays accurate.

export const calculateFinalScore = (surveyScore, behavioralScore, keyboardScore = 0) => {
  // Determine which signals are actually present
  const hasBehavioral = behavioralScore > 0;
  const hasKeyboard = keyboardScore > 0;

  let surveyWeight, behavioralWeight, keyboardWeight;

  if (hasBehavioral && hasKeyboard) {
    // All signals present: use ideal weights
    surveyWeight = 0.60;
    behavioralWeight = 0.30;
    keyboardWeight = 0.10;
  } else if (hasBehavioral) {
    // No keyboard data
    surveyWeight = 0.70;
    behavioralWeight = 0.30;
    keyboardWeight = 0;
  } else if (hasKeyboard) {
    // No behavioral data
    surveyWeight = 0.85;
    behavioralWeight = 0;
    keyboardWeight = 0.15;
  } else {
    // Only survey data — survey IS the score
    surveyWeight = 1.0;
    behavioralWeight = 0;
    keyboardWeight = 0;
  }

  const final = (surveyScore * surveyWeight) + (behavioralScore * behavioralWeight) + (keyboardScore * keyboardWeight);
  return Math.round(final * 2) / 2; // Round to nearest 0.5
};

// ──── Score Category ────

export const getScoreCategory = (score) => {
  if (score <= CONSTANTS.THRESHOLDS.LOW) return { color: CONSTANTS.COLORS.LOW, label: 'Low Stress', level: 1 };
  if (score <= CONSTANTS.THRESHOLDS.MILD) return { color: CONSTANTS.COLORS.MILD, label: 'Mild Stress', level: 2 };
  if (score <= CONSTANTS.THRESHOLDS.MODERATE) return { color: CONSTANTS.COLORS.MODERATE, label: 'Moderate Stress', level: 3 };
  if (score <= CONSTANTS.THRESHOLDS.HIGH) return { color: CONSTANTS.COLORS.HIGH, label: 'High Stress', level: 4 };
  return { color: CONSTANTS.COLORS.SEVERE, label: 'Severe Stress', level: 5 };
};
