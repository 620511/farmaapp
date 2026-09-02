import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Home as HomeIcon, ClipboardList, Heart, User, LogOut, LogIn } from 'lucide-react';
import Logo from './Logo.jsx';
import ChatWidget from './ChatWidget.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function CustomerLayout() {
  const { count } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-body">
      <header className="bg-brand-gradient text-white sticky top-0 z-20 safe-top">
        <div className="max-w-3xl mx-auto px-5 pt-4 pb-3">
          <div className="flex justify-between items-center">
            <button onClick={() => navigate('/app')}><Logo size={30} textClass="text-white text-lg" /></button>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/app/carrinho')} className="relative bg-white/15 rounded-full p-2.5">
                <ShoppingCart className="w-5 h-5" />
                {count > 0 && <span className="absolute -top-1 -right-1 bg-coral-500 text-[10px] w-5 h-5 rounded-full flex items-center justify-center">{count}</span>}
              </button>
              {user ? (
                <button onClick={logout} className="bg-white/15 rounded-full p-2.5" title="Sair">
                  <LogOut className="w-5 h-5" />
                </button>
              ) : (
                <Link to="/login" className="bg-white/15 rounded-full p-2.5" title="Entrar">
                  <LogIn className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
          {user ? (
            <p className="text-sm font-display font-semibold mt-3">Bem-vindo(a), {user.name?.split(' ')[0]}!</p>
          ) : (
            <p className="text-sm mt-3">
              Explorando como visitante — <Link to="/login" className="underline font-semibold">entrar</Link> ou <Link to="/register" className="underline font-semibold">criar conta</Link>
            </p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 safe-bottom">
        <div className="max-w-3xl mx-auto grid grid-cols-4 text-[11px]">
          {[
            { to: '/app', label: 'Início', icon: HomeIcon, end: true },
            { to: '/app/pedidos', label: 'Pedidos', icon: ClipboardList },
            { to: '/app/favoritos', label: 'Favoritos', icon: Heart },
            { to: '/app/conta', label: 'Conta', icon: User }
          ].map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 ${isActive ? 'text-teal-600' : 'text-navy-900/40'}`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <ChatWidget />
    </div>
  );
}
