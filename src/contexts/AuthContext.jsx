import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

const STORAGE_KEY = 'soundmind_user';

// ── Hardcoded credential ──
const DEMO_CREDENTIALS = {
  email: 'teamrocket01@gmail.com',
  password: '0000',
  userData: {
    id: 'student-001',
    name: 'Team Rocket',
    email: 'teamrocket01@gmail.com',
    picture: null,
    isDemo: true,
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  // ── Email/Password login (demo credential) ──
  const loginWithCredentials = useCallback((email, password) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (
      trimmedEmail === DEMO_CREDENTIALS.email &&
      password === DEMO_CREDENTIALS.password
    ) {
      const userData = { ...DEMO_CREDENTIALS.userData };
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, error: 'Invalid email or password.' };
  }, []);

  const signInWithGoogle = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.id) {
        reject(new Error('Google Identity Services not loaded'));
        return;
      }

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            // Decode the JWT credential to get user info
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            const userData = {
              id: payload.sub,
              name: payload.name,
              email: payload.email,
              picture: payload.picture,
              token: response.credential,
            };
            setUser(userData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
            resolve(userData);
          } catch (err) {
            reject(err);
          }
        },
      });

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: use the popup flow
          window.google.accounts.id.renderButton(
            document.createElement('div'),
            { type: 'standard' }
          );
          // Use the redirect/popup approach
          window.google.accounts.oauth2.initTokenClient({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            scope: 'email profile',
            callback: () => {},
          });
        }
      });
    });
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    // Don't clear consent data — that persists across sessions
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithCredentials, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
