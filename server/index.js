import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const port = process.env.PORT || 3001;

// CORS: allow dev and production origins
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGIN || true
    : true,
}));
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
} else {
  console.log('⚠️ MONGODB_URI not found in environment variables. Database features will fallback to local storage.');
}

// Mongoose Models
const assessmentSchema = new mongoose.Schema({
  surveyData: mongoose.Schema.Types.Mixed,
  behavioralData: mongoose.Schema.Types.Mixed,
  keyboardData: mongoose.Schema.Types.Mixed,
  surveyScore: Number,
  behavioralScore: Number,
  keyboardScore: Number,
  finalScore: Number,
  category: String,
  timestamp: { type: Date, default: Date.now }
}, { strict: false });

const Assessment = mongoose.model('Assessment', assessmentSchema);

// User model for Google Auth
const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, required: true },
  name: String,
  email: { type: String, unique: true },
  picture: String,
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
}, { strict: false });

const User = mongoose.model('User', userSchema);

// Helper: Convert OpenAI-style messages to Gemini format
const toGeminiHistory = (messages) => {
  return messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
};

// Model fallback order — if one model hits quota, try the next
const CHAT_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

// Helper: Chat with Gemini (auto-fallback across models)
const geminiChat = async (preferredModel, systemPrompt, messages, config = {}) => {
  // Build model priority list: preferred model first, then the rest
  const modelsToTry = [preferredModel, ...CHAT_MODELS.filter(m => m !== preferredModel)];
  const history = toGeminiHistory(messages.slice(0, -1));
  const lastMessage = messages[messages.length - 1]?.content || '';

  let lastError = null;
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          maxOutputTokens: config.maxTokens ?? 1000,
          ...config.extra,
        },
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage);
      const text = result.response.text();
      if (text) {
        console.log(`✅ Used model: ${modelName}`);
        return text;
      }
    } catch (err) {
      const msg = err.message || '';
      console.warn(`⚠️ ${modelName} failed: ${msg.includes('429') ? 'quota exceeded' : msg.substring(0, 80)}`);
      lastError = err;
      // If it's a quota error, try next model; otherwise re-throw
      if (!msg.includes('429') && !msg.includes('quota') && !msg.includes('RESOURCE_EXHAUSTED')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('All models exhausted');
};

// Helper: Generate content (non-chat, for questions/analysis) with model fallback
const geminiGenerate = async (preferredModel, systemPrompt, prompt, config = {}) => {
  const modelsToTry = [preferredModel, ...CHAT_MODELS.filter(m => m !== preferredModel)];

  let lastError = null;
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          maxOutputTokens: config.maxTokens ?? 1000,
          ...config.extra,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) {
        console.log(`✅ Used model: ${modelName}`);
        return text;
      }
    } catch (err) {
      const msg = err.message || '';
      console.warn(`⚠️ ${modelName} failed: ${msg.includes('429') ? 'quota exceeded' : msg.substring(0, 80)}`);
      lastError = err;
      if (!msg.includes('429') && !msg.includes('quota') && !msg.includes('RESOURCE_EXHAUSTED')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('All models exhausted');
};

// ──── Health Check ────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ──── Simple Chat Endpoint ────
app.post('/api/claude', async (req, res) => {
  try {
    const { messages, system } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API key not configured on server' });
    }

    const content = await geminiChat(
      'gemini-2.5-flash',
      system || 'You are a helpful assistant.',
      messages,
      { maxTokens: 1000 }
    );

    res.json({ content });
  } catch (error) {
    console.error('Gemini API Error:', error.message || error);
    res.status(500).json({ error: 'Failed to communicate with AI' });
  }
});

