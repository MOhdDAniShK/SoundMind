import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { initializeFaceLandmarker } from '../services/mediapipeService';
import { captureSnapshot, verifyTaskCompletion, getTaskType } from '../services/taskVerificationService';

// ── Curated reading passages by type with comprehension questions ──
const READING_PASSAGES = {
  fiction: {
    text: `The Little Match Girl — Hans Christian Andersen

It was so terribly cold. Snow was falling, and it was almost dark. Evening came on, the last evening of the year. In the cold and gloom a poor little girl, bareheaded and barefoot, was walking through the streets. Of course when she had left her house she'd had slippers on, but what good had they been? They were very big slippers, way too big for her, for they belonged to her mother. The little girl had lost them running across the road, where two carriages had rattled by terribly fast. One slipper she could not find again, and a boy had run off with the other, saying he could use it for a cradle when he had children of his own.

So the little girl walked on her little naked feet, which were quite red and blue with the cold. In an old apron she carried several packages of matches, and she held a box of them in her hand. No one had bought any from her all day long, and no one had given her a cent.

Shivering with cold and hunger, she crept along, a picture of misery, poor little girl! The snowflakes fell on her long fair hair, which hung in pretty curls over her neck, but she did not think of her pretty curls now. In all the windows lights were shining, and there was a wonderful smell of roast goose, for it was New Year's eve. Yes, she thought of that!

In a corner formed by two houses, one of which projected farther out into the street than the other, she sat down and cowered together. Her little feet she had drawn close up to her, but she grew colder and colder, and she did not dare go home, for she had sold no matches and earned not a single cent. Her father would surely beat her. Besides, it was cold at home, for they had nothing over them but a roof through which the wind whistled even though the biggest cracks had been stuffed with straw and rags.

Her hands were almost dead with cold. Oh, how much one little match might warm her! If she could only take one from the box and strike it against the wall and rub her fingers over the warm flame! She drew one out. R-r-atch! How it sputtered and burned! It made a warm, bright flame, like a little candle, as she held her hands over it; but it gave a strange light! It really seemed to the little girl as if she were sitting before a great iron stove with shining brass knobs and a brass cover. How the fire burned! How comfortable it was! But the little flame went out, the stove vanished, and she had only the remains of the burnt match in her hand.

A second match was struck against the wall. It burned up, and when the light fell upon the wall it became transparent like a thin veil, and she could see through it into a room. On the table a snow-white cloth was spread, and on it stood a shining dinner service. The roast goose stuffed with apples and dried plums steamed deliciously. And what was still more wonderful, the goose jumped down from the dish and waddled along the floor with a knife and fork in its breast, right up to the poor little girl. Then the match went out, and there was nothing but the thick, cold, damp wall before her.

She lighted another match. Now she was sitting under the most beautiful Christmas tree. It was larger and more beautifully decorated than the one she had seen through the glass door at the rich merchant's. Thousands of lights were burning on the green branches, and brightly-colored pictures, like those in the shop windows, looked down upon her. The little girl stretched out her hands toward them, and the match went out. The Christmas lights rose higher and higher, till they looked to her like the stars in the sky. Then she saw a star fall, leaving behind it a bright streak of fire. "Someone is dying," thought the little girl, for her old grandmother, the only person who had loved her, and who was now dead, had told her that when a star falls, a soul was going up to God.

She rubbed another match against the wall. It became bright again, and in the brightness there stood her old grandmother, clear and shining, yet mild and loving in her appearance. "Grandmother," cried the little one, "Oh, take me with you! I know you will go away when the match burns out; you will vanish like the warm stove, the roast goose, and the large, glorious Christmas tree." And she made haste to light the whole bundle of matches, for she wished to keep her grandmother there. And the matches glowed with a light that was brighter than the noon-day, and her grandmother had never appeared so large or so beautiful. She took the little girl in her arms, and they both flew upwards in brightness and joy far above the earth, where there was neither cold nor hunger nor pain, for they were with God.

In the dawn of morning there lay the poor little one, with pale cheeks and smiling mouth, leaning against the wall; she had been frozen to death on the last evening of the year; and the New Year's sun rose and shone upon a little corpse! The child still sat, in the stiffness of death, holding the matches in her hand, one bundle of which was burned. "She tried to warm herself," said some. No one imagined what beautiful things she had seen, nor into what glory she had entered with her grandmother, on New Year's day.`,
    questions: [
      { q: "What did the little girl lose when she ran across the road?", options: ["Her matches", "Her slippers", "Her apron", "Her hat"], answer: 1 },
      { q: "What did the little girl see when she struck the second match?", options: ["A warm iron stove", "A beautiful Christmas tree", "A shining dinner service with roast goose", "Her grandmother"], answer: 2 },
      { q: "Who did the little girl see in the brightness of the last matches she lit?", options: ["A merchant", "Her mother", "Her father", "Her grandmother"], answer: 3 }
    ]
  },
  comfort: {
    text: `The Secret Garden (Excerpt) — Frances Hodgson Burnett

Mary had stepped close to the robin, and suddenly the gust of wind swung aside some loose ivy trails, and more suddenly still she jumped toward it and caught it in her hand. This she did because she had seen something under it—a round knob which had been covered by the leaves hanging over it. It was the knob of a door.

She put her hands under the leaves and began to pull and push them aside. Thick as the ivy hung, it nearly all was a loose and swinging curtain, though some had crept over wood and iron. Mary's heart began to thump and her hands to shake a little in her eagerness. The robin kept singing and twittering away and tilting his head on one side, as if he were as excited as she was. What was this under her hands which was square and made of iron and which her fingers found a hole in?

It was the lock of the door which had been closed ten years, and she put her hand in her pocket, drew out the key, and found it fitted the keyhole. She put the key in and turned it. It took two hands to do it, but it did turn.

And then she took a long breath and looked behind her up the long walk to see if any one was coming. No one was coming. No one ever did come, it seemed, and she took another long breath, because she could not help it, and she held back the swinging curtain of ivy and pushed back the door which opened slowly—slowly.

Then she slipped through it, and shut it behind her, and stood with her back against it, looking about her and breathing quite fast with excitement, and wonder, and delight.

She was standing inside the secret garden.

It was the sweetest, most mysterious-looking place any one could imagine. The high walls which shut it in were covered with the leafless stems of climbing roses, which were so thick that they were matted together. Mary Lennox knew they were roses because she had seen a great many roses in India. All the ground was covered with grass of a wintry brown and out of it grew clumps of bushes which were surely rosebushes if they were alive. There were numbers of standard roses which had so spread their branches that they were like little trees. There were other trees in the garden, and one of the things which made the place look strangest and loveliest was that climbing roses had run all over them and swung down long tendrils which made light swaying curtains, and here and there they had caught at each other or at a far-reaching branch and had crept from one tree to another and made lovely bridges of themselves.

It was this hazy tangle from tree to tree which made it all look so mysterious. Mary had thought it must be different from other gardens which had not been left all by themselves so long; and indeed it was different from any other place she had ever seen in her life.`,
    questions: [
      { q: "What did Mary find covered by the ivy leaves?", options: ["A hidden key", "The knob of a door", "A sleeping robin", "A beautiful flower"], answer: 1 },
      { q: "How long had the door been closed?", options: ["Ten years", "Five years", "One hundred years", "A few months"], answer: 0 },
      { q: "What was climbing all over the high walls and trees inside the garden?", options: ["Grapevines", "Poison ivy", "Leafless stems of roses", "Apple trees"], answer: 2 }
    ]
  },
  poetry: {
    text: `Ulysses — Alfred, Lord Tennyson

It little profits that an idle king,
By this still hearth, among these barren crags,
Match'd with an aged wife, I mete and dole
Unequal laws unto a savage race,
That hoard, and sleep, and feed, and know not me.
I cannot rest from travel: I will drink
Life to the lees: all times I have enjoy'd
Greatly, have suffer'd greatly, both with those
That loved me, and alone; on shore, and when
Thro' scudding drifts the rainy Hyades
Vext the dim sea: I am become a name;
For always roaming with a hungry heart
Much have I seen and known; cities of men
And manners, climates, councils, governments,
Myself not least, but honour'd of them all;
And drunk delight of battle with my peers,
Far on the ringing plains of windy Troy.
I am a part of all that I have met;
Yet all experience is an arch wherethro'
Gleams that untravell'd world, whose margin fades
For ever and for ever when I move.
How dull it is to pause, to make an end,
To rust unburnish'd, not to shine in use!
As tho' to breathe were life. Life piled on life
Were all too little, and of one to me
Little remains: but every hour is saved
From that eternal silence, something more,
A bringer of new things; and vile it were
For some three suns to store and hoard myself,
And this gray spirit yearning in desire
To follow knowledge like a sinking star,
Beyond the utmost bound of human thought.

This is my son, mine own Telemachus,
To whom I leave the sceptre and the isle—
Well-loved of me, discerning to fulfil
This labour, by slow prudence to make mild
A rugged people, and thro' soft degrees
Subdue them to the useful and the good.
Most blameless is he, centred in the sphere
Of common duties, decent not to fail
In offices of tenderness, and pay
Meet adoration to my household gods,
When I am gone. He works his work, I mine.

There lies the port; the vessel puffs her sail:
There gloom the dark broad seas. My mariners,
Souls that have toil'd, and wrought, and thought with me—
That ever with a frolic welcome took
The thunder and the sunshine, and opposed
Free hearts, free foreheads—you and I are old;
Old age hath yet his honour and his toil;
Death closes all: but something ere the end,
Some work of noble note, may yet be done,
Not unbecoming men that strove with Gods.
The lights begin to twinkle from the rocks:
The long day wanes: the slow moon climbs: the deep
Moans round with many voices. Come, my friends,
'Tis not too late to seek a newer world.
Push off, and sitting well in order smite
The sounding furrows; for my purpose holds
To sail beyond the sunset, and the baths
Of all the western stars, until I die.
It may be that the gulfs will wash us down:
It may be we shall touch the Happy Isles,
And see the great Achilles, whom we knew.
Tho' much is taken, much abides; and tho'
We are not now that strength which in old days
Moved earth and heaven; that which we are, we are;
One equal temper of heroic hearts,
Made weak by time and fate, but strong in will
To strive, to seek, to find, and not to yield.`,
    questions: [
      { q: "How does the speaker describe the people he rules over?", options: ["A savage race that hoards, sleeps, and feeds", "A noble people who honor his name", "A wise council of elders", "A broken nation ruined by war"], answer: 0 },
      { q: "Who does the speaker plan to leave the sceptre and the isle to?", options: ["The great Achilles", "His aged wife", "His son Telemachus", "His faithful mariners"], answer: 2 },
      { q: "What is the speaker's ultimate resolve at the end of the poem?", options: ["To rest from travel and stay home", "To rule his kingdom justly", "To strive, to seek, to find, and not to yield", "To rebuild the ringing plains of Troy"], answer: 2 }
    ]
  }
};

