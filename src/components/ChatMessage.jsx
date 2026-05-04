import React from 'react';

/**
 * Render markdown: **bold**, *italic*, lists, and line breaks.
 */
const renderMarkdown = (text) => {
  if (!text) return null;

  return text.split('\n').map((line, lineIdx) => {
    // Check for list items (- or * or numbered)
    const listMatch = line.match(/^(\s*)([-*•]|\d+\.)\s+(.*)/);
    const isListItem = !!listMatch;
    const listContent = isListItem ? listMatch[3] : line;
    const indent = isListItem ? (listMatch[1]?.length || 0) : 0;

    const processInline = (str) => {
      const parts = [];
      let remaining = str;
      let key = 0;

      while (remaining.length > 0) {
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        const italicMatch = remaining.match(/(?:^|([^*]))\*([^*]+?)\*(?=[^*]|$)/);

        let earliest = null;
        let type = null;
        let preChar = '';

        if (boldMatch) {
          earliest = boldMatch;
          type = 'bold';
        }

        if (italicMatch && (!earliest || italicMatch.index < earliest.index)) {
          earliest = italicMatch;
          type = 'italic';
          preChar = italicMatch[1] || '';
        }

        if (!earliest) {
          parts.push(<span key={key++}>{remaining}</span>);
          break;
        }

        const matchIndex = earliest.index + (type === 'italic' && preChar ? 1 : 0);
        const matchLength = earliest[0].length - (type === 'italic' && preChar ? 1 : 0);

        if (matchIndex > 0) {
          parts.push(<span key={key++}>{remaining.substring(0, matchIndex)}</span>);
        }

        if (type === 'bold') {
          parts.push(<strong key={key++} style={{ fontWeight: 600, color: 'inherit' }}>{earliest[1]}</strong>);
        } else {
          parts.push(<em key={key++}>{earliest[2] || earliest[1]}</em>);
        }

        remaining = remaining.substring(matchIndex + matchLength);
      }
      return parts;
    };

    if (isListItem) {
      return (
        <div key={lineIdx} style={{
          display: 'flex',
          gap: '0.5rem',
          paddingLeft: `${indent * 0.5 + 0.25}rem`,
          marginTop: lineIdx > 0 ? '0.25rem' : 0,
        }}>
          <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>•</span>
          <span>{processInline(listContent)}</span>
        </div>
      );
    }

    return (
      <React.Fragment key={lineIdx}>
        {lineIdx > 0 && <br />}
        {processInline(line)}
      </React.Fragment>
    );
  });
};

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      marginBottom: '1rem',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      animation: 'fadeIn 0.3s ease-out forwards',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        maxWidth: '80%',
        gap: '0.5rem',
      }}>
        {/* Avatar */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginBottom: '0.25rem',
          fontSize: '0.85rem',
          color: 'white',
          background: isUser ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'var(--gradient-primary)',
        }}>
          {isUser ? '👤' : '🧠'}
        </div>

        {/* Message Bubble */}
        <div>
          <div style={{
            padding: '0.75rem 1rem',
            boxShadow: 'var(--shadow-sm)',
            borderRadius: isUser ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
            background: isUser ? 'linear-gradient(135deg, #22c55e, #10b981)' : 'var(--color-bg-secondary)',
            border: isUser ? 'none' : '1px solid var(--color-border)',
            color: isUser ? 'white' : 'var(--color-text-main)',
          }}>
            <div style={{
              fontSize: '0.875rem',
              lineHeight: 1.7,
              margin: 0,
              color: 'inherit',
            }}>
              {isUser ? message.content : renderMarkdown(message.content)}
            </div>
          </div>
          {message.timestamp && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              marginTop: '0.25rem',
              justifyContent: isUser ? 'flex-end' : 'flex-start',
            }}>
              <span style={{
                fontSize: '0.625rem',
                color: 'var(--color-text-muted)',
              }}>
                {message.timestamp}
              </span>
              {!isUser && message.isAI === false && (
                <span style={{
                  fontSize: '0.6rem',
                  color: '#f97316',
                  fontWeight: 600,
                }}>
                  • Offline
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
