// Cart helpers
import { STORAGE_KEYS, getItem, setItem } from './storage.js';

export function getCart() {
  return getItem(STORAGE_KEYS.CART, []);
}

export function setCart(cart) {
  setItem(STORAGE_KEYS.CART, cart);
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
  return cart;
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