const DEFAULT_PASSAGE = READING_PASSAGES.fiction;

const TaskVerificationPage = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const { currentTask } = state;

  const videoRef = useRef(null);
  const textareaRef = useRef(null);
  const [phase, setPhase] = useState('setup'); // setup | task | reading_quiz | verify | result
  const [baseline, setBaseline] = useState(null);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [webcamError, setWebcamError] = useState(false);

  // Tab-lock state
  const [tabAwayCount, setTabAwayCount] = useState(0);
  const [totalAwayTime, setTotalAwayTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const tabAwayStart = useRef(null);

  // Writing mode state
  const [writtenText, setWrittenText] = useState('');
  const wordCount = writtenText.trim().split(/\\s+/).filter(Boolean).length;

  // Reading quiz state
  const [quizAnswers, setQuizAnswers] = useState({});

  // ── Use verifyMode from task object, fallback to regex detection ──
  const getTaskMode = () => {
    if (!currentTask) return 'generic';
    if (currentTask.verifyMode) return currentTask.verifyMode;
    const desc = (currentTask.title + ' ' + currentTask.description).toLowerCase();
    if (/run|jog|walk|exercise|stretch|yoga|gym|sport|dance/.test(desc)) return 'physical';
    if (/writ|journal|essay|poem|story/.test(desc)) return 'writing';
    if (/read|book|article|passage/.test(desc)) return 'reading';
    if (/draw|paint|sketch|art|craft/.test(desc)) return 'creative';
    if (/music|listen|song/.test(desc)) return 'listening';
    return 'generic';
  };
  const taskMode = getTaskMode();

  // Get config values from task or defaults
  const verifyConfig = currentTask?.verifyConfig || {};
  const minWords = verifyConfig.minWords || 30;
  const writingPrompt = verifyConfig.prompt || "Write about anything — how you're feeling, a story, your thoughts. Just keep writing!";
  const readingData = READING_PASSAGES[verifyConfig.passage] || DEFAULT_PASSAGE;

  // Tab-lock: detect visibility change
  useEffect(() => {
    if (phase !== 'task') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabAwayStart.current = Date.now();
        setIsPaused(true);
        setShowTabWarning(true);
        setTabAwayCount(c => c + 1);
      } else {
        if (tabAwayStart.current) {
          const away = (Date.now() - tabAwayStart.current) / 1000;
          setTotalAwayTime(t => t + away);
          tabAwayStart.current = null;
        }
        setIsPaused(false);
        setTimeout(() => setShowTabWarning(false), 3000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [phase]);

  // Setup webcam (for physical tasks)
  useEffect(() => {
    if (!currentTask) { navigate('/interventions'); return; }
    if (taskMode !== 'physical') return;

    const setup = async () => {
      try {
        await initializeFaceLandmarker();
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error('Camera setup error:', err);
        setWebcamError(true);
      }
    };
    setup();
    return () => { if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop()); };
  }, [currentTask, navigate, taskMode]);

  // Timer (pauses when tab is away)
  useEffect(() => {
    if (phase !== 'task' || timeLeft <= 0 || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(timer); handleTaskComplete(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft, isPaused]);

  const handleStartTask = async () => {
    if (taskMode === 'physical' && !webcamError) {
      setIsCapturing(true);
      const snap = await captureSnapshot(videoRef.current);
      setBaseline(snap);
      setIsCapturing(false);
    }
    setPhase('task');
    setTimeLeft(currentTask.duration || 300);
    if (taskMode === 'writing' && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleTaskComplete = async () => {
    if (taskMode === 'reading') {
      setPhase('reading_quiz');
      return;
    }
    await verifyAndComplete();
  };

  const handleQuizSubmit = async () => {
    await verifyAndComplete();
  };

  const verifyAndComplete = async () => {
    setPhase('verify');
    let verifyResult;

    if (taskMode === 'writing') {
      const passed = wordCount >= minWords;
      verifyResult = {
        verified: passed,
        confidence: passed ? Math.min(100, Math.round((wordCount / (minWords * 1.5)) * 100)) : Math.round((wordCount / minWords) * 100),
        passedChecks: (passed ? 1 : 0) + (tabAwayCount <= 2 ? 1 : 0) + (totalAwayTime < 30 ? 1 : 0),
        totalChecks: 3,
        details: [
          passed ? `✅ Wrote ${wordCount} words (min ${minWords})` : `⚠️ Only ${wordCount} words (need ${minWords}+)`,
          tabAwayCount <= 2 ? `✅ Stayed focused (${tabAwayCount} tab switches)` : `⚠️ Left tab ${tabAwayCount} times`,
          totalAwayTime < 30 ? `✅ Total away time: ${Math.round(totalAwayTime)}s` : `⚠️ Away for ${Math.round(totalAwayTime)}s (max 30s)`,
        ],
      };
    } else if (taskMode === 'reading') {
      // Check quiz answers
      let correctAnswers = 0;
      readingData.questions.forEach((q, i) => {
        if (quizAnswers[i] === q.answer) correctAnswers++;
      });
      const passedQuiz = correctAnswers >= Math.ceil(readingData.questions.length / 2);
      const focused = tabAwayCount <= 2 && totalAwayTime < 30;
      
      const overallPassed = passedQuiz && focused;
      
      verifyResult = {
        verified: overallPassed,
        confidence: overallPassed ? 90 : Math.max(20, 90 - (tabAwayCount * 15) - ((readingData.questions.length - correctAnswers) * 20)),
        passedChecks: (passedQuiz ? 1 : 0) + (tabAwayCount <= 2 ? 1 : 0) + (totalAwayTime < 30 ? 1 : 0),
        totalChecks: 3,
        details: [
          passedQuiz ? `✅ Reading Comprehension (${correctAnswers}/${readingData.questions.length})` : `⚠️ Comprehension failed (${correctAnswers}/${readingData.questions.length})`,
          tabAwayCount <= 2 ? `✅ Stayed focused (${tabAwayCount} tab switches)` : `⚠️ Left tab ${tabAwayCount} times`,
          totalAwayTime < 30 ? `✅ Total away time: ${Math.round(totalAwayTime)}s` : `⚠️ Away for ${Math.round(totalAwayTime)}s`,
        ],
      };
    } else if (taskMode === 'physical' && !webcamError && baseline) {
      setIsCapturing(true);
      const snap = await captureSnapshot(videoRef.current);
      const taskType = currentTask.type || getTaskType(currentTask.title + ' ' + currentTask.description);
      verifyResult = verifyTaskCompletion(baseline, snap, taskType);
      setIsCapturing(false);
    } else {
      // Generic/creative/listening: tab-lock + self-confirm
      const focused = tabAwayCount <= 3 && totalAwayTime < 45;
      verifyResult = {
        verified: focused,
        confidence: focused ? 85 : Math.max(20, 85 - tabAwayCount * 10),
        passedChecks: (focused ? 1 : 0) + (totalAwayTime < 45 ? 1 : 0),
        totalChecks: 2,
        details: [
          tabAwayCount <= 3 ? `✅ Stayed on task (${tabAwayCount} switches)` : `⚠️ Left tab ${tabAwayCount} times`,
          totalAwayTime < 45 ? `✅ Active time verified` : `⚠️ Too much time away`,
        ],
      };
    }

    setResult(verifyResult);
    dispatch({ type: 'ADD_TASK_RESULT', payload: { task: currentTask.title, ...verifyResult, timestamp: Date.now() } });
    setPhase('result');
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (!currentTask) return null;

  return (
    <div className="flex-1 animate-fade-in py-4 max-w-4xl mx-auto w-full relative">
      {/* Tab-lock warning overlay */}
      {showTabWarning && phase === 'task' && (
        <div className="tab-lock-overlay">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#f97316' }}>Come Back!</h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 400 }}>
            Your task timer is paused. Stay on this tab to continue.
            {tabAwayCount > 2 && <><br/><strong style={{ color: '#ef4444' }}>Warning: {tabAwayCount} tab switches detected. This may affect verification.</strong></>}
          </p>
        </div>
      )}

      <button onClick={() => navigate('/interventions')} className="btn btn-secondary mb-6 text-sm">← Back to Plan</button>

      <div className="glass-card">
        <div className="text-center mb-6">
          <span className="text-4xl mb-3 block">{currentTask.icon}</span>
          <h1 style={{ fontSize: '1.75rem' }}>{currentTask.title}</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>{currentTask.description}</p>
          <span className="badge mt-2" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: '0.75rem' }}>
            {taskMode.toUpperCase()} MODE • {Math.floor((currentTask.duration || 300) / 60)} MIN
          </span>
        </div>

        {/* ═══ SETUP PHASE ═══ */}
        {phase === 'setup' && (
          <div className="text-center">
            <div className="metric-card mb-6 text-left" style={{ maxWidth: 500, margin: '0 auto 1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--color-text-main)' }}>📋 What to expect:</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {taskMode === 'physical' && <>
                  <li style={{ padding: '0.4rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>📸 We'll capture a baseline photo first</li>
                  <li style={{ padding: '0.4rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>🏃 Go do your activity for the full duration</li>
                  <li style={{ padding: '0.4rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>🔍 Come back for a post-activity photo (we check for flush/sweat)</li>
                </>}
                {taskMode === 'writing' && <>
                  <li style={{ padding: '0.4rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>✍️ Write continuously for {Math.floor((currentTask.duration || 300) / 60)} minutes</li>
                  <li style={{ padding: '0.4rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>📝 Minimum {minWords} words required</li>
                  <li style={{ padding: '0.4rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>🔒 Don't switch tabs — the timer pauses if you leave</li>
                </>}
                {taskMode === 'reading' && <>
                  <li style={{ padding: '0.4rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>📖 Read the passage we'll display for you</li>
                  <li style={{ padding: '0.4rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>⏱️ Stay focused for the full duration</li>
                  <li style={{ padding: '0.4rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>🧠 Answer a brief comprehension quiz at the end to verify</li>
                  <li style={{ padding: '0.4rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>🔒 Don't switch tabs — we track your focus</li>
                </>}
                {(taskMode === 'creative' || taskMode === 'listening' || taskMode === 'generic') && <>
                  <li style={{ padding: '0.4rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>⏱️ Complete the activity for the full duration</li>
                  <li style={{ padding: '0.4rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>🔒 Stay on this tab — switching pauses the timer</li>
                </>}
              </ul>
            </div>

            {taskMode === 'physical' && !webcamError && (
              <div className="relative rounded-xl overflow-hidden mb-4 max-w-sm mx-auto aspect-[4/3]" style={{ background: 'var(--color-bg-primary)' }}>
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
              </div>
            )}

            <button className="btn btn-primary px-8 py-3 text-lg" onClick={handleStartTask} disabled={isCapturing}>
              {isCapturing ? 'Capturing Baseline...' : "Let's Go! 🚀"}
            </button>
          </div>
        )}

        {/* ═══ TASK PHASE ═══ */}
        {phase === 'task' && (
          <div>
            {/* Timer bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {isPaused ? (
                  <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>⏸ PAUSED</span>
                ) : (
                  <span className="badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                    <span className="live-dot mr-2" /> ACTIVE
                  </span>
                )}
              </div>
              <div className="text-3xl font-mono font-bold" style={{ color: timeLeft < 30 ? '#ef4444' : 'var(--color-text-accent)' }}>
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="progress-container mb-6">
              <div className="progress-bar" style={{ width: `${((currentTask.duration || 300) - timeLeft) / (currentTask.duration || 300) * 100}%` }} />
            </div>

            {/* Mode-specific content */}
            {taskMode === 'writing' && (
              <div>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  {writingPrompt}
                </p>
                <textarea
                  ref={textareaRef}
                  value={writtenText}
                  onChange={e => setWrittenText(e.target.value)}
                  placeholder="Start writing here... Let your thoughts flow freely."
                  style={{
                    width: '100%', minHeight: 250, padding: '1rem', borderRadius: 'var(--radius-lg)',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)',
                    color: 'var(--color-text-main)', fontFamily: 'inherit', fontSize: '1rem',
                    lineHeight: 1.7, resize: 'vertical', outline: 'none',
                  }}
                  autoFocus
                />
                <div className="flex justify-between mt-2" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <span>{wordCount} word{wordCount !== 1 ? 's' : ''} {wordCount >= minWords ? '✅' : `(need ${minWords - wordCount} more)`}</span>
                  <span>{tabAwayCount} tab switch{tabAwayCount !== 1 ? 'es' : ''}</span>
                </div>
              </div>
            )}

            {taskMode === 'reading' && (
              <div>
                <div className="metric-card" style={{ maxHeight: 400, overflowY: 'auto', lineHeight: 1.9, textAlign: 'left', padding: '1.5rem' }}>
                  <p style={{ color: 'var(--color-text-main)', fontSize: '1.05rem', whiteSpace: 'pre-line' }}>
                    {readingData.text}
                  </p>
                </div>
                <p className="mt-3 text-center" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Read carefully. A short comprehension quiz will appear when the timer ends.
                </p>
              </div>
            )}

            {taskMode === 'physical' && (
              <div className="text-center">
                <p className="text-lg mb-2" style={{ color: 'var(--color-text-accent)' }}>Go do your activity now!</p>
                <p style={{ color: 'var(--color-text-muted)' }}>Come back to the camera when the timer ends or when you're done.</p>
                {!webcamError && (
                  <div className="relative rounded-xl overflow-hidden mt-4 max-w-sm mx-auto aspect-[4/3]" style={{ background: 'var(--color-bg-primary)' }}>
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
                  </div>
                )}
              </div>
            )}

            {(taskMode === 'creative' || taskMode === 'listening' || taskMode === 'generic') && (
              <div className="text-center">
                <p className="text-lg mb-2" style={{ color: 'var(--color-text-accent)' }}>
                  {taskMode === 'listening' ? '🎵 Enjoy your music!' : '✨ Enjoy your activity!'}
                </p>
                <p style={{ color: 'var(--color-text-muted)' }}>Stay on this tab. The timer tracks your focus.</p>
              </div>
            )}

            <div className="text-center mt-6">
              <button className="btn btn-success px-8 py-3" onClick={handleTaskComplete} disabled={isPaused}>
                I'm Done ✅
              </button>
            </div>
          </div>
        )}

        {/* ═══ READING QUIZ PHASE ═══ */}
        {phase === 'reading_quiz' && (
          <div className="text-left max-w-2xl mx-auto">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', color: 'var(--color-text-accent)' }}>Reading Comprehension</h2>
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
              Please answer a few quick questions to verify you completed the reading.
            </p>
            
            <div className="space-y-6 mb-8">
              {readingData.questions.map((q, qIndex) => (
                <div key={qIndex} className="metric-card">
                  <p style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-main)' }}>{qIndex + 1}. {q.q}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, oIndex) => (
                      <label key={oIndex} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer" style={{
                        background: quizAnswers[qIndex] === oIndex ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${quizAnswers[qIndex] === oIndex ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        transition: 'all 0.2s'
                      }}>
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          checked={quizAnswers[qIndex] === oIndex}
                          onChange={() => setQuizAnswers(prev => ({ ...prev, [qIndex]: oIndex }))}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span style={{ color: quizAnswers[qIndex] === oIndex ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                          {opt}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button 
                className="btn btn-primary px-8 py-3" 
                onClick={handleQuizSubmit}
                disabled={Object.keys(quizAnswers).length < readingData.questions.length}
              >
                Submit Answers
              </button>
            </div>
          </div>
        )}

        {/* ═══ VERIFY PHASE (loading) ═══ */}
        {phase === 'verify' && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>Verifying your task completion...</p>
          </div>
        )}

        {/* ═══ RESULT PHASE ═══ */}
        {phase === 'result' && result && (
          <div className="text-center">
            <div className={`verify-badge ${result.verified ? 'verified' : 'not-verified'} mx-auto mb-6`}>
              {result.verified ? '✅ Task Verified' : '⚠️ Could Not Verify'}
            </div>
            <p className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-accent)' }}>{result.confidence}% confidence</p>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>{result.passedChecks}/{result.totalChecks} checks passed</p>
            <div className="text-left max-w-sm mx-auto space-y-2 mb-8">
              {result.details.map((d, i) => (
                <div key={i} className="metric-card text-sm" style={{ color: 'var(--color-text-secondary)', padding: '0.65rem 1rem' }}>{d}</div>
              ))}
            </div>
            <button className="btn btn-primary px-8" onClick={() => navigate('/interventions')}>Back to Action Plan</button>
          </div>
        )}

        {/* Webcam error fallback */}
        {webcamError && taskMode === 'physical' && phase === 'setup' && (
          <div className="text-center mt-4">
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Camera unavailable. Task will use tab-tracking only.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskVerificationPage;
