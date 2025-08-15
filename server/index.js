const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// serve static frontend from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

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

// Route for login page (both with and without trailing slash)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login', 'login.html'));
});

app.get('/login/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login', 'login.html'));
});

// Route for register page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'register', 'register.html'));
});

app.get('/register/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'register', 'register.html'));
});

// Route for cart page
app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'cart', 'cart.html'));
});

app.get('/cart/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'cart', 'cart.html'));
});

// 404 fallback for APIs
app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }));

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
