import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pill, Minus, Plus, Heart, ShieldCheck } from 'lucide-react';
import api from '../../api/client.js';
import { useCart } from '../../context/CartContext.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => { api.get(`/products/${id}`).then((r) => setProduct(r.data)); }, [id]);

  async function handleFavorite() {
    await api.post('/favorites', { productId: id });
  }

  async function handleAdd() {
    await addToCart(id, qty);
    navigate('/app/carrinho');
  }

  if (!product) return <div className="p-5 text-center text-navy-900/40">Carregando...</div>;

  return (
    <div className="pb-6">
      <div className="h-56 bg-gray-50 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <Pill className="w-16 h-16 text-navy-900/20" />}
      </div>
      <div className="px-5 -mt-4 bg-white rounded-t-2xl relative pt-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-teal-600 font-semibold">{product.category?.name}</p>
            <h1 className="font-display font-bold text-lg text-navy-900 mt-0.5">{product.name}</h1>
            <p className="text-sm text-navy-900/50 mt-1">{product.description}</p>
          </div>
          <button onClick={handleFavorite} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 text-coral-500" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-4">
          {product.originalPrice && <p className="text-sm text-navy-900/40 line-through">R$ {product.originalPrice.toFixed(2).replace('.', ',')}</p>}
          <p className="text-2xl font-display font-bold text-teal-600">R$ {product.price.toFixed(2).replace('.', ',')}</p>
        </div>

        {product.requiresRx && (
          <div className="mt-3 flex items-center gap-2 bg-amber-50 text-amber-700 text-xs px-3 py-2 rounded-lg">
            <ShieldCheck className="w-4 h-4" /> Este produto exige receita médica.
          </div>
        )}

        <div className="flex items-center gap-4 mt-6">
          <p className="text-sm font-medium text-navy-900">Quantidade</p>
          <div className="flex items-center gap-3 bg-gray-50 rounded-full px-3 py-1.5">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="w-4 h-4" /></button>
            <span className="text-sm font-semibold w-4 text-center">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)}><Plus className="w-4 h-4" /></button>
          </div>
        </div>

        <button onClick={handleAdd} className="mt-8 w-full py-3.5 rounded-xl bg-brand-gradient text-white font-display font-semibold shadow-lg">
          Adicionar ao carrinho — R$ {(product.price * qty).toFixed(2).replace('.', ',')}
        </button>
      </div>
    </div>
  );
}
