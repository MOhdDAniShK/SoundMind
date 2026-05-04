import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let faceLandmarker = null;
let runningMode = "VIDEO";

// Track previous state for micro-expression detection
let previousBlendshapes = null;
let previousTimestamp = 0;
let microExpressionBuffer = [];
let stressScoreBuffer = [];
const STRESS_BUFFER_SIZE = 15;

export const initializeFaceLandmarker = async () => {
  if (faceLandmarker) return faceLandmarker;

  try {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
    );

    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU"
      },
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
      runningMode: runningMode,
      numFaces: 1
    });

    return faceLandmarker;
  } catch (error) {
    console.error("Error initializing FaceLandmarker:", error);
    throw error;
  }
};

// ──── Helper: Get blendshape value by name ────
const getBS = (blendshapes, name) => {
  return blendshapes.find(b => b.categoryName === name)?.score || 0;
};

// ──── Advanced Emotion Detection using all blendshapes ────
const detectEmotion = (bs) => {
  // Extract all relevant blendshapes
  const smileL = getBS(bs, 'mouthSmileLeft');
  const smileR = getBS(bs, 'mouthSmileRight');
  const frownL = getBS(bs, 'mouthFrownLeft');
  const frownR = getBS(bs, 'mouthFrownRight');
  const browDownL = getBS(bs, 'browDownLeft');
  const browDownR = getBS(bs, 'browDownRight');
  const browInnerUp = getBS(bs, 'browInnerUp');
  const browOuterUpL = getBS(bs, 'browOuterUpLeft');
  const browOuterUpR = getBS(bs, 'browOuterUpRight');
  const eyeWideL = getBS(bs, 'eyeWideLeft');
  const eyeWideR = getBS(bs, 'eyeWideRight');
  const eyeSquintL = getBS(bs, 'eyeSquintLeft');
  const eyeSquintR = getBS(bs, 'eyeSquintRight');
  const jawOpen = getBS(bs, 'jawOpen');
  const noseSneerL = getBS(bs, 'noseSneerLeft');
  const noseSneerR = getBS(bs, 'noseSneerRight');
  const cheekPuff = getBS(bs, 'cheekPuff');
  const mouthPucker = getBS(bs, 'mouthPucker');
  const mouthPress = getBS(bs, 'mouthPressLeft') + getBS(bs, 'mouthPressRight');
  const lipStretch = getBS(bs, 'mouthStretchLeft') + getBS(bs, 'mouthStretchRight');

  // Calculate emotion scores with confidence
  const emotions = {};

  // Happy: smile + cheek raise
  emotions.happy = (smileL + smileR) / 2 + (eyeSquintL + eyeSquintR) * 0.3;

  // Sad: frown + inner brow raise
  emotions.sad = (frownL + frownR) / 2 + browInnerUp * 0.5;

  // Angry: brow down + lip press + jaw clench
  emotions.angry = (browDownL + browDownR) / 2 + mouthPress * 0.2 + noseSneerL * 0.3;

  // Fearful: brow up + eye wide + mouth stretch
  emotions.fearful = browInnerUp * 0.5 + (eyeWideL + eyeWideR) / 2 + lipStretch * 0.2;

  // Surprised: brow up + eye wide + jaw open
  emotions.surprised = (browOuterUpL + browOuterUpR) / 2 + (eyeWideL + eyeWideR) / 2 + jawOpen * 0.3;

  // Contempt/Disgust: nose sneer + upper lip
  emotions.contempt = (noseSneerL + noseSneerR) / 2 + cheekPuff * 0.2;

  // Stressed: combination of tension indicators
  emotions.stressed = (browDownL + browDownR) / 2 * 0.4 +
    (1 - jawOpen) * 0.2 + // jaw clenched
    mouthPress * 0.2 +
    (eyeSquintL + eyeSquintR) / 2 * 0.2;

  // Neutral: absence of strong signals
  const maxEmotionScore = Math.max(...Object.values(emotions));
  emotions.neutral = Math.max(0, 0.5 - maxEmotionScore);

  // Find dominant emotion
  const sorted = Object.entries(emotions).sort(([, a], [, b]) => b - a);
  const [dominantEmotion, dominantScore] = sorted[0];
  const confidence = Math.min(1, dominantScore / 0.6); // normalize to 0-1

  return {
    emotion: dominantEmotion,
    confidence: confidence,
    allEmotions: emotions,
  };
};

