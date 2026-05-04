import React, { useState, useEffect } from 'react';

const BreathingExercise = () => {
  const [phase, setPhase] = useState('inhale');
  const [count, setCount] = useState(4);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          setPhase(p => {
            if (p === 'inhale') return 'hold';
            if (p === 'hold') return 'exhale';
            return 'inhale';
          });
          if (phase === 'inhale') return 7;
          if (phase === 'hold') return 8;
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, phase]);

  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative w-40 h-40 mb-6">
        <div
          className={`absolute inset-0 rounded-full ${isRunning ? 'animate-breathe' : ''}`}
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.25), rgba(6,182,212,0.12))',
            boxShadow: 'var(--shadow-glow-primary)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-4xl font-bold text-[var(--color-text-accent)]">{count}</span>
          <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mt-1 font-semibold">{phase}</span>
        </div>
      </div>

      {!isRunning ? (
        <button className="btn btn-primary px-8" onClick={() => setIsRunning(true)}>Begin Breathing</button>
      ) : (
        <button className="btn btn-secondary px-8" onClick={() => { setIsRunning(false); setPhase('inhale'); setCount(4); }}>Stop</button>
      )}

      <p className="text-xs text-[var(--color-text-muted)] mt-4 text-center">4-7-8 technique: Inhale 4s, Hold 7s, Exhale 8s</p>
    </div>
  );
};

export default BreathingExercise;
