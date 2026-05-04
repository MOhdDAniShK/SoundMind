import React from 'react';

const InterventionCard = ({ title, description, icon, color, buttonText, onAction, primary }) => {
  return (
    <div
      className={`glass-card ${primary ? '' : ''}`}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl shrink-0">{icon}</span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2" style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--color-text-main)' }}>
            {title}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed mb-0">
            {description}
          </p>
          {buttonText && onAction && (
            <button
              className="btn btn-primary mt-4 text-sm px-5 py-2"
              onClick={onAction}
            >
              {buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterventionCard;
