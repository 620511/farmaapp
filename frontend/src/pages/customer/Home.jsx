import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Pill, Droplet, Beaker, FlaskConical, HeartPulse, Plus, FileText, Sparkles } from 'lucide-react';
import api from '../../api/client.js';
import { useCart } from '../../context/CartContext.jsx';

const iconByCategory = {
  Medicamentos: Pill,
  Higiene: Droplet,
  Beleza: Beaker,
  Vitaminas: FlaskConical,
  Cuidados: HeartPulse
};

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [search, setSearch] = useState('');
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data));
    api.get('/products', { params: { onOffer: 'true' } }).then((r) => setOffers(r.data));
    api.get('/products/recommendations').then((r) => setRecommendations(r.data)).catch(() => setRecommendations([]));
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/app/categorias?search=${encodeURIComponent(search)}`);
  }

  function discountPct(p) {
    if (!p.originalPrice) return null;
    return Math.round(100 - (p.price / p.originalPrice) * 100);
  }

  return (
    <div>
      <div className="px-5 -mt-1 pb-4">
        <form onSubmit={handleSearch} className="bg-white rounded-xl flex items-center gap-2 px-4 py-3 shadow-sm border border-gray-100">
          <Search className="w-4 h-4 text-navy-900/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar medicamentos, produtos..."
            className="flex-1 text-sm outline-none placeholder:text-navy-900/40" />
        </form>
      </div>

      <div className="px-5">
        <div className="bg-gradient-to-br from-navy-800 to-teal-500 rounded-2xl p-5 text-white">
          <p className="font-display font-bold text-lg leading-snug">Saúde e bem-estar para você e sua família!</p>
          <p className="text-sm opacity-85 mt-1">Entrega rápida na sua região.</p>
        </div>
      </div>

      <div className="px-5 mt-4">
        <Link to="/app/receita" className="flex items-center gap-3 bg-white border border-teal-100 rounded-2xl p-4 shadow-sm">
          <div className="w-11 h-11 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-display font-semibold text-navy-900 text-sm flex items-center gap-1">Enviar receita médica <Sparkles className="w-3.5 h-3.5 text-teal-500" /></p>
            <p className="text-xs text-navy-900/50">Nossa IA lê a receita e te orienta — farmacêutico confirma tudo antes da entrega.</p>
          </div>
        </Link>
      </div>

      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display font-semibold text-navy-900">Categorias</p>
          <Link to="/app/categorias" className="text-teal-600 text-sm font-medium">Ver todas</Link>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {categories.map((c) => {
            const Icon = iconByCategory[c.name] || Pill;
            return (
              <Link key={c.id} to={`/app/categorias?categoryId=${c.id}`} className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-navy-900/70 text-center leading-tight">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="px-5 mt-7">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="w-4 h-4 text-teal-500" />
            <p className="font-display font-semibold text-navy-900">Recomendado pra você</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {recommendations.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden shrink-0 w-32">
                <Link to={`/app/produto/${p.id}`} className="block h-20 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <Pill className="w-7 h-7 text-navy-900/20" />}
                </Link>
                <div className="p-2">
                  <Link to={`/app/produto/${p.id}`}>
                    <p className="text-[11px] font-semibold text-navy-900 leading-tight line-clamp-2">{p.name}</p>
                  </Link>
                  <div className="flex items-end justify-between mt-1.5">
                    <p className="text-xs font-bold text-teal-600">R$ {p.price.toFixed(2).replace('.', ',')}</p>
                    <button onClick={() => addToCart(p.id)} className="w-5 h-5 rounded-full bg-navy-900 text-white flex items-center justify-center shrink-0">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-5 mt-7 pb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display font-semibold text-navy-900">Ofertas especiais</p>
          <Link to="/app/categorias?onOffer=true" className="text-teal-600 text-sm font-medium">Ver todas</Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {offers.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden relative">
              {discountPct(p) && (
                <span className="absolute top-2 left-2 bg-coral-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">-{discountPct(p)}%</span>
              )}
              <Link to={`/app/produto/${p.id}`} className="block h-20 bg-gray-50 flex items-center justify-center overflow-hidden">
                {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <Pill className="w-8 h-8 text-navy-900/20" />}
              </Link>
              <div className="p-2.5">
                <Link to={`/app/produto/${p.id}`}>
                  <p className="text-xs font-semibold text-navy-900 leading-tight line-clamp-2">{p.name}</p>
                  <p className="text-[10px] text-navy-900/50 mt-0.5">{p.description}</p>
                </Link>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    {p.originalPrice && <p className="text-[10px] text-navy-900/40 line-through">R$ {p.originalPrice.toFixed(2).replace('.', ',')}</p>}
                    <p className="text-sm font-bold text-teal-600">R$ {p.price.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <button onClick={() => addToCart(p.id)} className="w-6 h-6 rounded-full bg-navy-900 text-white flex items-center justify-center shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
