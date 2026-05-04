# SoundMind - StressDetector

An AI-powered mental health assessment and intervention platform for students.

## Features
- **Consensual Assessment:** Explicit privacy controls before assessment starts.
- **Survey Analysis:** Quick self-reported stress tracking.
- **Webcam Behavioral Analysis:** On-device, private facial analysis using MediaPipe to detect blink rates, jaw tension, and emotions.
- **Dynamic Interventions:** Claude-powered study plans, break activities, and a 4-7-8 breathing exercise.
- **AI Counselor:** A safe chatbot for talking through stress (powered by Anthropic Claude).
- **Dashboard:** Track assessments over time and export PDF reports.

## Prerequisites
- Node.js (v18+)
- (Optional) Firebase project for database persistence
- Anthropic Claude API Key for AI features

## Setup Instructions

1. **Install Frontend Dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Install Proxy Server Dependencies:**
   \`\`\`bash
   cd server
   npm install
   cd ..
   \`\`\`

3. **Configure Environment Variables:**
   - Copy `.env.example` to `.env`
   - Add your `ANTHROPIC_API_KEY`
   - (Optional) Add your Firebase config variables

4. **Start Development Servers (in two terminals):**
   - **Terminal 1 (Proxy Server):**
     \`\`\`bash
     cd server
     npm start
     \`\`\`
   - **Terminal 2 (Frontend):**
     \`\`\`bash
     npm run dev
     \`\`\`

5. **Open App:** Navigate to \`http://localhost:5173\`

## Note on MediaPipe
The first time you load the webcam analysis, it may take a few seconds to download the WebAssembly ML models. All processing happens locally in your browser. No video is ever sent to a server.
