import { CONSTANTS } from '../utils/constants';
import { getScoreCategory } from '../utils/stressCalculator';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ── Track used fallback indices to avoid repetition ──
let usedFallbackIndices = new Set();

// ── Fallback responses when API is unavailable ──
const MOCK_STUDY_PLAN = `1. Break down your study material into 25-minute Pomodoro chunks.\n2. Focus on the core concepts first rather than memorizing small details.\n3. Take a 5-minute walk outside before you start.`;

const MOCK_BREAK_ACTIVITIES = `1. Do a 5-minute stretching routine.\n2. Listen to two of your favorite upbeat songs.\n3. Drink a glass of cold water and step outside for some fresh air.`;

// ── Retry wrapper ──
const fetchWithRetry = async (url, options, retries = 1) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (i < retries) await delay(1000 * (i + 1));
    } catch (err) {
      if (i < retries) await delay(1000 * (i + 1));
      else throw err;
    }
  }
  throw new Error('All retries failed');
};

export const generateStudyPlan = async (subject, score) => {
  try {
    const response = await fetchWithRetry('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: CONSTANTS.PROMPTS.STUDY_PLAN(subject, score) }],
        system: "You are a helpful academic coach. Keep responses concise and actionable."
      })
    });

    const data = await response.json();
    return data.content || MOCK_STUDY_PLAN;
  } catch (error) {
    console.warn("API unavailable. Using fallback study plan.");
    await delay(800);
    return MOCK_STUDY_PLAN;
  }
};

export const getBreakActivities = async (hobby, score) => {
  try {
    const prompt = `Give me 3 short, calming break activities based on my hobby of ${hobby}. My current stress level is ${score}/10. Keep it brief.`;
    const response = await fetchWithRetry('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        system: "You are a wellness coach. Be concise and practical."
      })
    });

    const data = await response.json();
    return data.content || MOCK_BREAK_ACTIVITIES;
  } catch (error) {
    console.warn("API unavailable. Using fallback activities.");
    await delay(800);
    return MOCK_BREAK_ACTIVITIES;
  }
};

/**
 * Get AI-generated wellness advice for low-stress users
 */
export const getWellnessAdvice = async (score, hobbies) => {
  try {
    const prompt = `I'm a student with a stress level of ${score}/10 (low). My hobbies include ${hobbies || 'various things'}. Give me 3-4 brief, positive wellness tips to maintain my good mental health. Be warm and encouraging. Keep it concise.`;
    const response = await fetchWithRetry('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        system: "You are a positive wellness coach for students. Be encouraging and brief."
      })
    });

    const data = await response.json();
    return data.content || getDefaultWellnessAdvice(hobbies);
  } catch {
    await delay(600);
    return getDefaultWellnessAdvice(hobbies);
  }
};

const getDefaultWellnessAdvice = (hobbies) => {
  return `Great news — your stress levels are looking healthy! Here are some tips to keep it that way:\n\n1. **Keep up your hobbies** — ${hobbies || 'the activities you enjoy'} are natural stress buffers.\n2. **Maintain your sleep routine** — consistent sleep is your biggest ally.\n3. **Stay connected** — regular chats with friends and family keep your mood elevated.\n4. **Celebrate small wins** — acknowledge what's going well, not just what's hard.`;
};

/**
 * Get the initial counselor greeting via AI
 */
