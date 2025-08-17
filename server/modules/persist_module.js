const fs = require('fs').promises;
const path = require('path');


const PRODUCTS_PATH = path.join(__dirname, '..' ,'..', 'data', 'products.json');
const USERS_PATH = path.join(__dirname, '..', '..', 'data', 'users.json');
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

module.exports = { listProducts, readUsers, writeUsers };
