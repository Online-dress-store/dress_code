// Category page functionality
document.addEventListener('DOMContentLoaded', function() {
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
  
  // Set aria-current for navigation highlighting
  setCurrentPageIndicator(slug);
});

// Set current page indicator for navigation
function setCurrentPageIndicator(currentSlug) {
  // This will be used later when we add navigation highlighting
  console.log('Current category:', currentSlug);
}

// Export function for future product rendering
export function renderProducts(list) {
  // TODO later: replace empty-state with cards
  console.log('renderProducts called with:', list);
  
  const grid = document.getElementById('grid');
  const emptyState = grid.querySelector('.empty-state');
  
  if (list && list.length > 0) {
    // Remove empty state and render products
    if (emptyState) {
      emptyState.remove();
    }
    grid.classList.remove('empty');
    
    // Future implementation will render product cards here
    // list.forEach(product => {
    //   const card = createProductCard(product);
    //   grid.appendChild(card);
    // });
  } else {
    // Show empty state
    if (!emptyState) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="icon">🛍️</div>
          <h2>No items yet</h2>
          <p>Products will appear here soon.</p>
        </div>
      `;
    }
    grid.classList.add('empty');
  }
}
