// Checkout page functionality
let orderItems = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', async function() {
  // Check authentication first
  const authCheck = new AuthCheck();
  const isAuthenticated = await authCheck.init();
  
  if (!isAuthenticated) {
    return; // Stop execution if not authenticated
  }
  
  // Get current user
  currentUser = authCheck.getCurrentUser();
  
  // Load order from cart
  loadOrderFromCart();
  
  // Initialize form
  initializeForm();
  
  // Setup form submission
  setupFormSubmission();
});

// Load order items from cart localStorage
function loadOrderFromCart() {
  try {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      orderItems = (Array.isArray(parsed) ? parsed : []).map((raw) => {
        return {
          id: raw.id,
          name: raw.name || raw.title || 'Untitled Item',
          description: raw.description || '',
          image: raw.image || (raw.images && raw.images.main) || '',
          price: typeof raw.price === 'number' ? raw.price : Number(raw.price) || 0,
          quantity: Math.max(1, Math.min(99, parseInt(raw.quantity, 10) || 1))
        };
      });
    }
    
    renderOrderSummary();
    updateTotals();
  } catch (error) {
    console.error('Error loading order from cart:', error);
    showMessage('Error loading order details', 'error');
  }
}

// Render order summary
function renderOrderSummary() {
  const orderItemsContainer = document.getElementById('orderItems');
  if (!orderItemsContainer) return;
  
  if (orderItems.length === 0) {
    orderItemsContainer.innerHTML = `
      <div class="empty-order">
        <p>No items in your order</p>
      </div>
    `;
    return;
  }
  
  orderItemsContainer.innerHTML = orderItems.map(item => `
    <div class="order-item">
      <img src="${item.image}" alt="${item.name}" class="order-item-image">
      <div class="order-item-details">
        <div class="order-item-name">${item.name}</div>
        <div class="order-item-price">$${item.price.toFixed(2)}</div>
        <div class="order-item-quantity">Qty: ${item.quantity}</div>
      </div>
    </div>
  `).join('');
}

// Update totals
function updateTotals() {
  const subtotalElement = document.getElementById('subtotal');
  const shippingElement = document.getElementById('shipping');
  const totalElement = document.getElementById('total');
  
  if (!subtotalElement || !shippingElement || !totalElement) return;
  
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 9.99 : 0;
  const total = subtotal + shipping;
  
  subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  shippingElement.textContent = `$${shipping.toFixed(2)}`;
  totalElement.textContent = `$${total.toFixed(2)}`;
}

// Initialize form with user data
function initializeForm() {
  // Pre-fill email if available
  const emailInput = document.getElementById('email');
  if (emailInput && currentUser) {
    emailInput.value = currentUser.username + '@example.com';
  }
  
  // Setup card number formatting
  const cardNumberInput = document.getElementById('cardNumber');
  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
      e.target.value = formattedValue;
    });
  }
  
  // Setup expiry date formatting
  const expiryInput = document.getElementById('expiryDate');
  if (expiryInput) {
    expiryInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      e.target.value = value;
    });
  }
  
  // Setup CVV formatting
  const cvvInput = document.getElementById('cvv');
  if (cvvInput) {
    cvvInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      e.target.value = value.substring(0, 4);
    });
  }
}

// Setup form submission
function setupFormSubmission() {
  const form = document.getElementById('checkoutForm');
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  
  if (!form || !placeOrderBtn) return;
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Disable button during submission
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<i class="ri-loader-4-line"></i> Processing...';
    
    try {
      // Validate form
      if (!validateForm()) {
        return;
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get form data
      const formData = new FormData(form);
      const orderData = {
        items: orderItems,
        shipping: {
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          email: formData.get('email'),
          address: formData.get('address'),
          city: formData.get('city'),
          state: formData.get('state'),
          zipCode: formData.get('zipCode'),
          country: formData.get('country'),
          phone: formData.get('phone')
        },
        payment: {
          cardNumber: formData.get('cardNumber'),
          expiryDate: formData.get('expiryDate'),
          cvv: formData.get('cvv'),
          cardName: formData.get('cardName')
        },
        totals: {
          subtotal: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          shipping: 9.99,
          total: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 9.99
        },
        orderId: generateOrderId(),
        orderDate: new Date().toISOString(),
        userId: currentUser ? currentUser.id : null
      };
      
      // Save order to user's profile
      const saveOrderResponse = await fetch('/api/auth/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ orderData })
      });
      
      if (!saveOrderResponse.ok) {
        throw new Error('Failed to save order to profile');
      }
      
      // Log order data (in real app, this would be sent to server)
      console.log('Order submitted:', orderData);
      
      // Clear cart
      localStorage.removeItem('cart');
      
      // Store order in localStorage for thank you page
      localStorage.setItem('lastOrder', JSON.stringify(orderData));
      
      // Redirect to thank you page
      window.location.href = '/thank-you';
      
    } catch (error) {
      console.error('Error processing order:', error);
      showMessage('Error processing your order. Please try again.', 'error');
    } finally {
      // Re-enable button
      placeOrderBtn.disabled = false;
      placeOrderBtn.innerHTML = '<i class="ri-lock-line"></i> Place Order';
    }
  });
}

// Validate form
function validateForm() {
  const form = document.getElementById('checkoutForm');
  if (!form) return false;
  
  // Check if form is valid
  if (!form.checkValidity()) {
    form.reportValidity();
    return false;
  }
  
  // Additional validation
  const cardNumber = document.getElementById('cardNumber').value.replace(/\s+/g, '');
  const expiryDate = document.getElementById('expiryDate').value;
  const cvv = document.getElementById('cvv').value;
  
  if (cardNumber.length < 13 || cardNumber.length > 19) {
    showMessage('Please enter a valid card number', 'error');
    return false;
  }
  
  if (!expiryDate.match(/^\d{2}\/\d{2}$/)) {
    showMessage('Please enter expiry date in MM/YY format', 'error');
    return false;
  }
  
  if (cvv.length < 3 || cvv.length > 4) {
    showMessage('Please enter a valid CVV', 'error');
    return false;
  }
  
  return true;
}

// Generate order ID
function generateOrderId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `ORD-${timestamp}-${random}`.toUpperCase();
}

// Show message
function showMessage(message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = message;
  
  // Add styles
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#4CAF50' : '#d4a574'};
    color: white;
  `;
  
  document.body.appendChild(messageDiv);
  
  // Animate in
  setTimeout(() => {
    messageDiv.style.transform = 'translateX(0)';
  }, 100);
  
  // Remove after 5 seconds
  setTimeout(() => {
    messageDiv.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 300);
  }, 5000);
}