export const getInitialCounselorMessage = async (score, stressors, hobbies) => {
  const category = getScoreCategory(score);
  const prompt = `I just completed a stress assessment and my stress level came out to ${score}/10 (${category.label}). I'm a student and my main stressor is ${stressors || 'school'}. My hobbies include ${hobbies || 'various things'}. I'd like to talk about how I'm feeling.`;

  try {
    const response = await fetchWithRetry('/api/claude/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        stressScore: score,
        stressCategory: category.label,
        stressor: stressors || 'school',
        hobbies: hobbies || '',
      })
    });

    const data = await response.json();
    if (data.content) return { content: data.content, isAI: true };
    throw new Error('Empty response');
  } catch (error) {
    console.warn("API unavailable for greeting. Using fallback.");
    await delay(1000);

    let content;
    if (score <= 4) {
      content = `Hey! 😊 I see you just finished your assessment and you're sitting at a ${score}/10 on the stress scale — that's actually really solid! It's clear you've got some good things going for you right now.\n\nI'm here if you want to chat about anything, whether it's keeping this momentum going or just venting about the small stuff. Sometimes even low-stress periods have their moments, right?\n\nWhat's been the best part of your week so far?`;
    } else if (score <= 7) {
      content = `Hey, thanks for taking the time to do that assessment. I can see your stress is at ${score}/10, and I want you to know — that's completely normal for a student, but it doesn't mean we should ignore it.\n\nI'm here to listen and help you work through whatever's on your mind. There's no judgment here, just a conversation between two people trying to figure things out.\n\nWhat's been weighing on you the most lately?`;
    } else {
      content = `Hey, I'm really glad you're here. I can see your stress level came in at ${score}/10, and I want to start by saying — it takes real courage to acknowledge that and show up for yourself like this.\n\nI'm here for you, and we can take this at whatever pace feels right. There's no rush, no pressure. Just you and me talking through things.\n\nBefore we dive in — how are you feeling right now, in this moment?`;
    }
    return { content, isAI: false };
  }
};

