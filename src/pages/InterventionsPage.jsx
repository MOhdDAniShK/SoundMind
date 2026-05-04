import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import InterventionCard from '../components/InterventionCard';
import BreathingExercise from '../components/BreathingExercise';
import AnimatedBackground from '../components/AnimatedBackground';

import { CONSTANTS } from '../utils/constants';

const InterventionsPage = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();

  const [parentMessageSent, setParentMessageSent] = useState(state.parentNotificationSent || false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const { finalScore, userHobbies, consent, parentContact, academicStressType } = state;

  const hobbies = userHobbies || 'relaxing';

  // ── Determine stress tier ──
  const getStressTier = () => {
    if (finalScore < 6) return 'low';       // Below 6
    if (finalScore < 8) return 'moderate';   // 6 – 7.9
    if (finalScore < 9) return 'high';       // 8 – 8.9
    return 'critical';                        // 9+
  };
  const stressTier = getStressTier();

  // ── Curated activities per hobby category ──
  const HOBBY_ACTIVITIES = {
    writing: [
      {
        title: 'Journaling — Free-Write',
        description: 'Free-write your thoughts and feelings without judgment. This helps release pent-up emotions and untangle worries from your mind.',
        icon: '📝', type: 'writing', duration: 600, color: CONSTANTS.COLORS.MILD,
        verifyMode: 'writing', verifyConfig: { minWords: 50, prompt: 'Write freely about whatever is on your mind. No rules, no judgment — just let it flow.' },
      },
      {
        title: 'Creative Storytelling',
        description: 'Write a fictional short story or poem. Immersing yourself in an imaginary world provides an escape and mental break from real-life stressors.',
        icon: '✨', type: 'writing', duration: 600, color: CONSTANTS.COLORS.MILD,
        verifyMode: 'writing', verifyConfig: { minWords: 60, prompt: 'Write a short fictional story or poem — let your imagination run wild!' },
      },
      {
        title: 'Gratitude Writing',
        description: 'Spend 10-15 minutes writing things you\'re grateful for. This shifts your focus to positive aspects of life and naturally reduces anxiety.',
        icon: '🙏', type: 'writing', duration: 600, color: CONSTANTS.COLORS.LOW,
        verifyMode: 'writing', verifyConfig: { minWords: 40, prompt: 'List and describe things you\'re grateful for today. Big or small — everything counts.' },
      },
    ],
    reading: [
      {
        title: 'Fiction / Escapist Reading',
        description: 'Dive into a novel or fantasy world that completely absorbs your attention, allowing you to disconnect from stressors and forget your worries temporarily.',
        icon: '📚', type: 'reading', duration: 600, color: CONSTANTS.COLORS.LOW,
        verifyMode: 'reading', verifyConfig: { passage: 'fiction' },
      },
      {
        title: 'Comfort Re-Read',
        description: 'Return to a favorite book you\'ve already read. The familiarity and predictability are deeply calming and provide a sense of security.',
        icon: '📖', type: 'reading', duration: 600, color: CONSTANTS.COLORS.LOW,
        verifyMode: 'reading', verifyConfig: { passage: 'comfort' },
      },
      {
        title: 'Poetry or Short Stories',
        description: 'Read shorter, meaningful pieces that inspire reflection or peace. Their depth can be meditative and help process emotions.',
        icon: '🪶', type: 'reading', duration: 600, color: CONSTANTS.COLORS.LOW,
        verifyMode: 'reading', verifyConfig: { passage: 'poetry' },
      },
    ],
    walking: [
      {
        title: 'Mindful Nature Walk',
        description: 'Focus on your surroundings — sounds, sights, smells — rather than your thoughts. This grounding technique naturally reduces stress and anxiety.',
        icon: '🌿', type: 'physical', duration: 600, color: CONSTANTS.COLORS.LOW,
        verifyMode: 'physical', verifyConfig: { checkFlush: true, checkBreathing: true },
      },
      {
        title: 'Walking Meditation',
        description: 'Combine walking with slow, intentional breathing. Sync your steps with your breath to create a rhythmic, meditative experience.',
        icon: '🧘‍♂️', type: 'physical', duration: 600, color: CONSTANTS.COLORS.LOW,
        verifyMode: 'physical', verifyConfig: { checkFlush: true, checkCalm: true },
      },
      {
        title: 'Social Walk',
        description: 'Walk with a friend or family member for conversation and connection. Social interaction while moving provides both mood-boosting and stress-relieving benefits.',
        icon: '👫', type: 'physical', duration: 600, color: CONSTANTS.COLORS.MILD,
        verifyMode: 'physical', verifyConfig: { checkFlush: true, checkSmile: true },
      },
    ],
  };

  // ── Generate hobby-based tasks for moderate stress (6-8) ──
  const generateHobbyTasks = () => {
    const hobbyList = hobbies.split(',').map(h => h.trim().toLowerCase()).filter(Boolean);
    const tasks = [];
    hobbyList.forEach(hobby => {
      // Check for curated hobby categories first
      if (/writ|journal|poet|essay/.test(hobby)) {
        tasks.push(...HOBBY_ACTIVITIES.writing);
      } else if (/read|book|novel|fiction|literature/.test(hobby)) {
        tasks.push(...HOBBY_ACTIVITIES.reading);
      } else if (/walk|hik/.test(hobby)) {
        tasks.push(...HOBBY_ACTIVITIES.walking);
      } else if (/run|jog|sport|gym|exercise|yoga|dance|swim|cycle|bike/.test(hobby)) {
        tasks.push({ title: `Go for a ${hobby} session`, description: `Get your body moving with ${hobby} for 5 minutes. Physical activity releases endorphins and directly reduces cortisol levels.`, icon: '🏃', type: 'physical', duration: 300, color: CONSTANTS.COLORS.MILD, verifyMode: 'physical' });
      } else if (/draw|paint|art|craft|sketch/.test(hobby)) {
        tasks.push({ title: `Quick ${hobby} session`, description: `Spend 5 minutes on ${hobby}. Creative expression is a proven stress reliever.`, icon: '🎨', type: 'creative', duration: 300, color: CONSTANTS.COLORS.MILD, verifyMode: 'generic' });
      } else if (/music|sing|guitar|piano|drum/.test(hobby)) {
        tasks.push({ title: 'Play or listen to music', description: 'Put on your favorite playlist or pick up your instrument. Music reduces anxiety by up to 65%.', icon: '🎵', type: 'creative', duration: 300, color: CONSTANTS.COLORS.MILD, verifyMode: 'listening' });
      } else if (/game|gaming/.test(hobby)) {
        tasks.push({ title: 'Quick gaming reset', description: 'Play a casual game for 5 minutes. Gaming in moderation helps reset your focus.', icon: '🎮', type: 'creative', duration: 300, color: CONSTANTS.COLORS.MILD, verifyMode: 'generic' });
      } else if (/cook|bak/.test(hobby)) {
        tasks.push({ title: 'Make a quick snack', description: 'Prepare something simple in the kitchen. The act of cooking is meditative and grounding.', icon: '🍳', type: 'creative', duration: 300, color: CONSTANTS.COLORS.MILD, verifyMode: 'generic' });
      } else {
        tasks.push({ title: `Enjoy some ${hobby}`, description: `5 minutes of ${hobby} can shift your mood and reduce stress.`, icon: '⭐', type: 'creative', duration: 300, color: CONSTANTS.COLORS.MILD, verifyMode: 'generic' });
      }
    });
    // Always add a meditation option
    tasks.push({ title: '🧘 5-Minute Meditation', description: 'Close your eyes, breathe deeply, and let thoughts pass. Even 5 minutes of meditation lowers cortisol.', icon: '🧘', type: 'mindfulness', duration: 300, color: CONSTANTS.COLORS.LOW, verifyMode: 'generic' });
    tasks.push({ title: '🚶 Walk Outside', description: 'Step outside for fresh air and sunlight. A short walk resets your nervous system.', icon: '🚶', type: 'physical', duration: 300, color: CONSTANTS.COLORS.LOW, verifyMode: 'physical' });
    return tasks.slice(0, 8);
  };

  // ── Academic stress-specific tasks based on detected stressor ──
  const ACADEMIC_TASKS = {
    backlog: [
      {
        title: 'Brain Dump — Clear the Queue',
        description: 'Write down every pending task, assignment, and obligation. Getting it out of your head and onto paper reduces cognitive load and helps you prioritize what actually matters.',
        icon: '📋', type: 'writing', duration: 600, color: CONSTANTS.COLORS.MILD,
        verifyMode: 'writing', verifyConfig: { minWords: 40, prompt: 'List every task, assignment, or obligation on your mind right now. Don\'t organize — just dump everything out.' },
      },
      {
        title: 'The 2-Minute Sweep',
        description: 'Look at your overdue items and knock out anything that takes under 2 minutes. Each small completion builds momentum and shrinks the mental weight of your backlog.',
        icon: '⚡', type: 'creative', duration: 300, color: CONSTANTS.COLORS.MILD, verifyMode: 'generic',
      },
    ],
    exam_readiness: [
      {
        title: 'Teach-Back Challenge',
        description: 'Explain one key concept from your upcoming exam as if teaching it to a friend. Writing it out reveals gaps in understanding and solidifies what you already know.',
        icon: '🎓', type: 'writing', duration: 600, color: CONSTANTS.COLORS.MILD,
        verifyMode: 'writing', verifyConfig: { minWords: 60, prompt: 'Pick one concept from your upcoming exam and explain it in your own words, as if teaching a friend who knows nothing about the topic.' },
      },
      {
        title: 'Confidence Mapping',
        description: 'Write a quick list of topics you feel confident about vs. topics that worry you. Seeing it visually often reveals you know more than you think.',
        icon: '🗺️', type: 'writing', duration: 300, color: CONSTANTS.COLORS.LOW,
        verifyMode: 'writing', verifyConfig: { minWords: 30, prompt: 'Create two lists: "Topics I\'m confident about" and "Topics I need to review." Be honest with yourself.' },
      },
    ],
    comprehension: [
      {
        title: 'Read & Reflect',
        description: 'Read a calming passage mindfully, then reflect on its meaning. This exercises the same comprehension muscles in a low-pressure environment, rebuilding your reading confidence.',
        icon: '📖', type: 'reading', duration: 600, color: CONSTANTS.COLORS.LOW,
        verifyMode: 'reading', verifyConfig: { passage: 'fiction' },
      },
      {
        title: 'Concept Rewrite',
        description: 'Take the hardest concept you\'re struggling with and rewrite it using only simple, everyday words. If you can simplify it, you understand it.',
        icon: '✏️', type: 'writing', duration: 600, color: CONSTANTS.COLORS.MILD,
        verifyMode: 'writing', verifyConfig: { minWords: 50, prompt: 'Take a concept you\'re struggling with and explain it using only simple, everyday language. No jargon allowed!' },
      },
    ],
    time_management: [
      {
        title: 'Pomodoro Warm-Up',
        description: 'Practice the Pomodoro technique right now: set a 5-minute timer and write continuously about anything. This trains your brain to start on command.',
        icon: '🍅', type: 'writing', duration: 300, color: CONSTANTS.COLORS.MILD,
        verifyMode: 'writing', verifyConfig: { minWords: 40, prompt: 'Just write. About anything — your day, your thoughts, a story. The goal is to practice starting and not stopping for 5 minutes.' },
      },
      {
        title: 'Focus Reset Walk',
        description: 'A quick walk to physically break the avoidance loop. Movement resets your dopamine system and makes it easier to start tasks when you return.',
        icon: '🚶', type: 'physical', duration: 300, color: CONSTANTS.COLORS.LOW,
        verifyMode: 'physical', verifyConfig: { checkFlush: true, checkBreathing: true },
      },
    ],
  };

  // ── Build task list with academic-specific tasks first ──
  const getRecommendedTasks = () => {
    const academicTasks = academicStressType ? (ACADEMIC_TASKS[academicStressType] || []) : [];
    const hobbyTasks = generateHobbyTasks();
    // Prepend academic-targeted tasks, then hobby tasks, dedup by title
    const combined = [...academicTasks, ...hobbyTasks];
    const seen = new Set();
    return combined.filter(t => {
      if (seen.has(t.title)) return false;
      seen.add(t.title);
      return true;
    }).slice(0, 10);
  };

  // ── Redirect if no score ──
  useEffect(() => {
    if (finalScore === 0) { navigate('/home'); return; }
  }, [finalScore, navigate]);

  // ── Auto-send parent notification for critical stress ──
  useEffect(() => {
    if (stressTier === 'critical' && consent.parentNotification && !parentMessageSent && (parentContact.phone || parentContact.email)) {
      sendParentNotification();
    }
  }, [stressTier]);

  const sendParentNotification = async () => {
    setSendingMessage(true);
    try {
      const response = await fetch('/api/notify-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentName: parentContact.name || 'Parent/Guardian',
          parentPhone: parentContact.phone,
          parentEmail: parentContact.email,
          stressScore: finalScore,
          message: `Your child used SoundMind and their stress level was assessed at ${finalScore}/10 (Critical). We recommend you check in with them and have a supportive conversation. If you have concerns, please contact your school counselor.`,
        })
      });
      if (response.ok) {
        setParentMessageSent(true);
        dispatch({ type: 'SET_PARENT_NOTIFICATION_SENT', payload: true });
      }
    } catch (err) {
      console.error('Failed to send parent notification:', err);
      // Still mark as sent to prevent spam retries
      setParentMessageSent(true);
      dispatch({ type: 'SET_PARENT_NOTIFICATION_SENT', payload: true });
    }
    setSendingMessage(false);
  };

  const handleStartTask = (task) => {
    dispatch({ type: 'SET_CURRENT_TASK', payload: task });
    navigate('/verify-task');
  };

  // ── Render tasks based on stress tier ──
  const renderTaskContent = () => {
    switch (stressTier) {
      // ═══ LOW STRESS (Below 6) ═══
      case 'low':
        return (
          <div className="space-y-6">
            {/* Stress-free celebration card */}
            <div className="glass-card" style={{
              borderLeft: `4px solid ${CONSTANTS.COLORS.LOW}`,
              background: 'rgba(34,197,94,0.06)',
              textAlign: 'center',
              padding: '3rem 2rem',
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'pulse 3s infinite' }}>🌟</div>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 800,
                marginBottom: '0.75rem',
                WebkitTextFillColor: 'unset',
                background: 'none',
                color: CONSTANTS.COLORS.LOW,
              }}>
                You Are OK and Stress Free!
              </h2>
              <p style={{
                fontSize: '1.1rem',
                color: 'var(--color-text-secondary)',
                maxWidth: '500px',
                margin: '0 auto 1.5rem',
                lineHeight: 1.7,
              }}>
                Great news — your stress levels are healthy and within a normal range.
                Keep up the amazing work and continue doing what makes you happy! 🎉
              </p>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.5rem',
                borderRadius: '9999px',
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.25)',
                color: '#4ade80',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}>
                ✅ Score: {finalScore.toFixed(1)}/10 — No intervention needed
              </div>
            </div>

            {/* Encouragement tips */}
            <div className="glass-card" style={{ borderLeft: `3px solid ${CONSTANTS.COLORS.LOW}` }}>
              <div className="flex items-start gap-4">
                <span className="text-3xl shrink-0">💡</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-3" style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--color-text-main)' }}>
                    Keep It Going!
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-0" style={{ whiteSpace: 'pre-line' }}>
{`1. 🧘 Keep up your hobbies — ${hobbies || 'the activities you enjoy'} are natural stress buffers.
2. 😴 Maintain your sleep routine — consistent sleep is your biggest ally.
3. 👫 Stay connected — regular chats with friends and family keep your mood elevated.
4. 🎉 Celebrate small wins — acknowledge what's going well, not just what's hard.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      // ═══ MODERATE STRESS (6 – 8) ═══
      case 'moderate':
        return (
          <div className="space-y-6">
            <InterventionCard
              title="Time to Recharge 💪"
              description="Your stress is moderate. Let's channel it into something positive with activities you enjoy."
              icon="🎯"
              color={CONSTANTS.COLORS.MILD}
              primary
            />

            {/* Hobby-based tasks only */}
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--color-text-main)' }}>
                🎯 Hobby-Based Stress Busters
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Personalized activities based on your hobbies: <strong style={{ color: 'var(--color-text-accent)' }}>{hobbies}</strong>
              </p>
              <div className="space-y-3">
                {generateHobbyTasks().map((task, idx) => (
                  <div key={idx} className="metric-card flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl shrink-0">{task.icon}</span>
                      <div className="min-w-0">
                        <span className="font-semibold block text-[var(--color-text-main)]">{task.title}</span>
                        <span className="text-sm text-[var(--color-text-muted)] block">{task.description}</span>
                      </div>
                    </div>
                    <button className="btn btn-primary text-sm px-4 py-2 shrink-0" onClick={() => handleStartTask(task)}>
                      Start & Verify
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // ═══ HIGH STRESS (8 – 9) ═══
      case 'high':
        return (
          <div className="space-y-6">
            <InterventionCard
              title="We're Here to Help 🤝"
              description="Your stress level is elevated. We strongly recommend talking to our AI Counselor — it's a safe, private space to work through what you're feeling."
              icon="💛"
              color={CONSTANTS.COLORS.HIGH}
              primary
            />

            {/* Grounding exercise */}
            <div className="glass-card" style={{ borderLeft: `3px solid ${CONSTANTS.COLORS.HIGH}` }}>
              <h3 style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--color-text-main)' }} className="mb-4 text-xl">
                🫁 Grounding Exercise
              </h3>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Let's bring your stress response down first with some controlled breathing.
              </p>
              <BreathingExercise />
            </div>

            {/* Counselor referral — prominent */}
            <div className="glass-card" style={{
              borderLeft: `3px solid ${CONSTANTS.COLORS.HIGH}`,
              background: 'rgba(249, 115, 22, 0.06)',
            }}>
              <div className="flex items-start gap-4">
                <span className="text-3xl shrink-0">🤖</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2" style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--color-text-main)' }}>
                    Talk to AI Counselor
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    Our AI counselor is trained to help with exactly what you're going through. It's confidential, empathetic, and available 24/7. Many students find that just talking through their feelings makes a real difference.
                  </p>
                  <button
                    className="btn btn-primary px-8 py-3 text-lg"
                    onClick={() => navigate('/chat')}
                    style={{ boxShadow: '0 0 30px rgba(249,115,22,0.2)' }}
                  >
                    💬 Start Conversation
                  </button>
                </div>
              </div>
            </div>

            {/* Hobby-based tasks — all matched */}
            <div>
              <h2 className="text-lg font-bold mb-3" style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--color-text-main)' }}>
                🎯 Stress-Buster Activities
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Based on your hobbies: <strong style={{ color: 'var(--color-text-accent)' }}>{hobbies}</strong>
              </p>
              <div className="space-y-3">
                {getRecommendedTasks().map((task, idx) => (
                  <div key={idx} className="metric-card flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl shrink-0">{task.icon}</span>
                      <div className="min-w-0">
                        <span className="font-semibold block text-[var(--color-text-main)]">{task.title}</span>
                        <span className="text-sm text-[var(--color-text-muted)] block">{task.description}</span>
                      </div>
                    </div>
                    <button className="btn btn-secondary text-sm px-4 py-2 shrink-0" onClick={() => handleStartTask(task)}>
                      Start & Verify
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // ═══ CRITICAL STRESS (9+) ═══
      case 'critical':
        return (
          <div className="space-y-6">
            {/* Urgent support card */}
            <InterventionCard
              title="Your Wellbeing Comes First 🚨"
              description="Your stress level is very high. Please know you're not alone — let's get you some immediate support."
              icon="❤️"
              color={CONSTANTS.COLORS.SEVERE}
              primary
            />

            {/* Task 1: Talk to Counseling Bot */}
            <div className="glass-card" style={{
              borderLeft: `3px solid ${CONSTANTS.COLORS.SEVERE}`,
              background: 'rgba(239, 68, 68, 0.05)',
            }}>
              <div className="flex items-start gap-4">
                <span className="text-3xl shrink-0">🤖</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2" style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--color-text-main)' }}>
                    Task 1: Talk to AI Counselor Now
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    Please take a few minutes to talk through what you're feeling. Our AI counselor is here for you 24/7, completely confidential.
                  </p>
                  <button
                    className="btn px-8 py-3 text-lg"
                    onClick={() => navigate('/chat')}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: 'white',
                      boxShadow: '0 0 30px rgba(239,68,68,0.3)',
                    }}
                  >
                    💬 Talk to Counselor Now
                  </button>
                </div>
              </div>
            </div>

            {/* Task 2: Parent Notification */}
            <div className="glass-card" style={{
              borderLeft: `3px solid #f59e0b`,
              background: 'rgba(245, 158, 11, 0.05)',
            }}>
              <div className="flex items-start gap-4">
                <span className="text-3xl shrink-0">👨‍👩‍👧</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2" style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--color-text-main)' }}>
                    Task 2: Reach Out to Your Support System
                  </h3>

                  {consent.parentNotification && (parentContact.phone || parentContact.email) ? (
                    <>
                      {parentMessageSent ? (
                        <div className="flex items-center gap-2 p-3 rounded-lg mb-3" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                          <span className="text-xl">✅</span>
                          <div>
                            <span className="font-semibold text-[#22c55e] block text-sm">Message sent to {parentContact.name || 'your parent/guardian'}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">
                              {parentContact.email && `Email: ${parentContact.email}`}
                              {parentContact.phone && parentContact.email && ' • '}
                              {parentContact.phone && `Phone: ${parentContact.phone}`}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 rounded-lg mb-3" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: '#f97316', borderTopColor: 'transparent' }} />
                          <span className="text-sm text-[#f97316] font-medium">
                            {sendingMessage ? 'Sending notification to your parent/guardian...' : 'Preparing notification...'}
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-[var(--color-text-secondary)] mb-0">
                        A supportive message has been sent to let them know you might need some extra support. Having someone you trust aware of how you're feeling can make a big difference.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                        Please reach out to a parent, guardian, or trusted adult. Sharing how you feel with someone who cares about you is one of the most powerful things you can do.
                      </p>
                      <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)' }}>
                        <p className="text-xs text-[var(--color-text-muted)] mb-2" style={{ margin: 0 }}>
                          💡 <strong>Tip:</strong> You can enable automatic parent notification on the consent page next time so we can help bridge that conversation.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Crisis Resources */}
            <div className="p-6 rounded-xl border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
              <h3 className="text-red-400 mb-3 font-bold" style={{ WebkitTextFillColor: 'unset', background: 'none' }}>
                24/7 Crisis Support
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-3">If you need to talk to someone right now:</p>
              <a href="tel:988" className="block p-3 rounded-lg text-center font-bold text-red-400 border border-red-500/20 mb-2 no-underline hover:bg-red-500/10 transition-colors">
                📞 Lifeline: 988
              </a>
              <a href="sms:741741?body=HOME" className="block p-3 rounded-lg text-center font-bold text-blue-400 border border-blue-500/20 no-underline hover:bg-blue-500/10 transition-colors">
                💬 Text HOME to 741741
              </a>
            </div>

            {/* Breathing exercise */}
            <div className="glass-card" style={{ borderLeft: `3px solid ${CONSTANTS.COLORS.SEVERE}` }}>
              <h3 style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--color-text-main)' }} className="mb-4 text-xl">
                🫁 Calm Your Body First
              </h3>
              <BreathingExercise />
            </div>

            {/* Calming hobby tasks for critical stress */}
            <div>
              <h2 className="text-lg font-bold mb-3" style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--color-text-main)' }}>
                🌿 Calming Activities
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                When you're ready, try one of these calming activities based on your hobbies: <strong style={{ color: 'var(--color-text-accent)' }}>{hobbies}</strong>
              </p>
              <div className="space-y-3">
                {getRecommendedTasks().slice(0, 4).map((task, idx) => (
                  <div key={idx} className="metric-card flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl shrink-0">{task.icon}</span>
                      <div className="min-w-0">
                        <span className="font-semibold block text-[var(--color-text-main)]">{task.title}</span>
                        <span className="text-sm text-[var(--color-text-muted)] block">{task.description}</span>
                      </div>
                    </div>
                    <button className="btn btn-secondary text-sm px-4 py-2 shrink-0" onClick={() => handleStartTask(task)}>
                      Try It
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 animate-fade-in py-4 max-w-5xl mx-auto w-full">
      <AnimatedBackground />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Action Plan</h1>
          <p>Personalized interventions based on your assessment.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/history')}>View Dashboard</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {renderTaskContent()}
        </div>

        {/* Sidebar Snapshot */}
        <div className="glass-card h-fit">
          <h3 className="text-lg pb-3 mb-4 border-b border-[var(--color-border)]" style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--color-text-main)' }}>
            Snapshot
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Final</span>
              <span className="text-2xl font-bold text-[var(--color-text-accent)]">{finalScore.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Survey (60%)</span>
              <span>{state.surveyScore.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Visual (30%)</span>
              <span>{state.behavioralScore.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Input (10%)</span>
              <span>{state.keyboardScore.toFixed(1)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[var(--color-border)]">
              <span className="text-[var(--color-text-muted)]">Hobbies</span>
              <span className="text-sm text-right max-w-[150px] truncate">{hobbies}</span>
            </div>

            {/* Stress tier badge */}
            <div className="pt-2 border-t border-[var(--color-border)]">
              <span className="badge w-full justify-center py-2 text-xs font-bold uppercase tracking-wider" style={{
                background: stressTier === 'critical' ? 'rgba(239,68,68,0.15)' :
                             stressTier === 'high' ? 'rgba(249,115,22,0.15)' :
                             stressTier === 'moderate' ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.15)',
                color: stressTier === 'critical' ? '#ef4444' :
                       stressTier === 'high' ? '#f97316' :
                       stressTier === 'moderate' ? '#3b82f6' : '#22c55e',
              }}>
                {stressTier === 'critical' ? '🚨 Critical' :
                 stressTier === 'high' ? '⚠️ High' :
                 stressTier === 'moderate' ? '💪 Moderate' : '✅ Low'} Stress Tier
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterventionsPage;
