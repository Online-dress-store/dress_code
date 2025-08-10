const fs = require('fs').promises;
const path = require('path');

const PRODUCTS_PATH = path.join(__dirname, '..', 'data', 'products.json');

async function listProducts() {
  try {
    const txt = await fs.readFile(PRODUCTS_PATH, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

module.exports = { listProducts };
