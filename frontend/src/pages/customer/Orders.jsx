import { useEffect, useState } from 'react';
import { Wifi } from 'lucide-react';
import api from '../../api/client.js';
import { useSocket } from '../../context/SocketContext.jsx';

const statusLabel = {
  PENDING: 'Aguardando confirmação',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparação',
  OUT_FOR_DELIVERY: 'A caminho',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado'
};

const statusColor = {
  PENDING: 'bg-amber-50 text-amber-600',
  CONFIRMED: 'bg-blue-50 text-blue-600',
  PREPARING: 'bg-indigo-50 text-indigo-600',
  OUT_FOR_DELIVERY: 'bg-teal-50 text-teal-600',
  DELIVERED: 'bg-green-50 text-green-600',
  CANCELLED: 'bg-red-50 text-coral-500'
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const { socket } = useSocket() || {};

  function load() { api.get('/orders').then((r) => setOrders(r.data)); }
  useEffect(load, []);

  useEffect(() => {
    if (!socket) return;
    const handler = () => load();
    socket.on('order-status', handler);
    return () => socket.off('order-status', handler);
  }, [socket]);

  if (orders.length === 0) {
    return <div className="px-5 py-16 text-center text-navy-900/50">Você ainda não fez nenhum pedido.</div>;
  }

  return (
    <div className="px-5 py-4 pb-8 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display font-bold text-lg text-navy-900">Meus pedidos</h1>
        <span className="flex items-center gap-1 text-[10px] text-navy-900/40"><Wifi className="w-3 h-3" /> atualiza ao vivo</span>
      </div>
      {orders.map((o) => (
        <div key={o.id} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-navy-900">{o.pharmacy?.name}</p>
              <p className="text-xs text-navy-900/40">{new Date(o.createdAt).toLocaleString('pt-BR')}</p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusColor[o.status]}`}>{statusLabel[o.status]}</span>
          </div>
          <div className="mt-3 space-y-1">
            {o.items.map((i) => (
              <p key={i.id} className="text-xs text-navy-900/60">{i.quantity}x {i.product.name}</p>
            ))}
          </div>
          <p className="text-right font-display font-bold text-teal-600 mt-2">R$ {o.total.toFixed(2).replace('.', ',')}</p>
        </div>
      ))}
    </div>
  );
}
