import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApp } from './AppContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { users } = useApp();
  const [currentUser, setCurrentUser] = useState(() => {
    try { const s = sessionStorage.getItem('k4h_session'); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });

  const login = (username, password) => {
    const user = users.find(u =>
      u.username.toLowerCase() === username.toLowerCase() &&
      u.password === password &&
      u.active !== false
    );
    if (user) {
      const safe = { ...user };
      setCurrentUser(safe);
      sessionStorage.setItem('k4h_session', JSON.stringify(safe));
      return { ok: true, user: safe };
    }
    return { ok: false, error: 'Invalid username or password' };
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('k4h_session');
  };

  const isManager = currentUser?.role === 'manager';

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isManager }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
