// Empty cart array by default - no preloaded products
let cartItems = [];

// DOM elements
const cartItemsContainer = document.getElementById('cartItems');
const emptyCartElement = document.getElementById('emptyCart');
const cartContentElement = document.getElementById('cartContent');
const subtotalElement = document.getElementById('subtotal');
const shippingElement = document.getElementById('shipping');
const totalElement = document.getElementById('total');
const checkoutBtn = document.getElementById('checkoutBtn');

// Initialize cart
document.addEventListener('DOMContentLoaded', function() {
  // Load cart data from localStorage (if any exists)
  loadCartFromStorage();
  
  // Render the cart based on current state
  renderCart();
  updateTotals();
});

// Load cart data from localStorage
function loadCartFromStorage() {
  try {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      cartItems = JSON.parse(savedCart);
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
  if (cartItems.length === 0) {
    // Show empty cart state
    emptyCartElement.style.display = 'block';
    cartContentElement.style.display = 'none';
    return;
  }

  // Show cart content
  emptyCartElement.style.display = 'none';
  cartContentElement.style.display = 'block';

  cartItemsContainer.innerHTML = cartItems.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <img src="${item.image}" alt="${item.name}" class="cart-item-image">
      
      <div class="cart-item-details">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
      </div>
      
      <div class="cart-item-price">$${item.price.toFixed(2)}</div>
      
      <div class="quantity-selector">
        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">
          <i class="ri-subtract-line"></i>
        </button>
        <input type="number" class="quantity-input" value="${item.quantity}" 
               min="1" max="99" onchange="setQuantity(${item.id}, this.value)">
        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">
          <i class="ri-add-line"></i>
        </button>
      </div>
      
      <div class="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</div>
      
      <button class="remove-btn" onclick="removeItem(${item.id})" title="Remove item">
        <i class="ri-delete-bin-line"></i>
      </button>
    </div>
  `).join('');
}

// Update quantity by increment/decrement
function updateQuantity(itemId, change) {
  const item = cartItems.find(item => item.id === itemId);
  if (item) {
    const newQuantity = Math.max(1, Math.min(99, item.quantity + change));
    item.quantity = newQuantity;
    saveCartToStorage();
    renderCart();
    updateTotals();
  }
}

// Set quantity directly
function setQuantity(itemId, newQuantity) {
  const item = cartItems.find(item => item.id === itemId);
  if (item) {
    const quantity = Math.max(1, Math.min(99, parseInt(newQuantity) || 1));
    item.quantity = quantity;
    saveCartToStorage();
    renderCart();
    updateTotals();
  }
}

// Remove item from cart
function removeItem(itemId) {
  cartItems = cartItems.filter(item => item.id !== itemId);
  saveCartToStorage();
  renderCart();
  updateTotals();
  
  // Show removal notification
  showNotification('Item removed from cart');
}

// Calculate and update totals
function updateTotals() {
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
