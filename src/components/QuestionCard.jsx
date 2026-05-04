import React, { useState } from 'react';

/**
 * QuestionCard — Renders a single survey question with animated transitions.
 * Supports: slider, radio, emoji, text, select, date
 */
const QuestionCard = ({ question, answer, onAnswer, questionNumber, totalQuestions }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  if (!question) return null;

  const renderInput = () => {
    switch (question.type) {
      case 'slider': {
        const value = answer !== undefined ? Number(answer) : Math.round((question.min + question.max) / 2);
        const range = question.max - question.min;
        const pct = ((value - question.min) / range) * 100;
        return (
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-[var(--color-text-muted)]">{question.labels?.[0] || question.min}</span>
              <span className="text-2xl font-bold text-[var(--color-text-accent)]">{value}</span>
              <span className="text-[var(--color-text-muted)]">{question.labels?.[1] || question.max}</span>
            </div>
            <input
              type="range"
              min={question.min}
              max={question.max}
              value={value}
              onChange={(e) => onAnswer(question.id, Number(e.target.value))}
              className="range-slider w-full"
              style={{
                background: `linear-gradient(to right, #22c55e ${pct}%, #e5e7eb ${pct}%)`
              }}
            />
          </div>
        );
      }

      case 'radio':
        return (
          <div className="mt-6 space-y-3">
            {question.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => onAnswer(question.id, option)}
                className={`radio-option w-full text-left ${answer === option ? 'selected' : ''}`}
              >
                <span className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    answer === option 
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' 
                      : 'border-[var(--color-border)]'
                  }`}>
                    {answer === option && (
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                    )}
                  </span>
                  {option}
                </span>
              </button>
            ))}
          </div>
        );

      case 'emoji':
        return (
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            {question.options?.map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => onAnswer(question.id, question.values?.[idx] || idx)}
                className={`emoji-option ${answer === (question.values?.[idx] || idx) ? 'selected' : ''}`}
                title={`Score: ${question.values?.[idx] || idx}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        );

      case 'text':
        return (
          <div className="mt-6">
            <input
              type="text"
              value={answer || ''}
              onChange={(e) => onAnswer(question.id, e.target.value)}
              placeholder={question.placeholder || 'Type your answer...'}
              className="input-field text-lg"
              autoFocus
            />
          </div>
        );

      case 'select':
        return (
          <div className="mt-6">
            <select
              value={answer || ''}
              onChange={(e) => onAnswer(question.id, e.target.value)}
              className="input-field"
            >
              <option value="" disabled>Select an option...</option>
              {question.options?.map((option, idx) => (
                <option key={idx} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );

      case 'date':
        return (
          <div className="mt-6">
            <input
              type="date"
              value={answer || ''}
              onChange={(e) => onAnswer(question.id, e.target.value)}
              className="input-field"
            />
          </div>
        );

      default:
        return (
          <div className="mt-6">
            <input
              type="text"
              value={answer || ''}
              onChange={(e) => onAnswer(question.id, e.target.value)}
              className="input-field"
            />
          </div>
        );
    }
  };

  return (
    <div className="question-enter">
      {/* Question number badge */}
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold"
          style={{ background: 'var(--gradient-primary)', color: 'white' }}>
          {questionNumber}
        </span>
        <span className="text-sm text-[var(--color-text-muted)]">
          of {totalQuestions} questions
        </span>
      </div>

      {/* Question text */}
      <h2 className="text-xl md:text-2xl font-semibold leading-relaxed mb-2" 
        style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--color-text-main)' }}>
        {question.text}
      </h2>

      {/* Input */}
      {renderInput()}
    </div>
  );
};

export default QuestionCard;
