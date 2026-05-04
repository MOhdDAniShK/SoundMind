import React, { useEffect, useState } from 'react';
import { CONSTANTS } from '../utils/constants';

const StressGauge = ({ score }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = score / (duration / 16);
    const animate = () => {
      start += increment;
      if (start < score) { setAnimatedScore(start); requestAnimationFrame(animate); }
      else { setAnimatedScore(score); }
    };
    requestAnimationFrame(animate);
  }, [score]);

  const size = 250;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI;
  const normalizedScore = animatedScore / 10;
  const dashoffset = circumference - (normalizedScore * circumference);

  let currentColor = CONSTANTS.COLORS.LOW;
  if (animatedScore > CONSTANTS.THRESHOLDS.HIGH) currentColor = CONSTANTS.COLORS.SEVERE;
  else if (animatedScore > CONSTANTS.THRESHOLDS.MODERATE) currentColor = CONSTANTS.COLORS.HIGH;
  else if (animatedScore > CONSTANTS.THRESHOLDS.MILD) currentColor = CONSTANTS.COLORS.MODERATE;
  else if (animatedScore > CONSTANTS.THRESHOLDS.LOW) currentColor = CONSTANTS.COLORS.MILD;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      width: `${size}px`,
      height: `${size / 2 + 40}px`,
      margin: '0 auto',
    }}>
      <svg
        width={size}
        height={size / 2 + 20}
        viewBox={`0 0 ${size} ${size / 2 + 20}`}
        style={{ overflow: 'visible', display: 'block' }}
      >
        {/* Background Arc */}
        <path
          d={`M ${strokeWidth/2} ${size/2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth/2} ${size/2}`}
          fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth={strokeWidth} strokeLinecap="round"
        />
        {/* Glow Arc */}
        <path
          d={`M ${strokeWidth/2} ${size/2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth/2} ${size/2}`}
          fill="none" stroke={currentColor} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={dashoffset}
          style={{ transition: 'stroke 0.3s ease', filter: `drop-shadow(0 0 8px ${currentColor}60)` }}
        />
      </svg>

      {/* Score Display — centered under the arc */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: '3rem',
          fontWeight: 700,
          fontFamily: 'monospace',
          color: currentColor,
          textShadow: `0 0 20px ${currentColor}40`,
          lineHeight: 1,
        }}>
          {animatedScore.toFixed(1)}
        </span>
        <span style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          fontWeight: 600,
          marginTop: '0.25rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}>
          Score
        </span>
      </div>

      {/* Min/Max labels */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        position: 'absolute',
        bottom: 0,
        padding: '0 0.5rem',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'var(--color-text-muted)',
      }}>
        <span>0</span>
        <span>10</span>
      </div>
    </div>
  );
};

export default StressGauge;
