const express = require('express');
const { createRateLimit } = require('../middleware/rateLimit');
const { readAccessories } = require('../modules/persist_module');

const router = express.Router();

// Rate limiting for accessories endpoint
router.use(createRateLimit(15 * 60 * 1000, 100)); // 100 requests per 15 minutes

// GET /api/accessories?productId=... - Returns recommended accessories
router.get('/', async (req, res) => {
  try {
    const { productId } = req.query;
    
    if (!productId) {
      return res.status(400).json({ 
        error: 'MISSING_PRODUCT_ID', 
        message: 'productId query parameter is required' 
      });
    }

    // Get all accessories
    const allAccessories = await readAccessories();
    if (!Array.isArray(allAccessories)) {
      return res.status(500).json({ 
        error: 'DATA_ERROR', 
        message: 'Failed to load accessories data' 
      });
    }

    // Get product details for matching (we'll need to fetch from products)
    const { readProducts } = require('../modules/persist_module');
    const products = await readProducts();
    const product = products.find(p => String(p.id) === String(productId));
    
    if (!product) {
      return res.status(404).json({ 
        error: 'PRODUCT_NOT_FOUND', 
        message: 'Product not found' 
      });
    }

    // Simple recommendation logic based on product attributes
    const recommendations = getRecommendations(allAccessories, product);
    
    res.json({ 
      success: true, 
      productId: productId,
      recommendations: recommendations 
    });

  } catch (error) {
    console.error('Accessories endpoint error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR', 
      message: 'Failed to fetch accessories' 
    });
  }
});

// Enhanced recommendation algorithm
function getRecommendations(allAccessories, product) {
  const scored = allAccessories.map(accessory => {
    let score = 0;
    
    // Strong match by category/occasion
    if (product.category) {
      const productCategory = product.category.toLowerCase();
      if (accessory.occasions.some(occ => occ.toLowerCase() === productCategory)) {
        score += 5;
      }
    }
    
    // Match by color (more sophisticated matching)
    if (product.color) {
      const productColor = product.color.toLowerCase();
      if (accessory.colors.some(color => {
        const colorLower = color.toLowerCase();
        return colorLower.includes(productColor) || 
               productColor.includes(colorLower) ||
               areColorsCompatible(productColor, colorLower);
      })) {
        score += 3;
      }
    }
    
    // Match by style/description keywords
    if (product.description) {
      const desc = product.description.toLowerCase();
      if (accessory.styles.some(style => desc.includes(style.toLowerCase()))) {
        score += 2;
      }
    }
    
    // Category-specific preferences
    if (product.category) {
      const category = product.category.toLowerCase();
      
      if (category === 'evening') {
        // Evening wear: prefer jewelry, bags, beauty
        if (accessory.category === 'jewelry') score += 4;
        if (accessory.category === 'bags') score += 3;
        if (accessory.category === 'beauty') score += 2;
      } else if (category === 'summer') {
        // Summer wear: prefer hats, casual accessories
        if (accessory.category === 'hats') score += 4;
        if (accessory.occasions.includes('summer') || accessory.occasions.includes('beach')) score += 3;
      } else if (category === 'holiday') {
        // Holiday wear: prefer jewelry, bags, beauty
        if (accessory.category === 'jewelry') score += 3;
        if (accessory.category === 'bags') score += 2;
        if (accessory.category === 'beauty') score += 2;
      } else if (category === 'casual') {
        // Casual wear: prefer outerwear, casual accessories
        if (accessory.category === 'outerwear') score += 4;
        if (accessory.occasions.includes('casual') || accessory.occasions.includes('daily')) score += 3;
      }
    }
    
    // Avoid duplicate categories in recommendations
    // This will be handled in the selection logic below
    
    return { ...accessory, score };
  });
  
    // Sort by score and select diverse items
    const sorted = scored.sort((a, b) => b.score - a.score);
    const selected = [];
    const usedCategories = new Set();
    
    // First pass: select highest scoring items with different categories
    for (const item of sorted) {
      if (selected.length >= 3) break;
      if (!usedCategories.has(item.category)) {
        selected.push(item);
        usedCategories.add(item.category);
      }
    }
    
    // Second pass: fill remaining slots with highest scoring items
    for (const item of sorted) {
      if (selected.length >= 3) break;
      if (!selected.some(selectedItem => selectedItem.id === item.id)) {
        selected.push(item);
      }
    }
    
    return selected.map(({ score, ...accessory }) => accessory);
}

// Color compatibility helper
function areColorsCompatible(color1, color2) {
  const colorGroups = {
    warm: ['red', 'orange', 'yellow', 'pink', 'coral', 'peach'],
    cool: ['blue', 'green', 'purple', 'teal', 'navy', 'mint'],
    neutral: ['black', 'white', 'gray', 'beige', 'brown', 'tan', 'cream', 'ivory'],
    metallic: ['gold', 'silver', 'bronze', 'copper', 'metallic']
  };
  
  for (const [group, colors] of Object.entries(colorGroups)) {
    if (colors.some(c => color1.includes(c)) && colors.some(c => color2.includes(c))) {
      return true;
    }
  }
  return false;
}

module.exports = router;
