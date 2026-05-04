/**
 * Task Verification Service
 * Compares before/after facial metrics to verify stress-buster task completion.
 */

import { analyzeFrame } from './mediapipeService';

/**
 * Capture a baseline snapshot of facial metrics from a video element.
 * Takes multiple samples over 3 seconds and averages them.
 */
export const captureSnapshot = async (videoElement) => {
  const samples = [];
  const sampleCount = 10;
  const intervalMs = 300; // 3 seconds total

  for (let i = 0; i < sampleCount; i++) {
    const result = analyzeFrame(videoElement, -1);
    if (result) {
      samples.push(result);
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }

  if (samples.length === 0) return null;

  // Average the samples
  const avgBlinkScore = samples.reduce((s, r) => s + r.blinkScore, 0) / samples.length;
  const avgJawTension = samples.reduce((s, r) => s + r.jawTensionScore, 0) / samples.length;
  const avgSkinRedness = samples.reduce((s, r) => s + (r.skinRedness || 0), 0) / samples.length;
  const avgBreathingRate = samples.reduce((s, r) => s + (r.breathingScore || 0), 0) / samples.length;

  // Dominant emotion
  const emotions = samples.map(s => s.emotion);
  const emotionCounts = emotions.reduce((acc, e) => {
    acc[e] = (acc[e] || 0) + 1;
    return acc;
  }, {});
  const dominantEmotion = Object.keys(emotionCounts).reduce(
    (a, b) => emotionCounts[a] > emotionCounts[b] ? a : b
  );

  return {
    blinkScore: avgBlinkScore,
    jawTension: avgJawTension,
    skinRedness: avgSkinRedness,
    breathingRate: avgBreathingRate,
    emotion: dominantEmotion,
    timestamp: Date.now(),
    sampleCount: samples.length,
  };
};

/**
 * Verify task completion by comparing before/after snapshots.
 * Different tasks have different verification criteria.
 * 
 * @param {Object} baseline - Pre-task snapshot
 * @param {Object} completion - Post-task snapshot
 * @param {string} taskType - Type: 'physical', 'creative', 'social', 'mindfulness'
 * @returns {{ verified: boolean, confidence: number, details: string[] }}
 */
export const verifyTaskCompletion = (baseline, completion, taskType = 'physical') => {
  if (!baseline || !completion) {
    return { verified: false, confidence: 0, details: ['Could not capture facial data'] };
  }

  const details = [];
  let passedChecks = 0;
  let totalChecks = 0;

  switch (taskType) {
    case 'physical': {
      // Check for skin flush (redness increase after exercise)
      totalChecks = 4;
      
      const rednessChange = completion.skinRedness - baseline.skinRedness;
      if (rednessChange > 0.05) {
        passedChecks++;
        details.push(`✅ Skin flush detected (+${(rednessChange * 100).toFixed(0)}%)`);
      } else {
        details.push('⬜ No significant skin flush detected');
      }

      // Check for elevated breathing (more mouth movement)
      const breathingChange = completion.breathingRate - baseline.breathingRate;
      if (breathingChange > 0.1) {
        passedChecks++;
        details.push(`✅ Elevated breathing detected`);
      } else {
        details.push('⬜ No breathing rate change detected');
      }

      // General expression change
      if (baseline.emotion !== completion.emotion) {
        passedChecks++;
        details.push(`✅ Expression changed (${baseline.emotion} → ${completion.emotion})`);
      } else {
        details.push('⬜ No expression change');
      }

      // Blink rate change (exercise typically increases blink rate)
      const blinkChange = Math.abs(completion.blinkScore - baseline.blinkScore);
      if (blinkChange > 0.1) {
        passedChecks++;
        details.push('✅ Blink pattern changed');
      } else {
        details.push('⬜ No blink change');
      }
      break;
    }

    case 'creative': {
      totalChecks = 3;

      // Relaxed expression
      if (completion.jawTension < baseline.jawTension) {
        passedChecks++;
        details.push('✅ Jaw tension decreased (more relaxed)');
      } else {
        details.push('⬜ No tension decrease');
      }

      // Positive emotion change
      const positiveEmotions = ['happy', 'neutral'];
      if (positiveEmotions.includes(completion.emotion)) {
        passedChecks++;
        details.push(`✅ Positive expression detected (${completion.emotion})`);
      } else {
        details.push('⬜ No positive expression change');
      }

      // Expression change
      if (baseline.emotion !== completion.emotion) {
        passedChecks++;
        details.push('✅ Expression shifted');
      } else {
        details.push('⬜ No expression change');
      }
      break;
    }

    case 'social': {
      totalChecks = 3;

      // Smile detection
      if (completion.emotion === 'happy') {
        passedChecks++;
        details.push('✅ Smile/happiness detected');
      } else {
        details.push('⬜ No smile detected');
      }

      // Reduced tension
      if (completion.jawTension < baseline.jawTension - 0.05) {
        passedChecks++;
        details.push('✅ Reduced facial tension');
      } else {
        details.push('⬜ No tension change');
      }

      // Any expression change
      if (baseline.emotion !== completion.emotion) {
        passedChecks++;
        details.push('✅ Emotional state changed');
      } else {
        details.push('⬜ No emotional change');
      }
      break;
    }

    case 'mindfulness': {
      totalChecks = 4;

      // Reduced jaw tension
      if (completion.jawTension < baseline.jawTension) {
        passedChecks++;
        details.push('✅ Jaw tension decreased');
      } else {
        details.push('⬜ No jaw relaxation');
      }

      // Slower blink rate
      if (completion.blinkScore < baseline.blinkScore) {
        passedChecks++;
        details.push('✅ Blink rate slowed (calmer)');
      } else {
        details.push('⬜ No blink rate change');
      }

      // Neutral/calm expression
      if (completion.emotion === 'neutral' || completion.emotion === 'happy') {
        passedChecks++;
        details.push('✅ Calm expression detected');
      } else {
        details.push('⬜ Expression not calm');
      }

      // Breathing slowed
      if (completion.breathingRate < baseline.breathingRate) {
        passedChecks++;
        details.push('✅ Breathing rate decreased');
      } else {
        details.push('⬜ No breathing change');
      }
      break;
    }

    default:
      totalChecks = 1;
      if (baseline.emotion !== completion.emotion) {
        passedChecks = 1;
        details.push('✅ Facial state changed');
      } else {
        details.push('⬜ No change detected');
      }
  }

  const confidence = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;
  const verified = confidence >= 50; // At least half the checks must pass

  return {
    verified,
    confidence: Math.round(confidence),
    passedChecks,
    totalChecks,
    details,
  };
};

/**
 * Determine the task type from the task description for verification.
 */
export const getTaskType = (taskDescription) => {
  const desc = taskDescription.toLowerCase();

  if (/\b(run|jog|walk|exercise|stretch|yoga|pushup|jumping|dance|sport)\b/.test(desc)) {
    return 'physical';
  }
  if (/\b(draw|paint|write|music|sing|play|craft|cook|bake|build)\b/.test(desc)) {
    return 'creative';
  }
  if (/\b(call|talk|chat|friend|family|text|social|hang out)\b/.test(desc)) {
    return 'social';
  }
  if (/\b(meditat|breath|mindful|relax|calm|quiet|rest|sit)\b/.test(desc)) {
    return 'mindfulness';
  }

  return 'physical'; // default
};