// ── Massive contextual fallback system ──
const CONTEXTUAL_FALLBACKS = {
  sleep: [
    `Sleep is such a huge one — it affects literally everything else. When you're not sleeping well, your stress tolerance drops, focus gets worse, and everything feels harder than it actually is.\n\nHere's something that might help: try the **10-3-2-1 rule** tonight. No caffeine 10 hours before bed, no food 3 hours before, no screens 2 hours before, and no work 1 hour before. Even just starting with the "no screens" part can make a real difference.\n\nWhat does your typical night look like? Like, what time do you usually get into bed versus when you actually fall asleep?`,
    `I totally get it — sleep problems create this vicious cycle where you're too tired to function, which makes you more stressed, which makes it harder to sleep. It's really frustrating.\n\nOne thing I'd suggest: create a **"wind-down playlist"** of calm sounds or soft music. Put it on 30 minutes before bed. Your brain starts associating those sounds with sleep time, and it becomes a natural cue.\n\nAlso — and I know this is hard — try to keep your bed **only for sleeping**. No scrolling, no studying in bed. Your brain needs to connect that space with rest.\n\nHave you tried anything to help with your sleep so far?`,
  ],
  overwhelm: [
    `That feeling of being overwhelmed is one of the hardest ones, because it makes everything blur together into one giant wall of "too much." But here's the thing — it's almost never actually everything at once. It just *feels* that way.\n\nLet's try something. Can you **name the top 3 things** that are stressing you out right now? Not everything — just the big three. Sometimes just separating them out and seeing them individually makes them feel more manageable.\n\nWhat would be number one on that list?`,
    `I hear you — when everything piles up, it can feel like you're drowning. But you're not. You're here, you're talking about it, and that already means you're handling it better than you think.\n\nHere's a technique that really works: the **"2-minute rule."** Look at your to-do list and find anything that takes 2 minutes or less. Do those first. Crossing even tiny things off creates momentum and makes the bigger stuff feel less scary.\n\nWhat's one small thing you could knock out right now?`,
    `Being overwhelmed often comes from trying to hold everything in your head at once. Your brain isn't designed for that — it's like trying to juggle 10 balls when you can only hold 3.\n\nTry a **brain dump**: grab your phone or a piece of paper, and write down absolutely everything that's on your mind. Don't organize it, just dump it all out. Once it's on paper, your brain can stop trying to remember it all, and you can start prioritizing.\n\nWould you like to try that right now?`,
  ],
  focus: [
    `Focus is tricky because the harder you try to force it, the worse it gets. It's like trying to fall asleep — the effort itself becomes the obstacle.\n\nOne thing that works really well is the **"just 5 minutes" trick**. Tell yourself you'll focus on ONE task for just 5 minutes. Set a timer. When it goes off, you can stop if you want. But most of the time, you'll keep going because getting started was the hard part.\n\nWhat's the thing you've been trying hardest to focus on lately?`,
    `Difficulty concentrating is actually one of the most common stress responses. Your brain is in "alert mode" scanning for threats, which makes it really hard to settle down and focus on one thing.\n\nSomething that can help: **body doubling**. Study with a friend (even virtually on a call), or go to a library or café. Something about having other people around who are also working helps your brain settle in.\n\nAlso, have you tried putting your phone in another room while you study? Even having it face-down on your desk can be distracting because your brain knows it's there.\n\nWhat's your usual study setup like?`,
  ],
  anxiety: [
    `What you're describing sounds like anxiety, and I want you to know — it's incredibly common, especially for students. Your brain is basically stuck in "what if" mode, playing worst-case scenarios on repeat.\n\nHere's something that can help right now: the **5-4-3-2-1 grounding technique**. Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. It pulls your brain out of the future and back into the present.\n\nWhen do you notice the anxiety is at its worst?`,
    `Anxiety has a way of making everything feel urgent and dangerous, even when it's not. It's your brain trying to protect you, but it's overreacting.\n\nOne technique that can really help is **"worry scheduling."** Pick a 15-minute window each day — say, 4:00-4:15 PM — and that's your designated worry time. When anxious thoughts pop up outside that window, you acknowledge them and say "I'll think about that at 4." It sounds weird, but it gives your brain permission to let go temporarily.\n\nWhat kind of thoughts tend to loop for you the most?`,
  ],
  loneliness: [
    `Feeling lonely is really tough, especially as a student when it seems like everyone else has their group figured out. But I want you to know — a lot of people feel this way, even the ones who look like they've got it all together.\n\nConnection doesn't have to be big or dramatic. Sometimes it starts with small things: **texting one person you haven't talked to in a while**, joining a club that meets once a week, or even just saying hi to someone in class you've been wanting to talk to.\n\nWhat's holding you back the most from connecting with people?`,
    `Loneliness is one of those feelings that feeds on itself — the lonelier you feel, the harder it seems to reach out, which makes you feel even lonelier. Breaking that cycle takes one small step.\n\nHere's what I'd suggest: think of **one person** you'd feel comfortable texting right now. Not a deep conversation, just something simple like sharing a meme or asking about an assignment. That tiny connection can shift your whole day.\n\nDo you have someone like that in mind?`,
  ],
  academic: [
    `Academic pressure is one of the top stressors for students, and it makes sense — there's this constant feeling that your grades define your future. But here's the truth: **they don't define you.** They're one part of a much bigger picture.\n\nThat said, let's be practical. If you're struggling with a subject, the single most effective thing you can do is **go to office hours**. I know it feels awkward, but professors and TAs literally get paid to help you, and most of them genuinely want to.\n\nWhat subject or class is causing you the most stress right now?`,
    `I get it — when grades feel like they're slipping, it can trigger this spiral of "I'm not good enough" thinking. But struggling with a class doesn't mean you're not smart. It often means the way the material is being taught doesn't match how you learn best.\n\nHave you tried **teaching the material to someone else** (or even to an empty room)? It's called the Feynman Technique, and it's one of the most effective study methods because it forces you to actually understand the concepts, not just memorize them.\n\nWhat does your study routine usually look like?`,
  ],
  relationships: [
    `Relationship stress — whether it's friends, family, or romantic — hits different because it's so personal. It's hard to separate your emotions from the situation when it involves people you care about.\n\nOne thing that can really help is writing down what's bothering you before you try to talk about it. Not to send — just for yourself. It helps you figure out what you're actually feeling versus what you're reacting to in the moment.\n\nDo you want to tell me a bit more about what's going on?`,
  ],
  motivation: [
    `Losing motivation is frustrating, especially when you know you *should* care but just... don't. Here's the thing most people get wrong: **motivation doesn't come before action — it comes after.** You don't feel motivated, then start. You start, then feel motivated.\n\nSo the trick is making starting as easy as possible. Want to study? Just open the book. That's it. Don't commit to an hour — just open it. Want to exercise? Just put on your shoes. The rest tends to follow.\n\nWhat's one thing you've been putting off that you could start in the smallest possible way?`,
    `When motivation disappears, it's often because the goal feels too big or too far away. Your brain can't connect today's effort with a reward that's weeks or months away.\n\nTry **breaking things down into "micro-goals"** with immediate rewards. Study for 25 minutes → watch a YouTube video. Finish one assignment → get your favorite snack. Your brain needs these small dopamine hits to stay engaged.\n\nWhat's something you used to feel motivated about that's faded recently?`,
  ],
  family: [
    `Family stress is uniquely hard because you can't just "take space" the way you can with friends. These are people you live with, depend on, or have deep history with. And the dynamics can be really complicated.\n\nI want you to know that it's okay to feel frustrated or hurt by family — loving someone and being stressed by them aren't mutually exclusive. You can feel both at the same time.\n\nWithout going into too much detail if you're not comfortable — is it a specific person or more of a general family dynamic that's weighing on you?`,
  ],
  general: [
    `I hear you, and I want you to know that what you're feeling makes complete sense given what you're going through. A lot of students carry this kind of weight and feel like they have to just push through it alone — but you don't.\n\nWhat you just shared tells me a lot about your self-awareness, and that's actually a real strength. The fact that you can name what's going on is the first step to working through it.\n\nIf you could change just **one thing** about your situation right now, what would it be?`,

    `Thank you for being so open with me — that's not easy, and it matters. What I'm hearing is that you've been dealing with a lot, and it's starting to add up in ways that feel hard to manage.\n\nHere's what I want you to remember: **you don't have to solve everything today.** We can start small. Sometimes the most powerful thing you can do is just take one tiny step forward.\n\nWhat feels like the most doable thing you could do for yourself today — even something as small as taking a walk or texting a friend?`,

    `I can tell you've been carrying a lot. And the fact that you're here talking about it instead of just bottling it up? That takes guts. Seriously.\n\nLet's try something: **right now, take one deep breath.** In through your nose for 4 counts, hold for 4, out through your mouth for 4. Just one. I'll wait.\n\nOkay — now that you've got a tiny bit of space, what feels like the most pressing thing on your mind?`,

    `You know what I notice? You're really good at articulating what you're going through. That might not feel like much, but **emotional awareness is actually a superpower.** A lot of people can't even name what they're feeling, let alone talk about it.\n\nSo let's use that strength. What do you think is the root cause of what you're feeling right now — not the surface-level stuff, but the thing underneath it all?`,

    `I appreciate you trusting me with this. What you're describing is really common among students, but that doesn't make it any less real or difficult for you personally.\n\nHere's what I'd love for us to do: instead of trying to fix everything at once, let's **pick one area** where a small improvement would make the biggest difference. Sometimes loosening one knot helps unravel the whole tangle.\n\nWhat area of your life, if it improved just a little, would have the biggest positive ripple effect?`,

    `It sounds like you're in one of those phases where everything feels heavy. I've talked to a lot of students who describe exactly what you're going through, and I want you to know — **this phase is temporary.** It doesn't feel like it right now, but it is.\n\nFor today, I just want you to be kind to yourself. Not productive, not optimized, not "better" — just kind. What would that look like for you tonight?`,

    `What you're sharing really resonates, and I don't want to rush past it with quick advice. Sometimes the most helpful thing is just having someone really listen.\n\nSo let me ask: when you think about what's stressing you out, is it more about **things you can control** (like study habits, how you spend your time) or **things outside your control** (like other people's expectations, uncertainty about the future)? That distinction really changes what strategies work best.\n\nWhat comes to mind?`,

    `I want to validate something: **it's okay to not be okay.** There's this pressure, especially as a student, to always be hustling, always be positive, always have it together. But that's not realistic, and pretending everything is fine actually makes stress worse.\n\nSo right now, you don't have to have a plan or a solution. You just have to be honest with yourself about where you're at. And you're already doing that by being here.\n\nWhat would feel most helpful to you right now — venting, getting practical advice, or just talking?`,

    `You're dealing with a lot, and I respect that you're addressing it head-on. Not everyone does that.\n\nHere's a question that might help us get somewhere useful: **if a close friend came to you with exactly what you're going through right now, what advice would you give them?** Sometimes we're much better at caring for others than we are at caring for ourselves.\n\nWhat would you tell them?`,

    `I hear a lot of different things in what you're sharing — and that's okay. Life is rarely just one simple problem. It's usually a mix of things that compound each other.\n\nLet's start with what feels most urgent. Not most important, but most **urgent** — the thing that's taking up the most mental space right now. We can tackle the rest after.\n\nWhat's that one thing?`,
  ],
};

