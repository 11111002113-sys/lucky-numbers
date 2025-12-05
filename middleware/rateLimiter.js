const rateLimit = require('express-rate-limit');

// Rate limiter for login attempts (STRICT)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Only 3 attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts. Your IP has been temporarily blocked. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count even successful requests
});

// Rate limiter for admin routes (PROTECTED)
const adminLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // 50 requests per window for admin operations
  message: {
    success: false,
    message: 'Too many admin requests, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, apiLimiter, adminLimiter };
