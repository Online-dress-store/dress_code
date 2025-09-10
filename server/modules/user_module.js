const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { readUsers, writeUsers } = require('./persist_module');

// Return a safe copy of a user without sensitive fields
function toPublicUser(user) {
  if (!user) return null;
  const { id, username, role, cart = [], wishlist = [], orders = [], items = [] } = user;
  return { id, username, role, cart, wishlist, orders, items };
}

async function initializeUsers() {
  const users = await readUsers();
  if (!Array.isArray(users)) {
    await writeUsers([]);
    return;
  }
  // Ensure default structure for all users
  let changed = false;
  // Ensure default admin user exists (admin/admin)
  let adminUser = users.find(u => String(u.username).toLowerCase() === 'admin');
  if (!adminUser) {
    const passwordHash = await bcrypt.hash('admin', 10);
    adminUser = {
      id: uuidv4(),
      username: 'admin',
      passwordHash,
      role: 'admin',
      cart: [],
      wishlist: [],
      orders: [],
      items: []
    };
    users.push(adminUser);
    changed = true;
  } else {
    // ensure admin has correct role and password on every startup
    const newHash = await bcrypt.hash('admin', 10);
    if (adminUser.passwordHash !== newHash) {
      adminUser.passwordHash = newHash;
      changed = true;
    }
    if (adminUser.role !== 'admin') { adminUser.role = 'admin'; changed = true; }
  }
  for (const u of users) {
    if (!u.cart) { u.cart = []; changed = true; }
    if (!u.wishlist) { u.wishlist = []; changed = true; }
    if (!u.orders) { u.orders = []; changed = true; }
    if (!u.items) { u.items = []; changed = true; }

    // Enforce admin role for known admins
    if (String(u.username).toLowerCase() === 'yuval2301' || String(u.username).toLowerCase() === 'admin') {
      if (u.role !== 'admin') { u.role = 'admin'; changed = true; }
    } else {
      if (u.role !== 'user') { u.role = 'user'; changed = true; }
    }
  }
  if (changed) await writeUsers(users);
}

async function createUser(username, password) {
  const users = await readUsers();
  const exists = users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
  if (exists) throw new Error('Username already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    username: String(username),
    passwordHash,
    role: 'user',
    cart: [],
    wishlist: [],
    orders: [],
    items: []
  };
  users.push(user);
  await writeUsers(users);
  return toPublicUser(user);
}

async function authenticateUser(username, password) {
  const users = await readUsers();
  const user = users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash || '');
  if (!ok) return null;
  return toPublicUser(user);
}

async function getUserById(userId) {
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  return toPublicUser(user);
}

async function addOrder(userId, orderData) {
  const users = await readUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('User not found');

  const order = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    ...orderData
  };
  if (!Array.isArray(users[idx].orders)) users[idx].orders = [];
  users[idx].orders.push(order);
  await writeUsers(users);
  return users[idx].orders;
}

async function getUserOrders(userId) {
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  return user && Array.isArray(user.orders) ? user.orders : [];
}

async function getUserItems(userId) {
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  return user && Array.isArray(user.items) ? user.items : [];
}

async function addUserItem(userId, item) {
  const users = await readUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('User not found');
  if (!Array.isArray(users[idx].items)) users[idx].items = [];
  const newItem = Object.assign({}, item, { id: uuidv4(), createdAt: new Date().toISOString() });
  users[idx].items.push(newItem);
  await writeUsers(users);
  return newItem;
}

// Cart helpers
async function getUserCart(userId) {
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  return user && Array.isArray(user.cart) ? user.cart : [];
}

async function setUserCart(userId, cart) {
  const users = await readUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('User not found');
  users[idx].cart = Array.isArray(cart) ? cart : [];
  await writeUsers(users);
  return users[idx].cart;
}

// Wishlist helpers
async function getUserWishlist(userId) {
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  return user && Array.isArray(user.wishlist) ? user.wishlist : [];
}

async function setUserWishlist(userId, list) {
  const users = await readUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('User not found');
  users[idx].wishlist = Array.isArray(list) ? list : [];
  await writeUsers(users);
  return users[idx].wishlist;
}

module.exports = {
  initializeUsers,
  createUser,
  authenticateUser,
  getUserById,
  addOrder,
  getUserOrders,
  getUserItems,
  addUserItem,
  getUserCart,
  setUserCart,
  getUserWishlist,
  setUserWishlist
};
