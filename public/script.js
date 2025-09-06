// Home page functionality
let popup = null;

document.addEventListener('DOMContentLoaded', function() {
  // Initialize popup
  popup = new Popup();
  
  // Check authentication status
  checkAuthStatus();
  
  // Handle search form
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const query = document.getElementById('q').value;
      if (query.trim()) {
        // Redirect to categories with search
        window.location.href = `/categories/index.html?cat=all-items&search=${encodeURIComponent(query)}`;
      }
    });
  }
  
  // Handle dropdown menu
  const menuBtn = document.querySelector('.menu-btn');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  
  if (menuBtn && dropdownMenu) {
    menuBtn.addEventListener('click', function() {
      const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', !isExpanded);
      dropdownMenu.parentElement.classList.toggle('open');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        menuBtn.setAttribute('aria-expanded', 'false');
        dropdownMenu.parentElement.classList.remove('open');
      }
    });
  }
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
  
  // Update counters
  updateWishlistCounter();
  updateCartCounter();
}

// Update wishlist counter in header
function updateWishlistCounter() {
  try {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const wishlistLink = document.querySelector('a[href="/wishlist"]');
    if (wishlistLink) {
      let counter = wishlistLink.querySelector('.badge');
      if (wishlist.length > 0) {
        if (!counter) {
          counter = document.createElement('span');
          counter.className = 'badge';
          wishlistLink.appendChild(counter);
        }
        counter.textContent = wishlist.length;
      } else if (counter) {
        counter.remove();
      }
    }
  } catch (error) {
    console.error('Error updating wishlist counter:', error);
  }
}

// Update cart counter in header
function updateCartCounter() {
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartLink = document.querySelector('a[href="cart/cart.html"]');
    if (cartLink) {
      let counter = cartLink.querySelector('.badge');
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      
      if (totalItems > 0) {
        if (!counter) {
          counter = document.createElement('span');
          counter.className = 'badge';
          cartLink.appendChild(counter);
        }
        counter.textContent = totalItems;
      } else if (counter) {
        counter.remove();
      }
    }
  } catch (error) {
    console.error('Error updating cart counter:', error);
  }
}

// Update UI for guest user
function updateUIForGuestUser() {
  const profileLink = document.getElementById('profileLink');
  const heartLink = document.querySelector('a[href="/wishlist"]');
  const cartLink = document.querySelector('a[href="cart/cart.html"]');
  const sellLink = document.querySelector('a[href="/sell"]');
  
  // Keep profile link as login link
  if (profileLink) {
    profileLink.innerHTML = '<i class="ri-user-line"></i>';
  }
  
  // Disable protected links (they will redirect to login)
  if (heartLink) heartLink.style.pointerEvents = 'auto';
  if (cartLink) cartLink.style.pointerEvents = 'auto';
  if (sellLink) sellLink.style.pointerEvents = 'auto';
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
      // Redirect to home page
      window.location.href = '/';
    } else {
      console.error('Logout failed');
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}