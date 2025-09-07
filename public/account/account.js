// Import navigation
import { createNavigation, initNavigation, updateAuthStatus } from "../shared/navigation.js";

// Account page functionality
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
  
  // Get current user for account data
  const currentUser = authCheck.getCurrentUser();
  
  // Initialize account page
  initializeAccountPage(currentUser);
});

// Initialize account page with user data
function initializeAccountPage(user) {
  // Populate user information
  populateUserInfo(user);
  
  // Set up event listeners
  setupEventListeners();
  
  // Load user items and order history
  loadUserItems();
  loadOrderHistory();
}

// Populate user information
function populateUserInfo(user) {
  // Use username as email for now (since our user model doesn't have email yet)
  // In a real app, this would be user.email
  document.getElementById('email').textContent = user.username + '@example.com';
}

// Set up event listeners
function setupEventListeners() {
  const editProfileBtn = document.getElementById('editProfileBtn');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const profileInfo = document.getElementById('profileInfo');
  const profileForm = document.getElementById('profileForm');
  const editEmailInput = document.getElementById('editEmail');
  
  // Edit profile button
  editProfileBtn.addEventListener('click', function() {
    const currentEmail = document.getElementById('email').textContent;
    editEmailInput.value = currentEmail;
    
    profileInfo.style.display = 'none';
    profileForm.style.display = 'flex';
    editProfileBtn.style.display = 'none';
  });
  
  // Save profile button
  saveProfileBtn.addEventListener('click', async function() {
    const newEmail = editEmailInput.value.trim();
    
    if (!newEmail) {
      showMessage('Email cannot be empty', 'error');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      showMessage('Please enter a valid email address', 'error');
      return;
    }
    
    try {
      // Show loading state
      saveProfileBtn.disabled = true;
      saveProfileBtn.innerHTML = '<i class="ri-loader-line"></i> Saving...';
      
      // Update email (this would be an API call in a real app)
      // For now, we'll just update the display
      document.getElementById('email').textContent = newEmail;
      
      // Hide form and show info
      profileInfo.style.display = 'flex';
      profileForm.style.display = 'none';
      editProfileBtn.style.display = 'flex';
      
      showMessage('Email updated successfully', 'success');
      
    } catch (error) {
      console.error('Error updating email:', error);
      showMessage('Failed to update email', 'error');
    } finally {
      // Reset button state
      saveProfileBtn.disabled = false;
      saveProfileBtn.innerHTML = '<i class="ri-save-line"></i> Save Changes';
    }
  });
  
  // Cancel edit button
  cancelEditBtn.addEventListener('click', function() {
    profileInfo.style.display = 'flex';
    profileForm.style.display = 'none';
    editProfileBtn.style.display = 'flex';
  });
}

