// Simple in-memory rate limiting for DoS defense
const rateLimitMap = new Map();

function createRateLimit(windowMs = 15 * 60 * 1000, maxRequests = 100) { // 15 minutes, 100 requests
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const rateLimitData = rateLimitMap.get(key);
    
    // Reset if window has passed
    if (now > rateLimitData.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    // Check if limit exceeded
    if (rateLimitData.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.'
      });
    }
    
    // Increment counter
    rateLimitData.count++;
    next();
  };
}

// Admin-specific rate limiting (stricter)
function createAdminRateLimit() {
  return createRateLimit(15 * 60 * 1000, 50); // 15 minutes, 50 requests
}

module.exports = {
  createRateLimit,
  createAdminRateLimit
};
