import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssessmentHistory } from '../services/apiService';
import { CONSTANTS } from '../utils/constants';
import AnimatedBackground from '../components/AnimatedBackground';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const HistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { (async () => { setHistory(await getAssessmentHistory()); setIsLoading(false); })(); }, []);

  const chartData = {
    labels: history.slice().reverse().map(e => new Date(e.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Stress Score',
      data: history.slice().reverse().map(e => e.finalScore),
      borderColor: '#60a5fa',
      backgroundColor: 'rgba(59, 130, 246, 0.12)',
      borderWidth: 3,
      pointBackgroundColor: history.slice().reverse().map(e => {
        if (e.finalScore > CONSTANTS.THRESHOLDS.HIGH) return CONSTANTS.COLORS.SEVERE;
        if (e.finalScore > CONSTANTS.THRESHOLDS.MODERATE) return CONSTANTS.COLORS.HIGH;
        if (e.finalScore > CONSTANTS.THRESHOLDS.MILD) return CONSTANTS.COLORS.MODERATE;
        if (e.finalScore > CONSTANTS.THRESHOLDS.LOW) return CONSTANTS.COLORS.MILD;
        return CONSTANTS.COLORS.LOW;
      }),
      pointRadius: 6, pointHoverRadius: 8, fill: true, tension: 0.4
    }]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(26,26,46,0.95)', titleColor: '#e2e8f0', bodyColor: '#e2e8f0', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 12 } },
    scales: {
      y: { min: 0, max: 10, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { stepSize: 2, color: '#64748b' } },
      x: { grid: { display: false }, ticks: { color: '#64748b' } }
    }
  };



  return (
    <div className="flex-1 animate-fade-in py-4 max-w-5xl mx-auto w-full">
      <AnimatedBackground />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 relative z-10">
        <div><h1 className="text-3xl font-bold mb-1">Your Dashboard</h1><p className="text-[var(--color-text-secondary)] m-0">Track your progress over time.</p></div>
        <div className="flex gap-4 w-full sm:w-auto">

          <button className="btn btn-primary flex-1 sm:flex-none" onClick={() => navigate('/survey')}>+ New Assessment</button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div></div>
      ) : history.length === 0 ? (
        <div className="glass-card text-center p-12"><div className="text-6xl mb-4">📊</div><h2 style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--color-text-main)' }}>No History Yet</h2><p className="mb-6">Take your first assessment to start tracking.</p><button className="btn btn-primary" onClick={() => navigate('/consent')}>Start Assessment</button></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          <div className="lg:col-span-2 glass-card flex flex-col h-[400px]">
            <h3 className="mb-4" style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--color-text-main)' }}>Stress Trends</h3>
            <div className="flex-1 relative w-full h-full"><Line data={chartData} options={chartOptions} /></div>
          </div>
          <div className="glass-card flex flex-col h-[400px] overflow-hidden">
            <h3 className="mb-4 pb-2 border-b border-[var(--color-border)]" style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--color-text-main)' }}>Recent Assessments</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {history.map(entry => {
                let bc = CONSTANTS.COLORS.LOW;
                if (entry.finalScore > CONSTANTS.THRESHOLDS.HIGH) bc = CONSTANTS.COLORS.SEVERE;
                else if (entry.finalScore > CONSTANTS.THRESHOLDS.MODERATE) bc = CONSTANTS.COLORS.HIGH;
                else if (entry.finalScore > CONSTANTS.THRESHOLDS.MILD) bc = CONSTANTS.COLORS.MODERATE;
                return (
                  <div key={entry.id} className="metric-card flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm text-[var(--color-text-main)]">{new Date(entry.timestamp).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: bc, boxShadow: `0 0 10px ${bc}30` }}>{entry.finalScore.toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)]">{entry.category}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
