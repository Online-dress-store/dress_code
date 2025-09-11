const fs = require('fs').promises;
const path = require('path');


const PRODUCTS_PATH = path.join(__dirname, '..' ,'..', 'data', 'products.json');
const USERS_PATH = path.join(__dirname, '..', '..', 'data', 'users.json');
const ACCESSORIES_PATH = path.join(__dirname, '..', '..', 'data', 'accessories.json');
const QUIZ_PATH = path.join(__dirname, '..', '..', 'data', 'quiz.json');
// this path assumes the directory structure is as follows:
// Online-dress-store/server/modules/persist_module.js
// Online-dress-store/data/products.json  

async function listProducts() { // Function to list all products from the products.json file
  try {
    const txt = await fs.readFile(PRODUCTS_PATH, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

async function writeProducts(products) {
  await fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2));
}

// Read all users from users.json
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

// Write all users to users.json
async function writeUsers(users) {
  await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2));
}

// Read accessories from accessories.json
async function readAccessories() {
  try {
    const data = await fs.readFile(ACCESSORIES_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

// Alias for compatibility
const readProducts = listProducts;

module.exports = { 
  listProducts, 
  readProducts,
  writeProducts, 
  readUsers, 
  writeUsers,
  readAccessories,
  readQuizSubmissions: async function readQuizSubmissions() {
    try {
      const txt = await fs.readFile(QUIZ_PATH, 'utf8');
      return JSON.parse(txt);
    } catch (e) { if (e.code === 'ENOENT') return []; throw e; }
  },
  writeQuizSubmissions: async function writeQuizSubmissions(rows) {
    await fs.writeFile(QUIZ_PATH, JSON.stringify(rows, null, 2));
  }
};
