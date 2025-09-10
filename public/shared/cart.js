// Cart helpers
import { STORAGE_KEYS, getItem, setItem } from './storage.js';

async function fetchCurrentUser() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch (_) { return null; }
}

async function loadServerCartIfLoggedIn() {
  const user = await fetchCurrentUser();
  if (!user) return null;
  try {
    const res = await fetch('/api/auth/cart', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    // keep local cache in sync so existing UI works
    setItem(STORAGE_KEYS.CART, data.cart || []);
    return data.cart || [];
  } catch (_) { return null; }
}

async function saveServerCartIfLoggedIn(cart) {
  const user = await fetchCurrentUser();
  if (!user) return;
  try {
    await fetch('/api/auth/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ cart })
    });
  } catch (_) {}
}

export function getCart() { return getItem(STORAGE_KEYS.CART, []); }

// hydrate cart from server (call on app/page load after auth)
export async function hydrateCartFromServer() {
  await loadServerCartIfLoggedIn();
}

export function setCart(cart) {
  setItem(STORAGE_KEYS.CART, cart);
  // fire and forget server sync
  saveServerCartIfLoggedIn(cart);
  try {
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { cart } }));
  } catch (_) {}
}

export function cartCount() {
  const cart = getCart();
  return cart.reduce((sum, i) => sum + (i.quantity || 1), 0);
}

export function isInCart(productId, size = null) {
  const cart = getCart();
  return cart.some(i => String(i.id) === String(productId) && (size ? i.size === size : true));
}

export function addToCart(item, stock = Infinity) {
  const cart = getCart();
  const idx = cart.findIndex(i => String(i.id) === String(item.id) && i.size === item.size);
  if (idx !== -1) {
    const nextQty = Math.min(stock, (cart[idx].quantity || 1) + (item.quantity || 1));
    cart[idx].quantity = nextQty;
  } else {
    cart.push({ ...item, quantity: Math.min(stock, item.quantity || 1) });
  }
  setCart(cart);
  
  // Log add-to-cart activity
  logAddToCartActivity(item);
  
  return cart;
}

// Log add-to-cart activity to server
async function logAddToCartActivity(item) {
  try {
    const user = await fetchCurrentUser();
    if (!user) return; // Only log for authenticated users
    
    await fetch('/api/admin/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: user.username,
        activity: 'add-to-cart'
      })
    });
  } catch (error) {
    // Silently fail - don't interrupt cart functionality
    console.warn('Failed to log add-to-cart activity:', error);
  }
}

export function removeFromCart(productId, size = null) {
  const cart = getCart().filter(i => !(String(i.id) === String(productId) && (size ? i.size === size : true)));
  setCart(cart);
  return cart;
}

export function updateQuantity(productId, size, quantity, stock = 99) {
  const cart = getCart();
  const item = cart.find(i => String(i.id) === String(productId) && i.size === size);
  if (item) {
    item.quantity = Math.max(1, Math.min(stock, parseInt(quantity || 1, 10)));
    setCart(cart);
  }
  return cart;
}

export function totals() {
  const cart = getCart();
  const subtotal = cart.reduce((s, i) => s + (Number(i.price) * (i.quantity || 1)), 0);
  const shipping = subtotal > 0 ? 9.99 : 0;
  const total = subtotal + shipping;
  return { subtotal, shipping, total };
}
