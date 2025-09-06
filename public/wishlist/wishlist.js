// Import navigation
import { createNavigation, initNavigation, updateAuthStatus } from "../shared/navigation.js";

// DOM elements
const emptyWishlistElement = document.getElementById('emptyWishlist');
const wishlistGridElement = document.getElementById('wishlistGrid');

// Initialize wishlist
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
  
  // Get current user for wishlist data
  const currentUser = authCheck.getCurrentUser();
  
  // Load wishlist data from localStorage (if any exists)
  loadWishlistFromStorage();
  
  // Render the wishlist based on current state
  renderWishlist();
});

// Load wishlist data from localStorage
function loadWishlistFromStorage() {
  try {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      const wishlist = JSON.parse(savedWishlist);
      if (wishlist && wishlist.length > 0) {
        console.log('Found saved wishlist items:', wishlist);
        return wishlist;
      }
    }
  } catch (error) {
    console.error('Error loading wishlist from storage:', error);
  }
  return [];
}

// Render wishlist
function renderWishlist() {
  const wishlistItems = loadWishlistFromStorage();
  
  if (wishlistItems.length === 0) {
    // Show empty state
    emptyWishlistElement.style.display = 'block';
    wishlistGridElement.style.display = 'none';
  } else {
    // Show wishlist items
    emptyWishlistElement.style.display = 'none';
    wishlistGridElement.style.display = 'block';
    renderGrid(wishlistItems);
  }
}

// Render wishlist grid with items
function renderGrid(wishlistItems) {
  console.log('renderGrid function called with:', wishlistItems);
  
  // Clear existing content
  wishlistGridElement.innerHTML = '';
  
  // Create wishlist items
  wishlistItems.forEach(item => {
    const wishlistItem = createWishlistItem(item);
    wishlistGridElement.appendChild(wishlistItem);
  });
}

// Create individual wishlist item element
function createWishlistItem(item) {
  const itemElement = document.createElement('div');
  itemElement.className = 'wishlist-item';
  itemElement.innerHTML = `
    <div class="wishlist-item-image">
      <img src="${item.image}" alt="${item.title}" loading="lazy">
      <button class="remove-from-wishlist-btn" data-product-id="${item.id}">
        <i class="ri-heart-fill"></i>
      </button>
    </div>
    <div class="wishlist-item-details">
      <h3 class="wishlist-item-title">${item.title}</h3>
      <p class="wishlist-item-price">$${item.price.toFixed(2)}</p>
      <div class="wishlist-item-actions">
        <button class="add-to-cart-btn" data-product-id="${item.id}">
          <i class="ri-shopping-cart-line"></i>
          Add to Cart
        </button>
        <button class="remove-btn" data-product-id="${item.id}">
          <i class="ri-delete-bin-line"></i>
          Remove
        </button>
      </div>
    </div>
  `;
  
  // Add event listeners
  const removeBtn = itemElement.querySelector('.remove-from-wishlist-btn');
  const removeBtn2 = itemElement.querySelector('.remove-btn');
  const addToCartBtn = itemElement.querySelector('.add-to-cart-btn');
  
  removeBtn.addEventListener('click', () => removeFromWishlist(item.id));
  removeBtn2.addEventListener('click', () => removeFromWishlist(item.id));
  addToCartBtn.addEventListener('click', () => addToCartFromWishlist(item));
  
  return itemElement;
}

// Remove item from wishlist
function removeFromWishlist(productId) {
  try {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const updatedWishlist = wishlist.filter(item => item.id !== productId);
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
    
    // Re-render the wishlist
    renderWishlist();
    
    console.log('Item removed from wishlist:', productId);
  } catch (error) {
    console.error('Error removing item from wishlist:', error);
  }
}

// Add item to cart from wishlist
function addToCartFromWishlist(item) {
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartItem = {
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.image,
      size: 'M', // Default size
      quantity: 1
    };
    
    // Check if item already exists in cart
    const existingItem = cart.find(cartItem => cartItem.id === item.id && cartItem.size === 'M');
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push(cartItem);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Show success message
    showMessage('Item added to cart!', 'success');
    
    console.log('Item added to cart from wishlist:', item);
  } catch (error) {
    console.error('Error adding item to cart:', error);
  }
}

// Show message function
function showMessage(message, type = 'info') {
  // Create message element
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : '#f44336'};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 1000;
    font-family: 'Inter', sans-serif;
  `;
  
  document.body.appendChild(messageDiv);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove();
    }
  }, 3000);
}

// Export for use in other scripts (for future functionality)
window.wishlistFunctions = {
  renderGrid,
  loadWishlistFromStorage
};
