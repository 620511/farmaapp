import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Privacy from './pages/Privacy.jsx';

import CustomerLayout from './components/CustomerLayout.jsx';
import Home from './pages/customer/Home.jsx';
import Categories from './pages/customer/Categories.jsx';
import ProductDetail from './pages/customer/ProductDetail.jsx';
import Cart from './pages/customer/Cart.jsx';
import Checkout from './pages/customer/Checkout.jsx';
import Orders from './pages/customer/Orders.jsx';
import Favorites from './pages/customer/Favorites.jsx';
import Account from './pages/customer/Account.jsx';
import Prescription from './pages/customer/Prescription.jsx';

import PharmacyLayout from './components/PharmacyLayout.jsx';
import PharmacyDashboard from './pages/pharmacy/Dashboard.jsx';
import PharmacyProducts from './pages/pharmacy/Products.jsx';
import PharmacyOrders from './pages/pharmacy/Orders.jsx';
import PharmacyPrescriptions from './pages/pharmacy/Prescriptions.jsx';

import AdminLayout from './components/AdminLayout.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminPharmacies from './pages/admin/Pharmacies.jsx';
import AdminCategories from './pages/admin/Categories.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminSettings from './pages/admin/Settings.jsx';

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-navy-900">Carregando...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/privacidade" element={<Privacy />} />

      {/* /app é navegável sem login (modo convidado); só as ações que exigem
          identidade do cliente (checkout, pedidos, favoritos, conta, receita)
          pedem login individualmente. */}
      <Route path="/app" element={<CustomerLayout />}>
        <Route index element={<Home />} />
        <Route path="categorias" element={<Categories />} />
        <Route path="produto/:id" element={<ProductDetail />} />
        <Route path="carrinho" element={<Cart />} />
        <Route path="checkout" element={<Protected role="CUSTOMER"><Checkout /></Protected>} />
        <Route path="pedidos" element={<Protected role="CUSTOMER"><Orders /></Protected>} />
        <Route path="favoritos" element={<Protected role="CUSTOMER"><Favorites /></Protected>} />
        <Route path="conta" element={<Protected role="CUSTOMER"><Account /></Protected>} />
        <Route path="receita" element={<Protected role="CUSTOMER"><Prescription /></Protected>} />
      </Route>

      <Route path="/farmacia" element={<Protected role="PHARMACY"><PharmacyLayout /></Protected>}>
        <Route index element={<PharmacyDashboard />} />
        <Route path="produtos" element={<PharmacyProducts />} />
        <Route path="pedidos" element={<PharmacyOrders />} />
        <Route path="receitas" element={<PharmacyPrescriptions />} />
      </Route>

      <Route path="/admin" element={<Protected role="ADMIN"><AdminLayout /></Protected>}>
        <Route index element={<AdminDashboard />} />
        <Route path="farmacias" element={<AdminPharmacies />} />
        <Route path="categorias" element={<AdminCategories />} />
        <Route path="usuarios" element={<AdminUsers />} />
        <Route path="configuracoes" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
