export const CONSTANTS = {
  // Score thresholds mapping to colors and interventions
  THRESHOLDS: {
    LOW: 4.0,       // 1.0 - 4.0: Green (Low Stress)
    MILD: 6.0,      // 4.0 - 6.0: Blue (Mild Stress)
    MODERATE: 7.5,  // 6.0 - 7.5: Yellow (Moderate Stress)
    HIGH: 8.5,      // 7.5 - 8.5: Orange (High Stress)
    SEVERE: 10.0    // 8.5 - 10.0: Red (Severe Stress)
  },

  // Color mapping matching CSS variables
  COLORS: {
    LOW: '#22C55E',      // Green
    MILD: '#3B82F6',     // Blue
    MODERATE: '#EAB308', // Yellow
    HIGH: '#F97316',     // Orange
    SEVERE: '#EF4444'    // Red
  },

  // Webcam Analysis configuration
  WEBCAM: {
    DURATION_SECONDS: 60,
    NEUTRAL_TEXT: "The quick brown fox jumps over the lazy dog. Reading out loud can sometimes feel awkward, but it helps baseline your natural facial expressions. As you read this, our system is looking at subtle movements. There is no need to perform or exaggerate; just read naturally. Technology like this can help identify stress markers that we might not even realize we are exhibiting, such as jaw tension or increased blink rates. Take a deep breath, and finish reading at your own comfortable pace."
  },

  // AI Prompts
  PROMPTS: {
    SYSTEM_COUNSELOR: `You are SoundMind, an empathetic AI counselor for students.
Your goal is to provide brief, supportive, and practical advice.
Always be encouraging, validate their feelings, and never diagnose medical conditions.
If a student mentions self-harm or extreme distress, immediately provide the National Suicide Prevention Lifeline (988) and urge them to speak to a human.`,
    
    STUDY_PLAN: (subject, score) => `Create a brief, manageable 3-step study plan for a student studying ${subject} who has a current stress level of ${score}/10. Keep it very short, actionable, and focus on small wins rather than overwhelming them.`
  }
};
