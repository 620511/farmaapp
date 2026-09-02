import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const from = location.state?.from;
      if (from) navigate(from);
      else if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'PHARMACY') navigate('/farmacia');
      else navigate('/app');
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAF3FB] px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6"><Logo size={48} /></div>
        <h1 className="font-display font-bold text-xl text-navy-900 text-center mb-6">Entrar na sua conta</h1>
        {error && <p className="bg-red-50 text-coral-500 text-sm rounded-lg px-3 py-2 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-navy-900">E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-navy-900">Senha</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <button disabled={loading} className="w-full py-3 rounded-xl bg-brand-gradient text-white font-display font-semibold shadow-lg disabled:opacity-60">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-center text-sm text-navy-900/60 mt-6">
          Não tem conta? <Link to="/register" className="text-teal-600 font-semibold">Cadastre-se</Link>
        </p>
        <div className="mt-6 border-t pt-4 text-xs text-navy-900/40 space-y-1">
          <p>Demo admin: admin@farma.app / admin123</p>
          <p>Demo farmácia: farmacia@farma.app / farmacia123</p>
          <p>Demo cliente: cliente@farma.app / cliente123</p>
        </div>
      </div>
    </div>
  );
}
