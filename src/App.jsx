import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';

// Pages
import LoginPage from './pages/LoginPage';
import ConsentPage from './pages/ConsentPage';
import SurveyPage from './pages/SurveyPage';
import ResultsPage from './pages/ResultsPage';
import InterventionsPage from './pages/InterventionsPage';
import TaskVerificationPage from './pages/TaskVerificationPage';
import ChatbotPage from './pages/ChatbotPage';
import HistoryPage from './pages/HistoryPage';
import AnimatedBackground from './components/AnimatedBackground';

import { useAppContext } from './contexts/AppContext';

const SIDEBAR_LINKS = [
  { to: '/consent', icon: '🏠', label: 'Home' },
  { to: '/survey', icon: '📋', label: 'Assessment' },
  { to: '/results', icon: '📊', label: 'Results', requiresAssessment: true },
  { to: '/interventions', icon: '🎯', label: 'Tasks', requiresAssessment: true },
  { to: '/chat', icon: '💬', label: 'AI Counselor', requiresAssessment: true },
  { to: '/history', icon: '📈', label: 'History' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { state } = useAppContext();
  const needsAssessment = !state.surveyData && state.finalScore === 0;

  const handleLinkClick = (e, link) => {
    if (link.requiresAssessment && needsAssessment) {
      e.preventDefault();
      window.alert("Please complete the stress assessment survey first to unlock this feature!");
      return;
    }
    onClose();
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🧠</div>
          <span className="sidebar-brand-text">SoundMind</span>
        </div>
        <nav className="sidebar-nav">
          <span className="sidebar-section">Navigation</span>
          {SIDEBAR_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} ${(link.requiresAssessment && needsAssessment) ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => handleLinkClick(e, link)}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              {link.label}
              {link.requiresAssessment && needsAssessment && <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>🔒</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="live-dot" /> <span style={{ fontSize: '0.8rem', color: '#22c55e' }}>System Online</span>
          </div>
          SoundMind v3.0 • AI-Powered
        </div>
      </aside>
    </>
  );
};

const AppLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // No sidebar on login page
  const noSidebar = location.pathname === '/';

  if (noSidebar) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <AnimatedBackground />
        <div className="app-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Routes>
            <Route path="/" element={<LoginPage />} />
          </Routes>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <AnimatedBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="mobile-header">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>☰</button>
        <span style={{ fontWeight: 700, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SoundMind</span>
        <div style={{ width: 32 }} />
      </div>
      <main className="main-content">
        <Routes>
          <Route path="/consent" element={<ConsentPage />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/interventions" element={<InterventionsPage />} />
          <Route path="/verify-task" element={<TaskVerificationPage />} />
          <Route path="/chat" element={<ChatbotPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  );
};

import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }) {
  return (
    <div style={{ padding: '2rem', color: 'red', background: 'black', minHeight: '100vh', zIndex: 9999, position: 'relative' }}>
      <h2>Something went wrong:</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{error.message}</pre>
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{error.stack}</pre>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AppProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
