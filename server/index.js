import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
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

const toGeminiHistory = (messages) => {
  if (!messages || messages.length === 0) return [];

  let history = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content || ' ' }],
  }));

  if (history[0].role === 'model') {
    history.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
  }

  const normalized = [];
  for (let i = 0; i < history.length; i++) {
    if (normalized.length === 0) {
      normalized.push(history[i]);
    } else {
      if (normalized[normalized.length - 1].role === history[i].role) {
        normalized.push({
          role: history[i].role === 'user' ? 'model' : 'user',
          parts: [{ text: 'I understand.' }]
        });
      }
      normalized.push(history[i]);
    }
  }

  if (normalized.length > 0 && normalized[normalized.length - 1].role === 'user') {
    normalized.push({ role: 'model', parts: [{ text: 'Please continue.' }] });
  }

  return normalized;
};

// Model fallback order — if one model hits quota, try the next
const CHAT_MODELS = [
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite-001',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
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
    const { count = 12 } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API key not configured on server' });
    }

    const systemPrompt = `You are a clinical psychologist and stress assessment expert. Generate exactly ${count} questions to assess a student's stress level. 

CRITICAL: Do NOT ask direct questions like "how stressed are you" or "rate your stress level". Instead, use INDIRECT behavioral and situational questions that reveal stress through patterns:
- Sleep quality and habits
- Concentration and cognitive function
- Physical symptoms (headaches, tension)
- Emotional regulation ability
- Procrastination and avoidance behaviors
- Sense of control over life events
- Morning mood and outlook on the day
- Academic backlog and exam readiness
- Comprehension difficulties
- Time management and focus

IMPORTANT RULES:
1. Each question must have a "stressDirection" field: "positive" (high value = low stress) or "negative" (high value = high stress).
2. Do NOT include questions about hobbies, favorite activities, primary stressor, overwhelming subject, or deadlines — those are collected separately.
3. Include 4 academic stress probe questions with an "academicTag" field: one each for "backlog", "exam_readiness", "comprehension", and "time_management".
4. Mix different question types for engagement.

Return a JSON array of question objects. Each object must have:
- "text": the question text
- "type": one of "slider", "radio", "emoji"
- "stressDirection": "positive" or "negative"
- For "slider": include "min" (number), "max" (number), "labels" (array of 2 strings for min/max)
- For "radio": include "options" (array of 3-5 strings, ordered from BEST to WORST for "positive", or BEST to WORST for "negative")
- For "emoji": include "options" (array of 5 emoji strings) and "values" (array of 5 numbers 1-9, high = good)
- Optionally include "academicTag" for academic probe questions

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

// ──── Parent Notification Endpoint (Real Email via Nodemailer) ────
app.post('/api/notify-parent', async (req, res) => {
  try {
    const { parentName, parentPhone, parentEmail, studentName, stressScore, message } = req.body;

    if (!parentEmail) {
      return res.status(400).json({ error: 'Parent email is required' });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 PARENT NOTIFICATION TRIGGERED');
    console.log(`   To: ${parentName || 'Parent/Guardian'} <${parentEmail}>`);
    console.log(`   Student: ${studentName || 'Your child'}`);
    console.log(`   Stress Score: ${stressScore}/10`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpEmail || !smtpPassword) {
      console.warn('⚠️ SMTP credentials not configured (SMTP_EMAIL / SMTP_PASSWORD). Email logged but NOT sent.');
      console.log(`   Would send to: ${parentEmail}`);
      console.log(`   Message: ${message}`);
      return res.json({
        success: true,
        method: 'log_only',
        recipient: parentName || 'Parent/Guardian',
        message: 'Notification logged (SMTP not configured — add SMTP_EMAIL and SMTP_PASSWORD to .env to send real emails)',
      });
    }

    // Create Nodemailer transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
    });

    const studentDisplay = studentName || 'Your child';
    const parentDisplay = parentName || 'Parent/Guardian';

    // Professional HTML email template
    const htmlEmail = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:2rem 1rem;">
    <!-- Header -->
    <div style="text-align:center;padding:2rem;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px 16px 0 0;">
      <div style="font-size:2.5rem;margin-bottom:0.5rem;">🧠</div>
      <h1 style="color:white;margin:0;font-size:1.75rem;font-weight:700;">SoundMind Alert</h1>
      <p style="color:rgba(255,255,255,0.8);margin:0.5rem 0 0;font-size:0.95rem;">Student Wellness Notification</p>
    </div>

    <!-- Body -->
    <div style="background:#1a1a2e;padding:2rem;border:1px solid rgba(255,255,255,0.08);">
      <p style="color:#e2e8f0;font-size:1rem;line-height:1.6;margin-top:0;">
        Dear <strong>${parentDisplay}</strong>,
      </p>
      <p style="color:#cbd5e1;font-size:0.95rem;line-height:1.7;">
        We're reaching out because <strong style="color:#f8fafc;">${studentDisplay}</strong> recently completed a wellness assessment on <strong style="color:#f8fafc;">SoundMind</strong>, our AI-powered student stress detection platform.
      </p>

      <!-- Score Badge -->
      <div style="text-align:center;margin:1.5rem 0;">
        <div style="display:inline-block;padding:1rem 2rem;border-radius:12px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);">
          <div style="color:#fca5a5;font-size:0.85rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Stress Level Detected</div>
          <div style="color:#ef4444;font-size:2.5rem;font-weight:800;margin:0.25rem 0;">${stressScore}/10</div>
          <div style="color:#f87171;font-size:0.9rem;font-weight:600;">⚠️ Critical — Immediate Attention Recommended</div>
        </div>
      </div>

      <p style="color:#cbd5e1;font-size:0.95rem;line-height:1.7;">
        Your son/Daughter is very stressed , you should call him/her to check upon him ensuring his wellness
      </p>

      <!-- What You Can Do -->
      <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:1.25rem;margin:1.5rem 0;border:1px solid rgba(255,255,255,0.06);">
        <h3 style="color:#e2e8f0;margin:0 0 0.75rem;font-size:1rem;">💡 What You Can Do</h3>
        <ul style="color:#94a3b8;font-size:0.9rem;line-height:1.8;margin:0;padding-left:1.25rem;">
          <li>Start a gentle, non-judgmental conversation with ${studentDisplay}</li>
          <li>Ask open-ended questions like "How have you been feeling lately?"</li>
          <li>Listen without immediately trying to fix the problem</li>
          <li>Reassure them that it's okay to ask for help</li>
          <li>Consider connecting with a school counselor or mental health professional</li>
        </ul>
      </div>

      <!-- Crisis Resources -->
      <div style="background:rgba(239,68,68,0.08);border-radius:12px;padding:1.25rem;margin:1.5rem 0;border:1px solid rgba(239,68,68,0.2);">
        <h3 style="color:#fca5a5;margin:0 0 0.75rem;font-size:1rem;">🆘 Crisis Resources</h3>
        <p style="color:#94a3b8;font-size:0.875rem;line-height:1.6;margin:0;">
          If you believe your child is in immediate danger:<br/>
          <strong style="color:#f8fafc;">988 Suicide & Crisis Lifeline:</strong> Call or text <strong style="color:#60a5fa;">988</strong><br/>
          <strong style="color:#f8fafc;">Crisis Text Line:</strong> Text <strong style="color:#60a5fa;">HOME</strong> to <strong style="color:#60a5fa;">741741</strong><br/>
          <strong style="color:#f8fafc;">Emergency:</strong> Call <strong style="color:#60a5fa;">911</strong>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:1.5rem;background:#12121f;border-radius:0 0 16px 16px;border:1px solid rgba(255,255,255,0.05);border-top:none;">
      <p style="color:#64748b;font-size:0.8rem;margin:0;line-height:1.6;">
        This email was sent automatically by <strong>SoundMind</strong> because your child opted in to parent notifications.<br/>
        All assessment data is processed locally and is not stored on our servers.
      </p>
      <p style="color:#475569;font-size:0.75rem;margin:0.75rem 0 0;">
        © ${new Date().getFullYear()} SoundMind — AI-Powered Student Wellness
      </p>
    </div>
  </div>
</body>
</html>`;

    const mailOptions = {
      from: `"SoundMind Alert" <${smtpEmail}>`,
      to: parentEmail,
      subject: `⚠️ SoundMind Alert: ${studentDisplay}'s stress level is critical (${stressScore}/10)`,
      text: `Dear ${parentDisplay},\n\nYour son/Daughter is very stressed , you should call him/her to check upon him ensuring his wellness\n\n— SoundMind Team`,
      html: htmlEmail,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${parentEmail}`);

    res.json({
      success: true,
      method: 'email',
      recipient: parentDisplay,
      message: 'Email notification sent successfully',
    });
  } catch (error) {
    console.error('Parent notification error:', error);
    res.status(500).json({ error: 'Failed to send notification: ' + (error.message || 'Unknown error') });
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

// ──── Test Email Endpoint (for verifying SMTP config) ────
app.post('/api/test-email', async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: 'Email address required' });

    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpEmail || !smtpPassword) {
      return res.status(503).json({
        error: 'SMTP not configured. Add SMTP_EMAIL and SMTP_PASSWORD to .env',
        smtpEmail: !!smtpEmail,
        smtpPassword: !!smtpPassword,
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpEmail, pass: smtpPassword },
    });

    await transporter.sendMail({
      from: `"SoundMind Test" <${smtpEmail}>`,
      to,
      subject: '✅ SoundMind Email Service — Test Successful',
      text: 'This is a test email from SoundMind. If you received this, the email service is working correctly!',
      html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:500px;margin:0 auto;padding:2rem 1rem;">
    <div style="text-align:center;padding:2rem;background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:16px 16px 0 0;">
      <div style="font-size:3rem;margin-bottom:0.5rem;">✅</div>
      <h1 style="color:white;margin:0;font-size:1.5rem;">Email Service Working!</h1>
    </div>
    <div style="background:#1a1a2e;padding:2rem;border-radius:0 0 16px 16px;border:1px solid rgba(255,255,255,0.08);text-align:center;">
      <p style="color:#e2e8f0;font-size:1rem;line-height:1.6;">
        This is a test email from <strong>SoundMind</strong>.
      </p>
      <p style="color:#94a3b8;font-size:0.9rem;line-height:1.6;">
        If you're reading this, your SMTP configuration is correct and parent notifications will work when a student's stress score reaches 9+/10.
      </p>
      <div style="margin-top:1.5rem;padding:1rem;background:rgba(34,197,94,0.1);border-radius:8px;border:1px solid rgba(34,197,94,0.3);">
        <p style="color:#4ade80;font-size:0.85rem;margin:0;">🧠 SoundMind — AI-Powered Student Wellness</p>
      </div>
    </div>
  </div>
</body>
</html>`,
    });

    console.log(`✅ Test email sent to ${to}`);
    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (error) {
    console.error('Test email error:', error.message);
    res.status(500).json({ error: 'Failed to send test email: ' + error.message });
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
  console.log(`   SMTP Email: ${process.env.SMTP_EMAIL ? '✅ Configured' : '⚠️ Not configured — parent email notifications will be logged only'}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