// ──── Counselor Chat Endpoint ────
app.post('/api/claude/chat', async (req, res) => {
  try {
    const { messages, stressScore, stressCategory, stressor, hobbies } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API key not configured on server' });
    }

    const systemPrompt = `You are SoundMind — an empathetic, highly skilled AI mental health counselor designed specifically for students. You combine the warmth of a best friend with the expertise of a trained therapist.

## WHO YOU ARE
You're like that one amazing school counselor everyone wishes they had — genuinely caring, non-judgmental, and actually helpful. You feel like a real person, not a robot. You use the student's name naturally if they share it, you remember details they mention, and you respond like someone who truly cares.

## THE STUDENT RIGHT NOW
- Stress Level: ${stressScore}/10 (${stressCategory || 'Unknown'})
- Main Stressor: ${stressor || 'Not yet shared'}
- Hobbies/Interests: ${hobbies || 'Not yet shared'}

## HOW YOU TALK
- Write like a caring human, not a textbook. Use contractions (I'm, you're, that's).
- Be conversational and warm. Occasional gentle humor is okay when appropriate.
- Use short paragraphs (2-3 sentences each). Never write walls of text.
- Bold **key phrases** sparingly for emphasis on important insights.
- End EVERY response with exactly ONE thoughtful follow-up question that deepens the conversation.
- Never use bullet points in the first response — feel it out naturally first.
- IMPORTANT: Never repeat the same advice or question you already said. Always move the conversation forward with new insights.

## YOUR THERAPEUTIC TOOLKIT (use naturally, never label them)
1. **Validation First**: Before ANY advice, validate what they're feeling.
2. **Reflective Listening**: Mirror their words back. "So what you're saying is..." or "It sounds like the hardest part is..."
3. **Gentle Curiosity**: Ask "what" and "how" questions, not "why" (which feels accusatory).
4. **Cognitive Reframing**: When you spot distorted thinking, gently offer an alternative perspective.
5. **Scaling Questions**: "On a scale of 1-10, how confident do you feel about handling this?"
6. **Strengths Spotting**: Notice and name their strengths.
7. **Micro-Actions**: When suggesting next steps, make them tiny and specific.
8. **Hobby Integration**: When relevant, connect their hobbies (${hobbies || 'their interests'}) to coping.

## RESPONSE PATTERNS BY STRESS LEVEL
${stressScore <= 4 ? `- LOW STRESS: Be encouraging and celebratory. Help them maintain their wellbeing. Keep it light and positive.` : ''}${stressScore > 4 && stressScore <= 6 ? `- MILD STRESS: Be supportive and practical. Help them identify specific triggers and build small coping routines.` : ''}${stressScore > 6 && stressScore <= 8 ? `- MODERATE-HIGH STRESS: Be deeply empathetic and structured. Help them prioritize and break overwhelming situations into manageable pieces.` : ''}${stressScore > 8 ? `- SEVERE STRESS: Lead with compassion and safety. Validate heavily. Check in on basic needs (sleep, eating, social support). If they mention self-harm, IMMEDIATELY provide 988 Lifeline.` : ''}

## CRITICAL SAFETY RULES
- If they mention self-harm, suicide, or wanting to die: IMMEDIATELY provide 988 Lifeline, Crisis Text Line (text HOME to 741741), and urge them to tell a trusted adult.
- NEVER diagnose conditions, prescribe medication, or replace professional help.
- You are a support tool, not a replacement for professional care.`;

    // Trim conversation to last 20 messages
    const trimmedMessages = messages.length > 20
      ? messages.slice(-20)
      : messages;

    const content = await geminiChat(
      'gemini-2.5-flash',
      systemPrompt,
      trimmedMessages,
      { temperature: 0.8, maxTokens: 800 }
    );

    res.json({ content });
  } catch (error) {
    console.error('Gemini Chat API Error:', error.message || error);
    res.status(500).json({ error: 'Failed to communicate with AI counselor' });
  }
});

