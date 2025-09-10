const router = require('express').Router();
const persist = require('../modules/persist_module');
const { verifyToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res, next) => {
  try {
    const items = await persist.listProducts();
    res.set('Cache-Control', 'no-store');
    res.json(items);
  } catch (e) {
    next(e);
  }
});

// Admin guard helper
function requireAdmin(req, res, next) {
  try {
    const token = req.cookies.authToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });
    // read user to confirm role
    const userModule = require('../modules/user_module');
    userModule.getUserById(decoded.userId).then(user => {
      if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      req.user = user;
      next();
    }).catch(next);
  } catch (e) { next(e); }
}

// Add product (admin only)
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { title, description, price, category, image } = req.body || {};
    if (!title || !price || !image) {
      return res.status(400).json({ error: 'title, price, image are required' });
    }
    const products = await persist.listProducts();
    const id = `p_${uuidv4()}`;
    const product = {
      id,
      title: String(title),
      description: String(description || ''),
      price: Number(price),
      category: String(category || 'General'),
      images: { main: String(image) },
      variants: [ { size: 'M', stock: 99, color: 'black' } ]
    };
    products.push(product);
    await persist.writeProducts(products);
    res.json({ success: true, product });
  } catch (e) { next(e); }
});

// Delete product by id (admin only)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const products = await persist.listProducts();
    const nextProducts = products.filter(p => String(p.id) !== id);
    if (nextProducts.length === products.length) {
      return res.status(404).json({ error: 'Not found' });
    }
    await persist.writeProducts(nextProducts);
    res.json({ success: true });
  } catch (e) { next(e); }
});

module.exports = router;
