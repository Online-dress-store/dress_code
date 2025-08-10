async function fetchProducts() {
    try {
        const response = await fetch('/products');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        document.getElementById('products-container').innerHTML = 
            '<div class="error">Failed to load products. Please try again later.</div>';
    }
}

function displayProducts(products) {
    const container = document.getElementById('products-container');
    
    if (products.length === 0) {
        container.innerHTML = '<div class="loading">No products available</div>';
        return;
    }

    const productsHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-details">
                    <span class="product-price">$${product.price.toFixed(2)}</span>
                    <span class="product-category">${product.category}</span>
                </div>
                <div class="product-specs">
                    <span class="spec">Color: ${product.color}</span>
                    <span class="spec">Material: ${product.material}</span>
                    <span class="spec">${product.inStock ? 'In Stock' : 'Out of Stock'}</span>
                </div>
                <div class="size-list">
                    <span class="size-tag">Sizes:</span>
                    ${product.size.map(size => `<span class="size-tag">${size}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `<div class="products-grid">${productsHTML}</div>`;
}

// Load products when page loads
document.addEventListener('DOMContentLoaded', fetchProducts);
