import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Image as ImageIcon, Loader2 } from 'lucide-react';
import api from '../../api/client.js';

const empty = { name: '', description: '', price: '', originalPrice: '', stock: '', categoryId: '', requiresRx: false, imageUrl: '' };

export default function PharmacyProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  function loadProducts() {
    api.get('/pharmacies/me').then((r) => {
      api.get('/products', { params: { pharmacyId: r.data.id } }).then((res) => setProducts(res.data));
    });
  }

  useEffect(() => {
    loadProducts();
    api.get('/categories').then((r) => setCategories(r.data));
  }, []);

  async function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, imageUrl: res.data.url }));
    } catch {
      alert('Não foi possível enviar a imagem.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editingId) {
      await api.put(`/products/${editingId}`, form);
    } else {
      await api.post('/products', form);
    }
    setForm(empty);
    setEditingId(null);
    setShowForm(false);
    loadProducts();
  }

  function startEdit(p) {
    setForm({ name: p.name, description: p.description || '', price: p.price, originalPrice: p.originalPrice || '', stock: p.stock, categoryId: p.categoryId, requiresRx: p.requiresRx, imageUrl: p.imageUrl || '' });
    setEditingId(p.id);
    setShowForm(true);
  }

  async function remove(id) {
    if (!confirm('Remover este produto?')) return;
    await api.delete(`/products/${id}`);
    loadProducts();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-2xl text-navy-900">Meus produtos</h1>
        <button onClick={() => { setShowForm((s) => !s); setForm(empty); setEditingId(null); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-gradient text-white font-semibold text-sm">
          <Plus className="w-4 h-4" /> Novo produto
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-5 mb-6 grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
              {form.imageUrl ? <img src={form.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-navy-900/20" />}
            </div>
            <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm cursor-pointer">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              {uploading ? 'Enviando...' : 'Enviar foto do produto'}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
          <input required placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
          <input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
          <input required type="number" step="0.01" placeholder="Preço" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input type="number" step="0.01" placeholder="Preço original (promoção)" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input type="number" placeholder="Estoque" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">Categoria</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-navy-900/70 sm:col-span-2">
            <input type="checkbox" checked={form.requiresRx} onChange={(e) => setForm({ ...form, requiresRx: e.target.checked })} /> Exige receita médica
          </label>
          <button disabled={uploading} className="sm:col-span-2 py-2.5 rounded-lg bg-navy-900 text-white text-sm font-semibold disabled:opacity-50">{editingId ? 'Salvar alterações' : 'Cadastrar produto'}</button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-navy-900/50 text-left">
            <tr><th className="p-3">Produto</th><th className="p-3">Categoria</th><th className="p-3">Preço</th><th className="p-3">Estoque</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="p-3 font-medium text-navy-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-gray-50 overflow-hidden shrink-0">
                    {p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  {p.name}
                </td>
                <td className="p-3 text-navy-900/60">{p.category?.name}</td>
                <td className="p-3 text-teal-600 font-semibold">R$ {p.price.toFixed(2).replace('.', ',')}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => startEdit(p)} className="text-navy-900/40 hover:text-navy-900"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(p.id)} className="text-navy-900/40 hover:text-coral-500"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
