// Shared navigation component
export function createNavigation() {
  return `
    <header class="hc">
      <div class="hc__left">
        <form id="searchForm" class="searchline" role="search">
          <input id="q" type="text" placeholder="Search dresses…" aria-label="Search dresses" />
          <button class="icon" type="submit" aria-label="Search" data-tooltip="Search for dresses"><i class="ri-search-line"></i></button>
        </form>
      </div>
  
      <div class="hc__center">
        <h1 class="page-title"><a href="/" style="text-decoration: none; color: inherit;">DRESS <span>code</span></a></h1>
        <p class="store-tagline">Giving dresses a second life – buy and sell in one place.</p>
      </div>
  
      <div class="hc__right">
        <a href="/wishlist" class="icon" aria-label="Liked" data-tooltip="View wishlist"><i class="ri-heart-line"></i></a>
        <a href="/sell" class="icon" aria-label="Sell a dress" data-tooltip="Sell your dress"><i class="ri-add-line"></i></a>
        <a href="/login" class="icon" id="profileLink" aria-label="Personal area"><i class="ri-user-line"></i></a>
        <a href="/cart" class="icon" aria-label="Shopping cart" data-tooltip="View shopping cart"><i class="ri-shopping-bag-line"></i><span class="badge" id="bagCount">0</span></a>
        <button class="icon" id="themeToggle" aria-label="Toggle dark mode" data-tooltip="Toggle dark mode"><i class="ri-contrast-2-line"></i></button>
        <div class="menu-wrapper">
          <button class="icon menu-btn" aria-haspopup="true" aria-expanded="false" aria-label="Main menu">
            <i class="ri-menu-line" aria-hidden="true"></i>
          </button>
          <nav class="dropdown-menu" role="menu" aria-hidden="true">
            <div class="dropdown-section">
              <a href="/categories?cat=all-items" class="dropdown-item" role="menuitem">ALL ITEMS</a>
              <a href="/quiz" class="dropdown-item" role="menuitem">Style Quiz</a>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-section">
              <div class="dropdown-heading">Collections:</div>
              <a href="/categories?cat=evening" class="dropdown-item" role="menuitem">Evening</a>
              <a href="/categories?cat=summer" class="dropdown-item" role="menuitem">Summer</a>
              <a href="/categories?cat=holiday" class="dropdown-item" role="menuitem">Holiday</a>
              <a href="/categories?cat=casual" class="dropdown-item" role="menuitem">Casual</a>
            </div>
          </nav>
        </div>
      </div>
    </header>
  `;
}

// Initialize navigation functionality
export function initNavigation() {
  // Handle search form
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const query = document.getElementById('q').value;
      if (query.trim()) {
        window.location.href = `/categories?cat=all-items&search=${encodeURIComponent(query)}`;
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
  
  // Theme toggle
  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    // Apply saved theme
    try {
      const saved = localStorage.getItem('theme') || 'light';
      document.documentElement.setAttribute('data-theme', saved);
    } catch (_) {}
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (_) {}
    });
  }
  
  // Update cart counter
  updateCartCounter();
  updateWishlistCounter();

  // Live-update counters when cart/wishlist change in the app
  try {
    window.addEventListener('cart-updated', updateCartCounter);
    window.addEventListener('wishlist-updated', updateWishlistCounter);
    // Cross-tab updates via localStorage events
    window.addEventListener('storage', (e) => {
      if (e && (e.key === 'cart' || e.key === 'wishlist')) {
        updateCartCounter();
        updateWishlistCounter();
      }
    });
  } catch (_) {}
}

// Update cart counter
function updateCartCounter() {
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartLink = document.querySelector('a[href="/cart"]');
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

// Update wishlist counter
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

// Check authentication status and update profile link
export async function updateAuthStatus() {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    
    const profileLink = document.getElementById('profileLink');
    if (!profileLink) return;
    
    if (response.ok) {
      // User is logged in
      const data = await response.json();
      const isAdmin = data && data.user && data.user.role === 'admin';
      profileLink.href = '/account';
      profileLink.innerHTML = `
        <div class="user-menu">
          <i class="ri-user-line"></i>
          <div class="user-dropdown">
            <a href="/account" class="account-link">
              <i class="ri-user-line"></i>
              My Account
            </a>
            ${isAdmin ? `
            <a href="/admin" class="account-link">
              <i class="ri-shield-user-line"></i>
              Admin Panel
            </a>` : ''}
            <button class="logout-btn" onclick="logout()">
              <i class="ri-logout-box-line"></i>
              Logout
            </button>
          </div>
        </div>
      `;

      // Hydrate per-user data (cart, wishlist) from server after login
      try {
        const cartMod = await import('./cart.js');
        if (cartMod.hydrateCartFromServer) await cartMod.hydrateCartFromServer();
        const wishMod = await import('./wishlist.js');
        if (wishMod.hydrateWishlistFromServer) await wishMod.hydrateWishlistFromServer();
        // Update counters after hydration
        updateCartCounter();
        updateWishlistCounter();
      } catch (e) {
        console.error('Hydration error:', e);
      }
    } else {
      // User is not logged in
      profileLink.href = '/login';
      profileLink.innerHTML = '<i class="ri-user-line"></i>';
    }
  } catch (error) {
    console.error('Auth check error:', error);
  }
}

// Logout function
window.logout = async function() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      // Clear client caches so next user starts clean
      try {
        localStorage.removeItem('cart');
        localStorage.removeItem('wishlist');
      } catch (_) {}
      updateCartCounter();
      updateWishlistCounter();
      // Redirect to home page
      window.location.href = '/';
    } else {
      console.error('Logout failed');
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
};
