// Wishlist helpers
import { STORAGE_KEYS, getItem, setItem } from './storage.js';

async function fetchCurrentUser() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch (_) { return null; }
}

async function loadServerWishlistIfLoggedIn() {
  const user = await fetchCurrentUser();
  if (!user) return null;
  try {
    const res = await fetch('/api/auth/wishlist', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    setItem(STORAGE_KEYS.WISHLIST, data.wishlist || []);
    return data.wishlist || [];
  } catch (_) { return null; }
}

async function saveServerWishlistIfLoggedIn(list) {
  const user = await fetchCurrentUser();
  if (!user) return;
  try {
    await fetch('/api/auth/wishlist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ wishlist: list })
    });
  } catch (_) {}
}

export function getWishlist() { return getItem(STORAGE_KEYS.WISHLIST, []); }
export function setWishlist(list) { setItem(STORAGE_KEYS.WISHLIST, list); }
export async function hydrateWishlistFromServer() { await loadServerWishlistIfLoggedIn(); }

export function isWishlisted(productId) {
  return getWishlist().some(i => String(i.id) === String(productId));
}

export function addToWishlist(item) {
  const list = getWishlist();
  if (!isWishlisted(item.id)) {
    list.push(item);
    setWishlist(list);
    saveServerWishlistIfLoggedIn(list);
    try { window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: { wishlist: list } })); } catch (_) {}
  }
  return list;
}

export function removeFromWishlist(productId) {
  const next = getWishlist().filter(i => String(i.id) !== String(productId));
  setWishlist(next);
  saveServerWishlistIfLoggedIn(next);
  try { window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: { wishlist: next } })); } catch (_) {}
  return next;
}
