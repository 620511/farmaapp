import { useEffect, useState } from 'react';
import { Wifi } from 'lucide-react';
import api from '../../api/client.js';
import { useSocket } from '../../context/SocketContext.jsx';

const statuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const statusLabel = { PENDING: 'Aguardando', CONFIRMED: 'Confirmado', PREPARING: 'Preparando', OUT_FOR_DELIVERY: 'A caminho', DELIVERED: 'Entregue', CANCELLED: 'Cancelado' };

export default function PharmacyOrders() {
  const [orders, setOrders] = useState([]);
  const { socket } = useSocket() || {};

  function load() { api.get('/orders').then((r) => setOrders(r.data)); }
  useEffect(load, []);

  useEffect(() => {
    if (!socket) return;
    api.get('/pharmacies/me').then((r) => socket.emit('join-pharmacy', r.data.id));
    const handler = () => load();
    socket.on('new-order', handler);
    socket.on('order-status', handler);
    return () => { socket.off('new-order', handler); socket.off('order-status', handler); };
  }, [socket]);

  async function updateStatus(id, status) {
    await api.put(`/orders/${id}/status`, { status });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-navy-900">Pedidos</h1>
        <span className="flex items-center gap-1 text-[10px] text-navy-900/40"><Wifi className="w-3 h-3" /> atualiza ao vivo</span>
      </div>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-navy-900">Pedido #{o.id.slice(0, 8)}</p>
              <p className="text-xs text-navy-900/50">{new Date(o.createdAt).toLocaleString('pt-BR')} — {o.items.length} item(ns)</p>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-navy-900">R$ {o.total.toFixed(2).replace('.', ',')}</p>
              <p className="text-[10px] text-teal-600">repasse: R$ {(o.pharmacyPayout || 0).toFixed(2).replace('.', ',')}</p>
            </div>
            <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {statuses.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
            </select>
          </div>
        ))}
        {orders.length === 0 && <p className="text-navy-900/40 text-sm">Nenhum pedido recebido ainda.</p>}
      </div>
    </div>
  );
}
