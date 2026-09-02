import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CreditCard, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import api from '../../api/client.js';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdOrders, setCreatedOrders] = useState(null);
  const [paying, setPaying] = useState(false);

  async function handleCreateOrder(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/orders', { deliveryStreet: street, deliveryCity: city });
      setCreatedOrders(res.data);
      await clearCart();
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível fechar o pedido.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(order) {
    setPaying(true);
    setError('');
    try {
      const res = await api.post('/payments/preference', { orderId: order.id });
      const url = res.data.initPoint || res.data.sandboxInitPoint;
      if (url) window.location.href = url;
    } catch (err) {
      setError(err.response?.data?.error || 'Pagamento online indisponível no momento. Você pode combinar o pagamento na entrega com a farmácia.');
    } finally {
      setPaying(false);
    }
  }

  if (createdOrders) {
    const grandTotal = createdOrders.reduce((s, o) => s + o.total, 0);
    return (
      <div className="px-5 py-4 pb-8">
        <h1 className="font-display font-bold text-lg text-navy-900 mb-1">Pedido criado!</h1>
        <p className="text-sm text-navy-900/50 mb-4">Escolha como pagar pra confirmar com a farmácia.</p>

        {createdOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <p className="text-sm font-semibold text-navy-900">{order.pharmacy?.name}</p>
            <div className="mt-2 space-y-1 text-sm text-navy-900/60">
              <div className="flex justify-between"><span>Subtotal</span><span>R$ {order.subtotal.toFixed(2).replace('.', ',')}</span></div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Entrega{order.distanceKm ? ` (${order.distanceKm.toFixed(1)} km)` : ''}</span>
                <span>{order.deliveryFee === 0 ? 'Grátis' : `R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}`}</span>
              </div>
              <div className="flex justify-between font-display font-bold text-navy-900 pt-1 border-t border-gray-100"><span>Total</span><span>R$ {order.total.toFixed(2).replace('.', ',')}</span></div>
            </div>
            <button disabled={paying} onClick={() => handlePay(order)}
              className="mt-3 w-full py-3 rounded-xl bg-brand-gradient text-white font-display font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} Pagar com Mercado Pago
            </button>
          </div>
        ))}

        {error && <p className="bg-amber-50 text-amber-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</p>}

        <button onClick={() => navigate('/app/pedidos')} className="w-full py-3 rounded-xl border-2 border-navy-900 text-navy-900 font-display font-semibold">
          Pagar na entrega e ir para meus pedidos
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 pb-8">
      <h1 className="font-display font-bold text-lg text-navy-900 mb-4">Finalizar pedido</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-sm font-semibold text-navy-900 mb-3">Endereço de entrega</p>
        <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua, número, bairro"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 mb-3" />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <p className="text-xs text-navy-900/40 mt-2">O frete é calculado pela distância real até a farmácia depois de confirmar o endereço.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mt-4">
        <p className="text-sm font-semibold text-navy-900 mb-3">Resumo</p>
        {items.map((i) => (
          <div key={i.id} className="flex justify-between text-sm text-navy-900/70 py-1">
            <span>{i.quantity}x {i.product.name}</span>
            <span>R$ {(i.product.price * i.quantity).toFixed(2).replace('.', ',')}</span>
          </div>
        ))}
        <div className="flex justify-between font-display font-bold text-navy-900 pt-2 border-t border-gray-100 mt-2">
          <span>Subtotal</span><span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {error && <p className="bg-red-50 text-coral-500 text-sm rounded-lg px-3 py-2 mt-4">{error}</p>}

      <button disabled={loading || !street || !city} onClick={handleCreateOrder}
        className="mt-6 w-full py-3.5 rounded-xl bg-brand-gradient text-white font-display font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {loading ? 'Calculando frete...' : 'Confirmar endereço e ver frete'}
      </button>
    </div>
  );
}
