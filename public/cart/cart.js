// Empty cart array by default - no preloaded products
let cartItems = [];

// DOM elements (will be resolved after DOMContentLoaded)
let cartItemsContainer;
let emptyCartElement;
let cartContentElement;
let subtotalElement;
let shippingElement;
let totalElement;
let checkoutBtn;

// Initialize cart
document.addEventListener('DOMContentLoaded', async function() {
  // Resolve elements now that DOM is ready
  cartItemsContainer = document.getElementById('cartItems');
  emptyCartElement = document.getElementById('emptyCart');
  cartContentElement = document.getElementById('cartContent');
  subtotalElement = document.getElementById('subtotal');
  shippingElement = document.getElementById('shipping');
  totalElement = document.getElementById('total');
  checkoutBtn = document.getElementById('checkoutBtn');
  // Check authentication first
  const authCheck = new AuthCheck();
  const isAuthenticated = await authCheck.init();
  
  if (!isAuthenticated) {
    return; // Stop execution if not authenticated
  }
  
  // Get current user for cart data
  const currentUser = authCheck.getCurrentUser();
  
  // Load cart data from localStorage (if any exists)
  loadCartFromStorage();
  
  // Render the cart based on current state
  renderCart();
  // Only calculate totals if elements exist
  if (subtotalElement && shippingElement && totalElement && checkoutBtn) {
    updateTotals();
  }

  // Event delegation for remove buttons (handles icon clicks too)
  cartItemsContainer.addEventListener('click', function(event) {
    const removeBtn = event.target.closest('.remove-btn');
    if (removeBtn) {
      const row = removeBtn.closest('.cart-item');
      const id = row && row.getAttribute('data-id');
      const size = row && row.getAttribute('data-size');
      if (id) {
        removeItem(id, size);
      }
    }

    // Quantity +/- buttons
    const qtyBtn = event.target.closest('.quantity-btn');
    if (qtyBtn) {
      const row = qtyBtn.closest('.cart-item');
      const id = row && row.getAttribute('data-id');
      if (!id) return;
      // Determine delta: prefer data attribute, fallback to icon class
      const deltaAttr = qtyBtn.getAttribute('data-delta');
      const change = deltaAttr ? parseInt(deltaAttr, 10) : (qtyBtn.querySelector('.ri-add-line') ? 1 : -1);
      updateQuantity(id, change);
    }
  });

  // Delegate for direct quantity input changes (live input)
  cartItemsContainer.addEventListener('input', function(event) {
    const input = event.target.closest('.quantity-input');
    if (input) {
      const row = input.closest('.cart-item');
      const id = row && row.getAttribute('data-id');
      if (!id) return;
      setQuantity(id, input.value);
    }
  });
});

// Load cart data from localStorage
function loadCartFromStorage() {
  try {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      // Normalize stored items to a consistent shape used by the cart UI
      const parsed = JSON.parse(savedCart);
      cartItems = (Array.isArray(parsed) ? parsed : []).map((raw) => {
        return {
          // Preserve id (required)
          id: raw.id,
          // Prefer 'name'; fall back to 'title'
          name: raw.name || raw.title || 'Untitled Item',
          // Optional description
          description: raw.description || '',
          // Prefer flat image; fall back to nested images.main
          image: raw.image || (raw.images && raw.images.main) || '',
          // Price as number
          price: typeof raw.price === 'number' ? raw.price : Number(raw.price) || 0,
          // Quantity defaults to 1 and is clamped to [1,99]
          quantity: Math.max(1, Math.min(99, parseInt(raw.quantity, 10) || 1)),
          // Size information
          size: raw.size || null,
        };
      });
    }
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    cartItems = [];
  }
}

