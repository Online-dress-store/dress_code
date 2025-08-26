// Wishlist helpers
import { STORAGE_KEYS, getItem, setItem } from './storage.js';

export function getWishlist() { return getItem(STORAGE_KEYS.WISHLIST, []); }
export function setWishlist(list) { setItem(STORAGE_KEYS.WISHLIST, list); }

export function isWishlisted(productId) {
  return getWishlist().some(i => String(i.id) === String(productId));
}

export function addToWishlist(item) {
  const list = getWishlist();
  if (!isWishlisted(item.id)) {
    list.push(item);
    setWishlist(list);
  }
  return list;
}

export function removeFromWishlist(productId) {
  const next = getWishlist().filter(i => String(i.id) !== String(productId));
  setWishlist(next);
  return next;
}
