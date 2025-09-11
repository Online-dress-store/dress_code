const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const { requireAuth, requireGuest, requireAdmin } = require('./middleware/auth');
const userModule = require('./modules/user_module');
const activityModule = require('./modules/activity_module');
const { createRateLimit } = require('./middleware/rateLimit');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Middleware to ensure API routes return JSON
app.use('/api', (req, res, next) => {
  console.log('API request:', req.method, req.originalUrl, 'from origin:', req.headers.origin);
  // Set JSON content type for all API routes
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Initialize users and activity log on startup
Promise.all([
  userModule.initializeUsers(),
  activityModule.initializeActivity()
]).then(() => {
  console.log('Users and activity log initialized');
}).catch(err => {
  console.error('Failed to initialize:', err);
});

// API routes must come BEFORE static file serving
// products API (reads from data/products.json via persist module)
app.use('/products', require('./routes/products'));

// auth API (rate limiting applied inside auth routes for sensitive endpoints)
app.use('/api/auth', require('./routes/auth'));

// admin API (has its own stricter limiter inside the router)
app.use('/api/admin', require('./routes/admin'));

// accessories API
app.use('/api/accessories', require('./routes/accessories'));

// public activity logging (non-admin) – logs only add-to-cart for the authenticated user
app.post('/api/activity', createRateLimit(15 * 60 * 1000, 300), requireAuth, async (req, res) => {
  try {
    const { activity } = req.body || {};
    if (activity !== 'add-to-cart') {
      return res.status(400).json({ error: 'Only add-to-cart activity is allowed here' });
    }
    const user = await userModule.getUserById(req.user.userId);
    const activityModule = require('./modules/activity_module');
    await activityModule.logActivity(user.username, 'add-to-cart');
    res.json({ success: true });
  } catch (e) {
    console.error('Public activity log error:', e);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// serve data files
app.use('/data', express.static(path.join(__dirname, '..', 'data')));

// serve static frontend from /public (after API routes)
app.use(express.static(path.join(__dirname, '..', 'public')));

// healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Public documentation pages
app.get('/readme.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'readme.html'));
});

app.get('/llm.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'llm.html'));
});

// Route for home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// All page routes (authentication handled client-side)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login', 'login.html'));
});

app.get('/login/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'register', 'register.html'));
});

app.get('/register/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'register', 'register.html'));
});

app.get('/cart', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'cart', 'cart.html'));
});

app.get('/cart/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'cart', 'cart.html'));
});

app.get('/wishlist', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'wishlist', 'index.html'));
});

app.get('/wishlist/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'wishlist', 'index.html'));
});

app.get('/sell', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'sell', 'index.html'));
});

app.get('/sell/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'sell', 'index.html'));
});

app.get('/account', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'account', 'index.html'));
});

app.get('/account/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'account', 'index.html'));
});

// Public routes (categories remain public)
app.get('/categories', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'categories', 'index.html'));
});

app.get('/categories/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'categories', 'index.html'));
});

// Checkout and thank you pages
app.get('/checkout', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'checkout', 'index.html'));
});

app.get('/checkout/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'checkout', 'index.html'));
});

app.get('/thank-you', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'thank-you', 'index.html'));
});

app.get('/thank-you/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'thank-you', 'index.html'));
});

// Admin page (server enforces admin auth)
app.get('/admin', requireAuth, requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
});

app.get('/admin/', requireAuth, requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
});

// 404 fallback for APIs
app.use('/api/*', (req, res) => {
  console.log('API route not found:', req.method, req.originalUrl);
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API route not found' } });
});

// 404 fallback for all other routes
app.use((req, res) => {
  console.log('Route not found:', req.method, req.originalUrl);
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