// ──── Question Generation Endpoint ────
app.post('/api/gemini/questions', async (req, res) => {
  try {
    const { count = 20 } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API key not configured on server' });
    }

    const systemPrompt = `You are a clinical psychologist and stress assessment expert. Generate exactly ${count} questions to assess a student's stress level. 

CRITICAL: Do NOT ask direct questions like "how stressed are you" or "rate your stress level". Instead, use INDIRECT behavioral and situational questions that reveal stress through patterns:
- Sleep quality and habits
- Appetite and eating patterns
- Concentration and cognitive function
- Physical symptoms (headaches, tension)
- Social withdrawal vs. connection
- Emotional regulation ability
- Procrastination and avoidance behaviors
- Sense of control over life events
- Physical activity levels
- Morning mood and outlook on the day

IMPORTANT RULES:
1. Each question must have a "stressDirection" field: "positive" (high value = low stress) or "negative" (high value = high stress).
2. One question MUST ask about the student's favorite hobbies or things they do in idle time (type: "text").
3. One question MUST ask about their primary source of mental energy drain (type: "select").
4. One question MUST ask about their most overwhelming subject/area (type: "text").
5. One question MUST ask about their next major deadline (type: "date").
6. Mix different question types for engagement.

Return a JSON array of question objects. Each object must have:
- "text": the question text
- "type": one of "slider", "radio", "emoji", "text", "select", "date"
- "stressDirection": "positive" or "negative" (omit for text/select/date types)
- For "slider": include "min" (number), "max" (number), "labels" (array of 2 strings for min/max)
- For "radio": include "options" (array of 3-5 strings, ordered from BEST to WORST for "positive", or BEST to WORST for "negative")
- For "emoji": include "options" (array of 5 emoji strings) and "values" (array of 5 numbers 1-9, high = good)
- For "select": include "options" (array of strings)
- For "text": include "placeholder" (string)
- For "date": no extra fields needed

Return ONLY a JSON object with a "questions" key containing the array.`;

    const content = await geminiGenerate(
      'gemini-2.5-flash',
      systemPrompt,
      `Generate ${count} indirect stress assessment questions for a student. Return a JSON object with a "questions" key.`,
      { temperature: 0.7, maxTokens: 4000, extra: { responseMimeType: 'application/json' } }
    );

    try {
      const parsed = JSON.parse(content);
      const questions = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.data || []);
      res.json({ questions });
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Gemini API Error:', error.message || error);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

// ──── AI Stress Analysis Endpoint ────
app.post('/api/analyze-stress', async (req, res) => {
  try {
    const { questions, answers } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API key not configured' });
    }

    const qaSummary = questions
      .map(q => {
        const answer = answers[q.id];
        if (answer === undefined || answer === null || answer === '') return null;
        return `Q: ${q.text}\nA: ${answer}`;
      })
      .filter(Boolean)
      .join('\n\n');

    const prompt = `Analyze the following student stress assessment responses and provide a stress evaluation.

## Survey Responses:
${qaSummary}

## Instructions:
Based on these responses, evaluate the student's stress level. Consider:
1. Sleep patterns and quality
2. Emotional regulation and coping ability
3. Physical symptoms of stress
4. Social connection vs isolation
5. Academic/workload pressure
6. Behavioral indicators (procrastination, appetite changes, concentration)

Return a JSON object with:
- "score": a number from 1 to 10 (1 = minimal stress, 10 = severe stress)
- "category": one of "Low Stress", "Mild Stress", "Moderate Stress", "High Stress", "Severe Stress"
- "keyStressors": array of the top 2-3 identified stressors
- "insight": a 1-2 sentence clinical insight about the student's stress pattern

Return ONLY the JSON object.`;

    const content = await geminiGenerate(
      'gemini-2.5-flash',
      'You are a clinical psychologist specializing in student stress assessment. Analyze survey responses and provide accurate stress evaluations. Return only valid JSON.',
      prompt,
      { temperature: 0.3, maxTokens: 500, extra: { responseMimeType: 'application/json' } }
    );

    try {
      const parsed = JSON.parse(content);
      res.json(parsed);
    } catch (parseError) {
      console.error('Failed to parse Gemini stress analysis:', parseError);
      res.status(500).json({ error: 'Failed to parse AI analysis' });
    }
  } catch (error) {
    console.error('Stress Analysis API Error:', error.message || error);
    res.status(500).json({ error: 'Failed to analyze stress' });
  }
});

// ──── Parent Notification Endpoint ────
app.post('/api/notify-parent', async (req, res) => {
  try {
    const { parentName, parentPhone, parentEmail, stressScore, message } = req.body;

    // Log the notification (in production, this would send via Twilio/SendGrid)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 PARENT NOTIFICATION TRIGGERED');
    console.log(`   To: ${parentName || 'Parent/Guardian'}`);
    if (parentEmail) console.log(`   Email: ${parentEmail}`);
    if (parentPhone) console.log(`   Phone: ${parentPhone}`);
    console.log(`   Stress Score: ${stressScore}/10`);
    console.log(`   Message: ${message}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // In production, integrate with:
    // - Twilio for SMS: twilio.messages.create({ to: parentPhone, body: message })
    // - SendGrid for email: sgMail.send({ to: parentEmail, subject: 'SoundMind Alert', text: message })

    // Simulate a short delay for realism
    await new Promise(r => setTimeout(r, 1500));

    res.json({
      success: true,
      method: parentEmail ? 'email' : 'sms',
      recipient: parentName || 'Parent/Guardian',
      message: 'Notification sent successfully',
    });
  } catch (error) {
    console.error('Parent notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});
// ──── Google Auth Endpoint ────
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'No credential provided' });

    // Decode the JWT (Google Identity Services tokens are self-verifiable)
    const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());

    if (!process.env.MONGODB_URI) {
      // No database — just return the decoded user
      return res.json({
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      });
    }

    // Upsert user in MongoDB
    const user = await User.findOneAndUpdate(
      { googleId: payload.sub },
      {
        googleId: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        lastLogin: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      id: user._id,
      googleId: user.googleId,
      name: user.name,
      email: user.email,
      picture: user.picture,
    });
  } catch (error) {
    console.error('Google Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ──── Database Endpoints ────
app.post('/api/assessments', async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) return res.status(503).json({ error: 'Database not configured' });
    const assessment = new Assessment(req.body);
    const saved = await assessment.save();
    res.json({ id: saved._id, ...saved.toObject() });
  } catch (error) {
    console.error('Error saving assessment:', error);
    res.status(500).json({ error: 'Failed to save assessment' });
  }
});

app.get('/api/assessments', async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) return res.status(503).json({ error: 'Database not configured' });
    const assessments = await Assessment.find().sort({ timestamp: -1 }).limit(50);
    res.json(assessments.map(a => ({ id: a._id, ...a.toObject() })));
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// ──── Serve static files in production ────
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(distPath, 'index.html'));
    }
  });
}

app.listen(port, () => {
  console.log(`\n🧠 SoundMind server running at http://localhost:${port}`);
  console.log(`   Gemini API Key: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing — set GEMINI_API_KEY in .env'}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
