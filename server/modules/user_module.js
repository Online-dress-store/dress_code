const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { readUsers, writeUsers } = require('./persist_module');

// Return a safe copy of a user without sensitive fields
function toPublicUser(user) {
  if (!user) return null;
  const { id, username, role, cart = [], wishlist = [], orders = [] } = user;
  return { id, username, role, cart, wishlist, orders };
}

async function initializeUsers() {
  const users = await readUsers();
  if (!Array.isArray(users)) {
    await writeUsers([]);
    return;
  }
  // Ensure default structure for all users
  let changed = false;
  for (const u of users) {
    if (!u.cart) { u.cart = []; changed = true; }
    if (!u.wishlist) { u.wishlist = []; changed = true; }
    if (!u.orders) { u.orders = []; changed = true; }
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
    orders: []
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

module.exports = {
  initializeUsers,
  createUser,
  authenticateUser,
  getUserById,
  addOrder,
  getUserOrders
};
