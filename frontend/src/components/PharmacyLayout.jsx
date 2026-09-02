import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, FileText, LogOut } from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function PharmacyLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <header className="bg-navy-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Logo size={30} textClass="text-white text-lg" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/60">{user?.name}</span>
            <button onClick={logout} className="text-white/70"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-6 flex gap-6 text-sm border-t border-white/10">
          {[
            { to: '/farmacia', label: 'Painel', icon: LayoutDashboard, end: true },
            { to: '/farmacia/produtos', label: 'Produtos', icon: Package },
            { to: '/farmacia/pedidos', label: 'Pedidos', icon: ClipboardList },
            { to: '/farmacia/receitas', label: 'Receitas', icon: FileText }
          ].map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `flex items-center gap-2 py-3 border-b-2 ${isActive ? 'border-teal-400 text-white' : 'border-transparent text-white/50'}`}>
              <item.icon className="w-4 h-4" />{item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
