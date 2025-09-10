const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { createAdminRateLimit } = require('../middleware/rateLimit');
const activityModule = require('../modules/activity_module');
const persistModule = require('../modules/persist_module');

const router = express.Router();

// Apply rate limiting to all admin routes
router.use(createAdminRateLimit());

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

// Activity Log endpoints
router.get('/activity', async (req, res) => {
  try {
    const { username } = req.query;
    const activities = await activityModule.getActivities(username);
    
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch activity log'
    });
  }
});

router.post('/activity', async (req, res) => {
  try {
    const { username, activity } = req.body;
    
    if (!username || !activity) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Username and activity are required'
      });
    }
    
    const newEntry = await activityModule.logActivity(username, activity);
    
    res.status(201).json({
      success: true,
      data: newEntry,
      message: 'Activity logged successfully'
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to log activity'
    });
  }
});

// Products management endpoints
router.get('/products', async (req, res) => {
  try {
    const products = await persistModule.listProducts();
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch products'
    });
  }
});

// Create new product (per spec)
router.post('/products', async (req, res) => {
  try {
    const { title, description, picture, category, price } = req.body || {};
    if (!title || !picture) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Title and picture are required'
      });
    }
    const products = await persistModule.listProducts();
    const maxNumericId = products
      .map(p => Number(String(p.id).replace(/\D/g, '')))
      .filter(n => !Number.isNaN(n));
    const nextNum = maxNumericId.length ? Math.max(...maxNumericId) + 1 : 1;
    const newId = `p_${nextNum.toString().padStart(3,'0')}`;
    const product = {
      id: newId,
      title: String(title),
      description: String(description || ''),
      picture: String(picture),
      category: String(category || 'General'),
      price: Number(price || 0),
      sizes: ['S','M','L'],
      variants: [ { size: 'S', stock: 10, color: 'default' }, { size: 'M', stock: 10, color: 'default' }, { size: 'L', stock: 10, color: 'default' } ]
    };
    products.push(product);
    await persistModule.writeProducts(products);
    res.status(201).json({ success: true, data: product, message: 'Product added successfully' });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Failed to create product' });
  }
});

// Update existing product (edit-only mode)
router.put('/products/:id', async (req, res) => {
  try {
    const productId = String(req.params.id);

    const products = await persistModule.listProducts();
    const product = products.find(p => String(p.id) === productId);
    if (!product) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Product not found'
      });
    }

    const { title, description, picture, category, price, fabricType, color, tags, sizes } = req.body || {};

    if (title !== undefined) product.title = String(title);
    if (description !== undefined) product.description = String(description);
    if (picture !== undefined) product.picture = String(picture);
    if (category !== undefined) product.category = String(category);
    if (price !== undefined) product.price = Number(price);
    if (fabricType !== undefined) product.fabricType = String(fabricType);
    if (color !== undefined) product.color = String(color);
    if (tags !== undefined) product.tags = Array.isArray(tags) ? tags : product.tags;
    if (sizes !== undefined) {
      if (Array.isArray(sizes)) {
        product.sizes = sizes;
      } else if (typeof sizes === 'string') {
        product.sizes = sizes.split(',').map(s => s.trim()).filter(Boolean);
      }
      // Also sync variants for storefront size selection
      const baseColor = Array.isArray(product.variants) && product.variants.length ? product.variants[0].color : 'default';
      product.variants = (product.sizes || []).map(size => ({ size, stock: 10, color: baseColor }));
    }

    await persistModule.writeProducts(products);

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update product'
    });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const productId = String(req.params.id);
    
    const products = await persistModule.listProducts();
    const productIndex = products.findIndex(p => String(p.id) === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Product not found'
      });
    }
    
    products.splice(productIndex, 1);
    await persistModule.writeProducts(products);
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete product'
    });
  }
});

module.exports = router;
