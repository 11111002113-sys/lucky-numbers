// Security middleware for admin routes

// Track failed login attempts by IP
const failedAttempts = new Map();
const blockedIPs = new Map();

// Block duration in milliseconds (30 minutes)
const BLOCK_DURATION = 30 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

// Check if IP is blocked
function isIPBlocked(ip) {
  if (blockedIPs.has(ip)) {
    const blockTime = blockedIPs.get(ip);
    const now = Date.now();
    
    if (now - blockTime < BLOCK_DURATION) {
      return true;
    } else {
      // Unblock after duration
      blockedIPs.delete(ip);
      failedAttempts.delete(ip);
      return false;
    }
  }
  return false;
}

// Track failed login
function trackFailedLogin(ip) {
  const attempts = failedAttempts.get(ip) || 0;
  const newAttempts = attempts + 1;
  
  failedAttempts.set(ip, newAttempts);
  
  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    blockedIPs.set(ip, Date.now());
    console.warn(`⚠️ IP ${ip} has been blocked due to ${newAttempts} failed login attempts`);
    return true;
  }
  
  return false;
}

// Reset attempts on successful login
function resetFailedAttempts(ip) {
  failedAttempts.delete(ip);
}

// Get client IP (works with proxies)
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.ip;
}

// Middleware to check blocked IPs
function checkBlockedIP(req, res, next) {
  const ip = getClientIP(req);
  
  if (isIPBlocked(ip)) {
    const remainingTime = Math.ceil((BLOCK_DURATION - (Date.now() - blockedIPs.get(ip))) / 1000 / 60);
    
    console.warn(`🚫 Blocked IP ${ip} attempted to access admin`);
    
    return res.status(403).json({
      success: false,
      message: `Your IP has been temporarily blocked due to multiple failed login attempts. Please try again in ${remainingTime} minutes.`,
      blocked: true
    });
  }
  
  next();
}

// Log admin access attempts
function logAdminAccess(req, res, next) {
  const ip = getClientIP(req);
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  
  console.log(`🔐 [ADMIN ACCESS] ${timestamp} | IP: ${ip} | ${method} ${path}`);
  
  next();
}

// Hide admin routes from enumeration
function obfuscateAdminRoutes(req, res, next) {
  // Remove server headers that leak information
  res.removeHeader('X-Powered-By');
  
  // Return 404 for unauthorized admin access attempts
  if (req.path.startsWith('/admin') && !req.path.endsWith('.html') && !req.path.endsWith('.css') && !req.path.endsWith('.js')) {
    // Check if accessing API without token
    if (req.path.startsWith('/api/admin') && !req.headers.authorization) {
      return res.status(404).json({
        success: false,
        message: 'Not Found'
      });
    }
  }
  
  next();
}

module.exports = {
  checkBlockedIP,
  trackFailedLogin,
  resetFailedAttempts,
  getClientIP,
  logAdminAccess,
  obfuscateAdminRoutes,
  isIPBlocked
};
