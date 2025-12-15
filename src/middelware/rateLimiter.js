import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Rate limiter for login: 5 attempts per 1 minute
export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts, please try again after 1 minute',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req, res) => {
    // Use email as the key instead of IP to prevent issues with shared IPs
    // Fall back to ipKeyGenerator for IPv6 compatibility
    return req.body?.email || ipKeyGenerator(req, res);
  },
  skip: (req, res) => {
    // Skip rate limiting for non-login requests
    return false;
  },
  handler: (req, res, next, options) => {
    res.status(429).json({
      error: options.message,
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Rate limiter for registration: 3 attempts per 15 minutes
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per windowMs
  message: 'Too many accounts created from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator, // Use ipKeyGenerator for proper IPv6 handling
  skip: (req, res) => false,
  handler: (req, res, next, options) => {
    res.status(429).json({
      error: options.message,
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// General API rate limiter: 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator // Use ipKeyGenerator for proper IPv6 handling
});