// Keyword matching for contextual fallbacks
const detectTopics = (text) => {
  const lower = text.toLowerCase();
  const topics = [];

  if (/sleep|tired|exhausted|insomnia|rest|awake|nap/.test(lower)) topics.push('sleep');
  if (/overwhelm|too much|can't handle|drowning|piling up|swamped/.test(lower)) topics.push('overwhelm');
  if (/focus|concentrate|distract|attention|procrastin/.test(lower)) topics.push('focus');
  if (/anxi|nervous|worry|panic|scared|afraid|fear|dread/.test(lower)) topics.push('anxiety');
  if (/lonely|alone|isolat|disconnected|no friends|nobody/.test(lower)) topics.push('loneliness');
  if (/grade|exam|test|class|study|homework|assignment|gpa|professor|school/.test(lower)) topics.push('academic');
  if (/friend|boyfriend|girlfriend|relationship|dating|partner|breakup/.test(lower)) topics.push('relationships');
  if (/motivat|don't care|pointless|why bother|lazy|can't start/.test(lower)) topics.push('motivation');
  if (/family|parent|mom|dad|sibling|brother|sister|home/.test(lower)) topics.push('family');

  return topics.length > 0 ? topics : ['general'];
};

const getUnusedFallback = (pool) => {
  const availableIndices = pool.map((_, i) => i).filter(i => !usedFallbackIndices.has(`${pool[0]?.substring(0, 20)}_${i}`));

  if (availableIndices.length === 0) {
    // Reset used indices for this pool
    pool.forEach((_, i) => usedFallbackIndices.delete(`${pool[0]?.substring(0, 20)}_${i}`));
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const chosen = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  usedFallbackIndices.add(`${pool[0]?.substring(0, 20)}_${chosen}`);
  return pool[chosen];
};

/**
 * Multi-turn counselor chat via AI with full conversation context
 * Returns { content, isAI } where isAI indicates if it came from the real API
 */
export const chatWithCounselor = async (messages, score, stressors, hobbies) => {
  const category = getScoreCategory(score);

  try {
    const response = await fetchWithRetry('/api/claude/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages,
        stressScore: score,
        stressCategory: category.label,
        stressor: stressors || 'school',
        hobbies: hobbies || '',
      })
    });

    const data = await response.json();
    if (data.content) return { content: data.content, isAI: true };
    throw new Error('Empty response');
  } catch (error) {
    console.warn("API unavailable. Using contextual fallback.");
    await delay(1200);

    // Use keyword-matched contextual fallback
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const topics = detectTopics(lastUserMsg);

    // Try the most specific topic first
    for (const topic of topics) {
      const pool = CONTEXTUAL_FALLBACKS[topic];
      if (pool && pool.length > 0) {
        return { content: getUnusedFallback(pool), isAI: false };
      }
    }

    // Should never reach here, but fallback to general
    return { content: getUnusedFallback(CONTEXTUAL_FALLBACKS.general), isAI: false };
  }
};

/**
 * Check if the API is reachable
 */
export const checkAPIHealth = async () => {
  try {
    const response = await fetch('/api/health', { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
};
