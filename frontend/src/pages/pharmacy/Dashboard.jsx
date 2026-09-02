import { useEffect, useState } from 'react';
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import api from '../../api/client.js';

export default function PharmacyDashboard() {
  const [pharmacy, setPharmacy] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [insights, setInsights] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    api.get('/pharmacies/me').then((r) => setPharmacy(r.data));
    api.get('/orders').then((r) => setOrders(r.data));
    api.get('/products').then((r) => setProducts(r.data));
    api.get('/pharmacies/me/insights')
      .then((r) => { setInsights(r.data.insights); setLowStock(r.data.summary.produtosComEstoqueBaixo || []); })
      .catch(() => setInsights(['Não foi possível carregar os insights agora.']))
      .finally(() => setLoadingInsights(false));
  }, []);

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const payout = orders.reduce((s, o) => s + (o.pharmacyPayout || 0), 0);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">Olá, {pharmacy?.name || '...'}</h1>
      <p className="text-navy-900/50 mb-6">Resumo da sua farmácia</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-navy-900/50">Pedidos recebidos</p>
          <p className="font-display font-bold text-2xl text-navy-900 mt-1">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-navy-900/50">Produtos ativos</p>
          <p className="font-display font-bold text-2xl text-navy-900 mt-1">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-navy-900/50">Total das vendas</p>
          <p className="font-display font-bold text-2xl text-navy-900 mt-1">R$ {revenue.toFixed(2).replace('.', ',')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-navy-900/50">Seu repasse (já com a taxa descontada)</p>
          <p className="font-display font-bold text-2xl text-teal-600 mt-1">R$ {payout.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-4 mb-6 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Estoque baixo</p>
            <p className="text-xs text-amber-700">{lowStock.map((p) => `${p.name} (${p.stock})`).join(', ')}</p>
          </div>
        </div>
      )}

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
