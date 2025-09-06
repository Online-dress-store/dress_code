// Import navigation
import { createNavigation, initNavigation, updateAuthStatus } from "../shared/navigation.js";

// Thank you page functionality
document.addEventListener('DOMContentLoaded', async function() {
  // Load navigation
  const navigationElement = document.getElementById('navigation');
  if (navigationElement) {
    navigationElement.innerHTML = createNavigation();
    initNavigation();
    await updateAuthStatus();
  }
  
  // Check authentication first
  const authCheck = new AuthCheck();
  const isAuthenticated = await authCheck.init();
  
  if (!isAuthenticated) {
    return; // Stop execution if not authenticated
  }
  
  // Load and display order details
  loadOrderDetails();
});

// Load order details from localStorage
function loadOrderDetails() {
  try {
    const orderData = localStorage.getItem('lastOrder');
    if (!orderData) {
      // No order data found, redirect to home
      window.location.href = '/';
      return;
    }
    
    const order = JSON.parse(orderData);
    displayOrderDetails(order);
  } catch (error) {
    console.error('Error loading order details:', error);
    // Redirect to home if there's an error
    window.location.href = '/';
  }
}

// Display order details
function displayOrderDetails(order) {
  const orderDetailsContainer = document.getElementById('orderDetails');
  if (!orderDetailsContainer) return;
  
  const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  orderDetailsContainer.innerHTML = `
    <div class="order-info">
      <div class="order-info-item">
        <div class="order-info-label">Order ID</div>
        <div class="order-info-value">${order.orderId}</div>
      </div>
      <div class="order-info-item">
        <div class="order-info-label">Order Date</div>
        <div class="order-info-value">${orderDate}</div>
      </div>
      <div class="order-info-item">
        <div class="order-info-label">Shipping To</div>
        <div class="order-info-value">${order.shipping.firstName} ${order.shipping.lastName}</div>
      </div>
      <div class="order-info-item">
        <div class="order-info-label">Email</div>
        <div class="order-info-value">${order.shipping.email}</div>
      </div>
    </div>
    
    <div class="order-items">
      ${order.items.map(item => `
        <div class="order-item">
          <img src="${item.image}" alt="${item.name}" class="order-item-image">
          <div class="order-item-details">
            <div class="order-item-name">${item.name}</div>
            <div class="order-item-price">$${item.price.toFixed(2)}</div>
            <div class="order-item-quantity">Qty: ${item.quantity}</div>
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="order-total">
      Total: $${order.totals.total.toFixed(2)}
    </div>
  `;
}
