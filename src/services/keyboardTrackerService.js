/**
 * Keyboard & Cursor Stress Tracker
 * Monitors typing patterns and mouse behavior as passive stress indicators.
 * 
 * Metrics:
 * - Typing speed (keys/min) — erratic speeds = stress
 * - Error rate (backspace/delete frequency) — more corrections = stress
 * - Key hold duration — longer holds = tension
 * - Cursor velocity — fast/jerky = agitation
 * - Cursor idle time — prolonged pauses = hesitation
 * - Click patterns — rage-clicking or hesitant clicks
 */

const WINDOW_SIZE_MS = 30000; // 30-second sliding window

let isTracking = false;
let keyEvents = [];
let mouseEvents = [];
let clickEvents = [];
let keyHoldStart = {};

// ──── Event Handlers ────

const handleKeyDown = (e) => {
  if (!isTracking) return;
  const now = Date.now();

  if (!keyHoldStart[e.key]) {
    keyHoldStart[e.key] = now;
  }

  keyEvents.push({
    type: 'down',
    key: e.key,
    timestamp: now,
    isDelete: e.key === 'Backspace' || e.key === 'Delete',
  });
};

const handleKeyUp = (e) => {
  if (!isTracking) return;
  const now = Date.now();
  const holdDuration = keyHoldStart[e.key] ? now - keyHoldStart[e.key] : 0;
  delete keyHoldStart[e.key];

  keyEvents.push({
    type: 'up',
    key: e.key,
    timestamp: now,
    holdDuration,
  });
};

const handleMouseMove = (e) => {
  if (!isTracking) return;
  mouseEvents.push({
    x: e.clientX,
    y: e.clientY,
    timestamp: Date.now(),
  });
};

const handleClick = (e) => {
  if (!isTracking) return;
  clickEvents.push({
    x: e.clientX,
    y: e.clientY,
    timestamp: Date.now(),
  });
};

// ──── Lifecycle ────

export const startTracking = () => {
  isTracking = true;
  keyEvents = [];
  mouseEvents = [];
  clickEvents = [];
  keyHoldStart = {};

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleClick);
};

export const stopTracking = () => {
  isTracking = false;
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('keyup', handleKeyUp);
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('click', handleClick);
};

// ──── Analysis Functions ────

const getRecentEvents = (events, windowMs = WINDOW_SIZE_MS) => {
  const cutoff = Date.now() - windowMs;
  return events.filter(e => e.timestamp >= cutoff);
};

const calculateTypingSpeed = () => {
  const recent = getRecentEvents(keyEvents).filter(e => e.type === 'down' && !e.isDelete);
  if (recent.length < 2) return 0;
  const durationMin = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 60000;
  return durationMin > 0 ? recent.length / durationMin : 0;
};

const calculateErrorRate = () => {
  const recent = getRecentEvents(keyEvents).filter(e => e.type === 'down');
  if (recent.length === 0) return 0;
  const errors = recent.filter(e => e.isDelete).length;
  return errors / recent.length;
};

const calculateAvgHoldDuration = () => {
  const recent = getRecentEvents(keyEvents).filter(e => e.type === 'up' && e.holdDuration > 0);
  if (recent.length === 0) return 0;
  return recent.reduce((sum, e) => sum + e.holdDuration, 0) / recent.length;
};

const calculateCursorVelocity = () => {
  const recent = getRecentEvents(mouseEvents);
  if (recent.length < 2) return 0;

  let totalVelocity = 0;
  for (let i = 1; i < recent.length; i++) {
    const dx = recent[i].x - recent[i - 1].x;
    const dy = recent[i].y - recent[i - 1].y;
    const dt = (recent[i].timestamp - recent[i - 1].timestamp) / 1000;
    if (dt > 0) {
      totalVelocity += Math.sqrt(dx * dx + dy * dy) / dt;
    }
  }
  return totalVelocity / (recent.length - 1);
};

