import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const GUEST_CART_KEY = 'fd_guest_cart'; // [{ productId, quantity }]

function readGuestCart() {
  try { return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]'); } catch { return []; }
}
function writeGuestCart(cart) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const wasLoggedIn = useRef(false);

  // Monta os itens do carrinho de convidado buscando os dados de cada produto
  const loadGuestItems = useCallback(async () => {
    const cart = readGuestCart();
    if (cart.length === 0) { setItems([]); return; }
    const results = await Promise.all(cart.map(async (c) => {
      try {
        const res = await api.get(`/products/${c.productId}`);
        return { id: c.productId, productId: c.productId, quantity: c.quantity, product: res.data };
      } catch { return null; }
    }));
    setItems(results.filter(Boolean));
  }, []);

  const refresh = useCallback(async () => {
    if (!user) { await loadGuestItems(); return; }
    try {
      const res = await api.get('/cart');
      setItems(res.data);
    } catch { setItems([]); }
  }, [user, loadGuestItems]);

  // Ao logar, transfere o que estava no carrinho de convidado pro carrinho da conta
  useEffect(() => {
    async function syncGuestCartOnLogin() {
      const guestCart = readGuestCart();
      if (guestCart.length > 0) {
        for (const item of guestCart) {
          try { await api.post('/cart', { productId: item.productId, quantity: item.quantity }); } catch { /* ignore */ }
        }
        writeGuestCart([]);
      }
      await refresh();
    }
    if (user && !wasLoggedIn.current) {
      wasLoggedIn.current = true;
      syncGuestCartOnLogin();
    } else if (!user) {
      wasLoggedIn.current = false;
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function addToCart(productId, quantity = 1) {
    if (!user) {
      const cart = readGuestCart();
      const existing = cart.find((c) => c.productId === productId);
      if (existing) existing.quantity += quantity;
      else cart.push({ productId, quantity });
      writeGuestCart(cart);
      await loadGuestItems();
      return;
    }
    await api.post('/cart', { productId, quantity });
    await refresh();
  }

  async function updateQuantity(id, quantity) {
    if (!user) {
      let cart = readGuestCart();
      if (quantity <= 0) cart = cart.filter((c) => c.productId !== id);
      else {
        const existing = cart.find((c) => c.productId === id);
        if (existing) existing.quantity = quantity;
      }
      writeGuestCart(cart);
      await loadGuestItems();
      return;
    }
    await api.put(`/cart/${id}`, { quantity });
    await refresh();
  }

  async function removeItem(id) {
    if (!user) {
      writeGuestCart(readGuestCart().filter((c) => c.productId !== id));
      await loadGuestItems();
      return;
    }
    await api.delete(`/cart/${id}`);
    await refresh();
  }

  async function clearCart() {
    if (!user) {
      writeGuestCart([]);
      setItems([]);
      return;
    }
    await api.delete('/cart');
    await refresh();
  }

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.quantity * i.product.price, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, addToCart, updateQuantity, removeItem, clearCart, refresh, isGuest: !user }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
