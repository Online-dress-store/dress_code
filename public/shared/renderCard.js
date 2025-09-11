// Product card renderer
import { isWishlisted, addToWishlist, removeFromWishlist } from './wishlist.js';
import { isInCart, addToCart } from './cart.js';

export function renderProductCard(product, { onQuickView, onCartChange } = {}) {
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <div class="card-image">
      <img src="${product.images.main}" alt="${product.title}" loading="lazy">
      <div class="card-overlay">
        <button class="quick-view-btn" data-product-id="${product.id}" data-tooltip="View product details and accessories">Quick View</button>
      </div>
      <button class="wishlist-btn ${isWishlisted(product.id) ? 'active' : ''}" data-product-id="${product.id}" data-tooltip="${isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}">
        <i class="ri-heart-${isWishlisted(product.id) ? 'fill' : 'line'}"></i>
      </button>
    </div>
    <div class="card-content">
      <h3 class="card-title">${product.title}</h3>
      <p class="card-description">${product.description}</p>
      <div class="card-meta">
        <span class="card-category">${product.category}</span>
        <span class="card-price">$${product.price.toFixed(2)}</span>
      </div>
      <div class="card-actions">
        <button class="add-to-cart-btn ${isInCart(product.id) ? 'in-cart' : ''}" data-product-id="${product.id}" data-tooltip="${isInCart(product.id) ? 'Remove from cart' : 'Add to cart'}">
          ${isInCart(product.id) ? 'In Cart' : 'Add to Cart'}
        </button>
      </div>
    </div>`;

  // Events
  const qv = el.querySelector('.quick-view-btn');
  if (qv) qv.addEventListener('click', () => onQuickView && onQuickView(product));

  const wishBtn = el.querySelector('.wishlist-btn');
  if (wishBtn) wishBtn.addEventListener('click', () => {
    if (isWishlisted(product.id)) {
      removeFromWishlist(product.id);
      wishBtn.classList.remove('active');
      wishBtn.querySelector('i').className = 'ri-heart-line';
    } else {
      addToWishlist({ id: product.id, title: product.title, price: product.price, image: product.images.main });
      wishBtn.classList.add('active');
      wishBtn.querySelector('i').className = 'ri-heart-fill';
    }
  });

  const cartBtn = el.querySelector('.add-to-cart-btn');
  if (cartBtn) cartBtn.addEventListener('click', () => onCartChange && onCartChange(product, cartBtn));

  return el;
}

// Legacy function for categories page compatibility
export function createProductCard(product) {
  return renderProductCard(product, {
    onQuickView: (product) => {
      // This will be handled by the categories page
      const event = new CustomEvent('quickView', { detail: { product } });
      document.dispatchEvent(event);
    },
    onCartChange: (product, button) => {
      // This will be handled by the categories page
      const event = new CustomEvent('cartChange', { detail: { product, button } });
      document.dispatchEvent(event);
    }
  });
}
