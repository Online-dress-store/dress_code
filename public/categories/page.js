// Category page functionality - ES Module
import Modal from "../shared/modal.js";
import { fetchProducts } from "../shared/api.js";
import { isAuthenticated, currentUser, checkAuthStatus } from "../shared/auth.js";
import { 
  isInCart, 
  isInCartWithSize, 
  addToCartWithSizeAndStock, 
  removeFromCartWithSize,
  updateCartCounter 
} from "../shared/cart.js";
import { 
  isInWishlist, 
  addToWishlist, 
  removeFromWishlist, 
  updateWishlistCounter 
} from "../shared/wishlist.js";
import { createProductCard } from "../shared/renderCard.js";
import { showNotLoggedInMessage, showMessage } from "../shared/dom.js";

let allProducts = [];
let popup = null;
let modal = null;

document.addEventListener('DOMContentLoaded', async function() {
  // Initialize popup and modal
  popup = new Popup();
  modal = new Modal();
  
  // Check authentication first
  await checkAuthStatus();
  
  // Make popup available globally for shared modules
  window.popup = popup;
  
  // Read category from query string
  const params = new URLSearchParams(location.search);
  const slug = (params.get('cat') || 'all-items').toLowerCase();
  
  // Map slug to pretty title
  function titleize(s) {
    return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  
  // Set document title
  document.title = `DRESS code – ${titleize(slug)}`;
  
  // Set category title
  const catTitle = document.getElementById('catTitle');
  catTitle.textContent = titleize(slug);
  
  // Set category subtitle
  const catSubtitle = document.getElementById('catSubtitle');
  if (slug === 'sale') {
    catSubtitle.textContent = 'Discover our best offers';
  } else {
    catSubtitle.textContent = `Explore our latest ${titleize(slug)} looks`;
  }
  
  // Handle navigation state
  if (!params.get('cat')) {
    // If no cat parameter, push state to make links consistent
    const newUrl = `${location.pathname}?cat=all-items`;
    history.pushState({}, '', newUrl);
  }
  
  // Set up sort functionality
  setupSorting();
  
  // Load products and render
  loadProducts().then(() => {
    filterAndRenderProducts(slug);
  });
  
  // Set up modal event delegation
  setupModalEventDelegation();
});



// Set up sorting functionality
function setupSorting() {
  const sortSelect = document.querySelector('.sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      const currentCategory = new URLSearchParams(location.search).get('cat') || 'all-items';
      filterAndRenderProducts(currentCategory);
    });
  }
}

// Load products from JSON file
async function loadProducts() {
  try {
    allProducts = await fetchProducts();
    console.log('Products loaded:', allProducts.length);
  } catch (error) {
    console.error('Error loading products:', error);
    allProducts = [];
  }
}

// Sort products based on selected option
function sortProducts(products) {
  const sortSelect = document.querySelector('.sort-select');
  const sortBy = sortSelect ? sortSelect.value : 'newest';
  
  const sortedProducts = [...products];
  
  switch (sortBy) {
    case 'newest':
      // Sort by creation date (newest first)
      sortedProducts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      break;
    case 'price-low':
      // Sort by price (low to high)
      sortedProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      // Sort by price (high to low)
      sortedProducts.sort((a, b) => b.price - a.price);
      break;
    case 'name':
      // Sort by name (A-Z)
      sortedProducts.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }
  
  return sortedProducts;
}

// Filter products by category and render
function filterAndRenderProducts(categorySlug) {
  let filteredProducts = [];
  
  // Map category slugs to actual categories in the JSON
  const categoryMap = {
    'all-items': null, // Show all products
    'new-in': 'new', // Could be filtered by date
    'sale': 'sale', // Could be filtered by price or sale flag
    'vacation': 'Vacation',
    'evening': 'Evening',
    'summer': 'Summer',
    'everyday': 'Everyday'
  };
  
  const targetCategory = categoryMap[categorySlug];
  
  if (targetCategory === null) {
    // Show all products for "all-items"
    filteredProducts = allProducts;
  } else if (targetCategory === 'new') {
    // Show products created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    filteredProducts = allProducts.filter(product => 
      new Date(product.createdAt) > thirtyDaysAgo
    );
  } else if (targetCategory === 'sale') {
    // Show products with sale pricing (for now, show first 2 products as "sale")
    filteredProducts = allProducts.slice(0, 2);
  } else {
    // Filter by exact category match
    filteredProducts = allProducts.filter(product => 
      product.category.toLowerCase() === targetCategory.toLowerCase()
    );
  }
  
  // Sort the filtered products
  filteredProducts = sortProducts(filteredProducts);
  
  console.log(`Filtered and sorted ${filteredProducts.length} products for category: ${categorySlug}`);
  renderProducts(filteredProducts);
}