// Load user items from server
async function loadUserItems() {
  try {
    const response = await fetch('/api/auth/items', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user items');
    }
    
    const data = await response.json();
    const items = data.items || [];
    
    const emptyItems = document.getElementById('emptyItems');
    const itemsList = document.getElementById('itemsList');
    
    if (items.length === 0) {
      // Show empty items state
      emptyItems.style.display = 'block';
      itemsList.style.display = 'none';
    } else {
      // Show items list
      emptyItems.style.display = 'none';
      itemsList.style.display = 'block';
      
      // Sort items by date (newest first)
      const sortedItems = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Render items
      itemsList.innerHTML = sortedItems.map(item => `
        <div class="item-card">
          <div class="item-image">
            <img src="${item.images?.main || '/placeholder-dress.jpg'}" alt="${item.title}" loading="lazy">
          </div>
          <div class="item-details">
            <h3 class="item-title">${item.title}</h3>
            <p class="item-description">${item.description}</p>
            <div class="item-meta">
              <span class="item-category">${item.category}</span>
              <span class="item-price">$${item.price.toFixed(2)}</span>
            </div>
            <div class="item-actions">
              <span class="item-status ${item.status || 'active'}">${(item.status || 'active').charAt(0).toUpperCase() + (item.status || 'active').slice(1)}</span>
              <div class="item-buttons">
                <button class="edit-item-btn" onclick="editItem('${item.id}')">
                  <i class="ri-edit-line"></i>
                  Edit
                </button>
                <button class="delete-item-btn" onclick="deleteItem('${item.id}')">
                  <i class="ri-delete-bin-line"></i>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    }
    
  } catch (error) {
    console.error('Error loading user items:', error);
    showMessage('Failed to load your items', 'error');
    
    // Show empty state on error
    const emptyItems = document.getElementById('emptyItems');
    const itemsList = document.getElementById('itemsList');
    emptyItems.style.display = 'block';
    itemsList.style.display = 'none';
  }
}

// Load order history from server
async function loadOrderHistory() {
  try {
    const response = await fetch('/api/auth/orders', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    const data = await response.json();
    const orders = data.orders || [];
    
    const emptyOrders = document.getElementById('emptyOrders');
    const ordersList = document.getElementById('ordersList');
    
    if (orders.length === 0) {
      // Show empty orders state
      emptyOrders.style.display = 'block';
      ordersList.style.display = 'none';
    } else {
      // Show orders list
      emptyOrders.style.display = 'none';
      ordersList.style.display = 'block';
      
      // Sort orders by date (newest first)
      const sortedOrders = orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
      
      // Render orders
      ordersList.innerHTML = sortedOrders.map(order => `
        <div class="order-item">
          <div class="order-header">
            <div class="order-info">
              <h3>Order #${order.orderId}</h3>
              <p class="order-date">${new Date(order.orderDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
            <div class="order-status">
              <span class="status-badge">Completed</span>
            </div>
          </div>
          
          <div class="order-items">
            ${order.items.map(item => `
              <div class="order-product">
                <img src="${item.image}" alt="${item.name}" class="product-image">
                <div class="product-details">
                  <h4>${item.name}</h4>
                  <p class="product-price">$${item.price.toFixed(2)}</p>
                  <p class="product-quantity">Qty: ${item.quantity}</p>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="order-footer">
            <div class="order-total">
              <span>Total:</span>
              <span class="total-amount">$${order.totals.total.toFixed(2)}</span>
            </div>
            <div class="order-shipping">
              <span>Shipped to:</span>
              <span>${order.shipping.firstName} ${order.shipping.lastName}</span>
            </div>
          </div>
        </div>
      `).join('');
    }
    
  } catch (error) {
    console.error('Error loading order history:', error);
    showMessage('Failed to load order history', 'error');
    
    // Show empty state on error
    const emptyOrders = document.getElementById('emptyOrders');
    const ordersList = document.getElementById('ordersList');
    emptyOrders.style.display = 'block';
    ordersList.style.display = 'none';
  }
}

// Logout function
async function logout() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      showMessage('Logged out successfully', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } else {
      console.error('Logout failed');
      showMessage('Logout failed', 'error');
    }
  } catch (error) {
    console.error('Logout error:', error);
    showMessage('Logout error', 'error');
  }
}

// Show message function
function showMessage(message, type = 'info') {
  // Remove existing messages
  const existingMessage = document.querySelector('.account-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // Create message element
  const messageDiv = document.createElement('div');
  messageDiv.className = `account-message account-message-${type}`;
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
  `;
  
  // Set colors based on type
  if (type === 'success') {
    messageDiv.style.background = '#4CAF50';
    messageDiv.style.color = 'white';
  } else if (type === 'error') {
    messageDiv.style.background = '#f44336';
    messageDiv.style.color = 'white';
  } else {
    messageDiv.style.background = '#2196F3';
    messageDiv.style.color = 'white';
  }
  
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

// Edit item function (placeholder)
function editItem(itemId) {
  showMessage('Edit functionality coming soon!', 'info');
  console.log('Edit item:', itemId);
}

// Delete item function (placeholder)
function deleteItem(itemId) {
  if (confirm('Are you sure you want to delete this item?')) {
    showMessage('Delete functionality coming soon!', 'info');
    console.log('Delete item:', itemId);
  }
}
