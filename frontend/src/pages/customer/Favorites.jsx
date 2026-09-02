import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pill, Plus } from 'lucide-react';
import api from '../../api/client.js';
import { useCart } from '../../context/CartContext.jsx';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => { api.get('/favorites').then((r) => setFavorites(r.data)); }, []);

  if (favorites.length === 0) {
    return <div className="px-5 py-16 text-center text-navy-900/50">Você ainda não tem favoritos.</div>;
  }

  return (
    <div className="px-5 py-4 pb-8">
      <h1 className="font-display font-bold text-lg text-navy-900 mb-4">Favoritos</h1>
      <div className="grid grid-cols-2 gap-3">
        {favorites.map((f) => (
          <div key={f.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <Link to={`/app/produto/${f.product.id}`} className="block h-24 bg-gray-50 flex items-center justify-center overflow-hidden">
              {f.product.imageUrl ? <img src={f.product.imageUrl} alt={f.product.name} className="w-full h-full object-cover" /> : <Pill className="w-8 h-8 text-navy-900/20" />}
            </Link>
            <div className="p-3">
              <p className="text-xs font-semibold text-navy-900 leading-tight">{f.product.name}</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-sm font-bold text-teal-600">R$ {f.product.price.toFixed(2).replace('.', ',')}</p>
                <button onClick={() => addToCart(f.product.id)} className="w-7 h-7 rounded-full bg-navy-900 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
