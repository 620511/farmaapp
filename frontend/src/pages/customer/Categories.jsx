import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Pill, Plus } from 'lucide-react';
import api from '../../api/client.js';
import { useCart } from '../../context/CartContext.jsx';

export default function Categories() {
  const [params] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(params.get('categoryId') || '');
  const { addToCart } = useCart();

  useEffect(() => { api.get('/categories').then((r) => setCategories(r.data)); }, []);

  useEffect(() => {
    const query = {};
    if (activeCategory) query.categoryId = activeCategory;
    if (params.get('search')) query.search = params.get('search');
    if (params.get('onOffer')) query.onOffer = params.get('onOffer');
    api.get('/products', { params: query }).then((r) => setProducts(r.data));
  }, [activeCategory, params]);

  return (
    <div className="px-5 py-4">
      <h1 className="font-display font-bold text-lg text-navy-900 mb-4">Produtos</h1>
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
        <button onClick={() => setActiveCategory('')} className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold ${!activeCategory ? 'bg-navy-900 text-white' : 'bg-white border border-gray-200 text-navy-900/70'}`}>Todas</button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold ${activeCategory === c.id ? 'bg-navy-900 text-white' : 'bg-white border border-gray-200 text-navy-900/70'}`}>{c.name}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <Link to={`/app/produto/${p.id}`} className="block h-24 bg-gray-50 flex items-center justify-center overflow-hidden">
              {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <Pill className="w-8 h-8 text-navy-900/20" />}
            </Link>
            <div className="p-3">
              <Link to={`/app/produto/${p.id}`}>
                <p className="text-xs font-semibold text-navy-900 leading-tight line-clamp-2">{p.name}</p>
                <p className="text-[10px] text-navy-900/50 mt-0.5">{p.pharmacy?.name}</p>
              </Link>
              <div className="flex items-end justify-between mt-2">
                <div>
                  {p.originalPrice && <p className="text-[10px] text-navy-900/40 line-through">R$ {p.originalPrice.toFixed(2).replace('.', ',')}</p>}
                  <p className="text-sm font-bold text-teal-600">R$ {p.price.toFixed(2).replace('.', ',')}</p>
                </div>
                <button onClick={() => addToCart(p.id)} className="w-7 h-7 rounded-full bg-navy-900 text-white flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="col-span-2 text-center text-sm text-navy-900/40 py-10">Nenhum produto encontrado.</p>}
      </div>
    </div>
  );
}
