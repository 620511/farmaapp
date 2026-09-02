import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../../api/client.js';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');

  function load() { api.get('/categories').then((r) => setCategories(r.data)); }
  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    await api.post('/categories', { name });
    setName('');
    load();
  }

  async function remove(id) {
    if (!confirm('Remover categoria?')) return;
    await api.delete(`/categories/${id}`);
    load();
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-6">Categorias</h1>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da categoria" className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1" />
        <button className="px-4 py-2 rounded-lg bg-navy-900 text-white text-sm font-semibold">Adicionar</button>
      </form>
      <div className="grid sm:grid-cols-3 gap-3">
        {categories.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4 flex justify-between items-center">
            <span className="text-sm font-medium text-navy-900">{c.name}</span>
            <button onClick={() => remove(c.id)} className="text-navy-900/30 hover:text-coral-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
