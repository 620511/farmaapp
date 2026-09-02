import { useEffect, useState } from 'react';
import api from '../../api/client.js';

const empty = { name: '', description: '', city: '', ownerName: '', ownerEmail: '', ownerPassword: '' };

export default function AdminPharmacies() {
  const [pharmacies, setPharmacies] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);

  function load() { api.get('/admin/pharmacies').then((r) => setPharmacies(r.data)); }
  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await api.post('/admin/pharmacies', form);
    setForm(empty);
    setShowForm(false);
    load();
  }

  async function toggle(id) {
    await api.put(`/admin/pharmacies/${id}/toggle`);
    load();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-2xl text-navy-900">Farmácias parceiras</h1>
        <button onClick={() => setShowForm((s) => !s)} className="px-4 py-2.5 rounded-xl bg-brand-gradient text-white font-semibold text-sm">Nova farmácia</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-5 mb-6 grid sm:grid-cols-2 gap-3">
          <input required placeholder="Nome da farmácia" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
          <input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
          <input placeholder="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
          <input required placeholder="Nome do responsável" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input required type="email" placeholder="E-mail do responsável" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input required type="password" placeholder="Senha de acesso" value={form.ownerPassword} onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
          <button className="sm:col-span-2 py-2.5 rounded-lg bg-navy-900 text-white text-sm font-semibold">Cadastrar farmácia</button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-navy-900/50 text-left">
            <tr><th className="p-3">Farmácia</th><th className="p-3">Cidade</th><th className="p-3">Produtos</th><th className="p-3">Status</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {pharmacies.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="p-3 font-medium text-navy-900">{p.name}</td>
                <td className="p-3 text-navy-900/60">{p.city}</td>
                <td className="p-3">{p.products?.length || 0}</td>
                <td className="p-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-coral-500'}`}>{p.isActive ? 'Ativa' : 'Inativa'}</span>
                </td>
                <td className="p-3">
                  <button onClick={() => toggle(p.id)} className="text-xs font-semibold text-teal-600">{p.isActive ? 'Desativar' : 'Ativar'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
