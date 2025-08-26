const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { requireAuth, requireGuest } = require('./middleware/auth');
const userModule = require('./modules/user_module');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cookieParser());

// Initialize users on startup
userModule.initializeUsers().then(() => {
  console.log('Users initialized');
}).catch(err => {
  console.error('Failed to initialize users:', err);
});

// serve static frontend from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// serve data files
app.use('/data', express.static(path.join(__dirname, '..', 'data')));

// products API (reads from data/products.json via persist module)
app.use('/products', require('./routes/products'));

// auth API
app.use('/api/auth', require('./routes/auth'));

// healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok' }));

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

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'cart', 'cart.html'));
});

app.get('/cart/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'cart', 'cart.html'));
});

app.get('/wishlist', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'wishlist', 'index.html'));
});

app.get('/wishlist/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'wishlist', 'index.html'));
});

app.get('/sell', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'sell', 'index.html'));
});

app.get('/sell/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'sell', 'index.html'));
});

app.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'account', 'index.html'));
});

app.get('/account/', (req, res) => {
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
app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'checkout', 'index.html'));
});

app.get('/checkout/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'checkout', 'index.html'));
});

app.get('/thank-you', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'thank-you', 'index.html'));
});

app.get('/thank-you/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'thank-you', 'index.html'));
});

// 404 fallback for APIs
app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }));

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
