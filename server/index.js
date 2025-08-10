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

// healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 404 fallback for APIs
app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }));

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