// ──── Micro-expression detection ────
const detectMicroExpressions = (currentBS, timestamp) => {
  if (!previousBlendshapes || timestamp - previousTimestamp > 500) {
    previousBlendshapes = currentBS;
    previousTimestamp = timestamp;
    return { hasMicroExpression: false, type: null };
  }

  // Check for rapid changes in key blendshapes (within 200ms)
  const timeDelta = timestamp - previousTimestamp;
  if (timeDelta > 200) {
    previousBlendshapes = currentBS;
    previousTimestamp = timestamp;
    return { hasMicroExpression: false, type: null };
  }

  const significantChanges = [];
  const keys = ['mouthSmileLeft', 'mouthSmileRight', 'browDownLeft', 'browDownRight',
    'mouthFrownLeft', 'mouthFrownRight', 'eyeWideLeft', 'eyeWideRight'];

  for (const key of keys) {
    const prev = getBS(previousBlendshapes, key);
    const curr = getBS(currentBS, key);
    if (Math.abs(curr - prev) > 0.3) {
      significantChanges.push(key);
    }
  }

  previousBlendshapes = currentBS;
  previousTimestamp = timestamp;

  if (significantChanges.length >= 2) {
    const type = significantChanges.some(k => k.includes('Smile')) ? 'suppressed-smile' :
      significantChanges.some(k => k.includes('Frown')) ? 'suppressed-distress' :
        'rapid-expression-change';

    microExpressionBuffer.push({ type, timestamp });
    // Keep only last 10 micro-expressions
    if (microExpressionBuffer.length > 10) microExpressionBuffer.shift();

    return { hasMicroExpression: true, type };
  }

  return { hasMicroExpression: false, type: null };
};

// ──── Head Pose Estimation ────
const estimateHeadPose = (transformMatrix) => {
  if (!transformMatrix || transformMatrix.length === 0) {
    return { pitch: 0, yaw: 0, roll: 0, isAvoidant: false };
  }

  const matrix = transformMatrix[0]?.data || transformMatrix[0];
  if (!matrix || matrix.length < 16) return { pitch: 0, yaw: 0, roll: 0, isAvoidant: false };

  // Extract rotation from 4x4 transformation matrix
  const pitch = Math.asin(-matrix[6]) * (180 / Math.PI); // up/down
  const yaw = Math.atan2(matrix[2], matrix[10]) * (180 / Math.PI); // left/right
  const roll = Math.atan2(matrix[4], matrix[5]) * (180 / Math.PI); // tilt

  // Looking away significantly (>20 degrees) might indicate avoidance/anxiety
  const isAvoidant = Math.abs(yaw) > 20 || Math.abs(pitch) > 25;

  return { pitch, yaw, roll, isAvoidant };
};

