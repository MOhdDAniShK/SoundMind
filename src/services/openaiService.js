/**
 * OpenAI Service — generates dynamic survey questions via GPT-4o
 * Uses indirect, behavioral questions inspired by PSS-10 (Perceived Stress Scale)
 * to infer stress without asking "how stressed are you" directly.
 */

const MOCK_DELAY = 1200;

// ── Evidence-based indirect stress assessment questions ──
// These probe behavioral patterns, sleep, cognition, and emotions
// WITHOUT directly asking "how stressed are you?"
// NOTE: Static profile questions (hobbies, primary stressor, overwhelming subject)
// are collected at consent/login time, not during the survey.
const FALLBACK_QUESTIONS = [
  {
    id: 1,
    text: "In the past week, how often have you felt that things were going your way?",
    type: "radio",
    options: ["Almost always", "Often", "Sometimes", "Rarely", "Never"],
    stressDirection: "positive",
  },
  {
    id: 2,
    text: "How many hours of sleep did you get last night?",
    type: "radio",
    options: ["More than 8", "7-8 hours", "6-7 hours", "4-5 hours", "Less than 4"],
    stressDirection: "positive",
  },
  {
    id: 3,
    text: "How often have you found yourself unable to stop thinking about all the things you have to do?",
    type: "radio",
    options: ["Never", "Rarely", "Sometimes", "Often", "Almost always"],
    stressDirection: "negative",
  },
  {
    id: 4,
    text: "When you wake up in the morning, how do you typically feel?",
    type: "emoji",
    options: ["😄", "🙂", "😐", "😟", "😫"],
    values: [9, 7, 5, 3, 1],
    stressDirection: "positive",
  },
  {
    id: 5,
    text: "How often have you felt confident about your ability to handle your personal problems this week?",
    type: "radio",
    options: ["Almost always", "Often", "Sometimes", "Rarely", "Never"],
    stressDirection: "positive",
  },
  {
    id: 6,
    text: "How often do you find it hard to concentrate on what you're reading or studying?",
    type: "radio",
    options: ["Never", "Rarely", "Sometimes", "Often", "Almost always"],
    stressDirection: "negative",
  },
  {
    id: 7,
    text: "How often have you felt that difficulties were piling up so high you couldn't overcome them?",
    type: "radio",
    options: ["Never", "Rarely", "Sometimes", "Often", "Almost always"],
    stressDirection: "negative",
  },
  {
    id: 8,
    text: "When you think about tomorrow, what emotion comes to mind first?",
    type: "emoji",
    options: ["😄", "🙂", "😐", "😟", "😨"],
    values: [9, 7, 5, 3, 1],
    stressDirection: "positive",
  },
  // ── Indirect Academic Stress Probes ──
  {
    id: 9,
    text: "When you look at your assignment list or to-do board, how many items feel overdue or incomplete?",
    type: "radio",
    options: ["None — I'm caught up", "One or two minor things", "A handful that keep slipping", "Several I've lost track of", "So many I've stopped checking"],
    stressDirection: "negative",
    academicTag: "backlog",
  },
  {
    id: 10,
    text: "If someone quizzed you right now on the material you're currently studying, how would you feel?",
    type: "emoji",
    options: ["😎", "🙂", "😐", "😰", "🤯"],
    values: [9, 7, 5, 3, 1],
    stressDirection: "positive",
    academicTag: "exam_readiness",
  },
  {
    id: 11,
    text: "How often do you re-read the same page or section because it doesn't click the first time?",
    type: "radio",
    options: ["Almost never", "Occasionally", "Sometimes", "Frequently", "Almost every time I study"],
    stressDirection: "negative",
    academicTag: "comprehension",
  },
  {
    id: 12,
    text: "When you sit down to start studying, how long does it usually take before you actually begin focused work?",
    type: "radio",
    options: ["I start within a few minutes", "About 10-15 minutes", "Around 20-30 minutes", "Over 30 minutes", "I often don't start at all"],
    stressDirection: "negative",
    academicTag: "time_management",
  },
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate 12 stress assessment questions via Gemini AI.
 * Falls back to hardcoded questions if API is unavailable.
 */
export const generateSurveyQuestions = async () => {
  try {
    const response = await fetch('/api/gemini/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count: 12,
      }),
    });

    if (!response.ok) throw new Error('API response not ok');
    const data = await response.json();

    if (data.questions && Array.isArray(data.questions) && data.questions.length >= 10) {
      return data.questions.map((q, i) => ({ ...q, id: i + 1 }));
    }

    throw new Error('Invalid question format');
  } catch (error) {
    console.warn('OpenAI API failed or proxy not running. Using fallback questions.', error);
    await delay(MOCK_DELAY);
    return FALLBACK_QUESTIONS;
  }
};

/**
 * Detect the dominant academic stressor from survey answers.
 * Examines questions tagged with academicTag to infer:
 * - 'backlog': overdue/incomplete assignments piling up
 * - 'exam_readiness': feeling unprepared for exams/quizzes
 * - 'comprehension': struggling to understand course material
 * - 'time_management': unable to start or sustain focus
 * - null if no strong academic stress signal
 */
