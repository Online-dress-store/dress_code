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
function requireGuest(req, res, next) {
  const token = req.cookies.authToken;
  
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      // User is already logged in, redirect to home
      return res.redirect('/');
    } catch (error) {
      // Invalid token, clear it and continue
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

module.exports = {
  requireAuth,
  requireGuest,
  generateToken,
  verifyToken,
  JWT_SECRET
};
