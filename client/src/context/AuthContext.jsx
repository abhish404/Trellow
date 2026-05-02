import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/auth';

const Ctx = createContext(null);

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) return setLoading(false);
    getMe()
      .then(r => setUser(r.data))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return null;

  return (
    <Ctx.Provider value={{ user, login, logout, loading }}>
      {children}
    </Ctx.Provider>
  );
}
