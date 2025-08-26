// Storage helpers and keys (ES module)
export const STORAGE_KEYS = {
  CART: 'cart',
  WISHLIST: 'wishlist',
  LAST_ORDER: 'lastOrder',
};

export function getItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
}

export function removeItem(key) {
  try { localStorage.removeItem(key); } catch (_) {}
}
