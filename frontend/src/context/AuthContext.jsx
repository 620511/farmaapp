import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fd_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me').then((res) => setUser(res.data)).catch(() => {
      localStorage.removeItem('fd_token');
    }).finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('fd_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  async function register(name, email, password, phone) {
    const res = await api.post('/auth/register', { name, email, password, phone });
    localStorage.setItem('fd_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem('fd_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
