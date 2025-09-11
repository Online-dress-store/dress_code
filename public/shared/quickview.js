// Quick View Modal Component
export class QuickViewModal {
  constructor() {
    this.modal = null;
    this.overlay = null;
    this.isOpen = false;
    this.focusableElements = [];
    this.lastFocusedElement = null;
  }

  createModal() {
    // Create modal HTML
    const modalHTML = `
      <div id="quickview-overlay" class="quickview-overlay" style="display: none;">
        <div class="quickview-modal" role="dialog" aria-labelledby="quickview-title" aria-modal="true">
          <button class="quickview-close" aria-label="Close modal" data-tooltip="Close modal">&times;</button>
          <div class="quickview-content">
            <div class="quickview-left">
              <div class="quickview-product">
                <img id="quickview-image" src="" alt="" class="quickview-product-image">
                <div class="quickview-product-details">
                  <h2 id="quickview-title" class="quickview-product-title"></h2>
                  <p id="quickview-description" class="quickview-product-description"></p>
                  <div class="quickview-product-price">$<span id="quickview-price"></span></div>
                  <div class="quickview-product-sizes">
                    <span class="quickview-sizes-label">Available Sizes:</span>
                    <div id="quickview-sizes" class="quickview-sizes-list"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="quickview-right">
              <h3 class="quickview-accessories-title">Recommended Accessories</h3>
              <div id="quickview-accessories" class="quickview-accessories-list">
                <div class="quickview-loading">Loading accessories...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Insert modal into body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    this.modal = document.getElementById('quickview-overlay');
    this.overlay = this.modal;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Close button
    const closeBtn = this.modal.querySelector('.quickview-close');
    closeBtn.addEventListener('click', () => this.close());

    // Overlay click to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Focus trap
    this.modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && this.isOpen) {
        this.trapFocus(e);
      }
    });
  }

  async open(product) {
    if (this.isOpen) return;

    // Create modal if it doesn't exist
    if (!this.modal) {
      this.createModal();
    }

    // Store reference to last focused element
    this.lastFocusedElement = document.activeElement;

    // Populate product details
    this.populateProductDetails(product);

    // Show modal
    this.modal.style.display = 'flex';
    this.isOpen = true;

    // Focus first focusable element
    this.updateFocusableElements();
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }

    // Load accessories
    await this.loadAccessories(product.id);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.isOpen) return;

    this.modal.style.display = 'none';
    this.isOpen = false;

    // Restore body scroll
    document.body.style.overflow = '';

    // Return focus to last focused element
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
    }
  }

  populateProductDetails(product) {
    const image = document.getElementById('quickview-image');
    const title = document.getElementById('quickview-title');
    const description = document.getElementById('quickview-description');
    const price = document.getElementById('quickview-price');
    const sizes = document.getElementById('quickview-sizes');

    image.src = product.images?.main || product.picture || '';
    image.alt = product.title || 'Product image';
    title.textContent = product.title || 'Product';
    description.textContent = product.description || '';
    price.textContent = product.price || '0';

    // Populate sizes
    sizes.innerHTML = '';
    let availableSizes = [];
    
    // Check for variants (new format)
    if (product.variants && Array.isArray(product.variants)) {
      availableSizes = product.variants
        .filter(variant => variant.stock > 0)
        .map(variant => variant.size);
    }
    // Check for direct sizes array (legacy format)
    else if (product.sizes && Array.isArray(product.sizes)) {
      availableSizes = product.sizes;
    }
    
    if (availableSizes.length > 0) {
      // Remove duplicates and sort sizes
      const uniqueSizes = [...new Set(availableSizes)].sort((a, b) => {
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
        return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
      });
      
      uniqueSizes.forEach(size => {
        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'quickview-size-tag';
        sizeSpan.textContent = size;
        sizes.appendChild(sizeSpan);
      });
    } else {
      sizes.innerHTML = '<span class="quickview-no-sizes">No sizes available</span>';
    }
  }

  async loadAccessories(productId) {
    const accessoriesContainer = document.getElementById('quickview-accessories');
    
    try {
      const response = await fetch(`/api/accessories?productId=${encodeURIComponent(productId)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.recommendations) {
        this.renderAccessories(data.recommendations);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to load accessories:', error);
      accessoriesContainer.innerHTML = `
        <div class="quickview-error">
          <p>Unable to load accessories at this time.</p>
          <button class="quickview-retry-btn" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  renderAccessories(accessories) {
    const container = document.getElementById('quickview-accessories');
    
    if (!accessories || accessories.length === 0) {
      container.innerHTML = '<div class="quickview-no-accessories">No accessories available for this product.</div>';
      return;
    }

    const accessoriesHTML = accessories.map(accessory => `
      <div class="quickview-accessory-item">
        <img src="${accessory.image}" alt="${accessory.name}" class="quickview-accessory-image" 
             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
        <div class="quickview-accessory-details">
          <h4 class="quickview-accessory-name">${accessory.name}</h4>
          <div class="quickview-accessory-price">$${accessory.price}</div>
          <a href="${accessory.buyUrl}" target="_blank" rel="noopener" class="quickview-buy-btn" data-tooltip="Buy on external site">
            Buy Now
          </a>
        </div>
      </div>
    `).join('');

    container.innerHTML = accessoriesHTML;
  }

  updateFocusableElements() {
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    this.focusableElements = Array.from(
      this.modal.querySelectorAll(focusableSelectors.join(', '))
    );
  }

  trapFocus(e) {
    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }
}

// Global instance
export const quickViewModal = new QuickViewModal();
