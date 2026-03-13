import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('pm_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify session is still valid on mount
    API('/me')
      .then((data) => {
        const u = { email: data.email, is_admin: data.is_admin };
        setUser(u);
        localStorage.setItem('pm_user', JSON.stringify(u));
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('pm_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (email, is_admin) => {
    const u = { email, is_admin };
    setUser(u);
    localStorage.setItem('pm_user', JSON.stringify(u));
  };

  const logout = async () => {
    try {
      await API('/logout', { method: 'POST' });
    } catch (_) {
      // ignore errors
    }
    setUser(null);
    localStorage.removeItem('pm_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
