import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({ label: '', street: '', number: '', city: '', state: '', zip: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useState(() => { api.get('/addresses').then((r) => setAddresses(r.data)); }, []);

  async function addAddress(e) {
    e.preventDefault();
    const res = await api.post('/addresses', form);
    setAddresses((a) => [...a, res.data]);
    setForm({ label: '', street: '', number: '', city: '', state: '', zip: '' });
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await api.delete('/auth/me');
      logout();
      navigate('/');
    } catch {
      alert('Não foi possível excluir a conta agora. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="px-5 py-4 pb-8">
      <h1 className="font-display font-bold text-lg text-navy-900 mb-4">Minha conta</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-sm font-semibold text-navy-900">{user?.name}</p>
        <p className="text-xs text-navy-900/50">{user?.email}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mt-4">
        <p className="text-sm font-semibold text-navy-900 mb-3">Meus endereços</p>
        <div className="space-y-2 mb-3">
          {addresses.map((a) => (
            <p key={a.id} className="text-xs text-navy-900/60">{a.label}: {a.street}, {a.number} — {a.city}/{a.state}</p>
          ))}
        </div>
        <form onSubmit={addAddress} className="grid grid-cols-2 gap-2">
          <input placeholder="Rótulo (Casa, Trabalho)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-xs" required />
          <input placeholder="Rua" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-xs" required />
          <input placeholder="Número" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-xs" required />
          <input placeholder="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-xs" required />
          <input placeholder="UF" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-xs" required />
          <input placeholder="CEP" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-xs" required />
          <button className="col-span-2 mt-1 py-2 rounded-lg bg-navy-900 text-white text-xs font-semibold">Adicionar endereço</button>
        </form>
      </div>

      <Link to="/privacidade" className="mt-4 flex items-center gap-2 bg-white rounded-xl border border-gray-100 p-4 text-sm text-navy-900/70">
        <ShieldCheck className="w-4 h-4 text-teal-600" /> Política de privacidade e uso de dados
      </Link>

      <button onClick={logout} className="mt-6 w-full py-3 rounded-xl border-2 border-navy-900 text-navy-900 font-display font-semibold">Sair da conta</button>

      <div className="mt-8 border-t border-gray-100 pt-6">
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="text-sm text-coral-500 font-medium">
            Excluir minha conta e meus dados
          </button>
        ) : (
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-sm text-coral-500 font-semibold mb-1">Tem certeza?</p>
            <p className="text-xs text-navy-900/60 mb-3">
              Seus dados pessoais, endereços, favoritos e receitas médicas enviadas serão apagados. Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-lg border border-gray-300 text-navy-900 text-xs font-semibold">Cancelar</button>
              <button disabled={deleting} onClick={handleDeleteAccount} className="flex-1 py-2 rounded-lg bg-coral-500 text-white text-xs font-semibold disabled:opacity-50">
                {deleting ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