export const detectAcademicStressType = (questions, answers) => {
  if (!questions || !answers) return null;

  const tagScores = {};

  questions.forEach((q) => {
    if (!q.academicTag) return;
    const answer = answers[q.id];
    if (answer === undefined || answer === null || answer === '') return;

    let stressLevel = 0;

    if (q.type === 'radio' && q.options) {
      const idx = q.options.indexOf(answer);
      if (idx >= 0) {
        stressLevel = idx / (q.options.length - 1); // 0 = no stress, 1 = max stress
      }
    } else if (q.type === 'emoji' && q.values) {
      const val = Number(answer);
      stressLevel = (10 - val) / 10; // invert: low value = high stress
    }

    tagScores[q.academicTag] = stressLevel;
  });

  // Find the tag with the highest stress signal
  const tags = Object.entries(tagScores);
  if (tags.length === 0) return null;

  const sorted = tags.sort((a, b) => b[1] - a[1]);
  // Only return if there's a meaningful signal (>0.4 on 0-1 scale)
  if (sorted[0][1] < 0.4) return null;

  return sorted[0][0]; // 'backlog' | 'exam_readiness' | 'comprehension' | 'time_management'
};

/**
 * Calculate a stress score from survey answers using a weighted, direction-aware algorithm.
 * 
 * - "positive" direction questions: high option index = low stress (e.g., "How often do things go your way?")
 * - "negative" direction questions: high option index = high stress (e.g., "How often do you feel overwhelmed?")
 * - Applies non-linear scaling to amplify deviations from neutral
 * - Returns a score from 1 to 10
 */
export const calculateSurveyStressScore = (questions, answers) => {
  if (!questions || !answers) return 0;

  let totalScore = 0;
  let count = 0;
  let extremeHigh = 0;
  let extremeLow = 0;

  questions.forEach((q) => {
    const answer = answers[q.id];
    if (answer === undefined || answer === null || answer === '') return;

    let normalized = 5; // default mid-point
    const direction = q.stressDirection || 'negative';

    switch (q.type) {
      case 'slider': {
        normalized = Number(answer);
        // If the slider measures a positive thing, invert it
        if (direction === 'positive' || (q.labels && (
          q.labels[1]?.toLowerCase().includes('excellent') ||
          q.labels[1]?.toLowerCase().includes('supported') ||
          q.labels[1]?.toLowerCase().includes('satisfied')
        ))) {
          normalized = 10 - normalized;
        }
        break;
      }

      case 'radio': {
        const idx = q.options?.indexOf(answer) ?? -1;
        if (idx >= 0 && q.options) {
          const rawRatio = idx / (q.options.length - 1);

          if (direction === 'positive') {
            // First option is the best → index 0 = low stress, last = high stress
            normalized = rawRatio * 10;
          } else {
            // Negative: First option is the best → index 0 = low stress
            // But for negative questions, options go from low-frequency to high-frequency
            // e.g., ["Never", "Rarely", "Sometimes", "Often", "Always"]
            // index 0 (Never) = low stress, index 4 (Always) = high stress
            normalized = rawRatio * 10;
          }
        }
        break;
      }

      case 'emoji': {
        if (q.values) {
          const val = Number(answer);
          // Values are set so high = good, so invert to get stress
          normalized = 10 - val;
        }
        break;
      }

      case 'select':
      case 'text':
      case 'date':
        // These don't contribute to numeric score
        return;

      default:
        return;
    }

    // Track extremes for amplification
    if (normalized >= 8) extremeHigh++;
    if (normalized <= 2) extremeLow++;

    totalScore += normalized;
    count++;
  });

  if (count === 0) return 5;

  let avg = totalScore / count;

  // ── Non-linear amplification ──
  // Push scores away from the neutral zone (4.5-5.5) more aggressively
  // This ensures the score actually reflects the answers
  const deviation = avg - 5;
  const amplified = 5 + (deviation * 1.8);

  // ── Extreme answer bonus ──
  // If many answers are at the extremes, push the final score further
  const extremeRatio = (extremeHigh - extremeLow) / Math.max(count, 1);
  const finalRaw = amplified + (extremeRatio * 1.5);

  return Math.max(1, Math.min(10, Math.round(finalRaw * 10) / 10));
};

/**
 * AI-Driven Stress Analysis
 * Sends the full Q&A to Claude for a clinical-style stress evaluation.
 * Returns { score, category, keyStressors, insight } or null if unavailable.
 */
export const analyzeStressWithAI = async (questions, answers) => {
  try {
    const response = await fetch('/api/analyze-stress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions, answers }),
    });

    if (!response.ok) throw new Error('AI analysis API failed');
    const data = await response.json();

    if (data.score && typeof data.score === 'number') {
      return {
        score: Math.max(1, Math.min(10, data.score)),
        category: data.category || null,
        keyStressors: data.keyStressors || [],
        insight: data.insight || null,
      };
    }
    throw new Error('Invalid AI analysis response');
  } catch (error) {
    console.warn('AI stress analysis unavailable, using algorithmic score only.', error);
    return null;
  }
};
