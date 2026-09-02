import { useEffect, useState } from 'react';
import { Percent } from 'lucide-react';
import api from '../../api/client.js';

export default function AdminSettings() {
  const [percent, setPercent] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/admin/settings').then((r) => setPercent(String(r.data.platformFeePercent))); }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.put('/admin/settings', { platformFeePercent: percent });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">Configurações</h1>
      <p className="text-navy-900/50 mb-6 text-sm">Ajustes gerais da plataforma.</p>

      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0"><Percent className="w-5 h-5" /></div>
          <div>
            <p className="font-display font-semibold text-navy-900">Taxa da plataforma</p>
            <p className="text-xs text-navy-900/50">Percentual descontado de cada venda antes do repasse à farmácia.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex items-center gap-3">
          <div className="relative flex-1">
            <input type="number" min="0" max="50" step="0.5" value={percent} onChange={(e) => setPercent(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm pr-8" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-900/40 text-sm">%</span>
          </div>
          <button disabled={saving} className="px-5 py-2.5 rounded-lg bg-navy-900 text-white text-sm font-semibold disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
        {saved && <p className="text-xs text-teal-600 mt-2">Taxa atualizada — vale para os próximos pedidos.</p>}
        {error && <p className="text-xs text-coral-500 mt-2">{error}</p>}
        <p className="text-xs text-navy-900/40 mt-4">
          Ex.: com taxa de 5%, um pedido de R$ 100 em produtos gera R$ 5 de receita da plataforma e R$ 95 de repasse pra farmácia (o frete fica inteiro com a farmácia).
        </p>
      </div>
    </div>
  );
}