// ──── Main Analysis Function ────
export const analyzeFrame = (videoElement, lastVideoTime) => {
  if (!faceLandmarker || !videoElement) return null;

  const startTimeMs = performance.now();
  let results = null;

  if (videoElement.currentTime !== lastVideoTime) {
    results = faceLandmarker.detectForVideo(videoElement, startTimeMs);
  }

  if (results && results.faceBlendshapes && results.faceBlendshapes.length > 0) {
    const blendshapes = results.faceBlendshapes[0].categories;

    // Basic metrics
    const eyeBlinkLeft = getBS(blendshapes, 'eyeBlinkLeft');
    const eyeBlinkRight = getBS(blendshapes, 'eyeBlinkRight');
    const jawOpen = getBS(blendshapes, 'jawOpen');

    // Mouth movement for breathing estimation
    const mouthOpen = jawOpen;
    const lipPart = getBS(blendshapes, 'mouthClose');

    // Skin analysis (approximate via cheek/nose blendshapes as proxy)
    // Real skin redness would need pixel analysis, but we use face landmark distances as proxy
    const cheekPuff = getBS(blendshapes, 'cheekPuff');
    const cheekSquintL = getBS(blendshapes, 'cheekSquintLeft');
    const cheekSquintR = getBS(blendshapes, 'cheekSquintRight');

    // Advanced emotion detection
    const emotionResult = detectEmotion(blendshapes);

    // Micro-expression detection
    const microExpr = detectMicroExpressions(blendshapes, startTimeMs);

    // Head pose from transformation matrices
    const headPose = estimateHeadPose(results.facialTransformationMatrixes);

    // Breathing score (mouth movement frequency as proxy)
    const breathingScore = mouthOpen * 0.6 + (1 - lipPart) * 0.4;

    // Skin redness proxy (not real but approximation via face engagement)
    const skinRedness = (cheekPuff + cheekSquintL + cheekSquintR) / 3;

    return {
      // Basic scores
      blinkScore: Math.max(eyeBlinkLeft, eyeBlinkRight),
      jawTensionScore: 1 - jawOpen,

      // Advanced emotion
      emotion: emotionResult.emotion,
      emotionConfidence: emotionResult.confidence,
      allEmotions: emotionResult.allEmotions,

      // New metrics
      skinRedness,
      breathingScore,
      headPose,
      microExpression: microExpr,

      // Stress-specific compound score
      facialStressScore: calculateFacialStress(emotionResult, headPose, blendshapes),

      // Meta
      timestamp: startTimeMs,
      newVideoTime: videoElement.currentTime,
    };
  }

  return null;
};

// ──── Compound Facial Stress Score (v2 — fixed jaw baseline) ────
const calculateFacialStress = (emotionResult, headPose, blendshapes) => {
  let stress = 0;

  // Emotion-based stress (primary signal — 50% weight)
  const stressEmotions = { angry: 0.9, fearful: 0.95, stressed: 0.85, sad: 0.7, contempt: 0.6 };
  const calmEmotions = { happy: 0.1, neutral: 0.25, surprised: 0.35 };

  if (stressEmotions[emotionResult.emotion]) {
    stress += stressEmotions[emotionResult.emotion] * emotionResult.confidence * 5;
  } else if (calmEmotions[emotionResult.emotion]) {
    stress += calmEmotions[emotionResult.emotion] * 2.5;
  } else {
    stress += 2;
  }

  // Head avoidance adds moderate stress
  if (headPose.isAvoidant) {
    stress += 1.0;
  }

  // Jaw tension — FIXED: mouth is naturally closed (jawOpen ~0.02-0.05)
  // Only count as stress when jaw is actively CLENCHED (press lips, grind teeth)
  // Use mouthPress and lip tightening as better indicators
  const mouthPressL = getBS(blendshapes, 'mouthPressLeft') || 0;
  const mouthPressR = getBS(blendshapes, 'mouthPressRight') || 0;
  const jawClench = (mouthPressL + mouthPressR) / 2;
  // Only add stress if jaw is actively clenched (above 0.15 threshold)
  if (jawClench > 0.15) {
    stress += Math.min(2, (jawClench - 0.15) * 4);
  }

  // Brow tension (furrowed brows = thinking/stress)
  const browDown = ((getBS(blendshapes, 'browDownLeft') || 0) + (getBS(blendshapes, 'browDownRight') || 0)) / 2;
  if (browDown > 0.2) {
    stress += Math.min(1.5, (browDown - 0.2) * 3);
  }

  // Micro-expressions in buffer indicate suppression
  if (microExpressionBuffer.length > 3) {
    stress += 0.75;
  }

  const rawScore = Math.min(10, Math.max(0, stress));

  // Temporal smoothing: average over last N frames
  stressScoreBuffer.push(rawScore);
  if (stressScoreBuffer.length > STRESS_BUFFER_SIZE) stressScoreBuffer.shift();
  const smoothed = stressScoreBuffer.reduce((a, b) => a + b, 0) / stressScoreBuffer.length;

  return Math.round(smoothed * 10) / 10;
};

/**
 * Get accumulated micro-expression data for reporting.
 */
export const getMicroExpressionSummary = () => {
  return [...microExpressionBuffer];
};

/**
 * Reset tracking state (call when starting new session).
 */
export const resetTracking = () => {
  previousBlendshapes = null;
  previousTimestamp = 0;
  microExpressionBuffer = [];
  stressScoreBuffer = [];
};
