import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      navigate(location.state?.from || '/app');
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível criar a conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAF3FB] px-4 py-10">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6"><Logo size={48} /></div>
        <h1 className="font-display font-bold text-xl text-navy-900 text-center mb-6">Criar minha conta</h1>
        {error && <p className="bg-red-50 text-coral-500 text-sm rounded-lg px-3 py-2 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-navy-900">Nome completo</label>
            <input required value={form.name} onChange={set('name')} className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-navy-900">E-mail</label>
            <input type="email" required value={form.email} onChange={set('email')} className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-navy-900">Telefone</label>
            <input value={form.phone} onChange={set('phone')} className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-navy-900">Senha</label>
            <input type="password" required value={form.password} onChange={set('password')} className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <button disabled={loading} className="w-full py-3 rounded-xl bg-brand-gradient text-white font-display font-semibold shadow-lg disabled:opacity-60">
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>
        <p className="text-center text-sm text-navy-900/60 mt-6">
          Já tem conta? <Link to="/login" className="text-teal-600 font-semibold">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