// Save cart data to localStorage
function saveCartToStorage() {
  try {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
}

// Render cart items
function renderCart() {
  const checkoutBtn = document.getElementById('checkoutBtn');
  
  if (cartItems.length === 0) {
    // Show empty cart state
    emptyCartElement.style.display = 'block';
    cartContentElement.style.display = 'none';
    // Disable checkout button
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
    }
    return;
  }

  // Show cart content
  emptyCartElement.style.display = 'none';
  cartContentElement.style.display = 'block';
  
  // Enable checkout button
  if (checkoutBtn) {
    checkoutBtn.disabled = false;
  }

  cartItemsContainer.innerHTML = cartItems.map(item => `
    <div class="cart-item" data-id="${String(item.id)}" data-size="${item.size || ''}">
      <img src="${item.image}" alt="${item.name || item.title || ''}" class="cart-item-image">
      
      <div class="cart-item-details">
        <h3>${item.name || item.title || 'Untitled Item'}</h3>
        <p>${item.description || ''}</p>
        ${item.size ? `<p class="cart-item-size">Size: ${item.size}</p>` : ''}
      </div>
      
      <div class="cart-item-price">$${item.price.toFixed(2)}</div>
      
      <div class="quantity-selector">
        <button class="quantity-btn" data-delta="-1">
          <i class="ri-subtract-line"></i>
        </button>
        <input type="number" class="quantity-input" value="${item.quantity}" 
               min="1" max="99" inputmode="numeric" pattern="[0-9]*">
        <button class="quantity-btn" data-delta="1">
          <i class="ri-add-line"></i>
        </button>
      </div>
      
      <div class="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</div>
      
      <button class="remove-btn" title="Remove item">
        <i class="ri-delete-bin-line"></i>
      </button>
    </div>
  `).join('');
}

// Update quantity by increment/decrement
function updateQuantity(itemId, change) {
  const item = cartItems.find(item => String(item.id) === String(itemId));
  if (item) {
    const newQuantity = Math.max(1, Math.min(99, item.quantity + change));
    item.quantity = newQuantity;
    saveCartToStorage();
    // Update only the affected item's DOM for better UX
    const row = cartItemsContainer.querySelector(`.cart-item[data-id="${String(itemId)}"]`);
    if (row) {
      const qtyInput = row.querySelector('.quantity-input');
      const totalCell = row.querySelector('.cart-item-total');
      if (qtyInput) qtyInput.value = String(item.quantity);
      if (totalCell) totalCell.textContent = `$${(item.price * item.quantity).toFixed(2)}`;
    }
    updateTotals();
  }
}

// Set quantity directly
function setQuantity(itemId, newQuantity) {
  const item = cartItems.find(item => String(item.id) === String(itemId));
  if (item) {
    const quantity = Math.max(1, Math.min(99, parseInt(newQuantity) || 1));
    item.quantity = quantity;
    saveCartToStorage();
    const row = cartItemsContainer.querySelector(`.cart-item[data-id="${String(itemId)}"]`);
    if (row) {
      const qtyInput = row.querySelector('.quantity-input');
      const totalCell = row.querySelector('.cart-item-total');
      if (qtyInput) qtyInput.value = String(item.quantity);
      if (totalCell) totalCell.textContent = `$${(item.price * item.quantity).toFixed(2)}`;
    }
    updateTotals();
  }
}

// Remove item from cart
function removeItem(itemId, size = null) {
  if (size) {
    // Remove specific size variant
    cartItems = cartItems.filter(item => !(String(item.id) === String(itemId) && item.size === size));
  } else {
    // Remove all variants of the item (fallback for old cart items)
    cartItems = cartItems.filter(item => String(item.id) !== String(itemId));
  }
  
  saveCartToStorage();
  // Remove row from DOM immediately
  const row = cartItemsContainer.querySelector(`.cart-item[data-id="${String(itemId)}"][data-size="${size || ''}"]`);
  if (row && row.parentNode) row.parentNode.removeChild(row);
  // If cart became empty, re-render to show empty state
  if (cartItems.length === 0) {
    renderCart();
  }
  updateTotals();
  
  // Show removal notification
  showNotification('Item removed from cart');
}

// Calculate and update totals
function updateTotals() {
  // Guard if totals DOM isn't present
  if (!subtotalElement || !shippingElement || !totalElement || !checkoutBtn) {
    return;
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 9.99 : 0;
  const total = subtotal + shipping;

  subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  shippingElement.textContent = `$${shipping.toFixed(2)}`;
  totalElement.textContent = `$${total.toFixed(2)}`;

  // Update checkout button state
  checkoutBtn.disabled = cartItems.length === 0;
  checkoutBtn.style.opacity = cartItems.length === 0 ? '0.5' : '1';
}

// Handle checkout
checkoutBtn.addEventListener('click', function() {
  if (cartItems.length === 0) {
    showNotification('Your cart is empty');
    return;
  }
  
  // In a real app, this would redirect to a checkout page
  showNotification('Proceeding to checkout...');
  console.log('Checkout with items:', cartItems);
  
  // Simulate checkout process
  setTimeout(() => {
    alert('Checkout functionality would be implemented here. This is a demo.');
  }, 1000);
});

// Show notification
function showNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #d4a574;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Export for use in other scripts (for future add to cart functionality)
window.cartFunctions = {
  updateQuantity,
  setQuantity,
  removeItem,
  getCartItems: () => cartItems
};
