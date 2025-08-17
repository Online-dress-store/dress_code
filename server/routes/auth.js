const express = require('express');
const { readUsers, writeUsers } = require('../modules/persist_module');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  const users = await readUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
  // Optionally, set a cookie or session here
  res.json({ message: 'Login successful', user: { id: user.id, username: user.username, role: user.role } });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }
  const users = await readUsers();
  if (users.some(u => u.username === username)) {
    return res.status(409).json({ error: 'Username already exists.' });
  }
  const newUser = {
    id: uuidv4(),
    username,
    password,
    role: 'customer',
    cart: [],
    purchases: [],
    prefs: { theme: 'light' },
    activity: [{ at: new Date().toISOString(), type: 'register' }],
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  await writeUsers(users);
  res.status(201).json({ message: 'Registration successful', user: { id: newUser.id, username: newUser.username, role: newUser.role } });
});

module.exports = router;
