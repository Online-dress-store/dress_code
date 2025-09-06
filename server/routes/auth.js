
  const router = require('express').Router();
const userModule = require('../modules/user_module');
const { generateToken, requireGuest } = require('../middleware/auth');

// Register route
router.post('/register', async (req, res, next) => {
  try {
    await requireGuest(req, res, next);
  } catch (error) {
    return next(error);
  }
}, async (req, res) => {
  try {
    console.log('Registration attempt:', { username: req.body.username, hasPassword: !!req.body.password });
    console.log('Registration request headers:', req.headers);
    console.log('Registration request cookies:', req.cookies);
    const { username, password, confirmPassword } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Create user
    const user = await userModule.createUser(username, password);

    // Generate token (no remember me for registration)
    const token = generateToken(user.id, false);

    // Set cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: false, // Set to false for local development
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000 // 30 minutes
    });

    res.json({
      success: true,
      message: 'Account created successfully',
      user: { id: user.id, username: user.username, role: user.role }
    });

  } catch (error) {
    if (error.message === 'Username already exists') {
      return res.status(400).json({ error: 'Username already exists' });
    }

    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login route
router.post('/login', async (req, res, next) => {
  try {
    await requireGuest(req, res, next);
  } catch (error) {
    return next(error);
  }
}, async (req, res) => {
  try {
    console.log('Login attempt:', { username: req.body.username, hasPassword: !!req.body.password });
    console.log('Login request headers:', req.headers);
    console.log('Login request cookies:', req.cookies);
    const { username, password, rememberMe } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Authenticate user
    const user = await userModule.authenticateUser(username, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate token
    const token = generateToken(user.id, rememberMe);

    // Set cookie with appropriate expiration
    const maxAge = rememberMe ? 12 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000; // 12 days or 30 minutes
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: false, // Set to false for local development
      sameSite: 'lax',
      maxAge
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: { id: user.id, username: user.username, role: user.role }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    console.log('Auth check - cookies:', req.cookies);
    console.log('Auth check - headers:', req.headers);
    const token = req.cookies.authToken;

    if (!token) {
      console.log('No auth token found');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { verifyToken } = require('../middleware/auth');
    const decoded = verifyToken(token);

    if (!decoded) {
      console.log('Invalid token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await userModule.getUserById(decoded.userId);

    if (!user) {
      console.log('User not found for ID:', decoded.userId);
      return res.status(401).json({ error: 'User not found' });
    }

    console.log('User authenticated successfully:', user.username);
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        cart: user.cart,
        wishlist: user.wishlist
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Save order to user's profile
router.post('/orders', async (req, res) => {
  try {
    const token = req.cookies.authToken;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { verifyToken } = require('../middleware/auth');
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { orderData } = req.body;

    if (!orderData) {
      return res.status(400).json({ error: 'Order data is required' });
    }

    // Save order to user's profile
    const orders = await userModule.addOrder(decoded.userId, orderData);

    res.json({
      success: true,
      message: 'Order saved successfully',
      orders: orders
    });

  } catch (error) {
    console.error('Save order error:', error);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

// Get user's order history
router.get('/orders', async (req, res) => {
  try {
    const token = req.cookies.authToken;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { verifyToken } = require('../middleware/auth');
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user's order history
    const orders = await userModule.getUserOrders(decoded.userId);

    res.json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get order history' });
  }
});

module.exports = router;
