// Import navigation
import { createNavigation, initNavigation, updateAuthStatus } from "./shared/navigation.js";

// Home page functionality
let popup = null;

document.addEventListener('DOMContentLoaded', async function() {
  // Load navigation
  const navigationElement = document.getElementById('navigation');
  if (navigationElement) {
    navigationElement.innerHTML = createNavigation();
    initNavigation();
    await updateAuthStatus();
  }
  
  // Initialize popup
  popup = new Popup();
  
  // Check authentication status
  checkAuthStatus();
  
  // Search form is now handled by shared navigation
  
  // Dropdown menu is now handled by shared navigation
});

// Check authentication status
async function checkAuthStatus() {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    
    if (response.ok) {
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response from /api/auth/me:', {
          status: response.status,
          statusText: response.statusText,
          contentType: contentType,
          body: text
        });
        updateUIForGuestUser();
        return;
      }
      
      // User is logged in
      const data = await response.json();
      updateUIForLoggedInUser(data.user);
    } else if (response.status === 401) {
      // User is not logged in (this is expected)
      updateUIForGuestUser();
    } else {
      // Other error
      console.error('Auth check error:', response.status, response.statusText);
      updateUIForGuestUser();
    }
  } catch (error) {
    console.error('Auth check error:', error);
    updateUIForGuestUser();
  }
}

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
  const profileLink = document.getElementById('profileLink');
  const heartLink = document.querySelector('a[href="/wishlist"]');
  const cartLink = document.querySelector('a[href="cart/cart.html"]');
  const sellLink = document.querySelector('a[href="/sell"]');
  
  // Update profile link to show user menu and link to account page
  if (profileLink) {
    profileLink.href = '/account'; // Link to account page
    profileLink.innerHTML = `
      <div class="user-menu">
        <i class="ri-user-line"></i>
        <div class="user-dropdown">
          <a href="/account" class="account-link">
            <i class="ri-user-line"></i>
            My Account
          </a>
          <button class="logout-btn" onclick="logout()">
            <i class="ri-logout-box-line"></i>
            Logout
          </button>
        </div>
      </div>
    `;
  }
  
  // Enable protected links
  if (heartLink) heartLink.style.pointerEvents = 'auto';
  if (cartLink) cartLink.style.pointerEvents = 'auto';
  if (sellLink) sellLink.style.pointerEvents = 'auto';
  
  // Counters are now handled by shared navigation
}

// All navigation functionality is now handled by shared navigation