const calculateCursorJerkiness = () => {
  const recent = getRecentEvents(mouseEvents);
  if (recent.length < 3) return 0;

  let directionChanges = 0;
  for (let i = 2; i < recent.length; i++) {
    const dx1 = recent[i - 1].x - recent[i - 2].x;
    const dy1 = recent[i - 1].y - recent[i - 2].y;
    const dx2 = recent[i].x - recent[i - 1].x;
    const dy2 = recent[i].y - recent[i - 1].y;

    // Direction change if dot product is negative
    if (dx1 * dx2 + dy1 * dy2 < 0) {
      directionChanges++;
    }
  }
  return directionChanges / (recent.length - 2);
};

const calculateClickIntensity = () => {
  const recent = getRecentEvents(clickEvents);
  if (recent.length < 2) return 0;
  
  // Clicks per second
  const durationSec = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000;
  if (durationSec <= 0) return 0;
  
  const clickRate = recent.length / durationSec;
  
  // Rapid successive clicks (< 300ms apart) indicate frustration
  let rapidClicks = 0;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].timestamp - recent[i - 1].timestamp < 300) {
      rapidClicks++;
    }
  }
  
  return { clickRate, rapidClickRatio: recent.length > 1 ? rapidClicks / (recent.length - 1) : 0 };
};

// ──── Composite Score ────

/**
 * Returns a stress score from 0 to 10 based on keyboard/cursor behavior.
 * Also returns the raw metrics for display.
 */
export const getKeyboardStressScore = () => {
  const typingSpeed = calculateTypingSpeed();
  const errorRate = calculateErrorRate();
  const avgHold = calculateAvgHoldDuration();
  const cursorVelocity = calculateCursorVelocity();
  const jerkiness = calculateCursorJerkiness();
  const { clickRate, rapidClickRatio } = calculateClickIntensity();

  // Normalize each metric to 0-10 scale

  // Typing speed: normal ~40-80 WPM → 200-400 keys/min. 
  // Very slow (<100) or very fast (>500) can indicate stress
  let typingStress = 0;
  if (typingSpeed < 100) typingStress = Math.min(10, (100 - typingSpeed) / 15); // slow = hesitation
  else if (typingSpeed > 400) typingStress = Math.min(10, (typingSpeed - 400) / 50); // frantic
  else typingStress = 2; // normal range

  // Error rate: 0-1. > 0.15 is elevated
  const errorStress = Math.min(10, errorRate * 30);

  // Hold duration: normal ~100-150ms. > 200ms = tension
  const holdStress = avgHold > 200 ? Math.min(10, (avgHold - 200) / 50) : 1;

  // Cursor velocity: > 800 px/s is fast
  const velocityStress = Math.min(10, cursorVelocity / 150);

  // Jerkiness: > 0.3 direction change ratio is notable
  const jerkinessStress = Math.min(10, jerkiness * 15);

  // Rapid clicks: any significant rapid clicking
  const clickStress = Math.min(10, rapidClickRatio * 15 + clickRate * 2);

  // Weighted composite
  const composite = (
    typingStress * 0.20 +
    errorStress * 0.25 +
    holdStress * 0.10 +
    velocityStress * 0.15 +
    jerkinessStress * 0.15 +
    clickStress * 0.15
  );

  return {
    score: Math.min(10, Math.max(0, composite)),
    metrics: {
      typingSpeed: Math.round(typingSpeed),
      errorRate: (errorRate * 100).toFixed(1),
      avgHoldDuration: Math.round(avgHold),
      cursorVelocity: Math.round(cursorVelocity),
      jerkiness: (jerkiness * 100).toFixed(1),
      clickRate: clickRate.toFixed(2),
      rapidClickRatio: (rapidClickRatio * 100).toFixed(1),
    },
    subscores: {
      typingStress: typingStress.toFixed(1),
      errorStress: errorStress.toFixed(1),
      holdStress: holdStress.toFixed(1),
      velocityStress: velocityStress.toFixed(1),
      jerkinessStress: jerkinessStress.toFixed(1),
      clickStress: clickStress.toFixed(1),
    }
  };
};

/**
 * Get a real-time snapshot for live UI display (lighter calculation).
 */
export const getLiveMetrics = () => {
  return {
    typingSpeed: Math.round(calculateTypingSpeed()),
    errorRate: (calculateErrorRate() * 100).toFixed(0),
    cursorVelocity: Math.round(calculateCursorVelocity()),
    jerkiness: (calculateCursorJerkiness() * 100).toFixed(0),
  };
};