// Add to cart (now requires size selection)
function addToCart(product) {
  if (!isAuthenticated) {
    showNotLoggedInMessage('Please log in to add items to your cart');
    return;
  }
  
  // Check if product has variants/sizes
  if (!product.variants || product.variants.length === 0) {
    showMessage('This product has no available sizes', 'error');
    return;
  }
  
  // Show size selection modal
  showSizeSelectionModal(product);
}

// Show size selection modal
function showSizeSelectionModal(product) {
  const modalContent = createSizeSelectionContent(product);
  const modalInstance = modal.createModal(modalContent, {
    title: `Select Size - ${product.title}`,
    size: 'small',
    className: 'size-selection-modal',
    onClose: () => {
      // When modal is closed without adding item, reset the product card state
      resetProductCardState(product.id);
    }
  });
  
  // Store the product that triggered this modal for reference
  modalInstance.dataset.productId = product.id;
}

// Create size selection modal content
function createSizeSelectionContent(product) {
  const availableSizes = product.variants.filter(variant => variant.stock > 0);
  const outOfStockSizes = product.variants.filter(variant => variant.stock === 0);
  
  return `
    <div class="size-selection-container">
      <div class="size-selection-info">
        <p>Please select a size to add this item to your cart.</p>
      </div>
      
      <div class="size-selection-options">
        <label class="size-selection-label">Available Sizes:</label>
        <div class="size-options-grid">
          ${availableSizes.map(variant => `
            <button class="size-option-btn available" 
                    data-size="${variant.size}" 
                    data-stock="${variant.stock}"
                    data-product-id="${product.id}">
              <span class="size-text">${variant.size}</span>
              <span class="stock-info">${variant.stock} in stock</span>
            </button>
          `).join('')}
        </div>
        
        ${outOfStockSizes.length > 0 ? `
          <label class="size-selection-label out-of-stock-label">Out of Stock:</label>
          <div class="size-options-grid">
            ${outOfStockSizes.map(variant => `
              <button class="size-option-btn out-of-stock" disabled>
                <span class="size-text">${variant.size}</span>
                <span class="stock-info">Out of stock</span>
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
      
      <div class="size-selection-actions">
        <button class="size-selection-cancel" id="size-selection-cancel">
          Cancel
        </button>
      </div>
    </div>
  `;
}



// Quick View functionality
function showQuickView(product) {
  const modalContent = createQuickViewContent(product);
  modal.createModal(modalContent, {
    title: product.title,
    size: 'medium',
    className: 'quick-view-modal'
  });
}

// Create Quick View modal content
function createQuickViewContent(product) {
  // Get available sizes from variants
  const availableSizes = product.variants ? product.variants.filter(variant => variant.stock > 0) : [];
  const selectedSize = availableSizes.length > 0 ? availableSizes[0].size : null;
  const isInCartWithSize = selectedSize ? isInCartWithSize(product.id, selectedSize) : false;
  
  return `
    <div class="quick-view-container">
      <div class="quick-view-image">
        <img src="${product.images.main}" alt="${product.title}" loading="lazy">
      </div>
      
      <div class="quick-view-details">
        <h3 class="quick-view-title">${product.title}</h3>
        <p class="quick-view-description">${product.description}</p>
        
        <div class="quick-view-meta">
          <span class="quick-view-category">${product.category}</span>
          <span class="quick-view-price">$${product.price.toFixed(2)}</span>
        </div>
        
        ${availableSizes.length > 0 ? `
          <div class="quick-view-size-section">
            <label for="size-select" class="size-label">Size *</label>
            <div class="size-options">
              ${availableSizes.map(variant => `
                <button class="size-option ${selectedSize === variant.size ? 'selected' : ''}" 
                        data-size="${variant.size}" 
                        data-product-id="${product.id}"
                        data-stock="${variant.stock}">
                  ${variant.size}
                  <span class="stock-indicator">${variant.stock} left</span>
                </button>
              `).join('')}
            </div>
            <div class="size-error" id="size-error" style="display: none;">
              Please select a size
            </div>
          </div>
        ` : ''}
        
        <div class="quick-view-actions">
          <button class="quick-view-primary-btn ${isInCartWithSize ? 'remove' : 'add'}" 
                  id="quick-view-action-btn"
                  data-product-id="${product.id}"
                  data-size="${selectedSize || ''}">
            ${isInCartWithSize ? 'Remove from Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// Check if product with specific size is in cart
function isInCartWithSize(productId, size) {
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    return cart.some(item => item.id === productId && item.size === size);
  } catch (error) {
    return false;
  }
}



// Show size error
function showSizeError() {
  const sizeError = document.getElementById('size-error');
  if (sizeError) {
    sizeError.style.display = 'block';
  }
}

// Hide size error
function hideSizeError() {
  const sizeError = document.getElementById('size-error');
  if (sizeError) {
    sizeError.style.display = 'none';
  }
}

// Set up modal event delegation
function setupModalEventDelegation() {
  // Track which product triggered the size selection modal
  let currentSizeSelectionProduct = null;
  
  document.addEventListener('click', function(event) {
    // Handle size selection in Quick View
    if (event.target.classList.contains('size-option')) {
      const size = event.target.dataset.size;
      const productId = event.target.dataset.productId;
      
      // Update selected size
      document.querySelectorAll('.size-option').forEach(btn => {
        btn.classList.remove('selected');
      });
      event.target.classList.add('selected');
      
      // Hide size error
      hideSizeError();
      
      // Update action button
      const actionBtn = document.getElementById('quick-view-action-btn');
      if (actionBtn) {
        actionBtn.dataset.size = size;
        const isInCart = isInCartWithSize(productId, size);
        actionBtn.textContent = isInCart ? 'Remove from Cart' : 'Add to Cart';
        actionBtn.className = `quick-view-primary-btn ${isInCart ? 'remove' : 'add'}`;
      }
    }
    
    // Handle size selection in Size Selection Modal
    if (event.target.classList.contains('size-option-btn') && event.target.classList.contains('available')) {
      const size = event.target.dataset.size;
      const productId = event.target.dataset.productId;
      const stock = parseInt(event.target.dataset.stock);
      
      // Get product data
      const product = allProducts.find(p => p.id === productId);
      if (!product) return;
      
      // Add to cart with selected size
      if (addToCartWithSizeAndStock(product, size, stock)) {
        // Close modal
        modal.close();
        // Update product card state ONLY when item is successfully added
        updateProductCardState(productId, size, true);
      }
    }
    
    // Handle cancel button in size selection modal
    if (event.target.id === 'size-selection-cancel') {
      // Get the product ID from the modal
      const modalElement = document.querySelector('.size-selection-modal');
      const productId = modalElement ? modalElement.dataset.productId : null;
      
      modal.close();
      
      // Reset the product card state to reflect actual cart state
      if (productId) {
        resetProductCardState(productId);
      }
    }
    
    // Handle primary action button
    if (event.target.id === 'quick-view-action-btn') {
      const productId = event.target.dataset.productId;
      const size = event.target.dataset.size;
      const product = allProducts.find(p => p.id === productId);
      
      if (!product) return;
      
      const isInCart = isInCartWithSize(productId, size);
      
      if (isInCart) {
        // Remove from cart
        if (removeFromCartWithSize(productId, size)) {
          event.target.textContent = 'Add to Cart';
          event.target.className = 'quick-view-primary-btn add';
          updateProductCardState(productId, size, false);
        }
      } else {
        // Add to cart
        if (addToCartWithSize(product, size)) {
          event.target.textContent = 'Remove from Cart';
          event.target.className = 'quick-view-primary-btn remove';
          updateProductCardState(productId, size, true);
        }
      }
    }
  });
}

// Update product card state after modal interaction
function updateProductCardState(productId, size, isInCart) {
  const card = document.querySelector(`[data-product-id="${productId}"]`).closest('.card');
  if (card) {
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
      if (isInCart) {
        addToCartBtn.textContent = 'In Cart';
        addToCartBtn.classList.add('in-cart');
      } else {
        // Check if any size of this product is still in cart
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const hasAnySize = cart.some(item => item.id === productId);
        
        if (!hasAnySize) {
          addToCartBtn.textContent = 'Add to Cart';
          addToCartBtn.classList.remove('in-cart');
        }
      }
    }
  }
}

// Reset product card state to original (when canceling)
function resetProductCardState(productId) {
  const card = document.querySelector(`[data-product-id="${productId}"]`).closest('.card');
  if (card) {
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
      // Check current cart state
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const hasAnySize = cart.some(item => item.id === productId);
      
      if (hasAnySize) {
        addToCartBtn.textContent = 'In Cart';
        addToCartBtn.classList.add('in-cart');
      } else {
        addToCartBtn.textContent = 'Add to Cart';
        addToCartBtn.classList.remove('in-cart');
      }
    }
  }
}





// Export function for future product rendering
export function renderProducts(list) {
  console.log('renderProducts called with:', list);
  
  const grid = document.getElementById('grid');
  const emptyState = grid.querySelector('.empty-state');
  
  if (list && list.length > 0) {
    // Remove empty state and render products
    if (emptyState) {
      emptyState.remove();
    }
    grid.classList.remove('empty');
    
    // Clear existing content and render product cards
    grid.innerHTML = '';
    list.forEach(product => {
      const card = createProductCard(product);
      grid.appendChild(card);
    });
  } else {
    // Show empty state
    if (!emptyState) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="icon">🛍️</div>
          <h2>No items found</h2>
          <p>No products available in this category yet.</p>
        </div>
      `;
    }
    grid.classList.add('empty');
  }
  
  // Update counters after rendering
  updateWishlistCounter();
  updateCartCounter();
}
