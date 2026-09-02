import { useEffect, useState } from 'react';
import { Store, Package, ClipboardList, Users, DollarSign, Wallet, Sparkles, Loader2 } from 'lucide-react';
import api from '../../api/client.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data));
    api.get('/admin/insights')
      .then((r) => setInsights(r.data.insights))
      .catch(() => setInsights(['Não foi possível carregar os insights agora.']))
      .finally(() => setLoadingInsights(false));
  }, []);

  const cards = stats ? [
    { label: 'Farmácias parceiras', value: stats.pharmacies, icon: Store },
    { label: 'Produtos cadastrados', value: stats.products, icon: Package },
    { label: 'Pedidos realizados', value: stats.orders, icon: ClipboardList },
    { label: 'Clientes', value: stats.customers, icon: Users },
    { label: 'Faturamento total (bruto)', value: `R$ ${stats.revenue.toFixed(2).replace('.', ',')}`, icon: DollarSign },
    { label: 'Receita da plataforma', value: `R$ ${stats.platformRevenue.toFixed(2).replace('.', ',')}`, icon: Wallet }
  ] : [];

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-6">Visão geral</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0"><c.icon className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-navy-900/50">{c.label}</p>
              <p className="font-display font-bold text-xl text-navy-900">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <p className="font-display font-semibold text-navy-900">Insights da IA (últimos 30 dias)</p>
        </div>
        {loadingInsights ? (
          <p className="text-sm text-navy-900/40 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</p>
        ) : (
          <ul className="space-y-2">
            {insights?.map((i, idx) => (
              <li key={idx} className="text-sm text-navy-900/70 flex gap-2">
                <span className="text-teal-500">•</span> {i}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
