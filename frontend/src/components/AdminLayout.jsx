import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Store, Tags, Users, Settings as SettingsIcon, LogOut } from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminLayout() {
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
            { to: '/admin', label: 'Painel', icon: LayoutDashboard, end: true },
            { to: '/admin/farmacias', label: 'Farmácias', icon: Store },
            { to: '/admin/categorias', label: 'Categorias', icon: Tags },
            { to: '/admin/usuarios', label: 'Usuários', icon: Users },
            { to: '/admin/configuracoes', label: 'Configurações', icon: SettingsIcon }
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
