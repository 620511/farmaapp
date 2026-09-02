import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, Pill } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';

export default function Cart() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="px-5 py-16 text-center">
        <p className="text-navy-900/50">Seu carrinho está vazio.</p>
        <Link to="/app" className="inline-block mt-4 text-teal-600 font-semibold">Ver produtos</Link>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 pb-32">
      <h1 className="font-display font-bold text-lg text-navy-900 mb-4">Meu carrinho</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3">
            <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
              {item.product.imageUrl ? <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" /> : <Pill className="w-6 h-6 text-navy-900/20" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-navy-900">{item.product.name}</p>
              <p className="text-xs text-navy-900/50">{item.product.pharmacy?.name}</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3 bg-gray-50 rounded-full px-3 py-1">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="w-3.5 h-3.5" /></button>
                  <span className="text-xs font-semibold w-3 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="w-3.5 h-3.5" /></button>
                </div>
                <p className="text-sm font-bold text-teal-600">R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
            <button onClick={() => removeItem(item.id)} className="text-navy-900/30 shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-navy-900/50">Subtotal</p>
            <p className="font-display font-bold text-lg text-navy-900">R$ {subtotal.toFixed(2).replace('.', ',')}</p>
          </div>
          <button onClick={() => navigate('/app/checkout')} className="px-8 py-3 rounded-xl bg-brand-gradient text-white font-display font-semibold shadow-lg">
            Finalizar pedido
          </button>
        </div>
      </div>
    </div>
  );
}
