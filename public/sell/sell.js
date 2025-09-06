// Import navigation
import { createNavigation, initNavigation, updateAuthStatus } from "../shared/navigation.js";

// Sell page functionality
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
  
  // Get current user for form submission
  const currentUser = authCheck.getCurrentUser();
  
  const form = document.getElementById('sellForm');
  
  // Handle form submission
  form.addEventListener('submit', handleFormSubmit);
});

// Handle form submission
function handleFormSubmit(event) {
  event.preventDefault();
  
  // Collect form data
  const formData = new FormData(event.target);
  const productData = collectProductData(formData);
  
  // Validate the data
  if (!validateProductData(productData)) {
    return;
  }
  
  // Generate the final product object
  const newProduct = generateProductObject(productData);
  
  // Log the product object to console
  console.log('New Product Data:', newProduct);
  
  // Show success message
  showSuccessMessage();
  
  // Reset form
  event.target.reset();
  
  // Reset variants to default
  resetVariants();
}

// Collect all form data
function collectProductData(formData) {
  const data = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    tags: formData.get('tags'),
    price: parseFloat(formData.get('price')),
    fabricType: formData.get('fabricType'),
    mainImage: formData.get('mainImage'),
    galleryImages: formData.get('galleryImages'),
    variants: collectVariants()
  };
  
  return data;
}

// Collect variants data
function collectVariants() {
  const variants = [];
  const variantItems = document.querySelectorAll('.variant-item');
  
  variantItems.forEach(item => {
    const size = item.querySelector('.variant-size').value;
    const color = item.querySelector('.variant-color').value;
    const stock = parseInt(item.querySelector('.variant-stock').value);
    
    if (size && color && stock > 0) {
      variants.push({
        size: size,
        color: color,
        stock: stock
      });
    }
  });
  
  return variants;
}

// Validate product data
function validateProductData(data) {
  const errors = [];
  
  if (!data.title || data.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!data.description || data.description.trim() === '') {
    errors.push('Description is required');
  }
  
  if (!data.category) {
    errors.push('Category is required');
  }
  
  if (!data.price || data.price <= 0) {
    errors.push('Valid price is required');
  }
  
  if (!data.mainImage || data.mainImage.trim() === '') {
    errors.push('Main image URL is required');
  }
  
  if (data.variants.length === 0) {
    errors.push('At least one size/color variant is required');
  }
  
  if (errors.length > 0) {
    showErrorMessage(errors.join(', '));
    return false;
  }
  
  return true;
}

// Generate the final product object
function generateProductObject(data) {
  // Generate a unique ID
  const id = 'p_drs_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  // Parse tags
  const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
  
  // Parse gallery images
  const galleryImages = data.galleryImages ? 
    data.galleryImages.split('\n').map(url => url.trim()).filter(url => url) : 
    [data.mainImage];
  
  // Create the product object matching the existing structure
  const product = {
    id: id,
    title: data.title,
    description: data.description,
    category: data.category,
    tags: tags,
    price: data.price,
    fabricType: data.fabricType || 'cotton',
    variants: data.variants,
    images: {
      main: data.mainImage,
      gallery: galleryImages
    },
    inStock: data.variants.some(v => v.stock > 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return product;
}

// Add a new variant
function addVariant() {
  const container = document.getElementById('variantsContainer');
  const variantItem = document.createElement('div');
  variantItem.className = 'variant-item';
  
  variantItem.innerHTML = `
    <div class="variant-row">
      <div class="form-group">
        <label>Size</label>
        <select class="variant-size" required>
          <option value="">Select size</option>
          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="XXL">XXL</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Color</label>
        <input type="text" class="variant-color" required placeholder="e.g., navy, red, floral">
      </div>
      
      <div class="form-group">
        <label>Stock</label>
        <input type="number" class="variant-stock" required min="1" value="1">
      </div>
      
      <button type="button" class="remove-variant-btn" onclick="removeVariant(this)">
        <i class="ri-delete-bin-line"></i>
      </button>
    </div>
  `;
  
  container.appendChild(variantItem);
}

// Remove a variant
function removeVariant(button) {
  const variantItems = document.querySelectorAll('.variant-item');
  
  // Don't remove if it's the last variant
  if (variantItems.length > 1) {
    button.closest('.variant-item').remove();
  } else {
    showErrorMessage('At least one size/color variant is required');
  }
}

// Reset variants to default
function resetVariants() {
  const container = document.getElementById('variantsContainer');
  container.innerHTML = `
    <div class="variant-item">
      <div class="variant-row">
        <div class="form-group">
          <label>Size</label>
          <select class="variant-size" required>
            <option value="">Select size</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Color</label>
          <input type="text" class="variant-color" required placeholder="e.g., navy, red, floral">
        </div>
        
        <div class="form-group">
          <label>Stock</label>
          <input type="number" class="variant-stock" required min="1" value="1">
        </div>
        
        <button type="button" class="remove-variant-btn" onclick="removeVariant(this)">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>
    </div>
  `;
}

// Show success message
function showSuccessMessage() {
  // Create a simple success notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
  `;
  notification.textContent = '✅ Dress listed successfully! Check console for data.';
  
  document.body.appendChild(notification);
  
  // Remove after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Show error message
function showErrorMessage(message) {
  // Create a simple error notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f44336;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
  `;
  notification.textContent = `❌ ${message}`;
  
  document.body.appendChild(notification);
  
  // Remove after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}
