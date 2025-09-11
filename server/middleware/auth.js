const jwt = require('jsonwebtoken');

// Secret key for JWT tokens (in production, use environment variable)
const JWT_SECRET = 'dress-code-secret-key-2024';

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
  const token = req.cookies.authToken;
  
  if (!token) {
    // For API routes, return JSON error
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You are not logged in'
      });
    }
    
    // For page routes, redirect to login
    return res.redirect('/login?message=You are not logged in');
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Clear invalid token
    res.clearCookie('authToken');
    
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'You are not logged in'
      });
    }
    
    return res.redirect('/login?message=You are not logged in');
  }
}

// Middleware to check if user is NOT authenticated (for login/register pages)
async function requireGuest(req, res, next) {
  const token = req.cookies.authToken;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if user still exists in database
      const userModule = require('../modules/user_module');
      const user = await userModule.getUserById(decoded.userId);
      
      if (user) {
        // User is already logged in and exists
        if (req.path.startsWith('/api/')) {
          return res.status(400).json({ 
            error: 'Already logged in',
            message: 'You are already logged in'
          });
        }
        // For page routes, redirect to home
        return res.redirect('/');
      } else {
        // User doesn't exist, clear the token
        console.log('User not found in requireGuest, clearing token for user ID:', decoded.userId);
        res.clearCookie('authToken');
      }
    } catch (error) {
      // Invalid token, clear it and continue
      console.log('Invalid token in requireGuest, clearing cookie');
      res.clearCookie('authToken');
    }
  }
  
  next();
}

// Generate JWT token
function generateToken(userId, rememberMe = false) {
  const expiresIn = rememberMe ? '12d' : '30m';
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'You are not logged in'
    });
  }
  
  // Get user from database to check role
  const userModule = require('../modules/user_module');
  userModule.getUserById(req.user.userId).then(user => {
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Admin privileges required'
      });
    }
    next();
  }).catch(err => {
    console.error('Error checking admin role:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to verify admin privileges'
    });
  });
}

module.exports = {
  
  requireAuth,
  requireGuest,
  requireAdmin,
  generateToken,
  verifyToken,
  JWT_SECRET
};
