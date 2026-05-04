import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import ChatMessage from '../components/ChatMessage';
import { getInitialCounselorMessage, chatWithCounselor, checkAPIHealth } from '../services/claudeService';
import { getScoreCategory } from '../utils/stressCalculator';

const ChatbotPage = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const { finalScore = 0, surveyData, chatMessages = [], userHobbies } = state;
  const [messages, setMessages] = useState(chatMessages.length > 0 ? chatMessages : []);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiOnline, setApiOnline] = useState(null); // null = checking, true/false = result
  const messagesEndRef = useRef(null);
  const hasInitialized = useRef(false);

  const safeScore = typeof finalScore === 'number' ? finalScore : 0;
  const category = getScoreCategory(safeScore);

  // Extract stressor from survey data
  const stressor = (surveyData && typeof surveyData === 'object')
    ? Object.values(surveyData).find(v => typeof v === 'string' && v.length > 2) || 'school'
    : 'school';

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  // Redirect if no assessment data
  const needsRedirect = !surveyData && safeScore === 0;

  // Initial greeting + API health check
  useEffect(() => {
    if (needsRedirect) { navigate('/home'); return; }
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Health check
    checkAPIHealth().then(ok => setApiOnline(ok));

    if (messages.length === 0) {
      (async () => {
        setIsTyping(true);
        const result = await getInitialCounselorMessage(finalScore, stressor, userHobbies);
        const botMsg = {
          role: 'assistant',
          content: result.content || result,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAI: result.isAI ?? true,
        };
        setMessages([botMsg]);
        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: botMsg });
        if (result.isAI !== undefined) setApiOnline(result.isAI);
        setIsTyping(false);
      })();
    }
  }, []);

  // Dynamic suggested replies based on conversation
  const getSuggestedReplies = () => {
    if (messages.length === 0 || isTyping) return [];

    const lastBotMsg = [...messages].reverse().find(m => m.role === 'assistant')?.content?.toLowerCase() || '';

    if (messages.length <= 2) {
      return [
        "I've been feeling really overwhelmed lately",
        "I'm struggling with my workload",
        "I can't seem to focus on anything",
        "I'm not sleeping well",
      ];
    }
    if (messages.length <= 4) {
      // Contextual follow-ups based on what the bot asked
      if (lastBotMsg.includes('sleep') || lastBotMsg.includes('night')) {
        return ["I usually stay up past midnight", "I wake up feeling tired", "My mind won't stop racing at night"];
      }
      if (lastBotMsg.includes('focus') || lastBotMsg.includes('study')) {
        return ["I get distracted by my phone", "I procrastinate a lot", "I can't concentrate for more than 10 minutes"];
      }
      if (lastBotMsg.includes('friend') || lastBotMsg.includes('people') || lastBotMsg.includes('connect')) {
        return ["I feel like I don't fit in", "I've been isolating myself", "My friends don't understand"];
      }
      return [
        "Can you help me make a plan?",
        "What coping strategies do you suggest?",
        "I want to talk more about this",
      ];
    }
    if (messages.length <= 8) {
      return [
        "That actually makes sense",
        "I'll try that tonight",
        "What else can I do?",
      ];
    }
    return [];
  };

  const handleSend = async (e, quickReply = null) => {
    if (e) e.preventDefault();
    const text = quickReply || inputValue.trim();
    if (!text || isTyping) return;

    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setInputValue('');
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMsg });
    setIsTyping(true);

    // Safety check for severe distress
    const lowerText = text.toLowerCase();
    if (lowerText.includes('kill myself') || lowerText.includes('suicide') ||
        lowerText.includes('self-harm') || lowerText.includes('end it all') ||
        lowerText.includes('don\'t want to live')) {
      const safetyMsg = {
        role: 'assistant',
        content: `I hear you, and I'm really glad you shared that with me. What you're feeling is real, and you deserve support right now.\n\n**Please reach out to one of these resources immediately:**\n\n🆘 **National Suicide Prevention Lifeline:** Call or text **988** (24/7)\n💬 **Crisis Text Line:** Text **HOME** to **741741**\n🌐 **International Association for Suicide Prevention:** https://www.iasp.info/resources/Crisis_Centres/\n\nYou are not alone in this. A trained counselor can provide the immediate support you need. Would you like to talk about what's going on while you consider reaching out?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAI: true,
      };
      setMessages([...newMessages, safetyMsg]);
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: safetyMsg });
      setIsTyping(false);
      return;
    }

    // Send to AI with full conversation history
    const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
    const result = await chatWithCounselor(apiMessages, finalScore, stressor, userHobbies);
    const botMsg = {
      role: 'assistant',
      content: result.content || result,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAI: result.isAI ?? true,
    };
    setMessages(prev => [...prev, botMsg]);
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: botMsg });
    if (result.isAI !== undefined) setApiOnline(result.isAI);
    setIsTyping(false);
  };

  const handleNewConversation = () => {
    setMessages([]);
    dispatch({ type: 'CLEAR_CHAT' });
    hasInitialized.current = false;
    // Re-trigger initialization
    setTimeout(() => {
      hasInitialized.current = true;
      (async () => {
        setIsTyping(true);
        const result = await getInitialCounselorMessage(finalScore, stressor, userHobbies);
        const botMsg = {
          role: 'assistant',
          content: result.content || result,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAI: result.isAI ?? true,
        };
        setMessages([botMsg]);
        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: botMsg });
        setIsTyping(false);
      })();
    }, 100);
  };

  const suggestedReplies = getSuggestedReplies();

  // Don't render anything while redirecting — prevents crash on missing state
  if (needsRedirect) {
    return null;
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '800px',
      margin: '0 auto',
      width: '100%',
      height: 'calc(100vh - 4rem)',
      padding: '1rem 0.5rem',
      position: 'relative',
      zIndex: 1,
      animation: 'fadeIn 0.5s ease-out forwards',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: 'var(--shadow-glow-primary)',
          }}>
            🧠
          </div>
          <div>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              margin: 0,
              WebkitTextFillColor: 'unset',
              background: 'none',
              color: 'var(--color-text-main)',
            }}>
              AI Counselor
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem' }}>
              {/* API status indicator */}
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: apiOnline === null ? '#eab308' : apiOnline ? '#22c55e' : '#f97316',
                display: 'inline-block',
                boxShadow: `0 0 6px ${apiOnline === null ? '#eab30840' : apiOnline ? '#22c55e40' : '#f9731640'}`,
              }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {apiOnline === null ? 'Connecting...' : apiOnline ? 'AI Connected' : 'Offline Mode'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>•</span>
              <span style={{ fontSize: '0.75rem', color: category.color, fontWeight: 600 }}>
                Stress: {safeScore.toFixed(1)}/10
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={handleNewConversation}
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
            title="Start a new conversation"
          >
            🔄 New Chat
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/interventions')}
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: 'rgba(15, 15, 26, 0.6)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-2xl)',
        padding: '1.25rem',
        marginBottom: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}>
        <div style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          marginBottom: '1.5rem',
          fontWeight: 500,
          padding: '0.5rem 1rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 'var(--radius-full)',
          display: 'inline-block',
          margin: '0 auto 1.5rem',
        }}>
          🔒 This is an AI counselor. For emergencies, dial 988.
        </div>
        {messages.map((msg, idx) => (<ChatMessage key={idx} message={msg} />))}
        {isTyping && (
          <div style={{ display: 'flex', width: '100%', marginBottom: '1rem', justifyContent: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: '0.5rem', marginBottom: '0.25rem',
                background: 'var(--gradient-primary)', color: 'white', fontSize: '0.85rem',
              }}>🧠</div>
              <div style={{
                borderRadius: '1rem 1rem 1rem 0.25rem',
                padding: '0.75rem 1rem',
                display: 'flex', alignItems: 'center', height: '46px',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[0, 150, 300].map(d => (
                    <div key={d} style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: 'var(--color-text-muted)',
                      animation: `bounce 1.4s infinite both`,
                      animationDelay: `${d}ms`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Replies */}
      {suggestedReplies.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.5rem',
          flexShrink: 0,
        }}>
          {suggestedReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(null, reply)}
              style={{
                fontSize: '0.8rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '9999px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = 'var(--color-border-hover)';
                e.currentTarget.style.color = 'var(--color-text-main)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '9999px',
        padding: '0.375rem',
        flexShrink: 0,
      }}>
        <form onSubmit={handleSend} style={{ display: 'flex', position: 'relative' }}>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Type your message..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '0.625rem 3rem 0.625rem 1.25rem',
              fontSize: '1rem',
              color: 'var(--color-text-main)',
              fontFamily: 'inherit',
            }}
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            style={{
              position: 'absolute',
              right: '0.25rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: (!inputValue.trim() || isTyping) ? 'rgba(100,116,139,0.3)' : 'var(--gradient-primary)',
              color: 'white',
              border: 'none',
              cursor: (!inputValue.trim() || isTyping) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: (!inputValue.trim() || isTyping) ? 'none' : 'var(--shadow-glow-primary)',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotPage;
